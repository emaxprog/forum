/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.profileCompletion.js - Controller for profile completion sidebar widget
 *
 * Author: Ryan Ashbrook
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.profileCompletion', {
	
		initialize: function () {
			this.on( 'click', '[data-role="dismissProfile"]', this.dismissProfile );
		},

		dismissProfile: function(e) {
			e.preventDefault();
			
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=settings&do=dismissProfile' )
				.done( function(response) {
					$('[data-role="profileWidget"]').animate({
						opacity: 0
					}, 'fast', function() {
						$('[data-role="profileWidget"]').hide();
					} );
				});
		}
	});
}(jQuery, _));