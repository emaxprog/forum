/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.support.contact.js
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.support.contact', {

		initialize: function () {
			this.on( 'change', '#elCheckbox_support_request_extra_admin', this.acpAccountCheckboxChange );
		},

		acpAccountCheckboxChange: function (e) {
			if ( !$('#elCheckbox_support_request_extra_admin').is(':checked') ) {
				ips.ui.alert.show({
					type: 'confirm',
					message: ips.getString('supportAcpAccountHead'),
					subText: ips.getString('supportAcpAccountDisableBlurb'),
					icon: 'warn',
					buttons: {
						ok: ips.getString('supportAcpAccountDisableYes'),
						cancel: ips.getString('supportAcpAccountDisableNo')
					},
					callbacks: {
						ok: function(){
							$('#elCheckbox_support_request_extra_admin').prop( 'checked', true );
						}
					}
				});
			}
		}
				
	});
}(jQuery, _));