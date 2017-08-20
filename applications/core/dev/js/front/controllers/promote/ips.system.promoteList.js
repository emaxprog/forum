/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.promote.js - Promotion controller
 *
 * Author: Matt Mecham
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.promoteList', {

		initialize: function () {
			this.on( 'click', '[data-action="delete"]', this.delete );
		},
		
		/**
		 * Event handler for clicking a delete button
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		delete: function (e) {
			var a = $( e.currentTarget );
			
			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('promote_confirm_delete'),
				subText: ips.getString('promote_confirm_delete_desc'),
				icon: 'info',
				callbacks: {
					ok: function () {
						window.location = a.attr('href');
					}
				}
			});
			
			return false;
		}
	});
}(jQuery, _));