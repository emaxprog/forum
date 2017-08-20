CKEDITOR.plugins.add( 'ipsctrlenter', {
    init: function( editor ) {
	    editor.setKeystroke( CKEDITOR.CTRL + 13, 'ipsCtrlEnter' );
	    editor.addCommand( 'ipsCtrlEnter', {
		    exec: function( editor ) {
			    var primarySubmit = $( '.' + editor.id ).closest('form').find('[data-role="primarySubmit"]');
			    if ( primarySubmit.length ) {
				    primarySubmit.click();
			    } else {
				    $( '.' + editor.id ).closest('form').submit();
			    }
		    }
		});
	}
});