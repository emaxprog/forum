/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.templates.variablesDialog.js - Controller for the variables dialog
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.templates.variablesDialog', {

		initialize: function () {
			this.on( 'click', 'input[type="submit"]', this.submitChange );
		},

		/**
		 * Event handler called when the submit button within the dialog is clicked
		 * Fires an event that the editor controller can respond to
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		submitChange: function (e) {
			this.trigger( 'variablesUpdated.templates', {
				fileID: this.scope.find('[name="_variables_fileid"]').val(),
				type: this.scope.find('[name="_variables_type"]').val(),
				value: this.scope.find('[data-role="variables"]').val()
			});

			this.trigger( 'closeDialog' );
		}
	});
}(jQuery, _));