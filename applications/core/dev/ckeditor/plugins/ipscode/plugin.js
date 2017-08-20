CKEDITOR.plugins.add( 'ipscode', {
	requires: 'widget',
    icons: 'ipscode',
    hidpi: true,
    init: function( editor ) {
	    /* Handle upcasting so existing code blocks are drgagable as widgets and not editable */
		editor.widgets.add( 'ipscode', {
			template: "<pre class='ipsCode'></pre>",    
	    	upcast: function( element ) {
                return element.name == 'pre' && element.hasClass( 'ipsCode' );
            }
	    } );
	    /* The command when the button is pressed */
    	editor.addCommand( 'ipsCode', {
		    exec: function( editor ) {
		    	var current = '';
		    	var title = ips.getString( 'editorCodeButton' );
		    	var url = editor.config.controller + '&do=code&editorId=' + editor.name;
		    	var data = {};
				var selection = editor.getSelection();
				var selectedElement = selection.getSelectedElement();
				if ( selectedElement && !selectedElement.hasClass('ipsCode') ) {
					selectedElement = selectedElement.findOne('pre.ipsCode');
				}
				if ( selectedElement && selectedElement.is('pre') && selectedElement.hasClass('ipsCode') ) {
					
					var lang = '';
					var classes = selectedElement.getAttribute('class').split(' ');
					for ( var i in classes ) {
						if ( classes[i].substr( 0, 5 ) == 'lang-' ) {
							lang = classes[i].substr( 5 );
						}
					}
					data['val'] = selectedElement.getText();
					url = url + '&lang=' + lang;
				} else {
					data['val'] = editor.getSelection().getSelectedText();
					url = url + '&lang=html';
				}

				editor.focusManager.blur();

				var dialogRef = ips.ui.dialog.create({
					title: title,
					fixed: false,
				    url: url,
				    ajax: { type: 'post', data: data }
				});
				dialogRef.show();
		    }
		});
		/* Add the button */
		editor.ui.addButton( 'ipsCode', {
		    label: ips.getString( 'editorCodeButton' ),
		    command: 'ipsCode',
		    toolbar: 'insert'
		});
		/* Handle double-clicks to launch edit dialog */
		editor.on( 'doubleclick', function( evt ) {
			var elements = evt.data.element.getParents(true);
			for ( i in elements ) {
				if ( elements[i].is('div') && elements[i].hasClass('cke_wysiwyg_div') ) {
					break;
				}
				
				if ( elements[i] && elements[i].is('pre') && elements[i].hasClass('ipsCode') ) {
					editor.getSelection().selectElement( elements[i].getParent() );
					editor.execCommand( 'ipsCode' );
					return;
				}
			}
		});
    }
});