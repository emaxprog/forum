CKEDITOR.plugins.add( 'ipsautogrow', {
    init: function( editor ) {
		editor.on( 'instanceReady', function( e ) {
			var contentDiv = $('#cke_' + editor.name ).find('> div').first();
			var contentParent = $( contentDiv.parentNode );
			var computedHeight;
			
			// Stuff to handle resizing
			// We use debounce here for more efficient calculation
			var device = ips.utils.responsive.getCurrentKey();
			var debounce = _.debounce( debouncedResize, 200 );

			debouncedResize();

			$( window ).on( 'resize', debounce );

			function debouncedResize () {
				var device = ips.utils.responsive.getCurrentKey();

				if( device === 'desktop' ){
					contentDiv.find('.cke_wysiwyg_div').css({
						maxHeight: ( $( window ).height() - 200 ) + 'px'
					});
				}
			};

			//--------
			editor.on( 'beforeModeUnload', function( evt ) { 
				if ( evt.editor.mode == 'wysiwyg' ){
					computedHeight = contentDiv.height();
				}
			});

			editor.on( 'mode', function( evt ) {                           
				if ( evt.editor.mode == 'source' ) { 
					var textarea = $('#cke_' + editor.name ).find('textarea.cke_source');

					Debug.log( textarea );
					
					textarea.css({
						height: computedHeight + 'px'
					});

					if( document.all && !parseInt( textarea.width() ) ){
						textarea.css({
							width: '100%'
						});
					}
				}
			});

			editor.on( 'beforeCommandExec', function( evt ) { 
				if( evt.data.name == 'maximize' && evt.editor.mode == 'source' ) {
					var textarea = $('#cke_' + editor.name ).find('textarea.cke_source');

					textarea.css({
						height: computedHeight + 'px'
					});
				} else if ( evt.data.name == 'maximize' && evt.editor.mode == 'wysiwyg' ) {
					computedHeight = contentDiv.height();
				}
			});			
		});
	}
});