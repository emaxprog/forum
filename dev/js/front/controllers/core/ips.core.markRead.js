/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.markRead.js - Controller for moderation actions in content listings
 *
 * Author: Matt Mecham; Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.markRead', {

		initialize: function () {
			this.on( 'click', this.markSiteRead );
		},

		/**
		 * Event handler for marking site as read
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		markSiteRead: function (e) {
			e.preventDefault();
			
			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'question',
				message: ips.getString('markAsReadConfirm'),
				subText: '',
				callbacks: {
					ok: function () {
						var url = $( e.currentTarget ).attr('href');

						ips.getAjax()( url, {
							showLoading: true
						})
							.done( function () {
								$( document ).trigger( 'markAllRead' );
							})
							.fail( function (jqXHR, textStatus, errorThrown) {
								window.location = url;
							});
					}
				}
			});
			
		}
	});
}(jQuery, _));