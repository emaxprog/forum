/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.codeHook.js - Handles editing code hooks
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.codeHook', {
		
		codeMirror: null,
		
		initialize: function () {
			this.on( 'click', '[data-codeToInject]', this._itemClick );
		},
		
		/**
		 * Event handler for clicking on an item
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_itemClick: function (e) {
			var codeMirror = $( this.scope ).find('textarea').data('CodeMirrorInstance');
						
			var regex = new RegExp( $.parseJSON( $(e.currentTarget).attr('data-signature') ) );
			
			var found = false;
			var lastLine = codeMirror.doc.lineCount() - 1;
			codeMirror.doc.eachLine(function(line){
				if ( line.text.match( regex ) ) {
					found = true;
					codeMirror.setSelection( { line: codeMirror.doc.getLineNumber( line ), ch: 0 }, { line: codeMirror.doc.getLineNumber( line ), ch: line.text.length } );
					codeMirror.scrollIntoView( { line: codeMirror.doc.getLineNumber( line ), ch: 0 } );
				}
				if ( line.text.match( /^\s*}\s*$/ ) ) {
					lastLine = codeMirror.doc.getLineNumber( line );
				}
			});
			
			if ( !found ) {
				codeMirror.doc.replaceRange( $.parseJSON( $(e.currentTarget).attr('data-codeToInject') ), { line: lastLine - 1, chr: 0 }, { line: lastLine - 1, chr: 0 } );
				codeMirror.scrollIntoView( { line: codeMirror.doc.lineCount(), ch: 0 } );
			}
		}
	});
}(jQuery, _));
