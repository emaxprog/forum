CKEDITOR.plugins.add( 'ipsautolink', {
    init: function( editor ) {
	    editor.widgets.add( 'ipsembedded', {
		    inline: false,
		    upcast: function( element ) {
		        if ( ( element.name == 'div' && element.hasClass( 'ipsEmbeddedVideo' ) ) || ( element.name == 'iframe' && !_.isUndefined( element.attributes['data-embedcontent'] ) ) ) {
			       return true;
		        }
		    }
		});
		new CKEDITOR.plugins.ipsautolink( editor );
	}
} );

/**
 * IPS auto link, embed and emoticon handler
 *
 * @param	{CKEDITOR.editor} 	editor 		The editor instance
 * @returns {void}
 */
CKEDITOR.plugins.ipsautolink = function( editor ){
	
	/**
	 * The URL detection regex
	 *
	 * @link	https://gist.github.com/dperini/729294
	 */
	this.urlRegex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:localhost)|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[\/?#]\S*)?$/i;
	
	/**
	 * On key event (listens for space or return key)
	 *
	 * @param	{CKEDITOR.eventInfo}	evt		The event info
	 * @returns	{void}
	 */
	this.handleKey = function( evt ) {
    	/* Enter we need to do this asynchronously */
    	if ( evt.data.keyCode == 13 ) {
			CKEDITOR.tools.setTimeout( function() {
				this._handleKey(evt);
			}, 0, this );
		}
		/* But space we just do */
		else if ( evt.data.keyCode == 32 ) {
			this._handleKey(evt);
		}
	};
	this._handleKey = function( evt ) {
		var selection = editor.getSelection();
		if( selection === null )
		{
			return;
		}
		var ranges = selection.getRanges( true );
		for ( var i = 0; i < ranges.length; i++ ) {
    		
    		/* If it's collapsed (meaning we just have a normal caret, indicating normal typing, nothing highlighted)... */
			if ( ranges[i].collapsed ) {
				
				/* For space we look at this one */
				if ( evt.data.keyCode == 32 ) {
					var element = ranges[i].getCommonAncestor( true, true );
				}
				else {
					var element = ranges[i].getCommonAncestor( true, true ).getPrevious();
				}
				
				/* Do the replacements */
				if ( element && element instanceof CKEDITOR.dom.element ) {
					this.replaceInElement( element );
				}
			}
    	}
	};
	editor.on( 'key', this.handleKey, this );
	
	/**
	 * On paste event
	 *
	 * @param	{CKEDITOR.eventInfo}	evt		The event info
	 * @returns	{void}
	 */
	this.handlePaste = function( evt ) {
				
		/* Ignore internal pastes */
		if ( evt.data.dataTransfer.getTransferType( editor ) == CKEDITOR.DATA_TRANSFER_INTERNAL ) {
			return;
		}
		
		/* What did we paste? */
		var pastedText = evt.data.dataValue;
		
		/* The paste data is HTML, so if there's a < in it, it's not raw text and we can ignore */
		if ( pastedText.indexOf( '<' ) > -1 ) {
			/* If it's a link (which IE does for some reason) we need to add the ipsNoEmbed property so handleAfterPaste picks it up */
			var matches = pastedText.match(/<a href="(.+?)">(\1)<\/a>/);
			if ( matches ) {
				evt.data.dataValue = "<a href='" + matches[1] + "' ipsNoEmbed='false'>" + decodeURI( matches[1] ) + "</a>";
			}
			return;
		}
		
		/* If whatever is immediately before the paste is [img] or [url] we don't do anything */
		var selection = editor.getSelection();
		var ranges = selection.getRanges( true );
		for ( var i = 0; i < ranges.length; i++ ) {
			if ( ranges[i].startOffset ) { // Only if we're not at the start of that range (i.e. this isn't a new line)
				var preceedingEdiableNode = ranges[i].getPreviousEditableNode();
				if ( preceedingEdiableNode ) {
					var preceedingText = preceedingEdiableNode.getText();
					if ( preceedingText.substr( -5 ) == '[url=' || preceedingText.substr( -5 ) == "[img]" || preceedingText.substr( -5 ) == '[img=' || preceedingText.substr( -6 ) == "[code]" ) {
						return;
					}
				}
			}
		}
				
		/* Return replaced */
		var replacement = this.replaceTextWithLink( pastedText );
		if ( replacement ) {
			evt.data.dataValue = replacement.getOuterHtml();
		}
		
	};
	editor.on( 'paste', this.handlePaste, this, {}, 11 /* The priority has to be lower than default (10) so that ipspaste doesn't think we're pasting an event */ );
	
	/**
	 * After paste event
	 *
	 * @param	{CKEDITOR.eventInfo}	evt		The event info
	 * @returns	{void}
	 */
	this.handleAfterPaste = function( evt ) {
		var unEmbeddedLinks = editor.editable().find( 'a[ipsNoEmbed="false"]' );
		for ( var i = 0; i < unEmbeddedLinks.count(); i++ ) {
			this.replaceLinkWithEmbed( unEmbeddedLinks.getItem( i ) );
		}
	};
	editor.on( 'afterPaste', this.handleAfterPaste, this );

	/**
	 * When the form is submitted, do all replacements in the entire editor to catch any stragglers
	 *
	 * @returns	{void}
	 */
	editor.on( 'contentDom', function() {
		var self = this;
		var editable = editor.editable(); // Keep a reference to our editable element for use below

		$( '.' + editor.id ).closest('form').on('submit', function () {
			var children = editable.getChildren();
			for ( var i = 0; i < children.count(); i++ ) {
				if ( children.getItem(i) && children.getItem(i) instanceof CKEDITOR.dom.element ) {
					self.replaceInElement( children.getItem(i) );
				}
			}
			editor.updateElement();
		} );
	}, this );
	
	/**
	 * Do all replacements on a element
	 *
	 * @param	{CKEDITOR.dom.element}	element	The element
	 * @returns	{void}
	 */
	this.replaceInElement = function( element ) {
		
		/* Don't embed within links or code tags */
		if ( element.getName() == 'a' || element.getName() == 'pre' || element.getAttribute('ipsnoautolink') ) {
			return;
		}
		
		/* Loop all children */		
		var children = element.getChildren();
		for ( var i = 0; i < children.count(); i++ ) {
			
			var child = children.getItem( i );
			
			/* If it's a text node, look at it's contents... */
			if ( child instanceof CKEDITOR.dom.text ) {
				
				var text = child.getText();
				var breaks = [];
				var textSoFar = '';
				var haveReplacements = false;

				/* Loop over the words (separated by spaces) in it */ 
				var words = text.split(' ');
				for ( word in words ) {
					
					/* If there's a [url= in here, don't do any parsing */
					if ( words[word] == '[url=' || words[word] == '[img]' || words[word] == '[code]' ) {
						return;
					}
					
					/* If it needs replacing, add the element to replace it to breaks */
					var replacement = this.replaceWord( words[word].trim() );
					if ( replacement ) {
												
						/* Check if it needs to be embedded */
						if ( replacement.getName() == 'a' ) {
							this.replaceLinkWithEmbed( replacement )
						} 
						
						/* If we have already noted some texts from previous words, add a text node with that to breaks */
						if ( textSoFar.length ) {
							breaks.push( new CKEDITOR.dom.text( textSoFar ) );
							textSoFar = '';
						}
						
						/* Then add the actual element */
						breaks.push( replacement  );
						haveReplacements = true;
					}
					/* Otherwise, just note the text that was in it */
					else {
						textSoFar += words[word];
					}
					
					/* If that wasn't the last word, add a space */
					if ( word < words.length-1 ) {
						textSoFar += ' ';
					}
				}
				
				/* If there's any text left over, add that to breaks */
				if ( textSoFar.length ) {
					breaks.push(new CKEDITOR.dom.text( textSoFar ));
				}
												
				/* If we have ended up with more than one node, or a replacement, insert them */
				if ( breaks.length > 1 || haveReplacements ) {
					for ( var j = 0; j < breaks.length; j++ ) {
						var lastChild = breaks[j].insertBefore(child);
					}
					child.remove();
				}
			}
			
			/* Or if it's an element, loop over *it's* children */
			else {
				if ( child && child instanceof CKEDITOR.dom.element ) {
					this.replaceInElement( child );
				}
			}
		}
	};
	
	/**
	 * Do all replacements on a word
	 *
	 * @param	{string}	word	The word
	 * @returns	{CKEDITOR.dom.element|null}
	 */
	this.replaceWord = function( word ) {
				
		/* Is it a URL? */
		var urlLink = this.replaceTextWithLink( word );
		if ( urlLink ) {
			return urlLink;
		}
		
		/* Is it an emoticon? */
		var emoticon = this.replaceTextWithEmoticon( word );
		if ( emoticon ) {
			return emoticon;
		}
		
		return null;
	};
	
	/**
	 * Replace text with an <a> if the text is a link
	 *
	 * @param	{string}		text		The text
	 * @returns	{CKEDITOR.dom.element|null}
	 */
	this.replaceTextWithLink = function( text ) {
		if ( XRegExp.exec( text, this.urlRegex ) ) {
			var element = new CKEDITOR.dom.element( 'a' );
			element.setAttribute( 'ipsNoEmbed', 'false' );
			element.setAttribute( 'href', $('<textarea />').html( text ).text() );
			element.appendHtml( decodeURI( text ) );
			return element;
		}
		return null;
	};
	
	/**
	 * Replace text with an emotion if the text is an emoticon code
	 *
	 * @param	{string}		text		The text
	 * @returns	{CKEDITOR.dom.element|null}
	 */
	this.replaceTextWithEmoticon = function( text ) {
		for ( key in editor.config.ipsEmoticons ) {	
			var exp = new RegExp( '^' + key.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") /* This is a preg_quote equivalent */ + '$', 'i' );
			if ( text.match( exp ) ) {
				if ( $('<div>' + editor.getData() + '</div>' ).find('img[data-emoticon]').length < 75 ) {
					var element = new CKEDITOR.dom.element( 'img' );
					element.setAttribute( 'src', editor.config.ipsEmoticons[key]['image'] );
					if( editor.config.ipsEmoticons[key]['image_2x'] )
					{
						element.setAttribute( 'srcset', editor.config.ipsEmoticons[key]['image_2x'] );
					}
					if( editor.config.ipsEmoticons[key]['width'] && editor.config.ipsEmoticons[key]['height'] )
					{
						element.setAttribute( 'width', editor.config.ipsEmoticons[key]['width'] );
						element.setAttribute( 'height', editor.config.ipsEmoticons[key]['height'] );
					}
	
					element.setAttribute( 'data-emoticon', 'true' );
					element.setAttribute( 'alt', key );
					element.setAttribute( 'title', key );
					
					return element;
				} else {
					/* Show notification */
					var emoMessage = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="emoticonMessage"]');
					emoMessage.slideDown();
					
					/* Function to handle cancels */
					var hideEmoMessage = function(){
						emoMessage.slideUp();
					};
							
					/* After 2.5 seconds, more typing will remove */
					setTimeout(function(){
						editor.once( 'key', function() {
							hideEmoMessage();
						});
						editor.once( 'setData', function() {
							hideEmoMessage();
						});
					}, 2500);
				}
			}
		}
		return null;
	};
	
	/**
	 * Replace an <a> tag with an embed object if possible
	 *
	 * @param	{CKEDITOR.dom.element}		link		The <a> element
	 * @returns	{void}
	 */
	this.replaceLinkWithEmbed = function( link ) {
		
		/* If disabled, go no further */
		if ( !editor.config.ipsAutoEmbed ) {
			return;
		}
				
		/* If we've already checked this one, we don't need to do it again */
		if ( link.getAttribute('ipsNoEmbed') == 'true' ) {
			return;
		}
		
		/* Check if it's an image and fire request */
		var self = this;
		var img = new Image();
		img.onerror = function(){
			self._replaceLinkWithEmbed( link, false );
		};
		img.onload = function(){
			self._replaceLinkWithEmbed( link, true, img.width, img.height );
		}
		img.src = link.getAttribute('href');
	};
	
	/**
	 * Make request for replacing <a> tag with an embed object if possible
	 *
	 * @param	{CKEDITOR.dom.element}		link		The <a> element
	 * @param	{bool}						image		If the URL points to an image
	 * @param	{int}						width		If the URL points to an image, its width in pixels
	 * @param	{int}						height		If the URL points to an image, its height in pixels
	 * @returns	{void}
	 */
	this._replaceLinkWithEmbed = function( link, image, width, height ) {
		/* Set defaults, we can't use default function parameters here to keep IE11 compatibility */
		var width = width || 0;
		var height = height || 0;

		/* Fire the AJAX request */
		ips.getAjax()( editor.config.controller + '&do=validateLink', {
			data: {
				url: link.getAttribute('href').replace( /&amp;/g, '&' ),
				image: image,
				width: width,
				height: height
			},
			type: 'post'
		})
		/* Handle the response */
		.done(function( response ){
			
			/* If it's embeddable, embed it! */
			if ( response.embed ) {
				
				/* Init */
				var embedWidget, originalParent, splitParent;
				
				/* Create the new */
				var newElement = CKEDITOR.dom.element.createFromHtml( response.preview );
				
				/* If it's an image, we can just go ahead and stick it in */
				if ( newElement.getName() == 'img' ) {
					newElement.replace( link );
				}
				
				/* Otherwise for proper embeds like iframes, it's a bit more complicated */
				else {
					
					/* First we have to split up the surrounding paragraph - so find the closest <p> */
					var parents = link.getParents();
					for ( i in parents.reverse() ) {
						if ( parents[i].getName() == 'p' ) {
														
							/* Break into two <p>s */
							link.breakParent( parents[i] );
							
							/* But drop them if there's nothing in them */
							var previous = link.getPrevious();
							if ( previous && previous.getChildCount() == 0 ) {
								previous.remove();
							} else {
								originalParent = previous;
							}
							var next = link.getNext();
							if ( next && ( next.getChildCount(0) || ( next.getChildCount(1) && next.getChild(0).is('br') ) ) ) {
								var theOneAfterNext = next.getNext();
								if ( theOneAfterNext && ( next.getChildCount(0) || ( next.getChildCount(1) && next.getChild(0).is('br') ) ) ) {
									next.remove();
									next = theOneAfterNext;
								}
							}
							splitParent = next;
							
							
							/* And sure we keep the caret in the second one */
							var newRange = editor.createRange();
							newRange.moveToElementEditEnd( next );
							editor.getSelection().selectRanges( [ newRange ] );
							
							break;
						}
					}
					
					/* Then actually replace it */
					newElement.replace( link );
					
					/* Then turn it into a widget */
					var embedWidget = editor.widgets.initOn( newElement, 'ipsembedded' );
					$( document ).trigger('contentChange', [ $( '.' + editor.id ).closest('[data-ipsEditor]') ]);
				}
				
				/* Show notification */
				var embedMessage = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="embedMessage"]');
				embedMessage.slideDown();
				
				/* Function to handle cancels */
				var hideEmbedMessage = function(){
					embedMessage.slideUp();
					embedMessage.find('[data-action="keepEmbeddedMedia"]').off( 'click.ipsEmbed' );
					embedMessage.find('[data-action="removeEmbeddedMedia"]').off( 'click.ipsEmbed' );
				};
				
				/* After 2.5 seconds, more typing will remove */
				setTimeout(function(){
					editor.once( 'key', function() {
						hideEmbedMessage();
					});
					editor.once( 'setData', function() {
						hideEmbedMessage();
					});
				}, 2500);
				
				/* Event for "Keep Formatting" button */
				embedMessage.find('[data-action="keepEmbeddedMedia"]').on( 'click.ipsEmbed', function(){
					/* Select editor again */
					editor.focus();
					
					/* And hide the message */
					hideEmbedMessage();
				});
				
				/* Event for "Remove Formatting" button */
				embedMessage.find('[data-action="removeEmbeddedMedia"]').on( 'click.ipsEmbed', function(){
					
					/* Change back to link and select editor again */
					if ( embedWidget ) {
						embedWidget.destroy();
					}
					link.replace( newElement );
					link.setAttribute('ipsNoEmbed', 'true');
					
					/* Embedded content with content before and after */
					if ( splitParent && originalParent ) {
						link.move( splitParent, true );
						splitParent.moveChildren( originalParent );
					}
					/* Embedded content on it's own line */
					else if ( splitParent ) {
						var paragraph = new CKEDITOR.dom.element('p');
						paragraph.insertBefore( link );
						link.move( paragraph );
					}
					
					/* Select editor again */
					editor.focus();
										
					/* And hide the message */
					hideEmbedMessage();
				});
			}
			/* Otherwise, note that we've already checked this one and it's not embeddable */
			else {
				link.setAttribute('ipsNoEmbed', 'true');

				/* If there was an error, show it */
				if( response.errorMessage )
				{
					/* Show notification */
					var embedFailure = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="embedFailMessage"]');
					embedFailure.find('p').html( response.errorMessage );
					embedFailure.slideDown();

					/* After 2.5 seconds, more typing will remove */
					setTimeout(function(){
						editor.once( 'key', function() {
							embedFailure.slideUp();
						});
						editor.once( 'setData', function() {
							embedFailure.slideUp();
						});
					}, 2500);	
				}
			}
		})
		.fail(function( jqXHR ){
			link.setAttribute('ipsNoEmbed', 'true');

			/* If there was an error, show it */
			var embedFailure = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="embedFailMessage"]');
			embedFailure.find('p').html( ips.getString( 'embed_error_message_admin', { error: jqXHR.statusText + ': ' + jqXHR.responseText } ) );
			embedFailure.slideDown();

			/* After 2.5 seconds, more typing will remove */
			setTimeout(function(){
				editor.once( 'key', function() {
					embedFailure.slideUp();
				});
				editor.once( 'setData', function() {
					embedFailure.slideUp();
				});
			}, 2500);	
		});
		
	};
	
};