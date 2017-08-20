/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.databases.download.js - Present an alert to the user asking them if they want to build the app first
 *
 * Author: Rikki Tissier (Good bits), Matt Mecham (bad bits)
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.databases.download', {

		initialize: function () {
			this.on( 'click', this.launchAlert );
		},

		/**
		 * Displays a dialog to the user with 'build and download' and 'download' options
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		launchAlert: function (e) {
			var self = this;

			e.preventDefault();

			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('cms_download_db_explain'),
				icon: 'fa fa-download',
				buttons: {
					ok: ips.getString('cms_download_db'),
					cancel: ips.getString('cancel')
				},
				callbacks: {
					ok: function () {
						window.location = self.scope.attr('data-downloadURL');
					},
				}
			});
		}
	});
}(jQuery, _));