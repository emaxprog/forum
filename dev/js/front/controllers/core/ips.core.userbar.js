/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.userbar.js - Controller for userbar (inbox, notifications, etc.)
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.userbar', {

		loaded: {},

		/**
		 * Initialize controller events
		 * Sets up the events from the view that this controller will handle
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			// Events initiated here
			this.on( document, 'menuOpened', this.menuOpened );
			this.on( document, 'clearUserbarCache', this.clearUserbarCache );
		},

		/**
		 * Event handler for menus being opened. Pass off to the correct method to handle
		 *
		 * @param 		{event} 	e 		Event
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		menuOpened: function (e, data) {
			if( data.elemID == 'elFullInbox' || data.elemID == 'elMobInbox' ){
				this._loadMenu( 'inbox', ips.getSetting('baseURL') + 'index.php?app=core&module=messaging&controller=messenger&overview=1', 'inbox' );
			} else if( data.elemID == 'elFullNotifications' || data.elemID == 'elMobNotifications' ){
				this._loadMenu( 'notify', ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=notifications', 'notify' );
			} else if( data.elemID == 'elFullReports' || data.elemID == 'elMobReports' ){
				this._loadMenu( 'reports', ips.getSetting('baseURL') + 'index.php?app=core&module=modcp&controller=modcp&tab=reports&overview=1', 'reports' );
			}
		},
		
		/**
		 * Event handler to clear the cache of loaded windows
		 *
		 * @param 		{event} 	e 		Event
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		clearUserbarCache: function (e, data) {
			this.loaded[ data.type ] = false;
		},

		/**
		 * Loads one of the nav bar menus
		 *
		 * @param 		{string} 	type		Type of content being loaded
		 * @param 		{string} 	url 		URL to fetch the content
		 * @param 		{string} 	contentID 	Prefix used for the elements for this type (e.g. elInbox)
		 * @returns 	{void}
		 */
		_loadMenu: function (type, url, contentID) {
			if( !this.loaded[ type ] ){
				var self = this;
				var ajaxObj = ips.getAjax();

				$('[data-role="' + contentID + 'List"]')
					.html('')
					.css( { height: '100px' } )
					.addClass('ipsLoading');

				ajaxObj( url, { dataType: 'json' } )
					.done( function (returnedData) {
	 					
	 					// Add this content to the menu
						$('[data-role="' + contentID + 'List"]')
							.css( { height: 'auto' } )
							.removeClass('ipsLoading')
							.html( returnedData.data );

						// Remember we've loaded it
						self.loaded[ type ] = true;

						// Remove the notification count
						if( contentID != 'reports' ){
							var thisTotal = $('[data-notificationType="' + contentID + '"]').html();
							var globalCount = parseInt( $('[data-notificationType="total"]').html() );

							ips.utils.anim.go( 'fadeOut', $('[data-notificationType="' + contentID + '"]') );

							$('[data-notificationType="total"]').html( globalCount - parseInt( thisTotal ) );

							if( globalCount - parseInt( thisTotal ) <= 0 ){
								ips.utils.anim.go( 'fadeOut', $('[data-notificationType="total"]') );
							}
						}						

						$( document ).trigger( 'contentChange', [ $('[data-role="' + contentID + 'List"]') ] );
					})
					.fail( function () {
						//self.trigger('topicLoadError');
					});
			}
		}

	});

}(jQuery, _));