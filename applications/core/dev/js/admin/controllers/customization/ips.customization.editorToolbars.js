/* global ips, _, Debug, CKEDITOR */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.customization.editorToolbars.js - Controller for editor toolbar configuration screen
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.customization.editorToolbars', {

		initialize: function () {
			this.on( 'click', '[data-buttonKey]', this.openPreferences );
			this.on( 'click', '[data-action="addToolbar"]', this.addToolbar );
			this.on( 'click', '[data-action="addSep"]', this.addSep );

			this.on( document, 'editorWidgetInitialized', this.setUpEditor );
			this.setup();
		},

		/**
		 * Setup method
		 * When the document is ready, CKEditor is set up, and the dummy toolbars are made sortable
		 *
		 * @returns {void}
		 */
		setup: function () {
			// Set up ckeditor
			var self = this;

			//$( document ).ready( function () {

				/*var init = function () {
					self._setUpCKEditor();
				};

				if( ips.getSetting('useCompiledFiles') !== true ){
					ips.loader.get( ['core/dev/ckeditor/ckeditor.js'] ).then( init );	
				} else {
					ips.loader.get( ['core/interface/ckeditor/ckeditor.js'] ).then( init );
				}*/

				// Make the toolbars sortable
				self.scope.find('[data-role="dummyToolbar"]').sortable({
					connectWith: '[data-role="dummyToolbar"]',
					update: _.bind( self._saveToolbars, self ),
					appendTo: document.body
				});
			//});			
		},

		setUpEditor: function () {
			this._setUpCKEditor();
		},

		/**
		 * Redirects to page that allows button permissions to be edited
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		openPreferences: function (e) {
			var elem = $( e.currentTarget );
			var title = elem.attr('title');
			
			window.location = this.scope.attr('data-url') + '&do=permissions&button=' + elem.attr('data-buttonKey') + '&title=' + title;
		},

		/**
		 * Event handler for clicking the Add Toolbar button
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		addToolbar: function (e) {
			e.preventDefault();
			var elem = $( e.currentTarget );

			var list = $('<ul class="dummy_toolbar clearfix" data-role="dummyToolbar" style="min-height:40px" />');
			list.sortable({
				connectWith: '[data-role="dummyToolbar"]',
				update: _.bind( this._saveToolbars, this ),
				appendTo: document.body
			});

			this.scope.find('[data-role="dummyToolbar"]').sortable( 'option', 'connectWith', list );
			this.scope.find('#' + elem.attr('data-deviceKey') + '_editor_toolbars').append( list );
		},

		/**
		 * Event handler for clicking the Add Separator button
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		addSep: function (e) {
			e.preventDefault();
			var elem = $( e.currentTarget );
			
			var list = $('#' + elem.attr('data-deviceKey') + '_editor_toolbars')
				.children()
				.last();
			list.append( $('<li><span class="cke_toolbar_separator"></span></li>') );
			list.sortable({
				connectWith: '[data-role="dummyToolbar"]',
				update: _.bind( this._saveToolbars, this ),
				appendTo: document.body
			});
		},

		/**
		 * Sets up CKEditor by cloning each button and inserting it into the dummy toolbars
		 *
		 * @returns {void}
		 */
		_setUpCKEditor: function () {
			var self = this;
			var instance = null;

			for( var i in CKEDITOR.instances ){
				instance = CKEDITOR.instances[ i ];
			}

			//instance.on( 'instanceReady', function(){
				var items = CKEDITOR.ui( instance ).items;

				// Loop through all toolbar items in ckeditor
				// If it's a button or combo, we then clone the button onto dummy toolbars
				for( var i in items ){
					var elem = null;

					switch ( items[i].type ) {
						case 'button':
						case 'panelbutton':
							if( !$( '.' + instance.id ).find('.cke_button__' + items[i].name).length ){
								var button = new CKEDITOR.ui.button( items[i] );
								var output = [];
								button.render( instance, output );
								elem = $( output.join('') );
							} else {
								elem = $( '.' + instance.id ).find('.cke_button__' + items[i].name);
							}
							break;
						case 'richcombo':
							elem = $( '.' + instance.id ).find('.cke_combo__' + items[i].name );
							break;
						case 'separator':
							break;
					}

					if ( elem !== null ) {
						self.scope.find('[data-role="dummyEditor"]').each( function () {
							var deviceKey = $( this ).attr('data-deviceKey');
							// Clone the element
							var elemClone = elem.clone().attr( 'data-buttonKey', i );
							// Remove onclick from clone and children to prevent ckeditor from taking over
							elemClone.removeAttr('onclick').children().removeAttr('onclick');

							// If the button wrap already exists, clone the button into it, 
							// otherwise, create a new wrapper
							// and append it to the 'unused' toolbar
							if( self.scope.find('#' + deviceKey + '_editorButton_' + i ).length ){
								self.scope.find('#' + deviceKey + '_editorButton_' + i ).append( elemClone );
							} else {
								self.scope.find('#' + deviceKey + '_editor_unusedButtons').append(
									$('<li/>').attr('id', deviceKey + '_editorButton_' + i ).append( elemClone )
								);
							}
						});
					}
				}
			//});
		},

		/**
		 * Save the toolbar arrangement
		 *
		 * @returns {void}
		 */
		_saveToolbars: function () {
			var _save = {
				desktop: [],
				tablet: [],
				phone: []
			};

			this.scope.find('[data-role="devicePanel"]').each( function () {
				var deviceKey = $( this ).attr('data-deviceKey');
				var save = [];
				var i = 1;
				
				$( this ).find('[data-role="dummyToolbar"]').each( function () {
					var _id = 'row_' + i;
					i++;

					if( !$( this ).hasClass( 'editor_unusedButtons' ) ) {
						var toolbar = [];
						$( this ).children().each( function () {
							var buttonKey = null;

							if( $( this ).attr('id') ) {
								buttonKey = $( this ).attr('id').substr( 14 + deviceKey.length );
							} else {
								buttonKey = '-';
							}
							toolbar.push( buttonKey );
						});

						save.push( toolbar );
					}
				});

				_save[ deviceKey ] = save;
			});
			
			ips.getAjax()( this.scope.attr('data-url') + '&do=save', {
				type: 'post',
				data: {
					toolbars: JSON.stringify( _save ),
				}
			});
		}
	});
}(jQuery, _));