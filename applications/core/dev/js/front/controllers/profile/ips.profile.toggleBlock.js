/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.profile.toggleBlock.js - Toggle blocks on the profile
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.profile.toggleBlock', {

		initialize: function () {
			this.on( 'click', '[data-action="disable"]', this.toggleBlock );
			this.on( 'click', '[data-action="enable"]', this.toggleBlock );
		},

		/**
		 * Toggles a block on the profile, loading the new contents via ajax from the target URL
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleBlock: function (e) {
			e.preventDefault();

			var self = this;

			this.scope.css({
				opacity: 0.6
			});

			ips.getAjax()( $( e.currentTarget ).attr('href'), {
				showLoading: true
			} )
				.done( function (response) {
					self.scope.html( response );
					$( document ).trigger( 'contentChange', [ self.scope ] );
				})
				.fail( function () {
					window.location = $( e.currentTarget ).attr('href');
				})
				.always( function () {
					self.scope.css({ 
						opacity: 1
					});
				});
		}
	});
}(jQuery, _));