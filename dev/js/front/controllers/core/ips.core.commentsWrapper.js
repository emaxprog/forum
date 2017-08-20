/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.commentWrapper.js
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.commentsWrapper', {
		
		initialize: function () {
			this.on( document, 'addToCommentFeed', this.addToCommentFeed );
			this.on( 'deletedComment.comment', this.deletedComment );
		},
		
		/**
		 * Responds to an event (trigger within this controller) indicating a new comment has been added
		 * Show it, and reset the contents of ckeditor
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		addToCommentFeed: function(e, data) {
			this._updateCount( $(e.target).attr('data-commentsType'), data.totalItems );
		},
		
		/**
		 * Responds to an event indicating thay a comment has been deleted
		 * Show it, and reset the contents of ckeditor
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		deletedComment: function(e, data) {
			this._updateCount( $(e.target).closest('[data-commentsType]').attr('data-commentsType'), data.newTotal );
		},
		
		/**
		 * Update comment count
		 *
		 * @param	{int}	newTotal	The new total
		 * @returns 	{void}
		 */		
		_updateCount: function( type, number ) {
			var langString = 'js_num_' + type;
			var elem = $( '#' + $(this.scope).attr('data-tabsId') + '_tab_' + type );
			elem.text( ips.pluralize( ips.getString( langString ), number ) );
		}
	});
}(jQuery, _));