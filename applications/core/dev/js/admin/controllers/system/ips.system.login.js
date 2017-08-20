/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.login.js - ACP login screen controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.login', {

		initialize: function () {
			this.on( 'tabChanged', this.tabChanged );
			this.on( 'click', '[data-action="upgradeWarningContinue"]', this.upgradeWarningContinue );
			this.setup();
		},

		/**
		 * Setup method
		 * Focuses the first text field on the first visible tab automatically
		 *
		 * @returns {void}
		 */
		setup: function () {
			// find the active tab, if any, then the first text field to focus it
			this.scope
				.find("#elTabContent .ipsTabs_panel:visible")
					.first()
					.find('input[type="text"]')
						.first()
						.focus();
		},

		/**
		 * Event handler for the active tab being changed
		 * Saves the new active tab in a cookie for the next time the login screen is loaded
		 * so that we can show the user their correct login method automatically
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data	Event data object
		 * @returns {void}
		 */
		tabChanged: function (e, data) {
			// Store the tab they've clicked on in the local DB so that we can
			// show it by default next time they log in
			ips.utils.cookie.set( 'acpLoginMethod', data.tabID, 1 );
		},
		
		/**
		 * Event handler for when the upgrade warning is skipped
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data	Event data object
		 * @returns {void}
		 */
		upgradeWarningContinue: function (e, data) {
			e.preventDefault();
			$(this.scope).find('[data-role="upgradeWarning"]').hide();
			$(this.scope).find('[data-role="loginForms"]').removeClass('ipsHide').show();
		}
	});
}(jQuery, _));