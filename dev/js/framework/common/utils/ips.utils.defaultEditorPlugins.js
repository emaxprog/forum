/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.defaultEditorPlugins.js - Code for editor plugins which don't have their own code
 *
 * Author: Mark Wade
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.defaultEditorPlugins', function () {
		return {
			/**
			 * Inline
			 */
			inline: function( command, html ) {
				return {
					exec: function( editor ) {
						var range = editor.getSelection().getRanges()[0];
						var selected = range.extractContents();
												
						var element = new CKEDITOR.dom.element( 'span' );
						element.setHtml( html.replace( '{contents}', '<span data-content-marker="true"></span>' ).replace( '{content}', '<span data-content-marker="true"></span>' )  );
						
						var spans = element.getElementsByTag( 'span' );
						for ( var i = 0; i < spans.count(); i++ ) {
							if ( spans.getItem( i ).hasAttribute( 'data-content-marker' ) ) {
								selected.insertAfterNode( spans.getItem( i ) );
								spans.getItem( i ).remove();
							}
						}
												
						editor.insertHtml( element.getHtml() );
					}
				}
			},
			
			/**
			 * Single-Line Blocks
			 */
			singleblock: function( command, tagName, tagAttributes, beforeContent, includeContent, afterContent, optionValue ) {
				return {
					exec: function( editor ) {
						editor.focus();

						// Parse option
						if ( !_.isUndefined( optionValue ) ) {
							beforeContent = beforeContent.replace( /\{option\}/g, optionValue );
							afterContent = afterContent.replace( /\{option\}/g, optionValue );
							var _tagAttributes = tagAttributes;
							tagAttributes = {};
							for ( i in _tagAttributes ) {
								var newI = i.replace( /\{option\}/g, optionValue );
								tagAttributes[newI] = _tagAttributes[i].replace( /\{option\}/g, optionValue );
							}
						}

						var style = new CKEDITOR.style( { element: tagName, attributes: tagAttributes } );
						var elementPath = editor.elementPath();
						if ( style.checkActive( elementPath, editor ) ) {
							editor['removeStyle']( style );
						} else {							
							if ( beforeContent || !includeContent || afterContent ) {
								var range = editor.getSelection().getRanges()[0];
								var selected = range.extractContents();

								var element = new CKEDITOR.dom.element( tagName );
								element.setAttributes(tagAttributes);
								
								var content = beforeContent;
								if ( includeContent ) {
									content += "{content}";
								}
								content += afterContent;
								element.setHtml( content.replace( '{contents}', '<span data-content-marker="true"></span>' ).replace( '{content}', '<span data-content-marker="true"></span>' )  );
								
								var spans = element.getElementsByTag( 'span' );
								for ( var i = 0; i < spans.count(); i++ ) {
									if ( spans.getItem( i ).hasAttribute( 'data-content-marker' ) ) {
										selected.insertAfterNode( spans.getItem( i ) );
										spans.getItem( i ).remove();
									}
								}
								editor.insertElement( element );
							} else {
								editor['applyStyle']( style );
							}
						}						
					}
				}
			},
			
			/**
			 * Blocks
			 */
			block: function( command, tagName, tagAttributes, beforeContent, includeContent, afterContent, optionValue ) {
				if ( tagName == 'p' ) {
					tagName = 'div';
				}				
				return {
					exec: function( editor ) {

						var selection = editor.getSelection(),
							range = selection && selection.getRanges( true )[ 0 ];
			
						if ( !range )
							return;
			
						var bookmarks = selection.createBookmarks();
			
						// Kludge for #1592: if the bookmark nodes are in the beginning of
						// blockquote, then move them to the nearest block element in the
						// blockquote.
						if ( CKEDITOR.env.ie ) {
							var bookmarkStart = bookmarks[ 0 ].startNode,
								bookmarkEnd = bookmarks[ 0 ].endNode,
								cursor;
			
							if ( bookmarkStart && bookmarkStart.getParent().getName() == tagName ) {
								cursor = bookmarkStart;
								while ( ( cursor = cursor.getNext() ) ) {
									if ( cursor.type == CKEDITOR.NODE_ELEMENT && cursor.isBlockBoundary() ) {
										bookmarkStart.move( cursor, true );
										break;
									}
								}
							}
			
							if ( bookmarkEnd && bookmarkEnd.getParent().getName() == tagName ) {
								cursor = bookmarkEnd;
								while ( ( cursor = cursor.getPrevious() ) ) {
									if ( cursor.type == CKEDITOR.NODE_ELEMENT && cursor.isBlockBoundary() ) {
										bookmarkEnd.move( cursor );
										break;
									}
								}
							}
						}
			
						var iterator = range.createIterator(),
							block;
						iterator.enlargeBr = editor.config.enterMode != CKEDITOR.ENTER_BR;
			
						var paragraphs = [];
						while ( ( block = iterator.getNextParagraph() ) )
							paragraphs.push( block );
			
						// If no paragraphs, create one from the current selection position.
						if ( paragraphs.length < 1 ) {
							var para = editor.document.createElement( editor.config.enterMode == CKEDITOR.ENTER_P ? 'p' : 'div' ),
								firstBookmark = bookmarks.shift();
							range.insertNode( para );
							para.append( new CKEDITOR.dom.text( '\ufeff', editor.document ) );
							range.moveToBookmark( firstBookmark );
							range.selectNodeContents( para );
							range.collapse( true );
							firstBookmark = range.createBookmark();
							paragraphs.push( para );
							bookmarks.unshift( firstBookmark );
						}
								
						// Make sure all paragraphs have the same parent.
						var commonParent = paragraphs[ 0 ].getParent(),
							tmp = [];
						for ( var i = 0; i < paragraphs.length; i++ ) {
							block = paragraphs[ i ];
							commonParent = commonParent.getCommonAncestor( block.getParent() );
						}
			
						// The common parent must not be the following tags: table, tbody, tr, ol, ul.
						var denyTags = { table:1,tbody:1,tr:1,ol:1,ul:1 };
						while ( denyTags[ commonParent.getName() ] )
							commonParent = commonParent.getParent();
			
						// Reconstruct the block list to be processed such that all resulting blocks
						// satisfy parentNode.equals( commonParent ).
						var lastBlock = null;
						while ( paragraphs.length > 0 ) {
							block = paragraphs.shift();
							while ( !block.getParent().equals( commonParent ) )
								block = block.getParent();
							if ( !block.equals( lastBlock ) )
								tmp.push( block );
							lastBlock = block;
						}
			
						// If any of the selected blocks is a blockquote, remove it to prevent
						// nested blockquotes.
						while ( tmp.length > 0 ) {
							block = tmp.shift();
							if ( block.getName() == tagName ) {
								var docFrag = new CKEDITOR.dom.documentFragment( editor.document );
								while ( block.getFirst() ) {
									docFrag.append( block.getFirst().remove() );
									paragraphs.push( docFrag.getLast() );
								}
			
								docFrag.replace( block );
							} else
								paragraphs.push( block );
						}
						
						// Parse option
						if ( !_.isUndefined( optionValue ) ) {
							beforeContent = beforeContent.replace( /\{option\}/g, optionValue );
							afterContent = afterContent.replace( /\{option\}/g, optionValue );
							var _tagAttributes = tagAttributes;
							tagAttributes = {};
							for ( i in _tagAttributes ) {
								var newI = i.replace( /\{option\}/g, optionValue );
								tagAttributes[newI] = _tagAttributes[i].replace( /\{option\}/g, optionValue );
							}
						}
			
						// Now we have all the blocks to be included in a new blockquote node.
						var bqBlock = editor.document.createElement( tagName );
						bqBlock.setAttributes( tagAttributes );
						bqBlock.insertBefore( paragraphs[ 0 ] );
						var content = '';
						if ( beforeContent ) {
							content += beforeContent;
						}
						if ( includeContent ) {
							content += '<span data-content-marker="true"></span>';
						}
						if ( afterContent ) {
							content += afterContent;
						}
						bqBlock.appendHtml( content );
						if ( includeContent ) {
							var spans = bqBlock.getElementsByTag( 'span' );
							for ( var i = 0; i < spans.count(); i++ ) {
								if ( spans.getItem( i ).hasAttribute( 'data-content-marker' ) ) {
									while ( paragraphs.length > 0 ) {
										block = paragraphs.pop();
										block.insertAfter( spans.getItem( i ) );
									}
									spans.getItem( i ).remove();
								}
							}
						}
						selection.selectBookmarks( bookmarks );
						editor.focus();
					}
				}
			}
		};
	});
}(jQuery, _));