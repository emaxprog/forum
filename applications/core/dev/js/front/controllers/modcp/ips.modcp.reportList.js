/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.reportList.js - Report list controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.reportList', {

		initialize: function () {
			this.on( 'menuItemSelected', '[data-action="changeStatus"]', this.changeReportStatus );
		},

		/**
		 * When a reports status is changed, check whether the row needs changing
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Event data
		 * @returns 	{void}
		 */
		changeReportStatus: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			var row = $( e.currentTarget ).closest('.ipsDataItem');

			row.removeClass('ipsDataItem_new ipsDataItem_warning');

			switch( data.selectedItemID ){
				case '1':
					row.addClass('ipsDataItem_new');
				break;
				case '2':
					row.addClass('ipsDataItem_warning');
				break;
			}
		}
	});
}(jQuery, _));