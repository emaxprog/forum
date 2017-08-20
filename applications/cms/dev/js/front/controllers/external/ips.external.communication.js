/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.external.communication.js - External communication widget - sends messages to the parent window
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.front.external.communication', {

		_blockID: '',
		_widgetID: '',

		initialize: function () {
			this.on( window, 'message', this.windowMessage );

			this.on( 'click', 'a', this.clickLink );
			this.setup();
		},

		/**
		 * setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;
			var url = ips.utils.url.getURIObject();
			this._blockID = url.queryKey.blockid;
			this._widgetID = url.queryKey.widgetid;

			this._send( 'iframeReady' );
			this._sendHeight();

			// We'll run a loop to track the height of the document and let the parent know
			setInterval( _.bind( this._sendHeight, this ), 500 );
		},

		/**
		 * Handles messages received from the parent window
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		windowMessage: function (e) {
			try {
				var pmData = JSON.parse( e.originalEvent.data );
				var method = pmData.method;	
			} catch (err) {
				return;
			}

			// Check we have a widget ID and it matches ours
			if( _.isUndefined( pmData.widgetID ) || pmData.widgetID !== this._widgetID ){
				return;
			}

			if( method && !_.isUndefined( this[ method ] ) ){
				this[ method ].call( this, pmData );
			}
		},

		/**
		 * The parent has sent us some styles to use
		 *
		 * @param 	{object} 	data 	Data object containing the styles
		 * @returns {void}
		 */
		probedStyles: function (data) {
			// Create a style element to insert into the head
			var elem = $('<style/>').attr('type', 'text/css').appendTo('head');
			var stylesheet = "\
				body {\
					font-family: " + data.font + "; \
					color: " + data.text + ";\
				}\
				\
				a {\
					color: " + data.link + ";\
				}\
			";

			elem.text( stylesheet );
		},

		/**
		 * Event handler for clicking a link; we'll send it to the parent to handle
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		clickLink: function (e) {
			var link = $( e.currentTarget );
			var href = link.attr('href');

			if( href.startsWith('#') ){
				return;
			}

			e.preventDefault();

			this._send( 'goToLink', { link: href } );
		},

		/**
		 * Shortcut for calculating and sending the height to the parent
		 *
		 * @returns {void}
		 */
		_sendHeight: function () {
			var currentSize = $('body').outerHeight();
			this._send( 'iframeSize', { size: currentSize } );
		},

		/**
		 * Sends a message to the parent
		 *
		 * @param 	{string} 	method 	Method name to call on the parent
		 * @param 	{object} 	data 	Data object to send
		 * @returns {void}
		 */
		_send: function (method, data) {
			var output = JSON.stringify( _.extend( data || {}, { 
				method: method,
				widgetID: this._widgetID,
				blockID: this._blockID
			}));

			window.top.postMessage( output, '*' );
		}
	});
}(jQuery, _));