/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.preview.js - Editor preview panel
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.preview', {

		_origin: '',

		initialize: function () {
			this.on( window, 'message', this.processMessage );
			this.on( 'click', 'a', this.handleLinks );
			this.setup();
		},

		setup: function () {
			// Build a loading div that we can show
			this.scope.find('[data-role="previewContainer"]').html( ips.templates.get('core.editor.previewLoading') );

			this._origin = ips.utils.url.getOrigin();
			this._editorID = this.scope.attr('data-editorID');
			this._sendMessage({
				message: "iframeReady",
			});

			this._startTimer();
		},

		/**
		 * Don't allow links to go anywhere in the preview
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns void
		 */
		handleLinks: function (e) {
			// Allow the [page] links to work
			if( $( e.target ).is('[data-page]') ){
				return;
			}

			// Allow # links to work and assume a controller is going to do something with them
			if( $( e.target ).attr('href') && $( e.target ).attr('href') == '#' ){
				return;
			}

			// Otherwise, stop the link
			e.preventDefault();
		},

		/**
		 * Handles a message posted to us by the parent controller
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object}	data 	Data object
		 * @returns void
		 */
		processMessage: function (e, data) {			
			var oE = e.originalEvent;
			var json = $.parseJSON( oE.data );

			// Security: ignore requests not from the same origin so 3rd party frames can't tamper
			if( oE.origin !== this._origin ){
				return;
			}

			if( _.isUndefined( json.message ) ){
				return;
			}

			switch( json.message ){
				case 'fetchPreview':
					this._fetchPreview( json );
				break;
				case 'previewClosed':
					this._closedPreview();
				break;
			}
		},

		/**
		 * Sends a message to the parent controller
		 *
		 * @param 	{object}	data 	Data to send
		 * @returns void
		 */
		_sendMessage: function (data) {
			window.parent.postMessage( JSON.stringify( _.extend( data, { editorID: this._editorID } ) ), this._origin );
		},

		/**
		 * Pauses the interval timer
		 *
		 * @returns void
		 */
		_closedPreview: function () {
			if( this._timer ){
				clearInterval( this._timer );	
			}			
		},

		/**
		 * Starts the interval timer
		 *
		 * @returns void
		 */
		_startTimer: function () {
			this._timer = setInterval( _.bind( this._sendHeight, this ), 150 );
		},

		/**
		 * Fires an ajax request to get the preview contents
		 *
		 * @param 	{object}	data 	Editor data object
		 * @returns void
		 */
		_fetchPreview: function (data) {
			// Empty the content we already have
			this.cleanContents();
			this.scope.find('[data-role="previewContainer"]').html('');
			this._startTimer();

			var self = this;
			var ajaxData = {
				type: 'POST',
				data: {
					_previewField: this._editorID
				}
			};

			ajaxData.data[ this._editorID ] = data.editorContent;

			ips.getAjax()( data.url, ajaxData )
				.done( function (response) {
					self.scope.find('[data-role="previewContainer"]').html( self._processResponse( response ) );
				});
		},

		/**
		 * Processes the returned HTML before it's inserted into the dom
		 *
		 * @returns void
		 */
		_processResponse: function (response) {
			response = response.replace( /data\-ipshover/, '' );

			return response;
		},

		/**
		 * Sends the current height of the editor to the parent frame
		 *
		 * @returns void
		 */
		_sendHeight: function () {
			this._sendMessage({
				message: 'previewHeight',
				height: $( document ).height()
			});
		}
	});
}(jQuery, _));