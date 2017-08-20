CKEDITOR.plugins.add( 'ipsimage', {
    icons: 'ipsimage',
    hidpi: true,
    init: function( editor ) {
    	editor.addCommand( 'ipsImage', {
    		allowedContent: 'img',
		    exec: function( editor ) {
		    	var selection = editor.getSelection();
				var selectedElement = selection.getSelectedElement();

				var link = '';
				var _float = getComputedStyle( selectedElement.$, null ).getPropertyValue('float');
				if ( selectedElement.$.parentNode.tagName === 'A' ) {
					link = selectedElement.$.parentNode.href;
					_float = getComputedStyle( selectedElement.$.parentNode, null ).getPropertyValue('float')
				}
				var imageAlt = selectedElement.$.alt;

				Debug.log( selectedElement.$ );

				var border = parseInt( getComputedStyle( selectedElement.$, null ).getPropertyValue('border-left-width').replace('px', '') );
				var margin = parseInt( getComputedStyle( selectedElement.$, null ).getPropertyValue('margin-left').replace('px', '') );
				var padding = parseInt( getComputedStyle( selectedElement.$, null ).getPropertyValue('padding-left').replace('px', '') );

				var options = {
					"editorId": editor.name,
					"actualWidth": selectedElement.$.naturalWidth,
					"actualHeight": selectedElement.$.naturalHeight,
					"width": selectedElement.$.width + ( ( border + padding ) * 2 ),
					"height": selectedElement.$.height + ( ( border + padding ) * 2 ),
					"border": border,
					"margin": margin,
					"float": _float,
					"link": link,
					"imageAlt": imageAlt
				};

				Debug.log(options);

		    	var url = '?app=core&module=system&controller=editor&do=image&' + $.param( options );
				var dialogRef = ips.ui.dialog.create({
					title: ips.getString( 'editorImageButton' ),
					fixed: false,
					size: 'narrow',
				    url: url,
				    destructOnClose: true
				});
				dialogRef.show();
		    }
		});
		editor.on( 'doubleclick', function( evt ) {
			var element = CKEDITOR.plugins.ipslink.getSelectedLink( editor ) || evt.data.element;
			if ( !element.isReadOnly() && element.is('img') ) {
				editor.getSelection().selectElement( element );
				editor.execCommand( 'ipsImage' );
			}
		});
		if ( editor.contextMenu ) {
		    editor.addMenuGroup( 'ipsImage' );
		    editor.addMenuItem( 'editIpsImage', {
		        label: ips.getString('editorImageButtonEdit'),
		        icon: this.path + 'icons' + ( CKEDITOR.env.hidpi ? '/hidpi' : '' ) + '/ipsimage.png',
		        command: 'ipsImage',
		        group: 'ipsImage'
		    });
		    
		    editor.contextMenu.addListener( function( element ) {
		        if ( element.getAscendant( 'img', true ) ) {
		            return {
			            editIpsImage: CKEDITOR.TRISTATE_OFF
					};
		        }
		    });
		}
	}
});