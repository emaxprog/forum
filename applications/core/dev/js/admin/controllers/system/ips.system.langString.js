/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.langString.js - Faciliates editing language strings in the ACP translator
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.langString', {

		initialize: function () {
			this.on( 'click', '[data-action="saveWords"]', this.saveWords );
			this.on( 'click', '[data-action="revertWords"]', this.revertWords );
			this.setup();
		},
		
		/**
		 * Setup method
		 * Replaces the scope element with a textbox containing the scope's HTML
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;
			var textArea = $('<textarea />');

			textArea
				.attr( 'data-url', this.scope.attr('href') )
				.val( this.scope.html() )
				.change( function (e) {
					self._change(e);
				});
			
			//this.scope.replaceWith( textArea );
		},
		
		/**
		 * Event handler for content changing in the textbox
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_change: function (e) {
			var elem = $( e.target );

			elem.addClass( 'ipsField_loading' );

			var url = elem.attr('data-url') + '&form_submitted=1&csrfKey=' + ips.getSetting('csrfKey') + 
						'&lang_word_custom=' + encodeURIComponent( elem.val() );

			// Send the translated string, and show flash message on success
			// On failure we'll reload the page
			ips.getAjax()( url )
				.done( function() {
					elem.removeClass('ipsField_loading');
					ips.ui.flashMsg.show( ips.getString('saved') );
				})
				.fail( function () {
					window.location = url;
				});
		}
	});
}(jQuery, _));