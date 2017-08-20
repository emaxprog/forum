/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.reviewForm.js - Review form controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.reviewForm', {
		initialize: function () {
			this.on( 'click', '[data-action="writeReview"]', this.toggleReview );
		},

		toggleReview: function (e) {
			e.preventDefault();

			this.scope.find('[data-role="reviewIntro"]').hide();
			this.scope.find('[data-role="reviewForm"]').show();
		}
	});
}(jQuery, _));