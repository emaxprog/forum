/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.js - UI widget parent
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui', function(){

		var widgets = {}, // Registry for our widgets
			doneInitialInit = false, // Have we done the initial DOM setup on page load yet?
			ziCounter = ips.getSetting('zindex_start') || 5000, // Counter for zIndex incrementing
			ziIncrement = ips.getSetting('zindex_inc') || 50; // Increment for zindex

		// Set some keycodes as 'constants'
		var key = {
			BACKSPACE: 8,
			ESCAPE: 27,
			TAB: 9,
			LEFT: 37,
			RIGHT: 39,
			UP: 38,
			DOWN: 40,
			ENTER: 13,
			COMMA: 188,
			SPACE: 32
		};

		/**
		 * Register a widget module. Widget modules are for interface items, and work with
		 * a dataAPI that looks for data- options in HTML.
		 *
		 * @param	{string} 	widgetId 		The ID of this widget, which also forms its dataAPI key
		 * @param 	{array} 	acceptedOptions	Array of option keys that will be accepted by this widget
		 * @param 	{object}	widgetOptions 	Options to change the way this widget is registered/executed
		 * @param 	{function} 	fnCallback		The callback function when a widget is found on the page
		 * @returns {void}
		 */
		var	registerWidget = function (widgetID, handler, acceptedOptions, widgetOptions, fnCallback) {

			widgetOptions = _.defaults( widgetOptions || {}, {
				'lazyLoad': false, // Whether to only init this widget when necessary
				'lazyEvents': '', // The event to watch for to trigger lazy init
				'makejQueryPlugin': true
			});

			if( widgets[ widgetID ] ){
				Debug.warn( "'" + widgetID + "' is already registered as a widget. Skipping...");
			}

			widgets[ widgetID ] = { handler: handler, callback: fnCallback,
				acceptedOptions: acceptedOptions || [], widgetOptions: widgetOptions || {} };

			if( widgetOptions.makejQueryPlugin !== false ){
				buildjQueryPlugin( widgetID, handler, acceptedOptions, widgetOptions, fnCallback );
			}

			//Debug.info("Registered widget " + widgetID);
		},

		/**
		 * Returns an array of the options accepted for the given widget
		 *
		 * @param	{string} 	widgetId 		The ID of this widget, which also forms its dataAPI key
		 * @returns {array}
		 */
		getAcceptedOptions = function (widgetID) {
			return widgets[ widgetID ]['acceptedOptions'] || [];
		},

		/**
		 * Adds the provided widget as a jQuery plugin, enabling it to be instantiated programatically
		 * e.g. $('selector').ipsMenu({ options });
		 *
		 * @param	{string} 	widgetId 		The ID of this widget, which also forms its dataAPI key
		 * @param 	{array} 	acceptedOptions	Array of option keys that will be accepted by this widget
		 * @param 	{object}	widgetOptions 	Options to change the way this widget is registered/executed
		 * @param 	{function} 	fnCallback		The callback function when a widget is found on the page
		 * @returns {void}
		 */
		buildjQueryPlugin = function ( widgetID, handler, acceptedOptions, widgetOptions ) {

			var jQueryKey = widgetOptions.jQueryKey || 'ips' + widgetID.charAt(0).toUpperCase() + widgetID.slice(1),
				dataID = 'ips' + widgetID;

			if( $.fn[ jQueryKey ] ){
				Debug.warn("jQuery plugin '" + jQueryKey + "' already exists.");
				return;
			}

			$.fn[ jQueryKey ] = function (providedOptions) {

				this.each( function () {
					var elem = $( this );

					if( elem.attr( dataID ) ){
						removeExistingWidget( widgetID, this );
					}

					// Add the main widget attr
					elem.attr('data-' + dataID, '');

					// Add each option
					$.each( providedOptions, function (key, value) {
						if( _.indexOf( acceptedOptions, key ) !== false ){
							elem.attr('data-' + dataID + '-' + key, value);
						}
					});

					if( widgetOptions.lazyLoad === false ){
						_callWidget( widgetID, elem, _getWidgetOptions( widgetID, elem ) );
					}
				});

			};

			//Debug.log( 'Created $.fn.' + jQueryKey + ' jQuery plugin' );
		},

		/**
		 * Register a widget module. Widget modules are for interface items, and work with
		 * a dataAPI that looks for data- options in HTML.
		 *
		 * @param	{element} 	context 	The dom node that will be searched for widgets
		 * @param	{boolean} 	forceInit 	Force init widgets even if already initialized?
		 * @returns {void}
		 */
		_initializeWidgets = function (context /*, forceInit*/) {

			var immediateWidgets = [],
				lazyWidgets = [];

			if( !_.isElement( context ) ){
				context = document;
			}

			// Get all the widgets we'll attempt to load now
			_.each( widgets, function (item, key) {
				if( _.isUndefined( item.widgetOptions.lazyLoad ) || item.widgetOptions.lazyLoad === false ){
					immediateWidgets.push( key );
				} else {
					lazyWidgets.push( key );
				}
			});

			_doImmediateWidgets( immediateWidgets, context );

			// Lazy widgets only get set up once since they use delegated events
			if( !doneInitialInit ){
				_doLazyWidgets( lazyWidgets, context );
				doneInitialInit = true;
			}
		},

		destructAllWidgets = function (context) {
			var widgetIDs = _.keys( widgets );

			// Builds a selector that finds all of our widgets
			var selector = _.map( widgetIDs, function (item) {
				return "[data-ips" + item + "]";
			});

			// This is an expensive selector, so only do it once if possible.
			// We get all dom nodes that match any of our widgets, then we'll match them
			// up and fire off their respond methods
			var foundWidgets = $( context ).find( selector.join(',') );

			// Now we've found our widgets, we can set them up
			foundWidgets.each( function (idx, elem) {
				elem = $( elem );

				for( var i=0; i < widgetIDs.length; i++ ){
					if( !_.isUndefined( elem.attr( 'data-ips' + widgetIDs[i] ) ) ){
						_destructWidget( widgetIDs[i], elem );
					}
				}
			});
		},

		/**
		 * Calls the destruct method on a widget
		 *
		 * @param	{string} 	widgetID 	ID of the widget to destruct
		 * @param	{element} 	elem 		Element on which the widget exists
		 * @returns {void}
		 */
		_destructWidget = function (widgetID, elem) {
			if( _.isFunction( widgets[ widgetID ].handler.destruct ) ){
				try {
					widgets[ widgetID ].handler.destruct.call( widgets[ widgetID ].handler, elem );
				} catch (err) {
					Debug.error("Error calling destruct on " + widgetID );
					Debug.error( err );
				}
			}
		},

		/**
		 * Sets up immediately-initialized widgets
		 *
		 * @param	{array} 	widgetsToLoad 	Keys of those widgets to initialize immediately
		 * @param	{element} 	context 		The dom node that will be searched for widgets
		 * @returns {void}
		 */
		_doImmediateWidgets = function (widgetsToLoad, context) {

			if( !widgetsToLoad.length ){
				return;
			}

			// We'll create another var that this time contains the format needed for a css selector
			var selector = _.map( widgetsToLoad, function (item) {
				return "[data-ips" + item + "]";
			});

			// This is an expensive selector, so only do it once if possible.
			// We get all dom nodes that match any of our widgets, then we'll match them
			// up and fire off their respond methods
			var foundWidgets = $( context ).find( selector.join(',') );

			// Now we've found our widgets, we can set them up
			foundWidgets.each( function (idx, elem) {
				elem = $(elem);

				for( var i=0; i < widgetsToLoad.length; i++ ){
					if( !_.isUndefined( elem.attr( 'data-ips' + widgetsToLoad[i] ) ) ){
						_callWidget( widgetsToLoad[i], elem, _getWidgetOptions( widgetsToLoad[i], elem ) );
					}
				}
			});
		},

		/**
		 * Sets up events for lazily-loaded widgets
		 *
		 * @param	{array} 	widgetsToLoad 	Keys of those widgets to initialize immediately
		 * @param	{element} 	context 		The dom node that will be searched for widgets
		 * @returns {void}
		 */
		_doLazyWidgets = function (widgetsToLoad) {

			if( !widgetsToLoad.length ){
				return;
			}

			for( var i=0; i < widgetsToLoad.length; i++ ){
				var lazyEvents = widgets[ widgetsToLoad[i] ].widgetOptions.lazyEvents;

				if( !lazyEvents ){
					lazyEvents = 'click';
				}

				$( document ).on( lazyEvents, "[data-ips" + widgetsToLoad[i] + "]", _.partial( function (widgetKey, e) {
					_callWidget( widgetKey, this, _getWidgetOptions( widgetKey, this ), e );
				}, widgetsToLoad[i] ) );
			}

		},

		/**
		 * Calls a widget callback. If a callback is provided, that will be called. If not, we look
		 * for a 'respond' method on the handler and call that instead.
		 *
		 * @param	{string} 	widgetID 	The ID of the widget being processed
		 * @param	{element} 	elem 		The element being passed through
		 * @params 	{object} 	options 	The widget options being passed through
		 * @params 	{event} 	e 			Event object that may be passed for lazy-load widgets
		 * @returns {void}
		 */
		_callWidget = function (widgetID, elem, options, e) {
			if( _.isFunction( widgets[ widgetID ].callback ) ){
				widgets[ widgetID ].callback.call( widgets[ widgetID ].handler, elem, options, e );
			} else if( _.isFunction( widgets[ widgetID ].handler.respond ) ){
				widgets[ widgetID ].handler.respond.call( widgets[ widgetID ].handler, elem, options, e );
			} else {
				Debug.error("No callback method specified for " + widgetID);
			}
		},

		/**
		 * Calls a widget callback. If a callback is provided, that will be called. If not, we look
		 * for a 'respond' method on the handler and call that instead.
		 *
		 * @param	{string} 	widgetID 	The ID of the widget being processed
		 * @param	{element} 	elem 		The element being passed through
		 * @params 	{object} 	options 	The widget options being passed through
		 * @returns {void}
		 */
		_getWidgetOptions = function (widgetID, elem) {

			var options = {},
				optionKeys = widgets[ widgetID ].acceptedOptions;

			elem = $( elem );

			// First let's see there's a full options object waiting for us
			try {
				if( elem.attr('data-ips' + widgetID + '-options') ){
					var optionsObj = $.parseJSON( elem.attr('data-ips' + widgetID + '-options') );

					if( _.isObject( optionsObj ) ){
						return optionsObj;
					}
				}
			} catch(err) {
				Debug.warn("Invalid options object passed in for a " + widgetID + " widget. Must be valid JSON.");
			}

			// Loop through each option this widget will accept in order to see whether
			// that option exists on this element.
			if( optionKeys.length ){
				for( var i=0; i < optionKeys.length; i++ ){
					var thisOption = elem.attr( 'data-ips' + widgetID + '-' + optionKeys[i] );

					if( !_.isUndefined( thisOption ) ){

						// Try and correct numbers
						if( thisOption.match(/^[0-9]+$/g) ){
							thisOption = parseInt( thisOption, 10 );
						}

						// And try and cast booleans
						if( thisOption === 'true' ){
							thisOption = true;
						} else if( thisOption === 'false' ){
							thisOption = false;
						}

						// If no value is supplied, treat it as true
						if( $.trim( thisOption ) === '' ){
							thisOption = true;
						}

						options[ optionKeys[i] ] = thisOption;
					}
				}
			}

			return options;
		},

		/**
		 * Returns the next zIndex value
		 *
		 * @returns 	{number}
		 */
		zIndex = function () {
			ziCounter += ziIncrement;
			return ziCounter;
		},

		/**
 		 * Returns the modal element, building it if necessary
		 *
		 * @returns 	{element}
		 */
		getModal = function () {

			return $('<div/>')
						.addClass( 'ipsModal' )
						.hide()
						.appendTo( $('body') )
						.identify();
		},

		/**
 		 * Initialize ips.ui
		 *
		 * @returns 	{void}
		 */
		init = function () {
			// Listen for content change
			$( document ).on('contentChange', function (e, newContent) {

				// Initialize widgets; if we're passed a jQuery collection, loop through each
				if( newContent instanceof jQuery ){
					newContent.each( function () {
						if( Debug.isEnabled ){
							Debug.info("contentChange event, reinitializing widgets in " + $( this ).identify().attr('id') );
						}
						_initializeWidgets( this );
					});
				} else {
					if( Debug.isEnabled ){
						Debug.info("contentChange event, reinitializing widgets in " + $( newContent ).identify().attr('id') );
					}
					_initializeWidgets( newContent );
				}

				// Rerun prettyprint
				if (typeof PR != 'undefined') {
					PR.prettyPrint();
				}
			});

			_initializeWidgets( document );

		};

		return {
			registerWidget: registerWidget,
			init: init,
			zIndex: zIndex,
			getModal: getModal,
			getAcceptedOptions: getAcceptedOptions,
			key: key,
			destructAllWidgets: destructAllWidgets
		};
	});

}(jQuery, _));
