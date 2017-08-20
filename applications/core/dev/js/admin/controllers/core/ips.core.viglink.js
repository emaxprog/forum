/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.viglink.js - Controller to launch VigLink "convert account" window
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.viglink', {

		initialize: function () {
			this.on( 'submit', this._submitForm );
		},
				
		/**
		 * Event handler for when form is submitted
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_submitForm: function (e) {
			if( $(e.currentTarget).find('input[name="viglink_account_type"]:checked').val() == 'create' ) {
				window.open( $(e.currentTarget).attr('data-viglinkUrl'), 'viglink', 'height=980,width=780' );
			}
		}
	});
}(jQuery, _));
