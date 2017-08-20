/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.pages.embed.js - Pages embed dialog
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.pages.embed', {

		initialize: function () {
			this.on( 'change', 'input[type="checkbox"]', this.toggleInherit );
			this.on( 'mouseenter', 'textarea', this.mouseEnterTextarea );
		},

		/**
		 * Event handler for mousing over the textareas - we'll select hem to make them easy to copy and paste
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		mouseEnterTextarea: function (e) {
			$( e.currentTarget ).select();
		},

		/**
		 * Event handler for toggling the 'inherit styles' check
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleInherit: function (e) {
			var toggle = this.scope.find('input[type="checkbox"]');
			var textbox = this.scope.find('[data-role="blockCode"]');

			if( toggle.is(':checked') ){
				textbox.val( textbox.val().replace("></div>", " data-inheritStyle='true'></div>") );
			} else {
				textbox.val( textbox.val().replace(" data-inheritStyle='true'></div>", "></div>") );
			}
		}
	});
}(jQuery, _));