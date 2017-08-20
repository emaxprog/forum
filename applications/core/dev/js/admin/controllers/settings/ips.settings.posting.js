/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.settings.posting.js
 *
 * Author: Stuart Silvester
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.settings.posting', {
		defaultStatus: false,

		initialize: function () {
			this.defaultStatus = $( '#check_remote_image_proxy' ).is(':checked');
			this.on( 'change', '#check_remote_image_proxy', this.promptRebuildPreference );
		},

		promptRebuildPreference: function (e) {
			/* Do not prompt if the setting is toggled to the default */
			if( this.defaultStatus == $( '#check_remote_image_proxy' ).is(':checked') )
			{
				/* Disable any rebuild process */
				$('input[name=rebuildImageProxy]').val( 0 );
				return;
			}

			/* Show Rebuild Prompt */
			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('imageProxyRebuild'),
				subText: $( '#check_remote_image_proxy' ).is(':checked') ? ips.getString('imageProxyRebuildBlurbEnable') : ips.getString('imageProxyRebuildBlurbDisable'),
				icon: 'question',
				buttons: {
					ok: ips.getString('imageProxyRebuildYes'),
					cancel: ips.getString('imageProxyRebuildNo')
				},
				callbacks: {
					ok: function(){
						$('input[name=rebuildImageProxy]').val( 1 );
					},
					cancel: function(){
						$('input[name=rebuildImageProxy]').val( 0 );
					}
				}
			});
		}

	});
}(jQuery, _));