CKEDITOR.plugins.add( 'ipssource', {
	init: function( editor ) {
		editor.on( 'instanceReady', function( ev ) {
			// Output self-closing tags the HTML4 way, like <br>.
			this.dataProcessor.writer.selfClosingEnd = '>';

			// Use line breaks for block elements, tables, and lists.
			var dtd = CKEDITOR.dtd;
			for ( var e in CKEDITOR.tools.extend( {}, dtd.$nonBodyContent, dtd.$block, dtd.$listItem, dtd.$tableContent ) ) {
				this.dataProcessor.writer.setRules( e, {
					indent: true,
					breakBeforeOpen: true,
					breakAfterOpen: true,
					breakBeforeClose: true,
					breakAfterClose: true
				});
			}
		});

		// We do this to ensure switching to source mode and back to wysiwyg mode doesn't make the editor taller than the page.
		// The ipsautogrow plugin handles responding to the event
		editor.on( 'mode', function( ev ) {
			$( window ).trigger('resize');
		});
	}
});