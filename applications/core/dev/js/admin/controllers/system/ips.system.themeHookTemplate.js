/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.codeHook.js - Handles editing code hooks
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.themeHookTemplate', {
				
		initialize: function () {	
			this.on( 'click', 'li[data-selector]', this._itemClick );
		},
		
		/**
		 * Event handler for clicking on an item
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_itemClick: function (e) {
			this.trigger( $( e.currentTarget ), 'templateClicked' );
		}
		
	});
}(jQuery, _));
