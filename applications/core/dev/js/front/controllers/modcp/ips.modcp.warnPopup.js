/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.warnPopup.js - Warning popup controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.warnPopup', {

		initialize: function () {
			this.on( 'click', '[data-action="revoke"]', this.revokeWarning );
		},

		/**
		 * Revoke warning
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		revokeWarning: function (e) {
			e.preventDefault();

			var url = $( e.currentTarget ).attr('href');

			ips.ui.alert.show( {
				type: 'verify',
				icon: 'question',
				message: ips.getString('revokeWarning'),
				buttons: {
					yes: ips.getString('reverseAndDelete'),
					no: ips.getString('justDelete'),
					cancel: ips.getString('cancel')
				},
				callbacks: {
					yes: function () {
						window.location = url + '&undo=1';
					},
					no: function () {
						window.location = url + '&undo=0';
					}
				}
			});
		}
	});
}(jQuery, _));