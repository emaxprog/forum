/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.autoSizeIframe.js - Controller to automatically adjust the height of an iframe
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.autoSizeIframe', {

		_origin: ips.utils.url.getOrigin(),
		_embedId: '',
		_iframe: null,
		_border: { vertical: 0, horizontal: 0 },

		initialize: function () {
			if( !this.scope.is('iframe') ){
				return;
			}

			this.on( window, 'message', this.receiveMessage );
			this.on( document, 'breakpointChange', this.breakpointChange );
			this.setup();
		},

		/**
		 * Sets some basic styles on the iframe, and sets up an interval
		 * to constantly check for any change in sizing
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		setup: function () {
			this._lastDims = { height: 0, width: 0 };

			var iframe = this.scope.get(0);
			iframe.style.overflow = 'hidden';
			iframe.scrolling = "no";
			iframe.seamless = "seamless";

			this._getBorderAdjustment();

			// Make sure the built-in height is reasonable
			if( this.scope.height() > 800 ){
				this.scope.css({
					height: '800px'
				});
			}

			this._iframe = iframe.contentWindow;

			// Do we have an embed ID? If not, we need to generate one
			this._embedId = 'embed' + parseInt( Math.random() * (10000000000 - 1) + 1 );
			this.scope.attr('data-embedId', this._embedId );

			// Check for postMessage and JSON support
			if( !window.postMessage || !window.JSON.parse ){
				this.scope.css({
					height: '400px'
				});
				Debug.error("Can't resize embed: " + this._embedId );
				return;
			}

			// We can now tell the iframe we are ready
			this._startReadyTimeout();
		},

		/**
		 * Sets an interval that pings the iframe with a ready message
		 * This needs to repeat because the iframe might not immediately be ready to receive messages.
		 *
		 * @returns {void}
		 */
		_startReadyTimeout: function () {
			this._readyTimeout = setInterval( _.bind( function () {
				this._postMessage('ready');
			}, this ), 100 );

			// We'll just give it 10 seconds, then stop trying
			setTimeout( _.bind( function () {
				this._stopReadyTimeout();
			}, this ), 10000 );
		},

		/**
		 * Stops the ready message interval from firing
		 *
		 * @returns {void}
		 */
		_stopReadyTimeout: function () {
			if( this._readyTimeout !== null ){
				Debug.log("Stopped posting to embed " + this._embedId);
				clearInterval( this._readyTimeout );
				this._readyTimeout = null;
			}
		},

		/**
		 * Event handler for this controller being destructed
		 *
		 * @returns {void}
		 */
		destruct: function () {
			Debug.log('Destruct autoSizeIframe ' + this._embedId);
			this._stopReadyTimeout();
			this._postMessage('stop');
		},

		/**
		 * Event handler for this controller receiving a messgae.
		 * Actually, all messages to this window are handled here, so we have to check the origin,
		 * and whether it's a message for this controller in particular (i.e. the embedIds match)
		 *
		 * @returns {void}
		 */
		receiveMessage: function (e) {
			if( e.originalEvent.origin !== this._origin ){
				return;
			}

			try {
				var pmData = JSON.parse( e.originalEvent.data );
				var method = pmData.method;
			} catch (err) {
				Debug.log("Invalid data");
				return;
			}

			if( _.isUndefined( pmData.embedId ) || pmData.embedId !== this._embedId ){
				return;
			}

			// Stop telling it we're ready now
			this._stopReadyTimeout();

			if( method && !_.isUndefined( this[ method ] ) ){
				this[ method ].call( this, pmData );
			}
		},

		/**
		 * Post a message to the iframe
		 *
		 * @returns {void}
		 */
		_postMessage: function (method, obj) {
			// Send to iframe
			Debug.log("Posting to iframe " + this._embedId);

			this._iframe.postMessage( JSON.stringify( _.extend( obj || {}, {
				method: method,
				embedId: this._embedId
			} ) ), this._origin );
		},

		/**
		 * Get the border widths, which we'll use to adjust the widths we set on the iframe
		 *
		 * @returns {void}
		 */
		_getBorderAdjustment: function () {
			this._border.vertical = parseInt( this.scope.css('border-top-width') ) + parseInt( this.scope.css('border-bottom-width') );
			this._border.horizontal = parseInt( this.scope.css('border-left-width') ) + parseInt( this.scope.css('border-right-width') );
		},

		/**
		 * Event handler for the breakpoint changing
		 *
		 * @returns {void}
		 */
		breakpointChange: function (e, data) {
			// Now send the frame our responsive state
			this._postMessage('responsiveState', {
				currentIs: data.curBreakName
			});
		},

		/**********************************/
		/* Events from the iframe */

		/**
		 * Display a dialog
		 *
		 * @returns {void}
		 */
		dialog: function (data) {
			var options = ips.ui.getAcceptedOptions('dialog');
			var dialogOptions = {};

			_.each( options, function (opt) {
				if( !_.isUndefined( data.options['data-ipsdialog-' + opt.toLowerCase() ] ) ){
					dialogOptions[ opt ] = data.options['data-ipsdialog-' + opt.toLowerCase() ];
				}
			});

			if( _.isUndefined( dialogOptions['url'] ) ){
				dialogOptions['url'] = data.url;
			}

			var dialogRef = ips.ui.dialog.create( dialogOptions );

			dialogRef.show();
		},

		/**
		 * Set the height of the iframe
		 *
		 * @returns {void}
		 */
		height: function (data) {
			if( this._lastDims.height !== data.height ){
				this.scope.css({
					height: parseInt( data.height ) + this._border.vertical + 'px'
				});

				this._postMessage('setDimensions', {
					height: parseInt( data.height )
				});

				this._lastDims.height = data.height;
			}
		},

		/**
		 * Set the dimensions of the iframe
		 *
		 * @returns {void}
		 */
		dims: function (data) {
			if( parseInt( this._lastDims.height ) !== parseInt( data.height ) || parseInt( this._lastDims.width ) !== parseInt( data.width ) ){
				this.scope.css({
					height: parseInt( data.height ) + this._border.vertical + 'px',
					maxWidth: parseInt( data.width ) + this._border.horizontal + 'px'
				});

				this._lastDims.height = data.height;
				this._lastDims.width = data.width;
			}
		},

		/**
		 * The iframe received our Ready message
		 *
		 * @returns {void}
		 */
		ok: function () {
			this._stopReadyTimeout();
			this.scope.addClass('ipsEmbed_finishedLoading');

			// Now send the frame our responsive state
			this._postMessage('responsiveState', {
				currentIs: ips.utils.responsive.getCurrentKey()
			});
		}
	});
}(jQuery, _));
