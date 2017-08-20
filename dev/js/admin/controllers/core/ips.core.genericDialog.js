/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.genericDialog.js - A controller that can be used so that forms inside dialogs submit via ajax
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.genericDialog', {

		initialize: function () {
			this.on( 'submit', 'form', this.submitAjaxForm );
			$( document ).on( 'multipleRedirectFinished', _.bind( this.dismissDialog, this ) );
		},

		/**
		 * Event handler for form submit
		 * If the form is inside a dialog widget, this method will attempt to validate the form remotely
		 * If it fails, the dialog is updated with new HTML from the server. On success, the form is submitted
		 * as normal.
		 *
		 * @returns {void}
		 */
		submitAjaxForm: function (e) {
						
			if( $( e.currentTarget ).attr('data-bypassValidation') ){
				return;
			}
			
			e.preventDefault();

			var dialog = this.scope.closest('.ipsDialog');

			if( !dialog.length ){
				return;
			}

			// Get the dialog object so we can work with it
			var elemId = dialog.attr('id').replace(/_dialog$/, '');
			var dialogObj = ips.ui.dialog.getObj( $('#' + elemId) );

			if( !dialogObj ){
				return;
			}

			// Set the loading status
			dialogObj.setLoading(true);

			ips.getAjax()( $( e.currentTarget ).attr('action') + '&ajaxValidate=1', {
				data: $( e.currentTarget ).serialize(),
				type: 'post'
			})
				.done( function (response, textStatus, jqXHR) {					
					if( jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormError: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formerror: true') !== -1 ){
						dialogObj.updateContent( jqXHR.responseText );
						$( document ).trigger( 'contentChange', [ $('#' + elemId) ] );
						dialogObj.setLoading(false);
					} else if( jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormNoSubmit: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formnosubmit: true') !== -1 ){
						dialogObj.updateContent( jqXHR.responseText );
						$( document ).trigger( 'contentChange', [ $('#' + elemId) ] );
						dialogObj.setLoading(false);
					} else {
						$( e.currentTarget ).attr('data-bypassValidation', true).submit();
					}
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					if( Debug.isEnabled() ){
						Debug.error( "Ajax request failed (" + status + "): " + errorThrown );
						Debug.error( jqXHR.responseText );
					} else {
						// rut-roh, we'll just do a manual submit
						$( e.currentTarget ).attr('data-bypassValidation', true).submit();
					}
				});
		},
		
		/**
		 * Event to dismiss the dialog
		 *
		 */
		dismissDialog: function (e) {
			var elemId = $('.ipsDialog').attr('id').replace(/_dialog$/, '');
			
			var dialogObj = ips.ui.dialog.getObj( $('#' + elemId) );
			dialogObj.hide();
			
			$( '#' + elemId ).data('_dialog', '')

		}
	});
}(jQuery, _));