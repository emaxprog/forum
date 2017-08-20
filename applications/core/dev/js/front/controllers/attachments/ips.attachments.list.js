/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.attachments.list.js - My-Attachments controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.attachments.list', {

		initialize: function () {
			this.on( 'click', '[data-action="deleteAttachment"]', this.deleteAttachment );
		},

		/**
		 * Removes the attachment row
		 *
		 * @param e
		 */
		deleteAttachment: function (e) {
			e.preventDefault();

			var elem = $( e.currentTarget );

			// Confirm it
			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'question',
				message: ips.getString('delete'),
				subText: ips.getString('delete_confirm'),
				callbacks: {
					ok: function () {
						ips.getAjax()( elem.attr('href') + '&wasConfirmed=1' )
							.done( function (response) {
								var row = elem.closest('div.ipsDataItem');
								row.remove();
								ips.utils.anim.go( 'fadeOut', row );
							});
					}
				}
			});
		}
	});
}(jQuery, _));