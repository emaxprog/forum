/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.messengerMenu.js - Messenger menu popup to control drawer
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.messengerMenu', {

		initialize: function () {
			this.setup();
			this.on( 'click', '#elMessengerPopup_compose', this.clickCompose );
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			// Remove the dialog trigger if we're on mobile
			if( ips.utils.responsive.currentIs('phone') ){
				this.scope.find('#elMessengerPopup_compose').removeAttr('data-ipsDialog');
			}
		},

		/**
		 * Event handler for clicking the 'compose' button inside this popup.
		 * Find the drawer X button and clicks it, hiding the drawer while the compose popup is open
		 * Also backup protection for redirecting to the compose page if we're on mobile
		 *
		 * @returns {void}
		 */
		clickCompose: function (e) {
			if( ips.utils.responsive.currentIs('phone') ){
				e.preventDefault();
				window.location = $( e.currentTarget ).attr('href');
			} else {
				$('body').find('#elMobileDrawer .ipsDrawer_close').click();
			}
		}
	});
}(jQuery, _));