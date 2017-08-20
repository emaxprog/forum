/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.guestTerms.js - Guest terms bar
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.guestTerms', {

		initialize: function () {
			this.on( 'click', '[data-action="dismissTerms"]', this.dismissBar );
			this.setup();
		},

		setup: function () {
			// If guest caching is enabled, the bar HTML will exist in the page even if this
			// user has accepted terms. We'll hide it with JS if that happens.
			this.scope.toggle( !ips.utils.cookie.get('guestTermsDismissed') );
			$('body').toggleClass('cWithGuestTerms', !ips.utils.cookie.get('guestTermsDismissed') );
		},

		/**
		 * Event handler for dismiss button in bar
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		dismissBar: function (e) {
			e.preventDefault();

			var self = this;

			// Set the cookie so it doesn't show again
			ips.utils.cookie.set( 'guestTermsDismissed', 1, true );

			// Hide the bar
			self.scope.animate({
				opacity: 0
			}, 'fast', function () {
				$('body').removeClass('cWithGuestTerms');

				// Destruct the sticky
				if( self.scope.is('[data-ipsSticky]') ){
					ips.ui.sticky.destruct( self.scope );
				}

				self.scope.remove();
			});
		}
	});
}(jQuery, _));