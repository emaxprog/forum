/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.mobileNav.js - ACP mobile navigation
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.customization.themes', {

		initialize: function () {
			this.on( 'click', this.revertSetting );
		},

		
		/**
		 * Reverts a setting
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		revertSetting: function (e) {
			var self = this;

			e.preventDefault();

			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('theme_revert_setting'),
				icon: 'fa fa-question',
				buttons: {
					ok: ips.getString('ok'),
					cancel: ips.getString('cancel')
				},
				callbacks: {
					ok: function () {
						ips.getAjax()( self.scope.attr('href') + '&wasConfirmed=1' )
							.done( function (response) {
								var obj = $('#theme_setting_' + self.scope.attr('data-ipsThemeSetting') + ' input[name^=core_theme_setting_title_]');
								obj.val( response.value );
								obj.focus().blur();
								self.scope.hide();
							});	
					},
				}
			});
		}
	});
}(jQuery, _));