/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.codeHook.js - Handles editing theme hooks
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.themeHook', {
				
		initialize: function () {	
			var scope = this.scope;
			scope.find( '[data-action="showTemplate"]' ).removeClass('ipsHide');
			this.on( 'openDialog', function(e, data) {
				$( '#' + data.dialogID ).on( 'click', 'li[data-selector]', function(e){
					e.stopPropagation();
					ips.ui.dialog.getObj( scope.find( '[data-action="showTemplate"]' ) ).hide();
					scope.find( 'input[name="plugin_theme_hook_selector"]' ).val( $(e.currentTarget).attr('data-selector') );
				} )
			});
		},
		
	});
}(jQuery, _));
