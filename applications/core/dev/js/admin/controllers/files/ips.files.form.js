/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.files.form.js - ACP Files Form Stuffs
 *
 * Author: MTM
 */

;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.files.form', {

		initialize: function () {
			if ( this.scope.find('input[name=filestorage_move]') )
			{
				$('#form_filestorage_move').hide();
				this.on( 'submit', 'form.ipsForm_horizontal', this.submitForm );
			}
		},

		
		/**
		 * Check if move is needed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitForm: function (e) {
			var self = this;
			
			if( $( e.currentTarget ).attr('data-bypassValidation') ){
				return true;
			}
			
			e.preventDefault();
			
			$( e.currentTarget ).attr('data-bypassValidation', true);
			
			// Start the request
			ips.getAjax()( $( e.currentTarget ).attr('action').replace('do=configurationForm', 'do=checkMoveNeeded'), {
				data: $( e.currentTarget ).serialize(),
				type: 'post'
			})
			.done( function (response) {
				if ( response.needsMoving )
				{
					ips.ui.alert.show({
						type: 'confirm',
						message: ips.getString('files_overview_move_desc'),
						icon: 'fa fa-warning',
						buttons: {
							ok: ips.getString('files_overview_move'),
							cancel: ips.getString('files_overview_leave')
						},
						callbacks: {
							ok: function () {
								$('input[name=filestorage_move_checkbox]').prop('checked', true);
								$( e.currentTarget ).submit();
							},
							cancel: function () {
								$('input[name=filestorage_move_checkbox]').prop('checked', false);
								$( e.currentTarget ).submit();
							}
						}
					});
				}
				else {
					$( e.currentTarget ).submit();
				}
			});
		}
	});
}(jQuery, _));