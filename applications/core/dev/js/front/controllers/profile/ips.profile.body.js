/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.profile.body.js - Profile body controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.profile.body', {

		/**
 		 * Initialize controller events
		 * Sets up the events from the view that this controller will handle
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			this.on( 'click', '[data-action="showRecentWarnings"]', this.showRecentWarnings );
			this.setup();
		},

		/**
 		 * Non-event-based setup
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			
		},

		showRecentWarnings: function (e) {
			e.preventDefault();
			
			this.scope.find('[data-action="showRecentWarnings"]').hide();
			ips.utils.anim.go( 'fadeIn fast', this.scope.find('[data-role="recentWarnings"]') );
		}
	});
}(jQuery, _));