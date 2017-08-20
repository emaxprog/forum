/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.templates.addForm.js - Controller for the 'add' form in the template editor
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.templates.addForm', {

		initialize: function () {
			this.on( 'submit', 'form.ipsForm', this.submitForm );
			this.on( document, 'fileListRefreshed.templates', this.closeDialog );
		},

		submitForm: function (e) {
			e.preventDefault();

			var self = this;

			if( !$( e.currentTarget ).attr('data-bypassValidation') ){
				// The form hasn't been validated by the genericDialog controller yet, so bail for now
				return;
			}

			// Gather form values and send them
			ips.getAjax()( $( e.currentTarget ).attr('action'), {
				dataType: 'json',
				data: $( e.currentTarget ).serialize(),
				type: 'post'
			})
				.done( function (response) {

					self.trigger( 'addedFile.templates', {
						type: self.scope.attr('data-type'),
						fileID: response.id,
						name: response.name
					});

				});
		},

		closeDialog: function (e, data) {
			this.trigger('closeDialog');
		}
	});
}(jQuery, _));