/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.recommendedComments.js - Controller for recommended comments
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.recommendedComments', {
	
		initialize: function () {
			this.on( document, 'refreshRecommendedComments', this.refresh );
			this.on( document, 'removeRecommendation', this.removeRecommendation );
		},
		
		/**
		 * Refresh the recommended comments area (primary to add a new comment). Can optionally scroll to the
		 * recommended comments area firat
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		refresh: function (e, data){
			var self = this;

			if( data.scroll ){
				if( !this.scope.is(':visible') ){
					this.scope.show();
				}

				var once = _.bind( _.once( self._doRefresh ), this );

				$('html, body').animate({
					scrollTop: this.scope.offset().top + 'px'
				}, function () {
					once( data.recommended );
				});
			} else {
				self._doRefresh( data.recommended );
			}
		},

		/**
		 * Removes a recommended comment
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		removeRecommendation: function (e, data) {
			var self = this;
			var comment = this.scope.find('[data-commentID="' + data.commentID + '"]');

			if( comment.length ){
				comment.fadeOut().slideUp( function () {
					comment.remove();
					
					if( !self.scope.find('[data-commentID]').length ){
						self.scope.hide();
					}
				});
			}
		},

		/**
		 * Fires the ajax request to get the recommended comments
		 *
		 * @param 	{string} 	newId 	The ID of the new comment that was recommended
		 * @returns	{void}
		 */
		_doRefresh: function (newId) {
			var self = this;

			// Fetch the recommended comments
			ips.getAjax()( this.scope.attr('data-url') )
				.done( function (response) {
					self._handleResponse( response, newId );
				})
				.fail( function () {
					window.reload();
				});
		},

		/**
		 * Handles the server response when adding a new comment recommendation
		 *
		 * @param 	{object} 	response 		JSON returned from server
		 * @param 	{string} 	newId 			New comment ID recommendation
		 * @returns	{void}
		 */
		_handleResponse: function (response, newId ) {
			var content = $('<div>' + response.html + '</div>').find('[data-controller="core.front.core.recommendedComments"]');
			
			// Show/hide if needed
			if( parseInt( response.count ) > 0 ){
				this.scope.show();
			} else {
				this.scope.hide();
			}

			if( !response.count ){
				return;
			}

			// If we have a new ID, we don't need to replace the whole lot - we can insert it inline
			// Do we have an ID to hide and show?
			if( newId ){
				var newComment = content.find('[data-commentID="' + newId + '"]');
				newComment.hide();

				if( newComment.is(':last-child') ){
					this.scope.find('[data-role="recommendedComments"]').append( newComment );
				} else if( newComment.is(':first-child') ){
					this.scope.find('[data-role="recommendedComments"]').prepend( newComment );
				} else {
					var prev = newComment.prev('[data-commentID]');
					prev.after( newComment );
				}

				$( document ).trigger( 'contentChange', [ newComment ] );
				newComment.fadeIn().slideDown();
			} else {
				this.scope.html( content );
				$( document ).trigger( 'contentChange', [ this.scope ] );
			}			
		}
	});
}(jQuery, _));