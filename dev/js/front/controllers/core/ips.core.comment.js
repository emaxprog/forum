/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.comment.js - General controller for comments
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.comment', {

		_quoteData: null,
		_commentContents: '',
		_quotingDisabled: false,
		_quoteTimeout: null,
		_isEditing: false,
		_clickHandler: null,
		_selectionCoords: {left: 0, top: 0},
		
		initialize: function () {		
										
			// Events from within scope
			this.on( 'click', '[data-action="editComment"]', this.editComment );
			this.on( 'click', '[data-action="cancelEditComment"]', this.cancelEditComment );  
			this.on( 'click', '[data-action="deleteComment"]', this.deleteComment );
			this.on( 'click', '[data-action="approveComment"]', this.approveComment );
			this.on( 'click', '[data-action="quoteComment"]', this.quoteComment );
			this.on( 'click', '[data-action="multiQuoteComment"]', this.multiQuoteComment );
			this.on( 'click', '[data-action="rateReview"]', this.rateReview );
			this.on( 'submit', 'form', this.submitEdit );
			this.on( 'change', 'input[type="checkbox"][data-role="moderation"]', this.commentCheckbox );
			this.on( 'mouseup touchend touchcancel selectionchange', '[data-role="commentContent"]', this.inlineQuote );
			this.on( 'click', '[data-action="quoteSelection"]', this.quoteSelection );
			this.on( 'menuOpened', '[data-role="shareComment"]', this.shareCommentMenu );
			this.on( 'submitDialog', '[data-action="recommendComment"]', this.recommendComment );
			this.on( 'click', '[data-action="unrecommendComment"]', this.unrecommendComment );

			// Events sent down by the commentFeed controller
			this.on( 'setMultiQuoteEnabled.comment setMultiQuoteDisabled.comment', this.setMultiQuote );
			this.on( 'disableQuoting.comment', this.disableQuoting );

			// Model events that are handled all at once
			this.on( document, 'getEditFormLoading.comment saveEditCommentLoading.comment ' + 
									'deleteCommentLoading.comment', this.commentLoading );
			
			this.on( document, 'getEditFormDone.comment saveEditCommentDone.comment ' + 
									'deleteCommentDone.comment', this.commentDone );

			// Model events
			this.on( document, 'getEditFormDone.comment', this.getEditFormDone );
			this.on( document, 'getEditFormError.comment', this.getEditFormError );
			//---
			this.on( document, 'saveEditCommentDone.comment', this.saveEditCommentDone );
			this.on( document, 'saveEditCommentError.comment', this.saveEditCommentError );
			//---
			this.on( document, 'deleteCommentDone.comment', this.deleteCommentDone );
			this.on( document, 'deleteCommentError.comment', this.deleteCommentError );
			//---
			this.on( document, 'unrecommendCommentDone.comment', this.unrecommendCommentDone );
			this.on( document, 'unrecommendCommentError.comment', this.unrecommendCommentError );
			//---
			this.on( document, 'approveCommentLoading.comment', this.approveCommentLoading );
			this.on( document, 'approveCommentDone.comment', this.approveCommentDone );
			this.on( document, 'approveCommentError.comment', this.approveCommentError );

			this.setup();
		},
		
		/**
		 * Setup method for comments
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._commentID = this.scope.attr('data-commentID');
			this._clickHandler = _.bind( this._hideQuoteTooltip, this );

			// If we can't view user profiles, remove links in the comment content
			if( !ips.getSetting('viewProfiles') ){
				this._removeProfileLinks();
			}
		},

		destroy: function () {
			// --
		},

		/**
		 * Remove user profile links where possible if the current viewing user cannot access profiles
		 *
		 * @returns {void}
		 */
		_removeProfileLinks: function () {
			this.scope
				.find('[data-role="commentContent"]')
				.find('a[data-mentionid],a[href*="controller=profile"]')
					.replaceWith( function(){ return $(this).contents(); } );
		},

		/**
		 * Event handler for selective quoting, called on mouseup (after user has dragged/clicked)
		 * Get the selected text, then leave a short timeout before showing the tooltip
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns	{void}
		 */
		inlineQuote: function (e) {
			var self = this;
			var quoteButton = this.scope.find('[data-action="quoteComment"]');

			if( this._isEditing || this._quotingDisabled || !quoteButton.length ){
				return;
			}			

			clearInterval( this._quoteTimeout );

			this._quoteTimeout = setInterval( function () {
				self._checkQuoteStatus(e);
			}, 400 );			
		},

		/**
		 * Event handler for recommending comments. Triggered by the dialog being submitted and a successful response
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		recommendComment: function (e, data) {
			var commentHtml = $('<div>' + data.response.comment + '</div>').find('[data-controller="core.front.core.comment"]').html();

			this.scope
				.html( commentHtml )
				.closest('.ipsComment')
					.addClass('ipsComment_popular');

			// Let document know
			$( document ).trigger( 'contentChange', [ this.scope ] );

			// Set up multiquote in this comment
			if( ips.utils.db.isEnabled() ){
				this.scope.find('[data-action="multiQuoteComment"]').removeClass('ipsHide');
			}

			this.trigger('refreshRecommendedComments', {
				scroll: true,
				recommended: data.response.recommended
			});
		},

		/**
		 * Event handler for un-recommending comments.
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		unrecommendComment: function (e, data) {
			e.preventDefault();

			var url = $( e.currentTarget ).attr('href');

			this.trigger( 'unrecommendComment.comment', {
				url: url,
				commentID: this._commentID
			});
		},

		/**
		 * Unrecommending a comment was successful (triggered by comment model)
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		unrecommendCommentDone: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			var commentHtml = $('<div>' + data.comment + '</div>').find('[data-controller="core.front.core.comment"]').html();

			this.scope
				.html( commentHtml )
				.closest('.ipsComment')
					.removeClass('ipsComment_popular')
					.find('.ipsComment_popularFlag')
						.remove();
					

			// Flash message
			ips.ui.flashMsg.show( ips.getString( 'commentUnrecommended' ) );

			// Tell the recommended overview to remove it
			this.trigger('removeRecommendation', {
				commentID: data.unrecommended
			});
		},

		/**
		 * Unrecommending a comment failed
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns	{void}
		 */
		unrecommendCommentError: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			window.reload();
		},

		_checkQuoteStatus: function (e) {
			var selectedText = this._getSelectedText();
			var tooltip = this.scope.find('[data-role="inlineQuoteTooltip"]');
			var self = this;

			if( $.trim( selectedText ) == '' ){
				this._hideQuoteTooltip();
				return;
			}

			// If the user selects a bunch of text that contains HTML, the browser will automatically wrap it for us. But if the user
			// just selects some plain text, that's all we get. So in that case, we'll wrap it ourselves.
			if( !selectedText.startsWith('<') ){
				selectedText = '<p>' + selectedText + '</p>';
			}

			if( selectedText !== this._selectedText ){
				this._selectionCoords = {
					top: 0,
					left: 0
				};
			}

			this._selectedText = selectedText;
			this._showQuoteTooltip( e );
		},

		/**
		 * Returns the selected HTML
		 *
		 * @returns {string}	The selected HTML
		 */
		_getSelectedText: function () {
			var text = '';
			var container = this.scope.find('[data-role="commentContent"]').get(0);

			var isChild = function (child, parent) {
				if(child === parent){
					return true;	
				} 
				
				var current = child;
				
				while (current) {
					if(current === parent){
						return true;	
					} 
					current = current.parentNode;
				}
				
				return false;
			};

			// http://stackoverflow.com/questions/29038950/get-selected-text-with-a-div-with-arbitrary-nested-divs
			if( window.getSelection || document.getSelection ){
				var selection = ( window.getSelection ) ? window.getSelection() : document.getSelection();

				if( selection.rangeCount > 0 ){
					var range = selection.getRangeAt(0);
					var clonedSelection = range.cloneContents().querySelector('[data-role="commentContent"]');

					if( clonedSelection ){
						text = clonedSelection.innerHTML;
					} else {
						clonedSelection = range.cloneContents();
						var startNode = selection.getRangeAt(0).startContainer.parentNode;

						if( isChild( startNode, container ) ) {
							var div = document.createElement('div');
							div.appendChild( clonedSelection );
							text = div.innerHTML;
						}
					}
					
					return text;
				}
			} else if ( document.selection ){
				return document.selection.createRange().htmlText;
			}

			return '';
		},

		/**
		 * Builds & shows the selective quoting tooltip, displaying it just above the user's cursor
		 *
		 * @param 	{number} 	clientX 	X position of the cursor
		 * @param 	{number} 	clientY 	Y position of the cursor
		 * @returns	{void}
		 */
		_showQuoteTooltip: function (e) {
			var tooltip = this.scope.find('[data-role="inlineQuoteTooltip"]');
			var clientX = e.clientX;
			var clientY = e.clientY;
			var documentScroll = { 
				top: $( document ).scrollTop(),
				left: $( document ).scrollLeft() 
			};

			if( !_.isUndefined( e.originalEvent.changedTouches ) && !_.isUndefined( e.originalEvent.changedTouches[0] ) ){
				clientX = e.originalEvent.changedTouches[0].clientX;
				clientY = e.originalEvent.changedTouches[0].clientY;
			}

			if( !this._selectionCoords.top || !this._selectionCoords.left ){
				this._selectionCoords = {
					top: clientY + documentScroll.top,
					left: clientX + documentScroll.left
				};
			}

			if( !tooltip.length ){
				// Create the new tooltip
				this.scope.append( ips.templates.render('core.selection.quote', {
					direction: ips.utils.events.isTouchDevice() ? 'bottom' : 'top'
				}) );	
				tooltip = this.scope.find('[data-role="inlineQuoteTooltip"]');
				$( document ).on( 'click', this._clickHandler );			
			}

			// Get the correct positioning
			// Unfortunately we can't use our ips.utils.position utility here because that deals
			// with elements, not specific coordinates.
			var scopeOffset = this.scope.offset();
			var lineHeight = ips.utils.position.lineHeight( this.scope.find('[data-role="commentContent"]') );
			var tooltipSize = {
				width: tooltip.show().width(),
				height: tooltip.show().height()
			};
			var tooltipPos = {};
			
			// if this is a touch event, we'll position the quote tooltip in the middle of the text, but if it's a mouse
			// event we'll position it wherever we lifted the mouse
			var useMouseUpPositioning = true;
			
			if( ( e.originalEvent.type === 'touchend' || e.originalEvent.type === 'touchcancel' ) && ( window.Element && Element.prototype.getBoundingClientRect ) ){
				try {
					var selection = ( window.getSelection ) ? window.getSelection() : document.getSelection();

					if( selection.rangeCount > 0 ){
						var range = selection.getRangeAt(0);
						var rect = range.getBoundingClientRect();

						if( rect ){
							tooltipPos = {
								left: ( rect.left + ( rect.width / 2 ) + documentScroll.left ) - scopeOffset.left - ( tooltipSize.width / 2 ),
								top: ( rect.bottom + documentScroll.top ) - scopeOffset.top
							};

							useMouseUpPositioning = false;
						}
					}
				} catch (err) {}
			}

			if( useMouseUpPositioning ){
				tooltipPos = { 
					left: ( this._selectionCoords.left ) - scopeOffset.left - ( tooltipSize.width / 2 )
				};
				
				if( ips.utils.events.isTouchDevice() ){
					tooltipPos = _.extend( tooltipPos, {
						top: ( this._selectionCoords.top ) - scopeOffset.top + tooltipSize.height + lineHeight
					});
				} else {
					tooltipPos = _.extend( tooltipPos, {
						top: ( this._selectionCoords.top ) - scopeOffset.top - tooltipSize.height - lineHeight
					});
				}
			}

			tooltip.css({
				position: 'absolute',
				left: Math.round( tooltipPos.left ) + "px",
				top: Math.round( tooltipPos.top ) + "px"
			});

			// If the tooltip isn't already shown, fade it in
			if( !tooltip.is(':visible') ){
				tooltip.hide().fadeIn('fast');
			} else {
				tooltip.show();
			}
		},

		/**
		 * Hide the selective quote tooltip
		 *
		 * @returns	{void}
		 */
		_hideQuoteTooltip: function () {
			$( document ).off( 'click', this._clickHandler );
			this.scope.find('[data-role="inlineQuoteTooltip"]').fadeOut('fast');
			this._selectionCoords = {
				top: 0,
				left: 0
			};
		},

		/**
		 * Event handler for clicking 'quote this' in the selective quote tooltip
		 * Triggers an event sent to the comment feed
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns	{void}
		 */
		quoteSelection: function (e) {
			e.preventDefault();

			this._getQuoteData();

			if( this._selectedText ){
				this.trigger('quoteComment.comment', {
					userid: this._quoteData.userid,
					username: this._quoteData.username,
					timestamp: this._quoteData.timestamp,
					contentapp: this._quoteData.contentapp,
					contenttype: this._quoteData.contenttype,
					contentclass: this._quoteData.contentclass,
					contentid: this._quoteData.contentid,
					contentcommentid: this._quoteData.contentcommentid,
					quoteHtml: this._selectedText
				});
			}

			this._hideQuoteTooltip();
		},

		/**
		 * Triggered when the moderation checkbox is changed
		 *	
		 * @param 		{event}		e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		commentCheckbox: function (e) {
			var checked = $( e.currentTarget ).is(':checked');
			this.scope.closest('.ipsComment').toggleClass( 'ipsComment_selected', checked );

			this.trigger('checkedComment.comment', {
				commentID: this._commentID,
				actions: $( e.currentTarget ).attr('data-actions'),
				checked: checked
			});
		},

		/**
		 * The comment feed has told us we can't support quoting
		 *	
		 * @returns 	{void}
		 */
		disableQuoting: function () {
			this._quotingDisabled = true;
			this.scope.find('[data-ipsQuote-editor]').remove();
		},
		
		/**
		 * Event handler for the Helpful/Unhelpful buttons.
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		rateReview: function (e) {
			e.preventDefault();
			var self = this;

			ips.getAjax()( $( e.currentTarget ).attr('href') )
				.done( function (response) {
					var content = $("<div>" + response + "</div>");
					self.scope.html( content.find('[data-controller="core.front.core.comment"]').contents() );

					$( document ).trigger( 'contentChange', [ self.scope ] );
				})
				.fail( function (err) {
					window.location = $( e.currentTarget ).attr('href');
				});
		},

		/**
		 * User has clicked the share button within the comment; we'll select the text to make it easy to copy
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		shareCommentMenu: function (e, data) {
			if( data.menu ){
				data.menu.find('input[type="text"]').get(0).select();
			}
		},

		/**
		 * Event fired on this controller by a core.commentFeed controller to tell us which
		 * multiquote buttons are enabled presently. Here we check whether this applies to us, and toggle
		 * the button if so.
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		setMultiQuote: function (e, data) { 
			var selector = '[data-commentApp="' + data.contentapp + '"]';
				selector += '[data-commentType="' + data.contenttype + '"]';
				selector += '[data-commentID="' + data.contentcommentid + '"]';

			if( this.scope.is( selector ) ){
				if( !_.isNull( e ) && e.type == 'setMultiQuoteEnabled') {
					
					this.scope.find('[data-action="multiQuoteComment"]')
						.removeClass('ipsButton_simple')
						.addClass('ipsButton_alternate')
						.attr( 'data-mqActive', true )
						.html( ips.templates.render('core.posts.multiQuoteOn') );

				} else if( _.isNull( e ) || e.type == 'setMultiQuoteDisabled' ) {

					this.scope.find('[data-action="multiQuoteComment"]')
						.addClass('ipsButton_simple')
						.removeClass('ipsButton_alternate')
						.removeAttr( 'data-mqActive' )
						.html( ips.templates.render('core.posts.multiQuoteOff') );

				}
			}
		},

		/**
		 * Event handler for the Quote button. Triggers a quoteComment event for the
		 * commentFeed controller to handle.
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		quoteComment: function (e) {
			e.preventDefault();
			
			if( !this._getQuoteData() ){
				Debug.error("Couldn't get quote data");
				return;
			}

			var html = this._prepareQuote( $('<div/>').html( this.scope.find('[data-role="commentContent"]').html() ) );
			
			// Send the event up the chain to the commentFeed controller for handling
			this.trigger( 'quoteComment.comment', {
				userid: this._quoteData.userid,
				username: this._quoteData.username,
				timestamp: this._quoteData.timestamp,
				contentapp: this._quoteData.contentapp,
				contenttype: this._quoteData.contenttype,
				contentclass: this._quoteData.contentclass,
				contentid: this._quoteData.contentid,
				contentcommentid: this._quoteData.contentcommentid,
				quoteHtml: html.html()
			});
		},

		/**
		 * MultiQuote comment handler
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		multiQuoteComment: function (e) {
			e.preventDefault();

			if( !this._getQuoteData() ){
				Debug.error("Couldn't get quote data");
				return;
			}
			
			var button = $( e.currentTarget );
			var mqActive = button.attr('data-mqActive');

			var html = this._prepareQuote( $('<div/>').html( this.scope.find('[data-role="commentContent"]').html() ) );

			this.trigger( ( mqActive ) ? 'removeMultiQuote.comment' : 'addMultiQuote.comment', {
				userid: this._quoteData.userid,
				username: this._quoteData.username,
				timestamp: this._quoteData.timestamp,
				contentapp: this._quoteData.contentapp,
				contenttype: this._quoteData.contenttype,
				contentclass: this._quoteData.contentclass,
				contentid: this._quoteData.contentid,
				contentcommentid: this._quoteData.contentcommentid,
				quoteHtml: html.html(),
				button: button.attr('data-mqId')
			});

			if( mqActive ){
				button
					.removeClass('ipsButton_alternate')
					.addClass('ipsButton_simple')
					.removeAttr('data-mqActive')
					.html( ips.templates.render('core.posts.multiQuoteOff') );
			} else {
				button
					.removeClass('ipsButton_simple')
					.addClass('ipsButton_alternate')
					.attr( 'data-mqActive', true )
					.html( ips.templates.render('core.posts.multiQuoteOn') );
			}
		},

		/**
		 * Edit comment handler
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		editComment: function (e) {
			e.preventDefault();
			
			this._commentContents = this.scope.find('[data-role="commentContent"]').html();
			
			var url = $( e.currentTarget ).attr('href');

			this.trigger( 'getEditForm.comment', {
				url: url,
				commentID: this._commentID
			});
		},
		
		/**
		 * Called when a cancel link is clicked
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		cancelEditComment: function (e) {
			e.preventDefault();
			
			var self = this;
			
			ips.ui.alert.show( {
				type: 'verify',
				icon: 'warn',
				message: ips.getString('cancel_edit_confirm'),
				subText: '',
				buttons: { yes: ips.getString('yes'), no: ips.getString('no') },
				callbacks: {
					yes: function () {
						ips.ui.editor.destruct( self.scope.find('[data-ipseditor]') );
						self.scope.find('[data-role="commentContent"]').html( self._commentContents );
						self.scope.find('[data-role="commentControls"], [data-action="expandTruncate"]').show();
					}
				}
			});
		},
		
		/**
		 * Called when a comment edit button is clicked
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitEdit: function (e) {
			e.preventDefault();
			e.stopPropagation(); // This is a form within a form, so we have to prevent it bubbling up otherwise IE gets confused and will try to submit the moderation actions form too
			
			var instance;
			var empty = false;

			for( instance in CKEDITOR.instances ){
				CKEDITOR.instances[ instance ].updateElement();
			}

			if ( typeof CKEDITOR.instances['comment_value'] !== 'undefined' ) {
				var postBody = $.trim(CKEDITOR.instances['comment_value'].editable().getData().replace(/&nbsp;/g, ''));

				if (postBody == '' || postBody.match(/^<p>(<p>|<\/p>|\s)*<\/p>$/)) {
					ips.ui.alert.show({
						type: 'alert',
						icon: 'warn',
						message: ips.getString('cantEmptyEdit'),
						subText: ips.getString('cantEmptyEditDesc')
					});
					return;
				}
			}

			var form = this.scope.find('form');
			var url = form.attr('action');				
			var data = form.serialize();
			
			form.find('[data-action="cancelEditComment"]').remove();
			form.find('[type="submit"]').prop( 'disabled', true ).text( ips.getString('saving') );
						
			this.trigger( 'saveEditComment.comment', {
				form: data,
				url: url,
				commentID: this._commentID
			});
		},

		/**
		 * Model event: something is loading
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		commentLoading: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			var commentLoading = this.scope.find('[data-role="commentLoading"]');
			
			commentLoading
				.removeClass('ipsHide')
				.find('.ipsLoading')
					.removeClass('ipsLoading_noAnim');

			ips.utils.anim.go( 'fadeIn', commentLoading );
		},

		/**
		 * Model event: something is done loading
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		commentDone: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}


			this.scope
				.find('[data-role="commentLoading"]')
					.addClass('ipsHide')
					.find('.ipsLoading')
						.addClass('ipsLoading_noAnim');
		},

		/**
		 * Model event: edit form has loaded
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		getEditFormDone: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			var self = this;
			var showForm = _.once( function () {
				self._isEditing = true;
				self.scope.find('[data-action="expandTruncate"], [data-role="commentControls"]').hide();
				self.scope.find('[data-role="commentContent"]').html( data.response );

				$( document ).trigger( 'contentChange', [ self.scope.find('[data-role="commentContent"]') ] );
			});

			// Scroll to the comment
			var elemPosition = ips.utils.position.getElemPosition( this.scope );
			var windowScroll = $( window ).scrollTop();
			var viewHeight = $( window ).height();

			// Only scroll if it isn't already on the screen
			if( elemPosition.absPos.top < windowScroll || elemPosition.absPos.top > ( windowScroll + viewHeight ) ){
				$('html, body').animate( { scrollTop: elemPosition.absPos.top + 'px' }, function () {
					showForm();
				});	
			} else {
				showForm();
			}
		},

		/**
		 * Model event: error loading edit form
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		getEditFormError: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			window.location = data.url;
		},

		/**
		 * Model event: saving an edit is finished
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		saveEditCommentDone: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}
			
			ips.ui.editor.destruct( this.scope.find('[data-ipseditor]') );

			this._isEditing = false;
			this.scope.find('[data-role="commentContent"]').replaceWith( $('<div>' + data.response + '</div>').find('[data-role="commentContent"]') );
			this.scope.trigger('initializeImages');
			this.scope.find('[data-action="expandTruncate"], [data-role="commentControls"]').show();
			
			// Open external links in a new window
			if( ips.getSetting('links_external') ) {
				this.scope.find('a[rel*="external"]').each( function( index, elem ){
					elem.target = "_blank";
				})
			}
			
			$( document ).trigger( 'contentChange', [ this.scope ] );
		},

		/**
		 * Model event: saving an edit failed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		saveEditCommentError: function (e, data) {
			
			if( data.commentID != this._commentID ){
				return;
			}
			
			ips.ui.alert.show( {
				type: 'alert',
				icon: 'warn',
				message: ips.getString('editCommentError'),
			});
			//this.scope.find('form').submit();
		},
			
		/**
		 * Handler for approving a comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		approveComment: function (e) {
			e.preventDefault();

			var url = $( e.currentTarget ).attr('href');

			this.trigger( 'approveComment.comment', {
				url: url,
				commentID: this._commentID
			});
		},

		/**
		 * Model indicates it's starting to approve the comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Data object from model
		 * @returns 	{void}
		 */
		approveCommentLoading: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			this.scope
				.find('[data-role="commentControls"]')
					.addClass('ipsFaded')
						.find('[data-action="approveComment"]')
							.addClass( 'ipsButton_disabled' )
							.text( ips.getString( 'commentApproving' ) );
		},

		/**
		 * Model returned success for approving the comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Data object from model
		 * @returns 	{void}
		 */
		approveCommentDone: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			var commentHtml = $('<div>' + data.response + '</div>').find('[data-controller="core.front.core.comment"]').html();

			// Remove moderated classes and update HTML
			this.scope
				.html( commentHtml )
				.removeClass('ipsModerated')
				.closest( '.ipsComment' )
					.removeClass('ipsModerated');

			// Let document know
			$( document ).trigger( 'contentChange', [ this.scope ] );

			// Set up multiquote in this comment
			if( ips.utils.db.isEnabled() ){
				this.scope.find('[data-action="multiQuoteComment"]').removeClass('ipsHide');
			}

			// And show a flash message
			ips.ui.flashMsg.show( ips.getString( 'commentApproved' ) );
		},

		/**
		 * Model returned an error for approving the comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Data object from model
		 * @returns 	{void}
		 */
		approveCommentError: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			window.location = data.url;
		},

		/**
		 * Handler for delete comment
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		deleteComment: function (e) {
			e.preventDefault();
			
			var self = this;
			var url = $( e.currentTarget ).attr('href');
			var commentData = this._getQuoteData();

			var eventData = _.extend( commentData, {
				url: url,
				commentID: this._commentID
			});
			
			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'warn',
				message: ips.getString('delete_confirm'),
				callbacks: {
					ok: function(){
						self.trigger( 'deleteComment.comment', eventData );
					}
				}
			});
		},

		/**
		 * Model event: delete comment finished
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		deleteCommentDone: function (e, data) {

			if( data.commentID != this._commentID ){
				return;
			}

			var deleteLink = this.scope.find('[data-action="deleteComment"]');

			// Stuff to HIDE elements on delete
			var toHide = null;
			var toShow = null;

			if( deleteLink.attr('data-hideOnDelete') ){
				toHide = this.scope.find( deleteLink.attr('data-hideOnDelete') );
			} else {
				toHide = this.scope.closest('article');
			}

			toHide.animationComplete( function () {
				toHide.remove();
			});

			ips.utils.anim.go( 'fadeOutDown', toHide );

			// Update count
			if ( deleteLink.attr('data-updateOnDelete') ) {
				$( deleteLink.attr('data-updateOnDelete') ).text( parseInt( $( deleteLink.attr('data-updateOnDelete') ).text() ) - 1 );
			}

			// Stuff to SHOW elements on delete
			if( deleteLink.attr('data-showOnDelete') ) {
				toShow = this.scope.find( deleteLink.attr('data-showOnDelete') );
				ips.utils.anim.go( 'fadeIn', toShow );
			}

			this.trigger( 'deletedComment.comment', {
				commentID: this._commentID,
				response: data.response
			});
		},

		/**
		 * Model event: delete comment failed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		deleteCommentError: function (e, data) {
			if( data.commentID != this._commentID ){
				return;
			}

			window.location = data.url;
		},

		/**
		 * Prepares post data for quoting
		 *	
		 * @param 		{string} 	html 	Post contents
		 * @returns 	{string} 	Transformed post contents
		 */
		_prepareQuote: function (html) {
			
			/* Remove nested quotes */
			if( html.find('blockquote.ipsQuote') &&
				html.find('blockquote.ipsQuote').parent() && html.find('blockquote.ipsQuote').parent().get( 0 ) &&
				html.find('blockquote.ipsQuote').parent().get( 0 ).tagName == 'DIV' && html.find('blockquote.ipsQuote').siblings().length == 0 )
			{
				var div = html.find('blockquote.ipsQuote').closest('div');
				div.next('p').find("br:first-child").remove();
				div.remove();
			}
			else
			{
				html.find('blockquote.ipsQuote').remove();
			}
			
			/* Expand spoilers */			
			html.find('.ipsStyle_spoilerFancy,.ipsStyle_spoiler').replaceWith( ips.templates.render( 'core.posts.quotedSpoiler' ) );

			/* Remove data-excludequote (used for "edited by" byline presently, but can be used by anything) */
			html.find("[data-excludequote]").remove();
			
			/* Remove the citation */
			html.find('.ipsQuote_citation').remove();
			
			/* Set the quote value */
			html.find( '[data-quote-value]' ).each( function () {
				$( this ).replaceWith( '<p>' + $( this ).attr('data-quote-value') + '</p>' );
			});

			return html;
		},

		/**
		 * Parses the JSON object containing quote data for the comment
		 *	
		 * @returns 	{object} 	Quote data, or else an empty object
		 */
		_getQuoteData: function () {
			if( !this._quoteData ){
				try {
					this._quoteData = $.parseJSON( this.scope.attr('data-quoteData') );
					return this._quoteData;
				} catch (err) {
					Debug.log("Couldn't parse quote data");
					return {};
				}
			}

			return this._quoteData;
		}
	});
}(jQuery, _));
