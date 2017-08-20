CKEDITOR.plugins.add( 'ipsemoticon', {
    icons: 'ipsemoticon',
    hidpi: true,
    init: function( editor ) {
    	var menu;
    	editor.addCommand( 'ipsEmoticon', {
    		allowedContent: '',
		    exec: function( editor ) {
		    	
		    	var button = $( '.' + editor.id ).find( '.cke_button__ipsemoticon' );
		    
		    	if( !$( '#' + button.attr('id') + '_menu' ).length ){
									
					$('body').append( ips.templates.render( 'core.editor.emoticons', {
						id: button.attr('id'),
						editor: editor.name
					}) );
						
					$( document ).trigger('contentChange', [ $('#' + button.attr('id') + '_menu') ] );
					
					button.ipsMenu({
			    		alignCenter: true,
			    		closeOnClick: false
		    		});
		    	}
		    }
		});
		editor.ui.addButton( 'ipsEmoticon', {
		    label: ips.getString('editorEmoticonButton'),
		    command: 'ipsEmoticon',
		    toolbar: 'insert'
		});		
    }
});