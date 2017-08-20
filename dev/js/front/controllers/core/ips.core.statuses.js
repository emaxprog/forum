/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.statuses.js - Controller for status updates
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.statuses', {

		/**
		 * Initialize the events that this controller will respond to
		 *
		 * @returns 	{void}
		 */
		initialize: function () {

			this._hideReplyFields();

			// Events that originate here
			this.on( 'click', '[data-action="delete"]', this.deleteStatus );
			this.on( 'click', '[data-action="lock"]', this.lockStatus );
			this.on( 'click', '[data-action="unlock"]', this.unlockStatus );
			this.on( 'click', '[data-action="reply"]', this.replyStatus );
			this.on( 'click', '[data-action="loadPreviousComments"]', this.loadPrevious );
			this.on( 'blur', '[data-role="replyComment"] input[type="text"]', this.blurCommentField );
			this.on( 'keydown', '[data-role="replyComment"] input[type="text"]', this.keydownCommentField );
			//this.on( 'focus', '[data-role="replyComment"] input[type="text"]', this.focusCommentField );


			// Events we watch for here
			this.on( document, 'lockingStatus', this.togglingStatus );
			this.on( document, 'lockedStatus', this.lockedStatus );

			this.on( document, 'unlockingStatus', this.togglingStatus );
			this.on( document, 'unlockedStatus', this.unlockedStatus );

			this.on( document, 'deletingStatus deletingComment', this.deletingStatus );
			this.on( document, 'deletedStatus deletedComment', this.deletedStatus );

			this.on( document, 'loadingComments', this.loadingComments );
			this.on( document, 'loadedComments', this.loadedComments );

			this.on( document, 'addingComment', this.addingComment );
			this.on( document, 'addedComment', this.addedComment );
		},

		_requestCount: {},
		_offsets: {},

		_hideReplyFields: function () {
			$( this.scope )
				.find('[data-statusid]')
					.not('.ipsComment_hasChildren')
					.find('.ipsComment_subComments')
						.hide()
					.end()
				.end()
				.find('[data-role="submitReply"]')
					.hide();
		},

		/**
		 * Display previous comments on a status
		 *
		 * @param 	{event} 	e 		Event
		 * @fires 	core.statuses#loadComments
		 * @returns {void}
		 */
		loadPrevious: function (e) {
			e.preventDefault();

			// Get status ID
			var link = $( e.currentTarget ),
				statusElem = link.parents( '[data-statusid]' ),
				statusID = $( statusElem ).data('statusid');

			// Count how many we're showing already
			this._offsets[ statusID ] = ( statusElem.find('[data-commentid]').length ) * -1;

			this.trigger( 'loadComments', { statusID: statusID, offset: this._offsets[ statusID ] } );
		},

		/**
		 * Model is loading comments
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object}	data 	Event data object
		 * @returns {void}
		 */
		loadingComments: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' );

			status
				.find('[data-action="loadPreviousComments"]')
				.html( ips.templates.render('core.statuses.loadingComments') );
		},

		/**
		 * Comments have been loaded
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object}	data 	Event data object
		 * @returns {void}
		 */
		loadedComments: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' ),
				loadingRow = status.find('[data-action="loadPreviousComments"]');

			loadingRow.after( data.comments );

			var totalShown = status.find('[data-commentid]').length;

			if( data.total <= totalShown ){
				loadingRow.remove();
			} else {
				loadingRow
					.html( ips.templates.render('core.statuses.loadMore') )
					.find("[data-role='remainingCount']")
					.text( data.total - totalShown );
			}

			// Let everyone know
			$( document ).trigger( 'contentChange', [ status ] );
		},


		/**
		 * User has clicked a delete link
		 *
		 * @param 	{event} 	e 		Event
		 * @fires 	core.statuses#deleteComment
		 * @fires 	core.statuses#deleteStatus
		 * @returns {void}
		 */
		deleteStatus: function (e) {
			e.preventDefault();

			// Get status ID
			var link = $( e.currentTarget ),
				statusElem = link.parents('[data-statusid]'),
				commentElem = link.parents('[data-commentid]'),
				statusID = $( statusElem ).data('statusid'),
				commentID = $( commentElem ).data('commentid');

			if( commentElem ){
				if( confirm( ips.getString('confirmStatusCommentDelete') ) ){
				
					/**
					 * Requests that a model deletes this status
					 *
					 * @event 		core.statuses#deleteComment
					 * @type 		{object}
					 * @property	{number}	statusID 	The ID of the parent status
					 * @property	{number}	commentID 	The ID of the comment to delete
					 */
					this.trigger( 'deleteComment', { statusID: statusID, commentID: commentID } );
				}
			} else { 	
				if( confirm( ips.getString('confirmStatusDelete') ) ){
					
					/**
					 * Requests that a model deletes this status
					 *
					 * @event 		core.statuses#deleteStatus
					 * @type 		{object}
					 * @property	{number}	statusID 	The ID of the status to delete
					 */
					this.trigger( 'deleteStatus', { statusID: statusID } );
				}
			}
		},

		/**
		 * A delete request is currently being handled by the model
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object}	data 	Event data object
		 * @returns {void}
		 */
		deletingStatus: function (e, data) {
			// Find relevant status or comment
			if( data.commentID ){
				$( this.scope )
					.find( '[data-commentid="' + data.commentID + '"]' )
					.animate( { opacity: 0.5 } );
			} else {
				$( this.scope )
					.find( '[data-statusid="' + data.statusID + '"]' )
					.animate( { opacity: 0.5 } );
			}
		},

		/**
		 * Respond to the model deleting a status
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object}	data 	Event data object
		 * @returns {void}
		 */
		deletedStatus: function (e, data) {
			// Find relevant status or comment
			if( data.commentID ){
				$( this.scope )
					.find( '[data-commentid="' + data.commentID + '"]' )
					.remove();
			} else {
				$( this.scope )
					.find( '[data-statusid="' + data.statusID + '"]' )
					.remove();
			}
		},

		/**
		 * User has clicked a lock status link
		 *
		 * @param 	{event} 	e 		Event
		 * @fires 	core.statuses#lockStatus
		 * @returns {void}
		 */
		lockStatus: function (e) {
			e.preventDefault();

			// Get status ID
			var link = $( e.currentTarget ),
				statusElem = link.parents( '[data-statusid]' ),
				statusID = $( statusElem ).data('statusid');

			/**
			 * Requests that a model locks this status
			 *
			 * @event 		core.statuses#lockStatus
			 * @type 		{object}
			 * @property	{number}	statusID 	The ID of the status to lock
			 */
			this.trigger( 'lockStatus', { statusID: statusID } );
		},

		/**
		 * User has clicked an unlock status link
		 *
		 * @param 	{event} 	e 		Event
		 * @fires 	core.statuses#unlockStatus
		 * @returns {void}
		 */
		unlockStatus: function (e) {
			e.preventDefault();

			// Get status ID
			var link = $( e.currentTarget ),
				statusElem = link.parents( '[data-statusid]' ),
				statusID = $( statusElem ).data('statusid');

			/**
			 * Requests that a model locks this status
			 *
			 * @event 		core.statuses#unlockStatus
			 * @type 		{object}
			 * @property	{number}	statusID 	The ID of the status to unlock
			 */
			this.trigger( 'unlockStatus', { statusID: statusID } );
		},

		/**
		 * Responds to the model locking a status
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		lockedStatus: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' );

			// Find loading element
			$( status )
				.find('[data-action="lock"]')
				.first()
					.replaceWith( ips.templates.render('core.statuses.unlock') );

			this._finishedAction( e, data );
		},

		/**
		 * Responds to the model unlocking a status
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		unlockedStatus: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' );

			// Find loading element
			$( status )
				.find('[data-action="unlock"]')
				.first()
					.replaceWith( ips.templates.render('core.statuses.lock') );

			this._finishedAction( e, data );
		},

		/**
		 * A request is currently being handled by the model
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		togglingStatus: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' ),
				loadingThingy = status.find('.cStatusTools_loading');

			if( !loadingThingy.length ){
				// Add the loading thingy
				status
					.find('.cStatusTools')
					.first()
						.append( ips.templates.render('core.statuses.statusAction') );
			} else {
				loadingThingy.show();
			}

			// Update number of requests we're dealing with
			if( !this._requestCount[ data.statusID ] ){
				this._requestCount[ data.statusID ] = 1;
			} else {
				this._requestCount[ data.statusID ]++;
			}
		},

		/**
		 * Hides the loading thingy, if necessary. Called when we've finished handling a
		 * response from the model.
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		_finishedAction: function (e, data) {
			// Find relevant status
			var status = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' ),
				loadingThingy = status.find('.cStatusTools_loading');

			this._requestCount[ data.statusID ]--;

			if( this._requestCount[ data.statusID ] == 0 ){
				loadingThingy.remove();
			}
		},

		/**
		 * Shows and/or focuses the comment reply box for a status
		 *
		 * @param 	{event} 	e 		Event
		 * @returns {void}
		 */
		replyStatus: function (e) {
			e.preventDefault();

			// Get status ID
			var link = $( e.currentTarget ),
				statusElem = link.parents( '[data-statusid]' );

			if( statusElem.find('[data-commentid]').length > 0 ){
				statusElem
					.find('[data-role="replyComment"] input[type="text"]')
						.focus();

				return;
			}

			Debug.log( statusElem.find('.ipsComment_subComments').is(':visible') );

			if( !statusElem.find('.ipsComment_subComments').is(':visible') ){
				ips.utils.anim.go('fadeIn', statusElem.find('.ipsComment_subComments') );

				statusElem
					.addClass('ipsComment_hasChildren')
					.find('[data-role="replyComment"] input[type="text"]')
						.focus();
			} else {

				if( statusElem.find('[data-commentid]').length == 0 && field.val() == '' ){
					statusElem
						.removeClass('ipsComment_hasChildren')
						.find('.ipsComment_subComments, [data-role="submitReply"]')
							.hide();
				}
			}
			
		},

		/**
		 * User has blurred from the reply text field. Remove the comment box if a) there's no existing comments
		 * b) they haven't typed anything
		 *
		 * @param 	{event} 	e 		Event
		 * @returns {void}
		 */
		blurCommentField: function (e) {
			e.preventDefault();

			// Get status ID
			var field = $( e.currentTarget ),
				statusElem = field.parents( '[data-statusid]' ),
				replyButton = statusElem.find('[data-role="submitReply"]');

			if( statusElem.find('[data-commentid]').length == 0 && field.val() == '' ){
				statusElem
					.removeClass('ipsComment_hasChildren')
					.find('.ipsComment_subComments')
						.hide();
			}
		},

		/**
		 * User has blurred from the reply text field. Remove the comment box if a) there's no existing comments
		 * b) they haven't typed anything
		 *
		 * @param 	{event} 	e 		Event
		 * @returns {void}
		 */
		keydownCommentField: function (e) {

			var field = $( e.currentTarget ),
				statusElem = field.parents( '[data-statusid]' ),
				statusID = statusID = $( statusElem ).data('statusid');

			if( e.keyCode == ips.ui.key.ENTER ){
				
				/**
				 * Adds a new reply to a status
				 *
				 * @event 		core.statuses#addComment
				 * @type 		{object}
				 * @property	{string}	content 	The text of the reply
				 * @property	{number}	statusID 	The ID of the parent status				 
				 */
				this.trigger('addComment', {
					content: field.val(),
					statusID: statusID
				});
			}
		},

		/**
		 * The model is saving a comment
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		addingComment: function (e, data) {
			// Find relevant status
			var statusElem = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' ),
				replyRow = statusElem.find('[data-role="replyComment"]');

			replyRow
				.find('input[type="text"]')
				.prop('disabled', true)
				.addClass('ipsField_disabled');
		},

		/**
		 * A comment has been added by the model
		 *
		 * @param 	{event} 	e 		Event
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		addedComment: function (e, data) {
			// Find relevant status
			var statusElem = $( this.scope ).find( '[data-statusid="' + data.statusID + '"]' ),
				replyRow = statusElem.find('[data-role="replyComment"]'),
				subComments = statusElem.find('.ipsComment_subComments');

			if( replyRow.length ){
				replyRow.before( data.comment );
			} else if( subComments.length ){
				subComments.append( data.comment );
			}

			statusElem
				.find('[data-role="replyComment"] input[type="text"]')
					.val('')
					.blur()
					.prop('disabled', false)
					.removeClass('ipsField_disabled');
		},

		/**
		 * User has focused on the reply field, so we show the reply button
		 *
		 * @param 	{event} 	e 		Event
		 * @returns {void}
		 */
		/*focusCommentField: function (e) {
			e.preventDefault();

			// Get status ID
			var field = $( e.currentTarget ),
				statusElem = field.parents( '[data-statusid]' ),
				replyButton = statusElem.find('[data-role="submitReply"]');

			if( !replyButton.is(':visible') ){
				replyButton.show();
			}
		}*/
	});
}(jQuery, _));