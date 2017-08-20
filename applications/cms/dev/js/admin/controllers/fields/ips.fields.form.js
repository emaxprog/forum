/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.fields.form.js
 *
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.fields.form', {
		currentValue: null,
		initialize: function () {
			$('#elTextarea_field_default_value').on( 'keypress', this.checkChange );
			
			if ( $('#field_default_update_existing').length )
			{
				this.currentValue = $('#elTextarea_field_default_value').val();
				$('#field_default_update_existing').hide();
			}
		},
		
		/**
		 * checkChange handler
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkChange: function (e) {
			
			if ( $('#elTextarea_field_default_value').val() != this.currentValue )
			{
				$('#field_default_update_existing').show();
			}
		}
	});
}(jQuery, _));