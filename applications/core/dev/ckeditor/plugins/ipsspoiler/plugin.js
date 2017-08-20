CKEDITOR.plugins.add( 'ipsspoiler', {
    requires: 'widget',
    icons: 'ipsspoiler',
    init: function( editor ) {
	    editor.widgets.add( 'ipsspoiler', {
			/* Basic Widget definition */
			button: ips.getString('editorSpoiler'),
			template: ips.templates.render( 'core.editor.spoiler' ),
	        editables: {
		        content: {
		            selector: '.ipsSpoiler_contents'
		        }
		    },
		    
		    /* Upcast an element when editing into a proper widget */
		    upcast: function( element ) {
		        if ( ( element.name == 'div' && element.hasClass( 'ipsSpoiler' ) ) || ( element.name == 'blockquote' && element.hasClass( 'ipsStyle_spoiler' ) ) ) {
			       if ( !element.children[0] || element.children[0].hasClass == undefined || !element.children[0].hasClass('ipsSpoiler_header') ) {
				       element.setHtml( ips.templates.render( 'core.editor.legacySpoilerUpcast', {
					       contents: element.getHtml()
					   } ) );
			       }
				   return true;
		        }
		    },
		    
		    /* Initiate */
		    init: function(){
				
				/* What did we have highlighted? */
				var selectedHtml = editor.getSelectedHtml( true );
				var selection = editor.getSelection();
				var selectedElement = selection ? selection.getSelectedElement() : null;
							    
			    /* When the widget is ready, do stuff with that... */
			    if ( !selectedElement || !selectedElement.hasClass('cke_widget_wrapper') ) { // When drag-and-dropping a widget, it will reinitialise, and we don't want to wrap it in itself when that happens			    
				    this.once('focus', function(){
					    				    				    				    
					    /* If something was selected... */
					    if ( selectedHtml ) {
						    
						    /* Move it inside the editable area */
							if ( selectedHtml.substr( 0, 1 ) === '<p>' ) {
								this.editables.content.setHtml( selectedHtml );
							} else {
								this.editables.content.setHtml( '<p>' + selectedHtml + '</p>' );
							}
							
							/* Then move the cursor to right after it */
							var range = editor.createRange();
		                    range.moveToElementEditablePosition( this.wrapper.getNext() );
		                    range.select();
					    }
					    
					    /* If there was nothing to move in, put the cursor inside the editable area */
					    else {
							var range = editor.createRange();
		                    range.moveToElementEditablePosition( this.editables.content );
		                    range.select();
					    }
					    
				    }, this );	    
			    }
			}
	    } );
	}
} );