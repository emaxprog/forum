/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.statuses.status.js - Status controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.statuses.status', {

		_commentStatusID: null,

		initialize: function () {
			this.on( 'click', '[data-action="loadPreviousComments"], [data-action="loadNextComments"]', this.paginate );
			this.on( 'submit', '[data-role="replyComment"]', this.quickReply );
			this.on( document, 'addToStatusFeed', this.addToStatusFeed );
			this.setup();
		},

		setup: function () {
			this._commentStatusID = this.scope.attr('data-statusID');
		},

		/**
		 * Load more status comments
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		paginate: function (e) {
			e.preventDefault();

			var feed = $( e.currentTarget ).closest('[data-role="statusComments"]');
			var paginateRow = $( e.currentTarget ).closest( '.cStatusUpdates_pagination' );

			// Put the list in loading state
			paginateRow.html( ips.templates.render('core.statuses.loadingComments') );

			// Load the new comments
			ips.getAjax()( $( e.currentTarget ).attr('href') )
				.done( function (response) {
					paginateRow.replaceWith( response );

					// Remove any pagination rows which aren't at the start or end of the list
					feed
						.find('meta')
							.remove()
						.end();

					$( document ).trigger( 'contentChange', [ feed ] );
				})
				.fail(function(response){
					paginateRow.replaceWith( '' );
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: response.responseJSON,
					});
				});
		},

		/**
		 * Reply to a status
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		quickReply: function (e) {

			var form = this.scope.find('[data-role="replyComment"] form');

			if ( form.attr('data-noAjax') ) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			var self = this;
			var feed = $( e.currentTarget ).closest('[data-role="statusComments"]');
			var replyArea = this.scope.find('[data-role="replyComment"]');
			var submit = this.scope.find('[type="submit"]');
			
			var page = feed.attr('data-currentPage');
			
			if( !page ){
				page = 1;
			}

			var currentText = submit.text();
			
			// Set the form to loading
			submit
				.prop( 'disabled', true )
				.text( ips.getString('saving') );

			ips.getAjax()( form.attr('action'), {
				data: form.serialize() + '&submitting=1&currentPage=' + page,
				type: 'post'
			})
				.done( function (response) {
					self.trigger( 'addToStatusFeed', {
						content: response.content,
						statusID: self._commentStatusID
					});
				})
				.fail( function () {
					form.attr('data-noAjax', 'true');
					form.submit();
				})
				.always( function () {
					submit
						.prop( 'disabled', false )
						.text( currentText );
				});
		},

		/**
		 * Adds new comment to the feed and resets the editor
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		addToStatusFeed: function (e, data) {
			if( !data.content || data.statusID != this._commentStatusID ){
				return;
			}
			
			var content = $('<div/>').append( data.content );

			this.scope.find('[data-role="statusComments"]').append( content );

			ips.utils.anim.go( 'fadeInDown', content );

			ips.ui.editor.getObj( this.scope.find('[data-role="replyComment"] [data-ipsEditor]') ).reset();

			$( document ).trigger( 'contentChange', [ this.scope ] );
		}
	});
}(jQuery, _));