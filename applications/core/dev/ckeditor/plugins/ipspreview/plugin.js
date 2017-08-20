CKEDITOR.plugins.add( 'ipspreview', {
    icons: 'ipspreview',
    hidpi: true,
    init: function( editor ) {
    	editor.addCommand( 'ipsPreview', {
		    exec: function( editor ) {
				$( editor.element.$ ).closest('[data-ipsEditor]').trigger('togglePreview');
		    }
		});
		editor.ui.addButton( 'ipsPreview', {
		    label: ips.getString( 'editorPreview' ),
		    command: 'ipsPreview',
		    toolbar: 'insert'
		});
    }
});