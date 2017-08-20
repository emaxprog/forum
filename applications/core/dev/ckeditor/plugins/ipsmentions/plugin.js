CKEDITOR.plugins.add( 'ipsmentions', {
    init: function( editor ) {
	    new CKEDITOR.plugins.ipsmentions( editor );
	}
});

/**
 * IPS @mentions handler
 *
 * @param	{CKEDITOR.editor} 	editor 		The element this widget is being created on
 * @returns {void}
 */
CKEDITOR.plugins.ipsmentions = function( editor ){
	
	this.listenForAtSymbolEvent = null;
	this.listenWithinMention = null;
	this.currentMention = null;
	this.callsWithNoResults = 0;
	this.mentionLengthAtLastResult = 0;
	this.results = null;
	this.ajaxObj = null;
	
	/**
	 * Start listening for @ symbol
	 *
	 * @returns	{void}
	 */
	this.listenForAtSymbol = function(){
			    
	    /* When the content of the editor is changed, check if it was an @ */
		this.listenForAtSymbolEvent = editor.on( 'change', function(e) {
			
			/* We need to do this asynchronously */
			CKEDITOR.tools.setTimeout( function() {
				
				/* If we currently have just normal text selected, we're typing normally and there might be an @ */
				var selection = editor.getSelection();
				if ( selection.getType() == CKEDITOR.SELECTION_TEXT ) {
					
					/* Loop the ranges... */
					var ranges = selection.getRanges( true );
					for ( var i = 0; i < ranges.length; i++ ) {
						
						/* If it's collapsed (meaning we just have a normal caret, indicating normal typing, nothing highlighted) and the caret has something before it... */
						if ( ranges[i].collapsed && ranges[i].startOffset ) {
							
							/* And that is an @ symbol... */
							ranges[i].setStart( ranges[i].startContainer, 0 );
							if ( ranges[i].cloneContents().$.textContent.substr( -1 ) == '@' ) {
								this.respondToAtSymbol( ranges[i] );
							}
							
						}
						
					}
					
				}
			
			}, 0, this );
			
		}, this);
	};
	
	/**
	 * Respond to @ symbol being pressed
	 *
	 * @param	{CKEDITOR.dom.range}	range	The range
	 * @returns	{void}
	 */
	this.respondToAtSymbol = function( range ){
				
		/* If there's content before the @ besides a space, ignore it
			For example - "something@" means the user is typing an email so it's ignored
			but "What do you think @" or just "@" is what could be a mention */
		var rangeText = range.cloneContents().$.textContent;
		if ( rangeText.length > 1 && !rangeText.substr( -2, 1 ).match( /\s/ ) ) {
			return;
		}

		/* Stop listening for any more @s for now */
		this.listenForAtSymbolEvent.removeListener();
		
		/* Move the @ into its own tag */
		this.currentMention = new CKEDITOR.dom.element( 'span' );
		this.currentMention.setText('@');
		if ( range.endContainer instanceof CKEDITOR.dom.element ) {
			var atSymbol;
			var i;
			var children = range.endContainer.getChildren();
			for ( i = children.count(); i >= 0; i-- ) {
				var item = children.getItem( i )
				if ( item instanceof CKEDITOR.dom.text && item.getText() == '@' ) {
					atSymbol = item;
					break;
				}
			}
			if ( !atSymbol ) {
				return;
			}
		} else {
			var atSymbol = range.endContainer.split( range.endOffset - 1 );
		}
		atSymbol.split( 1 );
		this.currentMention.replace(atSymbol);
		var newRange = editor.createRange();
		newRange.moveToPosition( this.currentMention, CKEDITOR.POSITION_BEFORE_END );
		editor.getSelection().selectRanges( [ newRange ] );
		
		/* Reset the results tracking variables */
		this.callsWithNoResults = 0;
		this.mentionLengthAtLastResult = 0;
		
		/* Create and position the results menu. Hide it until we type another character so that it doesn't look like it's doing something when it's not */
		this.results = $('<ul class="ipsMenu ipsMenu_auto ipsMenu_bottomLeft" data-mentionMenu></ul>').hide();
		this.results.append('<li class="ipsLoading ipsLoading_small" style="height: 40px">&nbsp;</li>');
		$( 'body' ).append( this.results );
		this.positionResults(range);
		
		/* Listen for escape key */
		this.listenWithinMention = editor.on( 'key', this.listenWithinMentionEvent, this );
	};
	
	/**
	 * Positions the results menu according to position of the mention
	 *
	 * @param	{CKEDITOR.dom.range}	range	The range
	 * @returns	{void}
	 */
	this.positionResults = function (range) {
		var lineHeight = ( range && range.getNextEditableNode() ) ? range.getNextEditableNode().getSize('height') : 12;
		var positionInfo = {
			trigger: $(this.currentMention.$),
			target: this.results,
			center: true,
			above: false,
			stemOffset: { left: 25, top: 0 }
		};

		var menuPosition = ips.utils.position.positionElem( positionInfo );
		var menuDims = ips.utils.position.getElemDims( this.results );
		var triggerPosition = ips.utils.position.getElemPosition( $(this.currentMention.$) );

		// Position the menu with the resulting styles
		this.results.css({
			left: menuPosition.left + 'px',
			top: menuPosition.top + 'px',
			position: ( menuPosition.fixed ) ? 'fixed' : 'absolute',
		});

		// Remove any stems
		var stemClasses = [];
		$.each( ['topLeft', 'topRight', 'topCenter', 'bottomLeft', 'bottomRight', 'bottomCenter'], function (idx, value) {
			stemClasses[ idx ] = 'ipsMenu_' + value;
		});

		this.results.removeClass( stemClasses.join(' ') );

		// Add new stem
		var stemClass = '';
		stemClass += menuPosition.location.vertical;
		stemClass += menuPosition.location.horizontal.charAt(0).toUpperCase();
		stemClass += menuPosition.location.horizontal.slice(1);
		this.results.addClass( 'ipsMenu_' + stemClass );
	};

	/**
	 * Respond to key press within a mention
	 *
	 * @param	{CKEDITOR.eventInfo}	evt		Key press event
	 * @returns	{void}
	 */
	this.listenWithinMentionEvent = function( evt ){
		
		/* Escape is cancel */
		if ( evt.data.keyCode == 27 ){
			this.cancelMention();
			this.closeResults();
			return;
		}
		
		/* Arrow keys are for highlighting results */
		if ( evt.data.keyCode == 40 || evt.data.keyCode == 38 ) {
			var current = this.results.children('[data-selected]');
			if ( current.length ) {
				current.removeAttr('data-selected');
				if ( evt.data.keyCode == 40 ) {
					current.next().attr( 'data-selected', true );
				} else {
					current.prev().attr( 'data-selected', true );
				}
			} else {
				if ( evt.data.keyCode == 40 ) {
					this.results.children(':first-child').attr( 'data-selected', true );
				} else {
					this.results.children(':last-child').attr( 'data-selected', true );
				}
			}
			evt.cancel();
			return;
		}
		
		/* Return/tab key is the equivilant of clicking a result - or if enter is hit when a result is not selected, treat it like normal by cancelling the
			mention and allowing the caret to move to the next line */
		if ( evt.data.keyCode == 13 || evt.data.keyCode == 9 ) {
			var current = this.results.children('[data-selected]');
			if ( current.length ) {
				current.click();
				evt.cancel();
			} else if ( evt.data.keyCode == 13 ) {
				this.cancelMention();
				this.closeResults();
			}
			return;
		}
		
		/* Backspace means they might be correcting a typo, so reset the callsWithNoResults counter
			to give them an oppertunity to do that */
		if ( evt.data.keyCode == 8 ) {
			this.callsWithNoResults = 0;
		}
		
		/* For everything else, update the results, which we need to do asynchronously */
		CKEDITOR.tools.setTimeout( function() {
			
			/* If we have removed the @ symbol (by hitting backspace or whatever), cancel */
			if ( !this.currentMention.getText().length ) {
				this.closeResults();
				return;
			}
			
			/* Or if we're just not in that element anymore (by hitting return or repositioning the mouse), also cancel */
			var ranges = editor.getSelection().getRanges();
			for ( var i = 0; i < ranges.length; i++ ) {
				if ( !ranges[i].getCommonAncestor( true, true ).equals( this.currentMention ) ) {
					this.cancelMention();
					this.closeResults();
					return;
				}
			}
			
			/* Get the name being typed */
			var mentionContents = this.currentMention.getText().substr(1).trim();
			
			/* Show the box if it's not showing yet (it will have ipsLoading) */
			this.results.show();

			/* Reposition it */
			this.positionResults();

			/* Abort any running request */
			if( this.ajaxObj && _.isFunction( this.ajaxObj.abort ) ){
				try {
					this.ajaxObj.abort();
				} catch (err) { }
			}

			/* Make the AJAX call */
			this.ajaxObj = ips.getAjax()( editor.config.controller + '&do=mention&input=' + encodeURIComponent( mentionContents ), { context: this } ).done(function( response ){
				/* If we have results - show them */
				if ( response ) {
					this.mentionLengthAtLastResult = mentionContents.length;
					this.results.removeClass('ipsLoading');
					this.results.html( response );
					this.results.children().click( $.proxy( this.selectMentionResult, this ) );
				}
				/* If we haven't... */
				else if ( mentionContents.length ) {
					
					/* Note that there were no results */
					this.callsWithNoResults++;
										
					/* And if it's failed more than 3 times, give up. We don't want to give up immediately in case of typos, but we also don't want to keep going forever */
					if ( this.callsWithNoResults >= 3 ) {
						this.cancelMention();
						this.closeResults();
						return;
					}
					
					/* If the user has types 5 or more characters since the last time we found a result, hide it so it doesn't look broken, but we're still listening in case
						they've just typed quickly and made a typo on the last stroke */
					if ( this.mentionLengthAtLastResult <= ( mentionContents.length - 5 ) ) {
						this.results.hide();
					}
					
				}
			});
				
		}, 50, this );
	};
	
	/**
	 * Select a mention result
	 *
	 * @param	{jQuery.Event}	evt	The click event
	 * @returns	{void}
	 */
	this.selectMentionResult = function( evt ){
		
		/* Which user did we click on? */
		var selectedUser = $(evt.currentTarget);
		
		/* Convert the mention into a link */
		this.currentMention.renameNode('a');
		this.currentMention.setAttribute( 'href', selectedUser.attr('data-mentionhref') );
		this.currentMention.setAttribute( 'contenteditable', 'false' );
		this.currentMention.setAttribute( 'data-ipsHover', '' );
		this.currentMention.setAttribute( 'data-ipsHover-target', selectedUser.attr('data-mentionhover') );
		this.currentMention.setAttribute( 'data-mentionid', selectedUser.attr('data-mentionid') )
		this.currentMention.setHtml( '@' + selectedUser.find('[data-role="mentionname"]').html() );
				
		/* Focus the editor again, placing the cursor just after the link */
		editor.focus();
		var newRange = editor.createRange();
		newRange.moveToElementEditEnd( this.currentMention );
		editor.getSelection().selectRanges( [ newRange ] );
		
		/* Close the results menu */
		this.closeResults();
	};
	
	/**
	 * Cancel the mention
	 *
	 * @returns	{void}
	 */
	this.cancelMention = function(){
		this.currentMention.remove(true);
	};
	
	/**
	 * Close results menu and resume listening for @
	 *
	 * @returns	{void}
	 */
	this.closeResults = function(){
		this.currentMention = null;
		this.results.remove();
		this.listenWithinMention.removeListener();
		this.listenForAtSymbol();
	};
	
	/* On initiation, start listening for @ */
	this.listenForAtSymbol();
};