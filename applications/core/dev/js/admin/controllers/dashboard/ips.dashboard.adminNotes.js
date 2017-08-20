/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.dashboard.adminNotes.js - Admin notes controller for the admin notes widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.dashboard.adminNotes', {

		initialize: function () {
			this.on( 'submit', 'form', this.saveNotes );
		},

		saveNotes: function (e) {
			e.preventDefault();

			var url = $( e.currentTarget ).attr('action');
			var self = this;

			// Show loading
			this.scope.find('[data-role="notesInfo"]').hide();
			this.scope.find('[data-role="notesLoading"]').removeClass('ipsHide');

			ips.getAjax()( url, { type: 'post', data: $('#admin_notes').serialize() } )
				.done( function (response) {
					self.scope.find('[data-role="notesInfo"]').html( response );
				})
				.fail( function () {

				})
				.always( function () {
					self.scope.find('[data-role="notesInfo"]').show();
					self.scope.find('[data-role="notesLoading"]').addClass('ipsHide');
				});
		}
	});
}(jQuery, _));