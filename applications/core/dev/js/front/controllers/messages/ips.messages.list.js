/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.messages.list.js - Messages list in messenger
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.messages.list', {

		_messageList: null,
		_searchTimer: null,
		_currentFolder: null,
		_currentMessageID: null,
		_currentOptions: {
			sortBy: 'mt_last_post_time',
			filter: 'all'
		},

		initialize: function () {
			// Main controller events
			this.on( document, 'messengerReady.messages', this.messengerReady );

			// Menu events
			this.on( 'menuItemSelected', '#elSortByMenu', this.changeSort );
			this.on( 'menuItemSelected', '#elFilterMenu', this.changeFilter );
			this.on( 'menuItemSelected', '#elSearchTypes', this.selectedMenuItem );
			
			// Message list events
			this.on( 'click', '[data-messageid]', this.clickMessage );
			this.on( 'submit', '[data-role="moderationTools"]', this.moderationSubmit );

			// Search field
			this.on( 'input', '[data-role="messageSearchText"]', this.inputSearch );
			this.on( 'click', '[data-action="messageSearchCancel"]', this.cancelSearch );
			//this.on( 'focus', '[data-role="messageSearchText"]', this.focusSearch );
			//this.on( 'blur', '[data-role="messageSearchText"]', this.blurSearch );

			// Folder model events
			this.on( document, 'loadFolderDone.messages', this.loadFolderDone );
			this.on( document, 'loadFolderLoading.messages, searchFolderLoading.messages', this.loadFolderLoading );
			this.on( document, 'loadFolderFinished.messages', this.loadFolderFinished );
			this.on( document, 'searchFolderLoading.messages', this.searchFolderLoading );
			this.on( document, 'searchFolderDone.messages', this.searchFolderDone );
			this.on( document, 'searchFolderFinished.messages', this.searchFolderFinished );
			this.on( document, 'markFolderDone.messages', this.markFolderDone );
			this.on( document, 'deleteMessagesDone.messages', this.deleteMessagesDone );
			this.on( document, 'loadMessageDone.messages', this.markMessageRead );
			
			// Message model events
			this.on( document, 'deleteMessageDone.messages', this.deleteMessageDone );
			this.on( document, 'moveMessageDone.messages', this.moveMessageDone );
			this.on( document, 'addToCommentFeed', this.newMessage );
			this.on( document, 'deletedComment.comment', this.deletedMessage );

			// Message view events
			//this.on( document, 'updateReplyCount.messages', this.updateReplyCount );
			//this.on( 'deletedReply.messages', this.deletedReply );

			// Primary event that watches for URL changes
			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );

			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._messageList = this.scope.find('[data-role="messageList"]');
			this._currentFolder = this.scope.attr('data-folderID');

			this.trigger('setInitialFolder.messages', {
				folderID: this._currentFolder
			});
		},

		/**
		 * Handles submitting the moderation form (which lets uses mass-delete messages)
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		moderationSubmit: function (e, data) {
			e.preventDefault();

			var self = this;
			var form = this.scope.find('[data-role="moderationTools"]');

			// How many are we deleting?
			var count = parseInt( this.scope.find('[data-role="moderation"]:checked').length );
		
			if ( this.scope.find('[data-role="pageActionOptions"]').find('select option:selected').val() == 'move' ) {
				var dialog = ips.ui.dialog.create( { remoteVerify: false, size: 'narrow', remoteSubmit: false, title: ips.getString('messagesMove'), url: form.attr('action') + '&do=moveForm&ids=' + _.map( self.scope.find('[data-role="moderation"]:checked'), function (item) {
					return $( item ).closest('[data-messageid]').attr('data-messageid');
				}).join(',') } );
				dialog.show();
			} else {
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'question',
					message: ( count > 1 ) ? ips.pluralize( ips.getString( 'messagesDeleteMany' ), count ) : ips.getString('messagesDelete'),
					subText: ( count > 1 ) ? ips.getString( 'messagesDeleteManySubText' ) : ips.getString('messagesDeleteSubText'),
					callbacks: {
						ok: function () {
							// Get IDs
							var ids = _.map( self.scope.find('[data-role="moderation"]:checked'), function (item) {
								return $( item ).closest('[data-messageid]').attr('data-messageid');
							});
	
							self.trigger('deleteMessages.messages', {
								id: ids
							});
						}
					}
				});
			}
		},

		/**
		 * Deleted multiple messages using the pageAction widget
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		deleteMessagesDone: function (e, data) {
			// Build a selector to find the messages
			var selector = _.map( data.id, function (item) {
				return '[data-messageid="' + item + '"]';
			}).join(',');

			// Get the messages
			var self = this;
			var messages = this._messageList.find( selector );

			if( messages.length ){
				messages.slideUp( {
					complete: function () {
						messages.remove();

						// Is our selected message one of those deleted?
						if( data.id.indexOf( self._currentMessageID ) !== -1 ){
							self._currentMessageID = null;	

							// Are there any other messages we can show?
							if( self._messageList.find('[data-messageid]').length ){
								self._messageList.find('[data-messageid]').first().click();
							} else {
								self.trigger( 'getFolder', {
									folderID: self._currentFolder 
								});
							}
						}

						// Refresh the page action so it hides
						self._resetListActions();
					},
					queue: false
				}).fadeOut({
					queue: false
				});	
			}
		},

		/**
		 * Event handler for the search box. Starts a timer so that a search happens 500ms after
		 * the user stops typing
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		inputSearch: function (e) {
			clearTimeout( this._searchTimer );
			this._searchTimer = setTimeout( _.bind( this._startSearch, this ), 500 );
		},

		/**
		 * Event handler for model search loading event
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		searchFolderLoading: function (e, data) {
			this.scope.find('[data-role="messageSearchText"]').addClass('ipsField_loading');
		},

		/**
		 * Event handler for model search done event
		 * Updates the message list, hides the filders and shows the cancel button
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		searchFolderDone: function (e, data) {
			//this.cleanContents();
			this._messageList
				.html( data.response )
				.show()
				.end()
				.find('[data-role="loading"]')
					.hide()
				.end()
				.find('[data-role="messageListFilters"]')
					.hide();

			this.scope.find('[data-action="messageSearchCancel"]').show();

			$( document ).trigger( 'contentChange', [ this._messageList ] );
			this._resetListActions();
		},

		/**
		 * Event handler for model search finished event
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		searchFolderFinished: function (e, data) {
			this.scope.find('[data-role="messageSearchText"]').removeClass('ipsField_loading');
		},

		/**
		 * Event handler for clicking the cancel search button
		 *
		 * @param 		{event} 	e 		Event object	
		 * @returns 	{void}
		 */
		cancelSearch: function (e) {
			e.preventDefault();
			this._resetSearch();
			this._getFolder( this._currentFolder );
		},

		/**
		 * A reply in a message was deleted
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		deletedReply: function (e, data) {
			var count = this._messageList.find('[data-messageid="' + data.messageID + '"] .ipsCommentCount').text();
			this._messageList.find('[data-messageid="' + data.messageID + '"] .ipsCommentCount').text( parseInt( count ) - 1 );
		},

		/**
		 * Updates the reply count for a message
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		updateReplyCount: function (e, data) {
			this._messageList
				.find('[data-messageid="' + data.messageID + '"] .ipsCommentCount')
					.text( data.count );
		},

		/**
		 * Responds to the model event indicating the folder has been marked as read
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		markFolderDone: function (e, data) {
			if( data.folder == this._currentFolder ){
				this._messageList
					.find('[data-messageid]')
						.removeClass('ipsDataItem_unread')
						.find('.ipsItemStatus')
							.remove();
			}
		},

		/**
		 * Responds to the model event indicating an individual message has been deleted
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		deleteMessageDone: function (e, data) {
			// See if the deleted message exists in the list
			var message = this._messageList.find('[data-messageid="' + data.id + '"]');

			if( message.length ){
				ips.utils.anim.go( 'fadeOutDown', message ).done( function () {
					message.remove();
				});

				this._currentMessageID = null;
			}
		},

		/**
		 * Responds to model event indicating message has moved. If the message is in this list, we remove it.
		 * If the message is the selected message, we also select the next or previous message
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		moveMessageDone: function (e, data) {

			// If this message is in the list, remove it
			var message = this._messageList.find('[data-messageid="' + data.id + '"]');
			var next = null;

			if( this._currentMessageID == data.id ){
				// Get the prev or next message
				if( message.prev('[data-messageid]').length ){
					next = message.prev('[data-messageid]');
				} else if( message.next('[data-messageid]').length ){
					next = message.next('[data-messageid]');
				}
			}

			if( message.length && data.to != this._currentFolder ){
				ips.utils.anim.go( 'fadeOutDown', message ).done( function () {
					message.remove();
				});

				this._currentMessageID = null;
			}

			ips.ui.flashMsg.show( ips.getString('conversationMoved') );

			if( next ){
				next.click();
			}
		},

		/**
		 * Responds to the model event indicating a folder has been successfully loaded into the list
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		loadFolderDone: function (e, data) {
			//this.cleanContents();
			this.scope
				.attr( 'data-ipsInfScroll-url', data.listBaseUrl )
				.find('#elMessageList')
					.scrollTop(0);

			this._messageList
					.html( data.data )
					.show()
				.end()
				.find('[data-role="messageListPagination"]')
					.html( data.pagination )
				.end()
				.find('[data-role="loading"]')
					.hide();

			this.scope.trigger('refresh.infScroll');
			$( document ).trigger( 'contentChange', [ this._messageList ] );

			this._resetListActions();
		},

		/**
		 * Responds to the model indicating new results are loading
		 * Shows a loading thingy in place of the list
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		loadFolderLoading: function (e, data) {
			if( !this.scope.find('[data-role="loading"]').length ){
				this._messageList.after( 
					$('<div/>')
						.addClass('ipsLoading')
						.html('&nbsp;')
						.css( { minHeight: '150px' } )
						.attr('data-role', 'loading')
				);
			}

			this._messageList.hide();
			this._hideEmpty();
			this.scope.find('[data-role="loading"]').show();
		},

		/**
		 * Responds to the model indicating loading a folder has finished
		 * Shows the list again
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		loadFolderFinished: function (e, data) {
			this._messageList.show();
			this._resetSearch();
		},

		/**
		 * Responds when all messenger setup is complete.
		 * Triggers an event that lets the main and view controllers know which is the current message
		 *	
		 * @returns 	{void}
		 */
		messengerReady: function () {
			this._currentMessageID = this._messageList.find('.cMessage_active').attr('data-messageid');
			this.trigger( 'setInitialMessage.messages', {
				messageID: this._currentMessageID
			});
		},

		/**
		 * Event handler for clicking on a message in the list
		 * If it's a single message, we trigger an event to load it, and highlight it
		 * If a meta key is pressed, we select multiple messages, as well as triggering the event
		 *
		 * @param 		{event} 	e 		Event object	
		 * @returns 	{void}
		 */
		clickMessage: function (e) {
			if( $( e.target ).is('input[type="checkbox"]') ){
				return;
			}

			e.preventDefault();

			var messageID = $( e.currentTarget ).attr('data-messageid');
			var messageURL = $( e.currentTarget ).find('[data-role="messageURL"]').attr('href');
			var messageTitle = $( e.currentTarget ).find('[data-role="messageURL"]').text();

			// Selecting one message
			//if( ( !e.shiftKey && !e.metaKey ) || this._currentMessageID == null ){
				this.trigger( 'selectedMessage.messages', { 
					messageID: messageID,
					messageURL: messageURL,
					messageTitle: messageTitle
				});

				this.trigger('switchTo.filterBar', {
					switchTo: 'filterContent'
				});
				
				this._selectMessage( messageID );
				return;
			//}

			// Selecting multiple messages
			// Get all messages
			/*var messages = this._messageList.find('[data-messageid]');
			var currentMessage = this._messageList.find('[data-messageid="' + this._currentMessageID + '"]');
			var newMessage = $( e.currentTarget );
			var currentIndex = messages.index( currentMessage );
			var newIndex = messages.index( newMessage );

			if( currentIndex < newIndex ){
				var collection = currentMessage.nextUntil( newMessage );
			} else {
				var collection = currentMessage.prevUntil( newMessage );
			}

			collection = collection.add( currentMessage ).add( newMessage );

			var IDs = [];

			collection.each( function (idx, item) {
				IDs.push( $(item).attr('data-messageid') );
			});

			this.trigger( 'selectedMessage.messages', { 
				messageID: IDs
			});

			this.trigger('switchTo.filterBar', {
				switchTo: 'filterContent'
			});

			this._selectMessages( IDs );*/
		},
		
		/**
		 * Event handler for when a new message is sent
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		newMessage: function (e, data) {
			this._updateRow( data.feedID.substr( data.feedID.indexOf('-') + 1 ) );
		},
		
		/**
		 * Event handler for when a message is deleted
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		deletedMessage: function (e, data) {
			var feedId = $(e.target).closest('[data-feedid]').attr('data-feedid');	
			this._updateRow( feedId.substr( feedId.indexOf('-') + 1 ) );
		},
		
		/**
		 * Refresh row in list
		 *
		 * @param	{int}	conversationId	The conversation ID
		 * @returns	{void}
		 */
		_updateRow: function(conversationId) {
			var scope = $(this.scope);
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=messaging&controller=messenger&id=' + conversationId + '&getRow=1' ).done(function(response){
				scope.find('[data-messageid="'+conversationId+'"]').replaceWith( response );
				$( document ).trigger( 'contentChange', [ scope ] );
			});
		},

		/**
		 * Event handler for the 'sort' menu
		 * Triggers an event which loads new items into the list based on new sort order
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		changeSort: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			var sort = data.selectedItemID;

			if( sort ){
				/*this.trigger('loadFolder.messages', {
					sortBy: sort,
					folder: this._currentFolder,
					filterBy: this._currentOptions.filter,
				});*/

				this.trigger('changeSort.messages', {
					param: 'sortBy',
					value: sort
				});
			}
		},

		/**
		 * Event handler for the 'filter' menu
		 * Triggers an event which loads new items into the list based on the new filter
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		changeFilter: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}
			
			var filter = data.selectedItemID;

			if( filter ){
				/*this.trigger('loadFolder.messages', {
					sortBy: this._currentOptions.sort,
					folder: this._currentFolder,
					filterBy: filter
				});*/

				this.trigger('changeFilter.messages', {
					param: 'filter',
					value: filter
				});
			}
		},

		/**
		 * Responds to URL state changes
		 * Checks whether the folder or current message ID has changed
		 *
		 * @returns 	{void}
		 */
		stateChange: function () {
			var state = History.getState();

			if( _.isUndefined( state.data.controller ) || state.data.controller != 'messages' ){
				return;
			}

			var newFilters = false;

			if( state.data.params && ( state.data.params.sortBy != this._currentOptions.sortBy || state.data.params.filter != this._currentOptions.filter ) ){
				this._currentOptions.sortBy = state.data.params.sortBy;
				this._currentOptions.filter = state.data.params.filter;

				newFilters = true;
			}
			
			if( state.data.folder != this._currentFolder || newFilters ){
				this._getFolder( state.data.folder );
			}

			if( state.data.mid != this._currentMessageID ){
				if( _.isArray( state.data.mid ) ){
					this._selectMessages( state.data.mid );
				} else {
					this._selectMessage( state.data.mid );
				}
			}
		},
		
		/**
		 * Internal method which marks the message as read
		 *
		 * @param 		{number} 	id 		ID of message to highlight
		 * @returns 	{void}
		 */
		markMessageRead: function( e, data ) {
			this._messageList.find('[data-messageid="' + data.id + '"] a.cMessageTitle').removeClass('cMessageTitle_unread');
			this._messageList.find('[data-messageid="' + data.id + '"]').removeClass('ipsDataItem_unread').find('.ipsItemStatus').remove();
		},

		/**
		 * Starts a search by triggering on the model
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_startSearch: function (e) {
			var serialized = ips.utils.form.serializeAsObject( $('[data-role="messageSearch"]') );
			
			var gotSomething = false;
			_.each( [ 'topic', 'post', 'recipient', 'sender' ], function( item ) {
				Debug.log(item);
				if ( _.has( serialized.search, item ) ) {
					gotSomething = true;
				}
			} );
			
			if ( ! gotSomething ) {
				var self = this;
				ips.ui.alert.show( {
					type: 'alert',
					icon: 'warn',
					message: ips.getString('messageSearchFail'),
					subText: ips.getString('messageSearchFailSubText'),
					callbacks: {
						ok: function () {
							self._resetSearch();
							return false;
						}
					}
				});
			}
			else {
				this.trigger('searchFolder.messages', _.extend( {
					folder: this._currentFolder
				}, serialized ) );
			}
		},
		
		/**
		 * Resets changes made for searching
		 *
		 * @returns 	{void}
		 */
		_resetSearch: function () {
			// Reset the search box
			this.scope.find('[data-role="messageSearchText"]')
				.removeClass('ipsField_loading')
				.val('');

			// Hide the cancel button
			this.scope.find('[data-action="messageSearchCancel"]').hide();

			// Show the filter bar
			this.scope.find('[data-role="messageListFilters"]').show();

			// Reset page actions
			this._resetListActions();
		},

		/**
		 * Internal method which highlights the message with the given ID
		 *
		 * @param 		{number} 	id 		ID of message to highlight
		 * @returns 	{void}
		 */
		_selectMessage: function (id) {
			this._messageList
				.find('[data-messageid]')
					.removeClass('cMessage_active ipsDataItem_selected')
				.end()
				.find('[data-messageid="' + id + '"]')
					.addClass('cMessage_active ipsDataItem_selected');
			
			this._currentMessageID = id;
		},

		/**
		 * Internal method which highlights multiple messages with the given IDs
		 *
		 * @param 		{array} 	IDs 	Array of IDs of messages to select
		 * @returns 	{void}
		 */
		_selectMessages: function (IDs) {
			var self = this;

			this._messageList
				.find('[data-messageid]')
					.removeClass('cMessage_active ipsDataItem_selected');

			_.each( IDs, function (id) {
				self._messageList
					.find('[data-messageid="' + id + '"]')
						.addClass('cMessage_active ipsDataItem_selected');
			});

			this._currentMessageID = IDs;
		},

		/**
		 * Internal handler which triggers an event to get the contents of a folder
		 *
		 * @param 		{string} 	newFolder 		ID of the new folder to get
		 * @returns 	{void}
		 */
		_getFolder: function ( newFolder ) {
			this.trigger('loadFolder.messages', {
				folder: newFolder,
				filter: this._currentOptions.filter,
				sortBy: this._currentOptions.sortBy
			});
			
			this._currentFolder = newFolder;
		},

		/**
		 * Hides the 'no messages' text
		 *	
		 * @returns 	{void}
		 */
		_hideEmpty: function () {
			this.scope.find('[data-role="emptyMsg"]').hide();
		},

		/**
		 * Reset page action/auto check boxes
		 *	
		 * @returns 	{void}
		 */
		_resetListActions: function () {
			// Refresh the page action so it hides
			try {
				ips.ui.pageAction.getObj( this.scope.find('[data-ipsPageAction]') ).reset();
				ips.ui.autoCheck.getObj( this.scope.find('[data-ipsAutoCheck]') ).refresh();
			} catch (err) {}
		},
		
		/**
		 * Prevents default event when a menu item is selected
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object}	data 	Event data object
		 * @returns {void}
		 */
		selectedMenuItem: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}			
		}
	});
}(jQuery, _));