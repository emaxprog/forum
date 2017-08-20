/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.mobileNav.js - Mobile navigation controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.mobileNav', {

		initialize: function () {
			this.on( 'click', '[data-action="mobileSearch"]', this.mobileSearch );
			this.on( document, 'notificationCountUpdate', this.updateCount );
		},

		/**
		 * Update the badge when we have a different notification count
		 *
		 * @param	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		updateCount: function (e, data) {
			if( !_.isUndefined( data.total ) ){
				if( data.total <= 0 ){
					this.scope.find('[data-notificationType="total"]').hide();
				} else {
					this.scope.find('[data-notificationType="total"]').text( parseInt( data.total ) );
				}
			}
		},

		/**
		 * Mobile search; simply adds a class to the body. CSS shows the search box.
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		mobileSearch: function (e) {
			e.preventDefault();
			$('body').toggleClass('cSearchOpen');

			var url = ips.getSetting('baseURL') + 'index.php?app=core&module=search&controller=search&do=globalFilterOptions&checked=' + this.scope.attr('data-default');

			if( $('body').find('[data-role="globalSearchMenuOptions"]').length ){
				ips.getAjax()( url )
					.done(function( response ){
						$('body').find('[data-role="globalSearchMenuOptions"]').replaceWith( response );
					});
			}
		}
	});
}(jQuery, _));