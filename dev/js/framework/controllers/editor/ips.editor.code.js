/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.link.js - Controller for code panel in editor
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.code', {
		
		languageMap: {
			'clike': 'c',
			'coffeescript': 'coffee',
			'css': 'css',
			'dart': 'dart',
			'erlang': 'erlang',
			'go': 'go',
			'haskell': 'hs',
			'htmlmixed': 'html',
			'javascript': 'javascript',
			'lua': 'lua',
			'mumps': 'mumps',
			'pascal': 'pascal',
			'r': 'r',
			'perl': 'perl',
			'php': 'php',
			'python': 'py',
			'ruby': 'ruby',
			'scala': 'scala',
			'shell': 'bash',
			'sql': 'sql',
			'swift': 'swift',
			'tcl': 'tcl',
			'vbscript': 'vb',
			'vhdl': 'vhdl',
			'xml': 'xml',
			'xquery': 'xq',
			'yaml': 'yaml',
		},
		
		instance: null,
		
		initialize: function () {
			this.setup();
			this.on( 'click', '.cEditorURLButtonInsert', this.formSubmit );
			this.on( 'change', '[data-role="codeModeSelect"]', this.changeMode );
		},
		
		setup:function(){
			var self = this;
			ips.loader.get( ['core/interface/codemirror/diff_match_patch.js','core/interface/codemirror/codemirror.js'] ).then( function () {
				
				var selectedMode = '';
				for ( var i in self.languageMap ) {
					if ( self.languageMap[i] == self.scope.find('[data-role="codeModeSelect"]').attr('data-codeLanguage') ) {
						selectedMode = i;
						break;
					}
				}
				self.scope.find('[data-role="codeModeSelect"]').empty();
				for ( var i in CodeMirror.modes ) {
					var languageName = ips.getString( 'editor_code_' + i );
					if ( !languageName ) {
						languageName = i.toUpperCase();
					}
					var option = $('<option/>').attr( 'name', i ).text( languageName );
					if ( selectedMode == i ) {
						option.attr('selected', 'selected');
					}
					self.scope.find('[data-role="codeModeSelect"]').append( option );
				}
				
				self.instance = CodeMirror.fromTextArea( document.getElementById( 'elCodeInput' + self.scope.attr('data-randomstring') ), {
					autofocus: true,
					mode: selectedMode,
					lineWrapping: true
				} );
				self.scope.find('[data-role="codeLoading"]').remove();
				self.scope.find('[data-role="codeContainer"]').removeClass('ipsLoading');
			});
		},

		/**
		 * Event handler for changing the mode
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeMode: function (e) {
			this.instance.setOption( 'mode', this.scope.find('[data-role="codeModeSelect"] option:selected').attr('name') );
		},
				
		/**
		 * Event handler for submitting the form
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		formSubmit: function (e) {
			e.preventDefault();
			$(e.target).prop('disabled', true);
			this.insertCode(e);
		},

		/**
		 * Event handler for 'insert' button
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		insertCode: function (e) {
			var value = this.instance.getValue();			
			var editor = CKEDITOR.instances[ $( this.scope ).data('editorid') ];
			
			if ( this.scope.find('[data-role="codeModeSelect"] option:selected').attr('name') == 'null' ) {
				var element = CKEDITOR.dom.element.createFromHtml( "<pre class='ipsCode'></pre>" );
			} else {
				var lang = '';
				for ( var i in this.languageMap ) {
					if ( i == this.scope.find('[data-role="codeModeSelect"] option:selected').attr('name') ) {
						lang = 'lang-' + this.languageMap[i];
						break;
					}
				}
				var element = CKEDITOR.dom.element.createFromHtml( "<pre class='ipsCode prettyprint " + lang + "'></pre>" );
			}
			element.setText( value );
							
			this.scope.find('textarea').val('');
			editor.insertElement( element );
			editor.widgets.initOn( element, 'ipscode' );

			this.trigger('closeDialog');

			// Trigger a content change on the element so that it gets highlighted immediately
			$( document ).trigger( 'contentChange', [ $( element.$ ) ] );
		}
	});
}(jQuery, _));