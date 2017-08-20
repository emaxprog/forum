/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.statuses.statusFeed.js - Status feed controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.statuses.statusFeed', {

		initialize: function () {
			this.on( 'submit', '[data-role="newStatus"] form', this.submitNewStatus );
			this.setup();
		},

		setup: function () {
			
		},

		/**
		 * Adds a new status to the feed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitNewStatus: function (e) {
			e.preventDefault();
			e.stopPropagation();

			var self = this;
			var feed = this.scope.find('[data-role="activityStream"]');
			var replyArea = this.scope.find('[data-role="replyComment"]');
			var form = this.scope.find('[data-role="newStatus"] form');
			var submit = this.scope.find('[data-action="submitComment"]');
			var textarea = form.find('textarea');

			var currentText = submit.text();
			
			if ( !textarea.val() ) {
				ips.ui.alert.show( {
					type: 'alert',
					message: ips.getString('validation_required'),
					icon: 'warn'
				});
				return;
			}
			
			// Set the form to loading
			submit
				.prop( 'disabled', true )
				.text( ips.getString('saving') );

			ips.getAjax()( form.attr('action'), {
				data: form.serialize(),
				type: 'post',
				bypassRedirect: true
			})
				.done( function (response) {
					var content = $('<div/>').append( response );
					var comment = content.find('.ipsComment,.ipsStreamItem').first(); // Must select first(), because statuses can contain sub-comments

					feed.prepend( comment );

					ips.utils.anim.go( 'fadeInDown', comment );
					
					$( 'textarea[name="' + textarea.attr('name') + '"]' ).closest('[data-ipsEditor]').data('_editor').reset();
					$( document ).trigger( 'contentChange', [ comment ] );
				})
				.fail( function () {
					//form.submit();
				})
				.always( function () {
					submit
						.prop( 'disabled', false )
						.text( currentText );
				});
		}
	});
}(jQuery, _));