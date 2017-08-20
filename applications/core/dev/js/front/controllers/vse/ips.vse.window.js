/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.observer.js - Observing VSE controller. Initialized globally and listens for messages from the VSE interface
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.window', {

		_stylesheet: null,
		_selectors: [],
		_events: {},
		_exclude: null,
		_xrayElem: null,
		_url: '',
		_pointerEvents: false,

		initialize: function () {
			this.on( window, 'message', this.handleCommand );
			this.setup();
		},

		/**
		 * Setup method - adds our injected stylesheet for later, and sends commands to let the main window know we're ready
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			// Build the initial stylesheet elements
			$('head')
				.append( $('<style/>').attr('type', 'text/css').attr('id', 'elInjectedStyles') )
				.append( $('<style/>').attr('type', 'text/css').attr('id', 'elCustomCSS') );

			this._stylesheet = $('#elInjectedStyles');
			this._custom = $('#elCustomCSS');

			// Build URL
			var url = ips.utils.url.getURIObject( window.location.href );
			this._url = url.protocol + '://' + url.host;
			if ( url.port && url.port != 80 ) {
				this._url = this._url + ':' + url.port;
			}

			this.sendCommand('windowReady');
			this.sendCommand('getStylesheet'); // Ask the window for the initial stylesheet
		},

		/**
		 * Handles commands from the main window, executing the appropriate method here.
		 *
		 * @param		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		handleCommand: function (e) {
			if( e.originalEvent.origin != this._url ){
				Debug.error("Invalid origin");
				return;
			}

			var pieces = e.originalEvent.data.command.split('.');
			var obj = this;

			for( var i = 0; i < pieces.length - 1; i++ ){
				if( !_.isUndefined( obj[ pieces[ i ] ] ) ){
					obj = obj[ pieces[ i ] ];
				} else {
					Debug.error( "Couldn't run vse.window." + e.originalEvent.data.command );
					return;
				}
			}

			if( obj[ pieces[ pieces.length - 1 ] ] ){
				obj[ pieces[ pieces.length - 1 ] ]( e.originalEvent.data );
			} else {
				Debug.error( "Couldn't run vse.window." + e.originalEvent.data.command );
				return;
			}
		},

		/**
		 * Sends a command to the main window
		 *
		 * @param		{string} 	command 	Command name
		 * @param 		{object} 	data 		Data object
		 * @returns 	{void}
		 */
		sendCommand: function (command, data) {
			top.postMessage( _.extend( data || {}, { command: command } ), this._url );
		},

		/**
		 * Command from the main controller letting us know a style has been updated
		 *
		 * @param 		{object} 	data 		Data object
		 * @returns 	{void}
		 */
		updateStyle: function (data) {
			ips.utils.css.replaceStyle( 'elInjectedStyles', data.selector, data.styles );
		},

		/**
		 * Updates the freeform style tag with custom css
		 *
		 * @param 		{object} 	data 		Data object
		 * @returns 	{void}
		 */
		updateCustomCSS: function (data) {
			this._custom.html( data.css );
		},

		/**
		 * The main window has sent us selector data, which the xRay will use to find elements
		 *
		 * @param 		{object} 	data 		Data object
		 * @returns 	{void}
		 */
		selectorData: function (data) {
			this._selectors = data.selectors;
		},

		/**
		 * Replaces the injected stylesheet contents with new content, built from the data object
		 *
		 * <code>
		 * {
		 *		classes: {
		 *			'body': {
		 *				'background-color': 'red'
		 *			},
		 *			'.ipsButton': {
		 *				'color': 'blue'
		 *			}
		 *		}
		 * 	}
		 * </code>
		 * @param		{object} 	data 	Object of style data
		 * @returns 	{void}
		 */
		createStylesheet: function (data) {
			var update = '';

			_.each( data.classes, function (val, key) {
				if( ( _.isObject( val ) && !_.size( val ) ) || !val ){
					return;
				}
				
				update += key + "{\n";
				
				_.each( val, function (styleVal, styleKey) {
					if( _.isObject( styleVal ) ){
						_.each( styleVal, function (thisVal) {
							update += styleKey + ': ' + thisVal + ";\n";
						});
					} else {
						update += styleKey + ': ' + styleVal + ";\n";	
					}					
				});

				update += "}\n\n";
			});

			this._stylesheet.html( update );
			this._custom.html( data.custom || '' );
		},			

		/**
		 * Starts the xray
		 *
		 * @returns 	{void}
		 */
		xrayStart: function () {
			this._createXRayElem();
			this._pointerEvents = this._supportsPointerEvents();

			this._events['down'] = $( document ).on( 'mousedown.xray', _.bind( this._doDown, this ) );
			this._events['move'] = $( document ).on( 'mousemove.xray', _.bind( this._doFalse, this ) );
			this._events['over'] = $( document ).on( 'mouseover.xray', _.bind( this._doOver, this ) );
		},

		/**
		 * Cancels the xray
		 *
		 * @returns 	{void}
		 */
		xrayCancel: function () {
			if( this._xrayElem && this._xrayElem.length ){
				this._xrayElem.remove();
			}

			this._stop();
		},

		/**
		 * Stops the xray
		 *
		 * @returns 	{void}
		 */
		_stop: function () {
			$( document ).off('.xray');
		},

		/**
		 * Initializes the xray function by resizing/positioning the xray element to fit the currently-hovered element
		 *
		 * @param		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_doXray: function (e) {
			e.preventDefault();

			var elem = $( e.target );

			if( elem.is( this._exclude ) ){
				return;
			}

			var elemPosition = ips.utils.position.getElemPosition( elem );
			var elemDims = { width: elem.outerWidth(), height: elem.outerHeight() };

			this._xrayElem.css({
				width: elemDims.width + 'px',
				height: elemDims.height + 'px',
				left: elemPosition.absPos.left + 'px',
				top: elemPosition.absPos.top + 'px',
				zIndex: ips.ui.zIndex()
			});
		},

		/**
		 * Event handler for mousedown
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_doDown: function (e) {
			e.preventDefault();
			this._doXray(e);
			this._stop();

			this._findMatchingSelectors( $( e.target ) );
		},

		/**
		 * Event handler for mouseover
		 * If browser supports pointerEvents we highlight the hovered element, otherwise do nothing
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_doOver: function (e) {
			if( this._pointerEvents ){
				this._doXray(e);
			} else {
				this._doFalse(e);
			}
		},

		/**
		 * Called to prevent xray events from bubbling
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_doFalse: function (e) {
			e.preventDefault();
		},

		/**
		 * Creates the xray element and attaches it to body ready for this._doXray
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_createXRayElem: function () {
			if( $('#vseXRay').length ){
				$('#vseXRay').remove();
			}

			$('body').append( $('<div/>').attr( 'id', 'vseXRay' ) );

			this._xrayElem = $('#vseXRay');
		},

		/**
		 * Finds the ancestors of the clicked elemented, and matches selectors from our list
		 * Sends command to the main controller with our results
		 *
		 * @param 		{element} 	elem 		Clicked element
		 * @returns 	{void}
		 */
		_findMatchingSelectors: function (elem) {
			// Get all ancestors
			var ancestors = elem.parents().addBack( elem );
			var matched = [];
			var primaryMatch = null;
			var self = this;
			var selectorsLength = this._selectors.length;

			_.each( ancestors.get().reverse(), function (value, idx) {
				for( var i = 0; i < selectorsLength; i++ ){
					if( $( value ).is( self._selectors[ i ] ) ){
						if( idx == 0 ){
							primaryMatch = self._selectors[ i ];
						} else {
							matched.push( self._selectors[ i ] );
						}
					}
				}
			});

			this.sendCommand( 'selectorsMatched', {
				primary: primaryMatch,
				other: matched
			});
		},

		/**
		 * Determines whether the browser supports css pointer-events style
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_supportsPointerEvents: function () {
			// From https://github.com/ausi/Feature-detection-technique-for-pointer-events/blob/master/modernizr-pointerevents.js
			var element = document.createElement('x');
			element.style.cssText = 'pointer-events:auto';
			return element.style.pointerEvents === 'auto';
		}
	});
}(jQuery, _));