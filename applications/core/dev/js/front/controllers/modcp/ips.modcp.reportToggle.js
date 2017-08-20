/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.reportToggle.js - Controller for report toggling
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.reportToggle', {

		initialize: function () {
			this.on( 'menuItemSelected', this.reportToggled );
		},

		/**
		 * Report status has been changed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		reportToggled: function (e, data) {
			// Get the menu elem
			var item = data.menuElem.find('[data-ipsmenuvalue="' + data.selectedItemID + '"]');

			var icon = item.find('[data-role="ipsMenu_selectedIcon"]').attr('class');
			var status = item.find('[data-role="ipsMenu_selectedText"]').text();

			this.scope.find('[data-role="reportIcon"]').get(0).className = icon;
			this.scope.find('[data-role="reportStatus"]').text( status );

			// And show a flash message
			ips.ui.flashMsg.show( ips.getString('reportStatusChanged') );
		}
	});
}(jQuery, _));