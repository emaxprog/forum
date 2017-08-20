/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.databases.form.js
 *
 * Author: Matt Mecham
 */

;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.databases.form', {

		initialize: function () {
			this.on( 'change', '[name=database_create_page]', this.toggle );
			this.on( 'change', '[name=database_use_categories]', this.toggleUseCategories );
			this.toggle();
			this.toggleUseCategories();
		},
		
		/**
		 * Toggle use categories
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleUseCategories: function (e) {
			var label = this.scope.find('[data-lang=index_as_categories]');
			
			if ( $('[name=database_use_categories]:checked').val() == 1 )
			{
				label.html( ips.getString('index_as_categories') );
			}
			else
			{
				label.html( ips.getString('index_as_records') );
			}
		},
		
		/**
		 * Toggle event handler
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggle: function (e) {
			var thisToggle = $('[name=database_create_page]:checked');
			
			$.each( ['details', 'meta'], function( i, row)
			{
				if ( thisToggle.val() == 'existing' )
				{
					$('#form_header_content_page_form_tab__' + row ).hide();
				}
				else
				{
					$('#form_header_content_page_form_tab__' + row ).show();
				}
			} );
		}
	});
}(jQuery, _));