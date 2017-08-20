/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.comment.js - Comment model
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.model.register('core.comment', {

		initialize: function () {
			this.on( 'getEditForm.comment', this.getEditForm );
			this.on( 'saveEditComment.comment', this.saveEditComment );
			this.on( 'deleteComment.comment', this.deleteComment );
			this.on( 'newComment.comment', this.newComment );
			this.on( 'approveComment.comment', this.approveComment );
			this.on( 'unrecommendComment.comment', this.unrecommendComment );
		},
				
		/**
		 * Retrieves edit form
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		getEditForm: function (e, data) {
			this.getData( {
				url: data.url,
				dataType: 'html',
				data: {},
				events: 'getEditForm',
				namespace: 'comment'
			}, data);
		},

		/**
		 * Saves edit back to server
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		saveEditComment: function (e, data) {
			var url = data.url;
			
			this.getData( {
				url: data.url,
				dataType: 'html',
				type: 'post',
				data: data.form || {},
				events: 'saveEditComment',
				namespace: 'comment'
			}, data);
		},

		/**
		 * Approves comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		approveComment: function (e, data) {
			this.getData( {
				url: data.url,
				dataType: 'html',
				data: data.form || {},
				events: 'approveComment',
				namespace: 'comment'
			}, data);
		},

		/**
		 * Unrecommend this comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		unrecommendComment: function (e, data) {
			this.getData( {
				url: data.url,
				dataType: 'json',
				data: data.form || {},
				events: 'unrecommendComment',
				namespace: 'comment'
			}, data);
		},

		/**
		 * Deletes comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		deleteComment: function (e, data) {
			this.getData( {
				url: data.url,
				dataType: 'html',
				data: data.form || {},
				events: 'deleteComment',
				namespace: 'comment'
			}, data);
		},

		/**
		 * Adds a new comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object}	data 	Event data object
		 * @returns 	{void}
		 */
		newComment: function (e, data) {
			this.getData( {
				url: data.url,
				dataType: 'json',
				data: data.form || {},
				events: 'newComment',
				namespace: 'comment'
			}, data);
		}
	});
}(jQuery, _));