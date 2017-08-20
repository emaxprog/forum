(function() {
	CKEDITOR.plugins.add( 'ipspage', {
		icons: 'ipspage',
		init: function( editor ) {
			editor.addCommand( 'ipspage', ips.utils.defaultEditorPlugins.block( 'ipspage', 'div', {"data-role":"contentPage"}, "", true, "<hr data-role='contentPageBreak'>" ) );
			editor.ui.addButton && editor.ui.addButton( 'ipspage', {
				label: ips.getString('editorbutton_ipspage'),
				command: 'ipspage',
				toolbar: ''
			});
		}
	});
})();