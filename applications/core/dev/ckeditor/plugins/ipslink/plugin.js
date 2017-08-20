CKEDITOR.plugins.add( 'ipslink', {
    icons: 'ipslink',
    hidpi: true,
    init: function( editor ) {    	
    	editor.addCommand( 'ipsLink', {
    		allowedContent: 'a',
		    exec: function( editor ) {			    
		    	var current = '';
		    	var title = ips.getString( 'editorLinkButton' );
		    	var url = editor.config.controller + '&do=link&editorId=' + editor.name + '&title=' + encodeURIComponent( editor.getSelection().getSelectedText() ).replace( /%C2%A0/gi, '%20' );
		    	var element = CKEDITOR.plugins.ipslink.getSelectedLink( editor );
		    			    	
		    	if ( element ) {
			    	var link = element.getAscendant( 'a', true );

			    	if( link )
			    	{
						editor.getSelection().selectElement( link );
						current = link.getAttribute('href');
						url = editor.config.controller + '&do=link&current=' + encodeURIComponent( current ) + '&editorId=' + editor.name + '&title=' + encodeURIComponent( editor.getSelection().getSelectedText() ).replace( /%C2%A0/gi, '%20' );
						if ( !link.equals( element ) ) {
							url += '&block=1';
						}
					}
		    	}
		    	
		    	editor._linkBookmarks = editor.getSelection().createBookmarks();

				var dialogRef = ips.ui.dialog.create({
					title: title,
					fixed: false,
				    url: url,
				    forceReload: true
				});
				dialogRef.show();
		    }
		});
		editor.addCommand( 'ipsLinkRemove', {
    		allowedContent: 'a',
		    exec: function( editor ) {
				var style = new CKEDITOR.style( { element: 'a', type: CKEDITOR.STYLE_INLINE, alwaysRemoveElement: 1 } );
				editor.removeStyle( style );
				var newstyle = new CKEDITOR.style( { attributes: { 'ipsnoautolink': true } } );
				editor.applyStyle( newstyle );
			}
		} );
		editor.ui.addButton( 'ipsLink', {
		    label: ips.getString( 'editorLinkButton' ),
		    command: 'ipsLink',
		    toolbar: 'insert'
		});
		editor.on( 'doubleclick', function( evt ) {
			var element = CKEDITOR.plugins.ipslink.getSelectedLink( editor ) || evt.data.element;
			if ( !element.isReadOnly() && element.is( 'a' ) && element.getAttribute( 'href' ) ) {
				
				var done = false;
				if ( element.getChildCount() == 1 ) {
					var children = element.getChildren();
					for ( var i = 0; i < children.count(); i++ ) {
						var child = children.getItem(i);
						if ( child.$.nodeType == child.$.ELEMENT_NODE && child.is('img') ) {
							done = true;
							break;
						}
					}
				}
				
				if ( !done ) {
					editor.getSelection().selectElement( element );
					editor.execCommand( 'ipsLink' );
				}
			}
		});
		if ( editor.contextMenu ) {
		    editor.addMenuGroup( 'ipsLink' );
		    editor.addMenuItem( 'editIpsLink', {
		        label: ips.getString('editorLinkButtonEdit'),
		        icon: this.path + 'icons' + ( CKEDITOR.env.hidpi ? '/hidpi' : '' ) + '/ipslink.png',
		        command: 'ipsLink',
		        group: 'ipsLink'
		    });
		    editor.addMenuItem( 'removeIpsLink', {
		        label: ips.getString('editorLinkButtonRemove'),
		        icon: this.path + 'icons' + ( CKEDITOR.env.hidpi ? '/hidpi' : '' ) + '/unlink.png',
		        command: 'ipsLinkRemove',
		        group: 'ipsLink'
		    });
		    
		    editor.contextMenu.addListener( function( element ) {
		        if ( element.getAscendant( 'a', true ) ) {
		            return {
			            editIpsLink: CKEDITOR.TRISTATE_OFF,
			            removeIpsLink: CKEDITOR.TRISTATE_OFF
					};
		        }
		    });
		}
    }
});

CKEDITOR.plugins.ipslink = {
	 getSelectedLink: function( editor ) {
		var selection = editor.getSelection();
		var selectedElement = selection.getSelectedElement();
		if ( selectedElement && ( selectedElement.is( 'a' ) || selectedElement.is( 'img' ) ) )
			return selectedElement;
		
		var range = selection.getRanges( true )[ 0 ];
		
		if ( range ) {
			range.shrink( CKEDITOR.SHRINK_TEXT );
			return editor.elementPath( range.getCommonAncestor() ).contains( 'a', 1 );
		}
		return null;
	}
};