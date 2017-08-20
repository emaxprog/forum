/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.notificationSettings.js - Notification settings controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.notificationSettings', {

		initialize: function () {
			this.on( 'click', '[data-action="promptMe"]', this.promptMe );
			this.on( document, 'permissionGranted.notifications', this.permissionChanged );
			this.on( document, 'permissionDenied.notifications', this.permissionChanged );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			if( ips.utils.notification.supported ){
				this._showNotificationChoice();	
			}			
		},

		/**
		 * Event handler for when the notification permission changes
		 *
		 * @returns 	{void}
		 */
		permissionChanged: function () {
			this._showNotificationChoice();
		},

		/**
		 * Event handler for clicking the 'enabled notifications' button.
		 * Shows an info message, and then triggers a browser prompt 2 secs later
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		promptMe: function (e) {
			e.preventDefault();

			if( ips.utils.notification.hasPermission() ){
				// No need to do anything
				return;
			}

			// Shoe the message then wait a couple of secs before prompting
			this.scope.find('[data-role="promptMessage"]').slideDown();

			setTimeout( function () {
				ips.utils.notification.requestPermission();
			}, 2000);
		},

		/**
		 * Displays an info panel, with the message depending on whether notifications are enabled in the browser
		 *
		 * @returns 	{void}
		 */
		_showNotificationChoice: function () {
			var type = ips.utils.notification.permissionLevel();

			this.scope
				.find('[data-role="browserNotifyInfo"]')
					.show()
					.html( ips.templates.render( 'notification.' + type ) );
		}
	});
}(jQuery, _));