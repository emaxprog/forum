/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.statusFeedWidget.js - Controller for status sidebar widget
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.statusFeedWidget', {
	
		initialize: function () {
			this.on( 'editorWidgetInitialized', '[data-role="statusFormArea"]', this.editorReady );
			this.on( 'focus', '[data-role="statusFormArea"] .ipsComposeArea_dummy', this.focusNewStatus );
			this.on( 'submit', '[data-role="statusFormArea"] form', this.submitNewStatus );
			this.setup();
		},

		setup: function () {

		},

		focusNewStatus: function (e) {
			e.preventDefault();
			var self = this;

			$( e.currentTarget ).text( ips.getString('loading') + "..." );

			// Fetch the form
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=status&controller=ajaxcreate')
				.done( function (response) {
					self.scope.find('[data-role="statusEditor"]').html( response );
					$( document ).trigger( 'contentChange', [ self.scope.find('[data-role="statusEditor"]') ] );
				});
		},

		editorReady: function (e, data) {
			this.scope.find('[data-role="statusEditor"]').show();
			this.scope.find('[data-role="statusDummy"]').hide().find('.ipsComposeArea_dummy').text( ips.getString('whatsOnYourMind') );

			try {
				CKEDITOR.instances[ data.id ].focus();
			} catch (err) {
				Debug.log( err );
			}
		},

		submitNewStatus: function (e) {
			e.preventDefault();

			var self = this;
			var form = $( e.currentTarget );

			// Set the button loading
			form.find('button[type="submit"]').prop( 'disabled', true ).text( ips.getString('updatingStatus') );

			ips.getAjax()( form.attr('action'), {
				data: form.serialize(),
				type: 'post',
				bypassRedirect: true
			} )
				.done( function (response) {
					var newStatus = $( response.content );

					self.scope.find('[data-role="statusDummy"]').show();
					self.scope.find('[data-role="statusEditor"]').hide();
					self.scope.find('[data-role="statusFeedEmpty"]').hide();

					// Add the content, find the new status, hide it, then animate it
					self.scope.find('[data-role="statusFeed"]')
						.prepend( newStatus )
						.find('[data-statusID="' + response.id + '"]')
							.hide()
							.slideDown();

					$( document ).trigger( 'contentChange', [ self.scope.find('[data-role="statusFeed"]') ] );
				})
				.always( function () {
					form.find('button[type="submit"]').prop( 'disabled', false ).text( ips.getString('submitStatus') );
				});
		}
	});
}(jQuery, _));