CKEDITOR.plugins.add( 'ipspaste', {
	requires: 'clipboard',
    init: function( editor ) {
	    
	    /* Since Cut and Copy don't work in any browser, we should just remove them from the context menu */
	    if ( editor.contextMenu ) {
		    editor.on('pluginsLoaded', function(){
				editor.removeMenuItem('cut');
				editor.removeMenuItem('copy');
			});
		}
	    
	    /* Create a command for paste as plain text */
		editor.addCommand( 'ipspasteplain', {
			canUndo: false,
			async: true,
			exec: function( editor ) {
				editor.getClipboardData( { title: ips.getString('pasteAsPlaintext') }, function( data ) {
					data && editor.fire( 'paste', {
						type: 'text',
						dataValue: data.dataValue,
						method: 'paste',
						dataTransfer: CKEDITOR.plugins.clipboard.initPasteDataTransfer(),
						force: true
					} );
					editor.fire( 'afterCommandExec', {
						name: 'pastetext',
						command: 'ipspasteplain',
						returnValue: !!data
					} );
				} );
			}
		} );
	    
	    /* Add a paste as plaintext menu option */
	    if ( editor.contextMenu ) {
		    editor.addMenuItem( 'ipspasteplain', {
				label: ips.getString('pasteAsPlaintext'),
				icon: this.path + 'icons' + ( CKEDITOR.env.hidpi ? '/hidpi' : '' ) + '/pastetext.png',
				command: 'ipspasteplain',
				group: 'clipboard',
				order: 16
			} );
			editor.contextMenu.addListener( function( element, selection ) {
				inReadOnly = selection.getRanges()[ 0 ].checkReadOnly();
				return {
					ipspasteplain: CKEDITOR.TRISTATE_OFF
				};
			} );
		}
		
		/* Handle uploading files from pastes */
		var injectedFileReady = function(e,data){
			var afterInjectBookmarks = editor.getSelection().createBookmarks( true );
			editor.focus();
			if ( data.data.insertPoint ) {
				editor.getSelection().selectBookmarks( data.data.insertPoint );
				editor.insertHtml( data.content );
			}  else if ( data.data.placeholder ) {
				var nodeList = editor.document.find('img.pastedImagePlaceholder' + data.data.placeholder );
				if ( nodeList.count() ) {
					editor.getSelection().selectElement( nodeList.getItem(0) );
				}
				editor.insertHtml( data.content );
			}
			editor.focus();
			editor.getSelection().selectBookmarks( afterInjectBookmarks );
		};
		var uploaderElem = $(editor.element.$).closest('[data-ipsEditor]').find('[data-ipsUploader]');
		if ( uploaderElem.length ) { 
			uploaderElem.on( 'injectedFileReadyForInsert', injectedFileReady );
		} else {
			var editorElement = $(editor.element.$).closest('[data-ipsEditor]');
			editorElement.on( 'uploaderReady', function(){
				uploaderElem = editorElement.find('[data-ipsUploader]');
				if ( uploaderElem.length && !uploaderElem.data('pasteReady') ) {
					uploaderElem.on( 'injectedFileReadyForInsert', injectedFileReady );
					uploaderElem.data('pasteReady', true);
				}
			} );
		}
		function uploadFromPastes(evt) {
			var bookmarks = editor.getSelection().createBookmarks2( true );
			if ( uploaderElem.length && evt.data.dataTransfer.getFilesCount() ) {
				for ( var fileId = 0; fileId < evt.data.dataTransfer.getFilesCount(); fileId++ ) {
					uploaderElem.trigger( 'injectFile', { file: evt.data.dataTransfer.getFile( fileId ), data: { insertPoint: bookmarks } } );
				}
			}
		}
		function showNoPasteMessage() {
			var imageMessage = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="imageMessage"]');
			imageMessage.slideDown({
				queue: false
			});
			imageMessage.find('[data-action="removeImageMessage"]').click(function(){
				imageMessage.slideUp();
			});
		}
		
		/* Remove the formatting before the paste... */
		if ( editor.config.ipsPasteBehaviour == 'force' ) {
			editor.on( 'paste', function( evt ) {
				uploadFromPastes(evt);
				if ( evt.data.method != 'paste' ) {
					return;
				}
				evt.data.type = 'text';
			}, this, {}, 0 );
		}
	    
	    /* On paste, allow the user the option to remove formatting */
	    else {
			editor.on( 'paste', function( evt ) {
																												
				/* Are there any files we need to upload? */
				if ( ( !CKEDITOR.env.gecko && !CKEDITOR.env.edge && !( CKEDITOR.env.chrome && !CKEDITOR.env.mac ) ) || evt.data.method != 'paste' ) {
					uploadFromPastes(evt);
				}
				
				/* If there's no value we can stop there */
				if ( !evt.data.dataValue ) { 
					return;
				}
				
				/* Safari pastes images with webkit-fake-url:// as the src. We cannot do anything with these so they need to be discarded */
				if ( CKEDITOR.env.safari ) {
					var matches = evt.data.dataValue.match(/<img src="webkit-fake-url:\/\//);
					if ( matches ) {
						evt.data.dataValue = evt.data.dataValue.replace( /<img src="webkit-fake-url:\/\/[^>]*>/, '' );
						showNoPasteMessage();
					}
				}
				
				/* Any base64 images? */
				if ( !  evt.data.dataValue.match(/data-cke-widget-drag-handler/i) ) {
					var matches = evt.data.dataValue.match(/<img[^>]*src=(["'])data:image\/(jpeg|png|gif);base64,[A-Z0-9\/\+]*=*\1[^>]*>/gi);
					if ( matches ) {
						if ( uploaderElem.length ) {
							for ( var i = 0; i < matches.length; i++ ) {
								
								var randomId = Math.random().toString(36).substring(7);
								evt.data.dataValue = evt.data.dataValue.replace( matches[i], '<img class="pastedImagePlaceholder' + randomId + '" content-editable="false">' );
								
								var _matches = matches[i].match(/src=(["'])data:(image\/(jpeg|png|gif));base64,([A-Z0-9\/\+]*=*)\1/i);
								var bstr = atob( _matches[4] );
								var n = bstr.length;
								var u8arr = new Uint8Array(n);
								while(n--) {
									u8arr[n] = bstr.charCodeAt(n);
								}
								var file = new File( [u8arr], "image." + _matches[3], { type: _matches[2] } );
								uploaderElem.trigger( 'injectFile', { file: file, data: { placeholder: randomId } } );
								
							}
						} else {
							for ( var i = 0; i < matches.length; i++ ) {
								evt.data.dataValue = evt.data.dataValue.replace( matches[i], '' );
							}
							showNoPasteMessage();
						}
					}
				}
								
				/* Does it contain HTML, other than plain <p>, <a> or <br> tags? */
				var strippedValue = evt.data.dataValue.replace( /<((\/)?(p|a( href=["'].+?['"])?)|br(.+?)?)>/g, '' );
				var containsHtml = strippedValue.indexOf('<') !== -1;
								
				/* If it does... */
				if ( containsHtml && editor.config.ipsPasteBehaviour != 'force' && !evt.data.force ) {
					
					/* Save the snapshot of how the editor is now (before the paste) */
					var snapshot = editor.getSnapshot();
					var bookmarks = editor.getSelection().createBookmarks2( true );
					
					/* And how it is after the paste */
					var afterPasteBookmarks = null;
					editor.once( 'afterPaste', function( evt ) {
						afterPasteBookmarks = editor.getSelection().createBookmarks2( true );
						
						/* Event for whenever anything happens to the editor */
						editor.once( 'key', function() {
							hidePasteMessage();
						});
						editor.once( 'setData', function() {
							hidePasteMessage();
						});
					});		
					
					/* Show notification */
					var pasteMessage = $( '.' + editor.id ).closest('[data-ipsEditor]').find('[data-role="pasteMessage"]');
					pasteMessage.slideDown({
						queue: false
					});
									
					/* Function to handle cancels */
					var hidePasteMessage = function(){
						pasteMessage.slideUp({
							queue: false
						});
						pasteMessage.find('[data-action="keepPasteFormatting"]').off( 'click.ipsPaste' );
						pasteMessage.find('[data-action="removePasteFormatting"]').off( 'click.ipsPaste' );
					};
					
					/* Event for "Keep Formatting" button */
					pasteMessage.find('[data-action="keepPasteFormatting"]').on( 'click.ipsPaste', function(){
						/* Restore selection */
						editor.focus();
						editor.getSelection().selectBookmarks( afterPasteBookmarks || bookmarks );
						
						/* And hide the message */
						hidePasteMessage();
					});
					
					/* Event for "Remove Formatting" button */
					pasteMessage.find('[data-action="removePasteFormatting"]').on( 'click.ipsPaste', function(){
						
						/* Restore contents */
						editor.focus();
						editor.loadSnapshot( snapshot );
						
						/* Restore selection */
						editor.getSelection().selectBookmarks( bookmarks );
												
						/* Paste as plaintext */
						editor.fire( 'paste', {
							type: 'text',
							dataValue: evt.data.dataValue,
							method: 'paste',
							dataTransfer: CKEDITOR.plugins.clipboard.initPasteDataTransfer()
						} );
						
						/* And hide the message */
						hidePasteMessage();
					});	
				
				}
						
			}, this );
		}
	}
} );