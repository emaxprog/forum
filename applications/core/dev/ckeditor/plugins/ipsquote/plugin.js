CKEDITOR.plugins.add( 'ipsquote', {
    requires: 'widget',
    icons: 'ipsquote',
    hidpi: true,
    allowedContent: 'blockquote',
    init: function( editor ) {
	    editor.widgets.add( 'ipsquote', {
			/* Basic Widget definition */
			button: ips.getString('editorQuote'),
	        template: ips.templates.render( 'core.editor.quote', { citation: ips.getString('editorQuote'), contents: '' } ),
	        editables: {
		        content: {
		            selector: '.ipsQuote_contents'
		        }
		    },
		    
		    /* Upcast an element when editing into a proper widget */
		    upcast: function( element ) {
		        if ( element.name == 'blockquote' && element.hasClass( 'ipsQuote' ) ) {
			       /* Get options */
			       var data = {};
				   var i = 0;
				   for ( i in element.attributes ) {
					   if ( i.substr( 0, 14 ) == 'data-ipsquote-' ) {
						   data[ i.substr(14) ] = element.attributes[i];
					   }
				   }
			       
			       /* Legacy (created pre-4.1) */
			       if ( !element.children[0].hasClass('ipsQuote_citation') ) {
				       element.setHtml( ips.templates.render( 'core.editor.legacyQuoteUpcast', {
					       citation: ips.utils.getCitation( data ),
					       contents: element.getHtml()
					   } ) );
			       }
			       /* Created post 4.1 */
			       else {
				       element.children[0].setHtml( ips.utils.getCitation( data ) );
			       }
			       return true;
		        }
		    },
		    
		    /* We have to override the insert code because we want it so if you highlight
			    content and click quote, it quotes the highlighted content. Much of this code
			    is copied from CKEditor's widget plugin */
		    insert: function(){
			    
				/* What did we have highlighted? */
				var selectedHtml = editor.getSelectedHtml( true );
				var selection = editor.getSelection();
				var selectedElement = selection ? selection.getSelectedElement() : null;
								    
				var defaults = typeof this.defaults == 'function' ? this.defaults() : this.defaults,
					element = CKEDITOR.dom.element.createFromHtml( this.template.output( defaults ) ),
					instance,
					wrapper = editor.widgets.wrapElement( element, this.name ),
					temp = new CKEDITOR.dom.documentFragment( wrapper.getDocument() );

				// Append wrapper to a temporary document. This will unify the environment
				// in which #data listeners work when creating and editing widget.
				temp.append( wrapper );
				instance = editor.widgets.initOn( element, this, false );

				// Instance could be destroyed during initialization.
				// In this case finalize creation if some new widget
				// was left in temporary document fragment.
				if ( !instance ) {
					finalizeCreation();
					return;
				}

				// Listen on edit to finalize widget insertion.
				//
				// * If dialog was set, then insert widget after dialog was successfully saved or destroy this
				// temporary instance.
				// * If dialog wasn't set and edit wasn't canceled, insert widget.
				var editListener = instance.once( 'edit', function( evt ) {
					if ( evt.data.dialog ) {
						instance.once( 'dialog', function( evt ) {
							var dialog = evt.data,
								okListener,
								cancelListener;

							// Finalize creation AFTER (20) new data was set.
							okListener = dialog.once( 'ok', finalizeCreation, null, null, 20 );

							cancelListener = dialog.once( 'cancel', function( evt ) {
								if ( !( evt.data && evt.data.hide === false ) ) {
									editor.widgets.destroy( instance, true );
								}
							} );

							dialog.once( 'hide', function() {
								okListener.removeListener();
								cancelListener.removeListener();
							} );
						} );
					} else {
						// Dialog hasn't been set, so insert widget now.
						finalizeCreation();
					}
				}, null, null, 999 );

				instance.edit();

				// Remove listener in case someone canceled it before this
				// listener was executed.
				editListener.removeListener();
				
				function finalizeCreation() {
					editor.widgets.finalizeCreation( temp );
				}
				
			    /* If something was selected... */
			    if ( selectedHtml ) {
				    
				    /* Move it inside the editable area */
					if ( selectedHtml.substr( 0, 1 ) === '<p>' ) {
						instance.editables.content.setHtml( selectedHtml );
					} else {
						instance.editables.content.setHtml( '<p>' + selectedHtml + '</p>' );
					}
					
					/* Then move the cursor to right after it */
					var range = editor.createRange();
                    range.moveToElementEditablePosition( instance.wrapper.getNext() );
                    range.select();
			    }
			    
			    /* If there was nothing to move in, put the cursor inside the editable area */
			    else {
					var range = editor.createRange();
                    range.moveToElementEditablePosition( instance.editables.content );
                    range.select();
			    }
		    }
		} );
		
		/* When editing, detect enter on empty paragraphs to break */
		editor.on( 'key', function( evt ){
			
			/* If the key is enter... */
			if ( evt.data.keyCode == 13 ) {
				
				/* Figure out where the cursor is... */
				var ranges = editor.getSelection().getRanges();
			    for ( var i = 0; i < ranges.length; i++ ) {
				   
				    var selectedElement = ranges[i].getCommonAncestor();
				    selectedElement = selectedElement instanceof CKEDITOR.dom.text ? selectedElement.getParent() : selectedElement;
				   
				    /* If it was a blank paragraph... */
				    if ( selectedElement.getName() == 'p' && selectedElement.getHtml() == '<br>' ) {
					    
					    /* And we are inside a quote... */
					    var quoteAscendant = selectedElement.getAscendant( function(el){
							return el instanceof CKEDITOR.dom.element && el.getName() == 'div' && el.hasClass('ipsQuote_contents');
						}, true );
					    if ( quoteAscendant ) {
						    
						    /* If we are in the *middle* of a quote, we need to break it into two... */
							if ( selectedElement.getNext() ) {
								
								/* Create a new quote */
								var newQuote = CKEDITOR.dom.element.createFromHtml( ips.templates.render( 'core.editor.quote', { citation: quoteAscendant.getParent().findOne('.ipsQuote_citation').getText(), contents: '' } ) );
								
								/* Work out which of the paragraphs from the current quote need to be moved into the new one */
								var workingParagraph = selectedElement;
								var paragraphsToMove = [];
								while ( workingParagraph = workingParagraph.getNext() ) {
									paragraphsToMove.push( workingParagraph );
								}
								
								/* Move them */
								var newQuoteContents = newQuote.findOne('.ipsQuote_contents');
								for ( var j = 0; j < paragraphsToMove.length; j++ ) {
									paragraphsToMove[j].move( newQuoteContents );
								}
								
								/* Create an empty paragraph to go in between the quotes, and insert that and the new quote after teh current quote */
								var emptyParagraph = CKEDITOR.dom.element.createFromHtml('<p><br></p>');
								emptyParagraph.insertAfter( quoteAscendant.getParent().getParent() );
								newQuote.insertAfter( emptyParagraph );
								editor.widgets.initOn( newQuote, 'ipsquote' );
								
								/* Move the cursor into the empty paragraph */								
								var newRange = editor.createRange();
								newRange.moveToPosition( emptyParagraph, CKEDITOR.POSITION_AFTER_START );
								editor.getSelection().selectRanges( [ newRange ] );
								
								/* And remove the empty paragraph we were in that triggered the event to begin with */
								selectedElement.remove();
							}
							/* Or if we are at the end of a quote, jump to the next paragraph */
							else {
								selectedElement.remove();
								editor.focus();
								var newRange = editor.createRange();
								var wrapper = quoteAscendant.getParent().getParent();
								var nextParagraph = wrapper.getNext();
								if ( !nextParagraph ) {
									var nextParagraph = new CKEDITOR.dom.element( 'p', editor.document );
									nextParagraph.insertAfter( wrapper );
								}
								newRange.moveToPosition( nextParagraph, CKEDITOR.POSITION_AFTER_START );
								editor.getSelection().selectRanges( [ newRange ] );
							}
							
							/* And return false so our enter does nothing */
						    return false;
					    }
					}
					
			    }
			    
			}
			
		}, this, 0 );
		
		/* Breakout command */
		editor.addCommand( 'ipsQuoteBreakout', {
		    exec: function( editor, data ) {
			    var selection = editor.getSelection();
			    var selectedElement = selection.getSelectedElement();
			    if ( !selectedElement ) {
				    var ranges = selection.getRanges();
				    for ( var i = 0; i < ranges.length; i++ ) {
					    selectedElement = ranges[i].getCommonAncestor();
				    }
			    }
			    var container = selectedElement.getAscendant( function( el ){
					return el instanceof CKEDITOR.dom.element && el.hasClass('cke_widget_wrapper');
				}, true );
				var contents = container.find('.ipsQuote_contents > *');
				for ( var i = 0; i < contents.count(); i++ ) {
					editor.insertElement( contents.getItem( i ).clone( true ) );
				}
				container.remove();
			}
		} );
		
		/* Remove command */
		editor.addCommand( 'ipsQuoteRemove', {
		    exec: function( editor ) {
				var selection = editor.getSelection();
				var bookmarks = selection.createBookmarks2( true );
			    var selectedElement = selection.getSelectedElement();
			    if ( !selectedElement ) {
				    var ranges = selection.getRanges();
				    for ( var i = 0; i < ranges.length; i++ ) {
					    selectedElement = ranges[i].getCommonAncestor();
				    }
			    }
			    selectedElement.getAscendant( function( el ){
					return el instanceof CKEDITOR.dom.element && el.hasClass('cke_widget_wrapper');
				}, true ).remove();
				editor.getSelection().selectBookmarks( bookmarks );
			}
		} );
		    
	    /* Context menu to remove */
	    if ( editor.contextMenu ) {
		    editor.addMenuGroup( 'ipsQuote' );
		    editor.addMenuItem( 'ipsQuoteBreakout', {
		        label: ips.getString('editorQuoteBreakout'),
		        icon: null,
		        command: 'ipsQuoteBreakout',
		        group: 'ipsQuote'
		    });
		    editor.addMenuItem( 'ipsQuoteRemove', {
		        label: ips.getString('editorQuoteRemove'),
		        icon: null,
		        command: 'ipsQuoteRemove',
		        group: 'ipsQuote'
		    });
		    
		    editor.contextMenu.addListener( function( element, selection ) {
				if ( element.getAscendant(function(el){
					return el instanceof CKEDITOR.dom.element && el.hasClass('ipsQuote');
				}, true ) || element.find('.ipsQuote').count() ) {
					return {
						ipsQuoteBreakout: CKEDITOR.TRISTATE_OFF,
						ipsQuoteRemove: CKEDITOR.TRISTATE_OFF
					};
				}
			} );
		}
	}
} );