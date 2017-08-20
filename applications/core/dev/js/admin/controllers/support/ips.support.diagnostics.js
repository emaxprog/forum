/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.support.diagnostics.js
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.support.diagnostics', {

		initialize: function () {
			this.on( 'click', '[data-action="contactSupport"]', this.stillNeedHelpButton );
			this.on( 'click', '[data-action="disableThirdParty"]', this.disableThirdPartyButton );
			this.on( 'click', '[data-action="enableThirdParty"]', this.enableThirdPartyButton );
			this.on( 'click', '[data-action="enableThirdPartyPart"]', this.enableThirdPartyPartButton );
		},

		stillNeedHelpButton: function (e) {
			e.preventDefault();
			
			if ( $(this.scope).attr('data-fails') ) {
				ips.ui.alert.show({
					type: 'confirm',
					message: ips.getString('supportToolFailsHead'),
					subText: ips.getString('supportToolFailsInfo'),
					icon: 'warn',
					buttons: {
						ok: ips.getString('supportContinueAnyway'),
						cancel: ips.getString('cancel')
					},
					callbacks: {
						ok: _.bind( $(this.scope).attr('data-thirdParty') == '0' ? this._continueToSupportForm : this._launchThirdPartyAlert, this )
					}
				});
				return;
			}
			
			if ( $(this.scope).attr('data-thirdParty') ) {
				this._launchThirdPartyAlert();
			}
		},
				
		_launchThirdPartyAlert: function() {
			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('supportTool3rdPartyHead'),
				subText: ips.getString('supportTool3rdPartyInfo'),
				icon: 'warn',
				buttons: {
					ok: ips.getString('supportContinueAnyway'),
					cancel: ips.getString('cancel')
				},
				callbacks: {
					ok: _.bind( this._continueToSupportForm, this )
				}
			});
		},
		
		_continueToSupportForm: function() {
			$(this.scope).find('[data-action="contactSupport"]').attr( 'data-action', 'wizardLink' ).click();
		},
		
		disableThirdPartyButton: function (e) {
			e.preventDefault();
			
			$(this.scope).attr('data-thirdParty', '0');
			
			$(e.target).prop('disabled', true).addClass('ipsButton_disabled').addClass('ipsButton_disabled').text( ips.getString('supportDisablingCustomizations') );
			
			var self = this;
			ips.getAjax()( $(e.target).attr('href') )
				.done( function(response) {
				  $(self.scope).find('[data-role="thirdPartyInfo"]').html( response );
				  $( document ).trigger( 'contentChange', [ $(self.scope) ] );
				});
		},
		
		enableThirdPartyButton: function (e) {
			e.preventDefault();
			
			$(e.target).prop('disabled', true).addClass('ipsButton_disabled').addClass('ipsButton_disabled').text( ips.getString('supportEnablingCustomizations') );
			
			var self = this;
			ips.getAjax()( $(e.target).attr('href') )
				.done( function(response) {
					$(e.target).remove();
					var container = $(self.scope).find('[data-role="disabledInformation"]');
					container.find('.ipsType_warning').removeClass('ipsType_warning').addClass('ipsType_neutral');
					container.find('.fa-exclamation-triangle').removeClass('fa-exclamation-triangle').addClass('fa-info-circle');
					container.find('.ipsButton_negative').removeClass('ipsButton_negative').addClass('ipsButton_light');
					container.find('[data-role="disabledMessage"]').hide();
					container.find('[data-role="enabledMessage"]').show();
					container.find('[data-action="enableThirdPartyPart"]').remove();
					$( document ).trigger( 'contentChange', [ $(self.scope) ] );
				});
		},
		
		enableThirdPartyPartButton: function (e) {
			e.preventDefault();
			
			$(e.target).prop('disabled', true).addClass('ipsButton_disabled').addClass('ipsButton_disabled').text( ips.getString('supportEnablingCustomizations') );
			
			var self = this;
			ips.getAjax()( $(e.target).attr('href') )
				.done( function(response) {
					var container = $(e.target).closest('li');
					container.find('.ipsType_warning').removeClass('ipsType_warning').addClass('ipsType_neutral');
					container.find('.fa-exclamation-triangle').removeClass('fa-exclamation-triangle').addClass('fa-info-circle');
					container.find('.ipsButton_negative').removeClass('ipsButton_negative').addClass('ipsButton_light');
					container.find('[data-role="disabledMessage"]').hide();
					container.find('[data-role="enabledMessage"]').show();
					
					$(e.target).remove();
					$( document ).trigger( 'contentChange', [ $(self.scope) ] );
				});
		}
	});
}(jQuery, _));