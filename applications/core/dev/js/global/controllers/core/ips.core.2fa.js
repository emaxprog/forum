/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.2fa.js - Two-factor authentication controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.2fa', {

		initialize: function () {
			this.on( 'tabShown', this.tabShown );
			this.on( 'tabChanged', this.tabChanged );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			// Give ourselves an appropriate z-index
			this.scope.css({
				zIndex: ips.ui.zIndex()
			});

			// Focus into the first visible text box
			this.scope.find('input[type="text"]:visible').first().focus();
		},

		/**
		 * Event handler for tab being toggled. Used to focus first text field in the current tab.
		 *
		 * @returns {void}
		 */
		tabShown: function (e, data) {
			this.scope.find('input[type="text"]:visible').first().focus();
		},

		/**
		 * Event handler for tab being changed.
		 * Allows us to check the correct radio button for the method
		 *
		 * @returns {void}
		 */
		tabChanged: function (e, data) {
			if( data.tab ){
				data.tab.find('input[name="mfa_method"]').prop('checked', true);
			}
		}
	});
}(jQuery, _));