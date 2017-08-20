/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.notification.js - A module for working with HTML5 notifications
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.notification', function () {

		var supported = ( "Notification" in window );

		/**
		 * Determines whether the user has granted permission for notifications
		 *
		 * @returns 	{boolean}	Whether notifications have permission
		 */
		var hasPermission = function () {
			if( !supported || Notification.permission == 'denied' || Notification.permission == 'default' ){
				return false;
			}

			return true;
		},

		/**
		 * Do we need permission to show notifications? If the user has agreed or explicitly declined, this
		 * will be false. If they haven't decided yet, it'll return true.
		 *
		 * @returns 	{boolean} 	Whether the browser needs to ask for permission
		 */
		needsPermission = function () {
			if( supported && Notification.permission == 'default' ){
				return true;
			}

			return false;
		},

		/**
		 * Returns the granted permission level
		 *
		 * @returns 	{mixed}
		 */
		permissionLevel = function () {
			if( !supported ){
				return null;
			}

			return Notification.permission;
		},

		/**
		 * Requests permission for notifications from the user
		 *
		 * @returns 	{void}
		 */
		requestPermission = function () {
			if( supported ){
				Notification.requestPermission( function (result) {
					if( result == 'granted' ){
						$( document ).trigger('permissionGranted.notifications');	
					} else {
						$( document ).trigger('permissionDenied.notifications');
					}					
				});
			}
		},

		/**
		 * Creates a new notification and returns a notification object
		 *
		 * @param 		{object} 	options 	Configuration object
		 * @returns 	{function}
		 */
		create = function (options) {
			return new notification( options );
		};

		/**
		 * Our notification construct
		 *
		 * @param 		{object} 	options 	Configuration object
		 * @returns 	{void}
		 */
		function notification (options) {
			this._notification = null;

			this._options = _.defaults( options, {
				title: '',
				body: '',
				icon: '',
				timeout: false,
				tag: '',
				dir: $('html').attr('dir') || 'ltr',
				lang: $('html').attr('lang') || '',
				onShow: $.noop,
				onHide: $.noop,
				onClick: $.noop,
				onError: $.noop
			} );

			// Unescape body & title because we'll be getting escaped chars from the backend
			this._options.body = _.unescape( this._options.body.replace( /&#039;/g, "'" ).replace( /<[^>]*>?/g, '' ) );
			this._options.title = _.unescape( this._options.title.replace( /&#039;/g, "'" ) );

			this.show = function () {
				this._notification = new Notification( this._options.title, this._options );
				this._notification.addEventListener( 'show', this._options.onShow, false );
				this._notification.addEventListener( 'hide', this._options.onHide, false );
				this._notification.addEventListener( 'click', this._options.onClick, false );
				this._notification.addEventListener( 'error', this._options.onError, false );

				if( this._options.timeout !== false ){
					setTimeout( _.bind( this.hide, this ), this._options.timeout * 1000 );
				}
			};

			this.hide = function () {
				this._notification.close();
				this._notification.removeEventListener( 'show', this._options.onShow, false );
				this._notification.removeEventListener( 'hide', this._options.onHide, false );
				this._notification.removeEventListener( 'click', this._options.onClick, false );
				this._notification.removeEventListener( 'error', this._options.onError, false );
			};
		};		
		
		return {
			supported: supported,
			hasPermission: hasPermission,
			needsPermission: needsPermission,
			permissionLevel: permissionLevel,
			requestPermission: requestPermission,
			create: create
		};
	});
}(jQuery, _));