/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.mobileNav.js - ACP mobile navigation
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.mobileNav', {

		initialize: function () {
			this.on( 'click', '[data-action="mobileSearch"]', this.mobileSearch );
		},

		/**
		 * Mobile search; simply adds a class to the body. CSS shows the search box.
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		mobileSearch: function (e) {
			e.preventDefault();

			if( $('body').hasClass('acpSearchOpen') ){
				$('body').find('.ipsModal').trigger('click');
			}

			$('body').toggleClass('acpSearchOpen');
		}
	});
}(jQuery, _));