/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.templates.fileEditor.js - Templates: controller for the tabbed file editor
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.templates.fileEditor', {

		_tabBar: null,
		_tabContent: null,
		_fileStore: {},
		_ajaxURL: '',
		_cmInstances: {},
		_currentHeight: 0,
		_editorPreferences: {
			wrap: true,
			lines: false
		},

		initialize: function () {
			// Events from elsewhere
			this.on( document, 'openFile.templates', this.openFile );
			this.on( document, 'variablesUpdated.templates', this.updateVariables );

			// Events from within
			this.on( 'tabChanged', this.changedTab );
			this.on( 'click', '[data-action="closeTab"]', this.closeTab );
			this.on( 'click', '[data-action="save"]', this.save );
			this.on( 'click', '[data-action="revert"]:not( .ipsButton_disabled )', this.revert );
			this.on( 'savedFile.templates', this.updateFile );
			this.on( 'revertedFile.templates', this.updateFile );
			this.on( 'openDialog', this.openedDialog );
			this.on( 'menuItemSelected', this.menuSelected );

			var debounce = _.debounce( _.bind( this._recalculatePanelWrapper, this ), 100 );
			this.on( window, 'resize', debounce );

			// Other setup
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;

			// Set element references
			this._tabBar = this.scope.find('#elTemplateEditor_tabbar');
			this._tabContent = this.scope.find('#elTemplateEditor_panels');

			// Get the current height of the tab bar
			this._currentHeight = this._tabBar.outerHeight();

			// Set URLs
			this._ajaxURL = this.scope.closest('[data-ajaxURL]').attr('data-ajaxURL');
			this._normalURL = this.scope.closest('[data-normalURL]').attr('data-normalURL');

			// Get the template editor preferences
			this._editorPreferences['wrap'] = ips.utils.db.get('templateEditor', 'wrap');
			this._editorPreferences['lines'] = ips.utils.db.get('templateEditor', 'lines');

			if( this._editorPreferences['wrap'] ){
				$('#elTemplateEditor_preferences_menu').find('[data-ipsMenuValue="wrap"]').addClass('ipsMenu_itemChecked');
			}

			if( this._editorPreferences['lines'] ){
				$('#elTemplateEditor_preferences_menu').find('[data-ipsMenuValue="lines"]').addClass('ipsMenu_itemChecked');
			}			

			// Initialize the initial content
			this._tabContent.find('[data-group]').each( function (i, item) {
				// We need to turn the variables/attributes text input into a hidden field
				// We can't simply change the type because IE8 throws a hissy fit, so we'll make a copy
				// then remove the original
				var original = self._tabContent.find('[data-fileid="' + $( item ).attr('data-fileid') + 
														'"] input[data-role="variables"]');

				if( original.length ){
					original.after( 
						$('<input/>')
							.attr( 'type', 'hidden' )
							.attr( 'name', original.attr('name') )
							.attr( 'value', original.attr('value') )
							.attr( 'data-role', 'variables' )
					)
					
					original.remove();
				}

				ips.loader.get( ['core/interface/codemirror/diff_match_patch.js','core/interface/codemirror/codemirror.js'] ).then( function () {
					self._initCodeMirror( $( item ).attr('data-fileid'), $( item ).attr('data-type') );
				});
			});
		},

		/**
		 * Event handler for the editor preference menu
		 *
		 * @param	{event} 	e		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		menuSelected: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			if( data.triggerID == 'elTemplateEditor_preferences' ){
				if( data.selectedItemID == 'wrap' ){
					this._changeEditorPreference( !ips.utils.db.get('templateEditor', 'wrap'), 'wrap', 'lineWrapping' );
				} else {
					this._changeEditorPreference( !ips.utils.db.get('templateEditor', 'lines'), 'lines', 'lineNumbers' );
				}
			}
		},

		/**
		 * Method that updates an editor preference
		 *
		 * @param	{object} 	data	Event data object from this.menuSelected
		 * @returns {void}
		 */
		_changeEditorPreference: function (toValue, type, cmName) {
			// Set the menu appropriately
			if( toValue ){
				$('#elTemplateEditor_preferences_menu')
					.find('[data-ipsMenuValue="' + type + '"]').addClass('ipsMenu_itemChecked');
			} else {
				$('#elTemplateEditor_preferences_menu')
					.find('[data-ipsMenuValue="' + type + '"]').removeClass('ipsMenu_itemChecked');
			}

			// Update controller variable
			this._editorPreferences[ type ] = toValue;

			// Update local DB
			ips.utils.db.set( 'templateEditor', type, toValue );

			// Update all CM instances
			for( var i in this._cmInstances ){
				this._cmInstances[ i ].setOption( cmName, toValue );
			}
		},

		/**
		 * A dialog has been opened
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		openedDialog: function (e, data) {
			if( data.elemID == 'elTemplateEditor_variables' || data.elemID == 'elTemplateEditor_attributes' ){
				this._insertVariablesIntoDialog( data );
			}
		},

		/**
		 * Inserts the current variables value into the dialog
		 *
		 * @param	{object} 	data 	Event data object from the dialog
		 * @returns {void}
		 */
		_insertVariablesIntoDialog: function (data) {
			// First get the variables
			var active = this._getActiveTab();

			if( !active.tabPanel ){
				return;
			}

			var variablesValue   = $.trim( active.tabPanel.find('[data-role="variables"]').val() );
			var descriptionValue = $.trim( active.tabPanel.find('[data-role="description"]').val() );
			var titleValue       = $.trim( active.tabPanel.find('[data-role="title"]').val() );
			var groupValue       = $.trim( active.tabPanel.find('[data-role="group"]').val() );

			data.dialog
				.find('[data-role="variables"]')
					.val( variablesValue )
				.end()
				.find('[data-role="description"]')
					.val( descriptionValue )
				.end()
				.find('[name="_variables_fileid"]')
					.val( active.tabPanel.attr('data-fileid') )
				.end()
				.find('[name="_variables_location"]')
					.val( active.tabPanel.attr('data-location') )
				.end()
				.find('[data-role="title"]')
					.val( titleValue );
			
			/* Show the correct select box */
			data.dialog.find('select[data-container-type]').addClass('ipsHide');
			data.dialog.find('select[data-container-type=' + active.tabPanel.attr('data-location') + ']').removeClass('ipsHide');
			data.dialog.find('select[data-container-type=' + active.tabPanel.attr('data-location') + ']').val( groupValue );

            /* Reset */
            data.dialog.find('#elTemplateEditor_container_title').show();
            data.dialog.find('[data-role="container"]').show();
            data.dialog.find('[data-role="variables"]').show();
            data.dialog.find('#elTemplateEditor_attributes_title').show();

			if ( active.tabPanel.attr('data-type') != 'template' )
			{
				data.dialog.find('#elTemplateEditor_group_title').hide();
				
				data.dialog.find('[data-role="variables"]').hide();
				data.dialog.find('#elTemplateEditor_attributes_title').hide();
			}
			else if ( active.tabPanel.attr('data-location') == 'block')
			{
				data.dialog.find('#elTemplateEditor_group_title').hide();
				data.dialog.find('[data-role="group"]').hide();
			}
			else if ( active.tabPanel.attr('data-location') == 'database' )
			{
				/* Can't move */
				data.dialog.find('#elTemplateEditor_group_title').hide(); 
				data.dialog.find('[data-role="group"]').hide();
				
				/* Can't rename */
				data.dialog.find('#elTemplateEditor_title_title').hide(); 
				data.dialog.find('[data-role="title"]').hide();
			}
			else if ( active.tabPanel.attr('data-location') == 'page' )
			{
				/* Hide params */
				data.dialog.find('[data-role="variables"]').show();
				data.dialog.find('#elTemplateEditor_attributes_title').show();
				data.dialog.find('select[data-container-type=' + active.tabPanel.attr('data-location') + ']').show();
			}
		},

		/**
		 * Updates the value of the variables field in the tab with the given file ID
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{event} 	e 		Event data object from templates.variablesDialog
		 * @returns {void}
		 */
		updateVariables: function (e, data) {
			// Find the panel with the correct fileID, and update it's variables value

			this._tabContent
				.find('[data-fileid="' + data.fileID + '"]')
					.find('[data-role="variables"]')
						.val( data.value )
					.end()
					.find('[data-role="title"]')
						.val( data.title )
					.end()
					.find('[data-role="description"]')
						.val( data.description )
					.end()
					.find('[data-role="group"]')
						.val( data.group );
						
			this._updateTabLabel( data.fileID, data.title );
		},

		/**
		 * Saves the contents of the editor
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		save: function (e) {
			e.preventDefault();
			var self = this;
			var active = this._getActiveTab();
			var panel = active.tabPanel;
			var key = panel.attr('data-fileid');

			if( !active.tab || !active.tabPanel ){
				Debug.warn('No active tab or tab panel');
				return;
			}

			var save = this._getParametersFromPanel( panel );

			// We call .save() on the CodeMirror instance, which will cause it to update the
			// contents of the original textbox
			this._cmInstances[ key ].save();

			// Add it to the save object
			save[ 'editor_' + key ] = this.scope.find( '#editor_' + key ).val();
			
			// Name
			_.extend( save, {
				't_name': panel.find('[data-role="title"]').val()
			});
				
			// Description
			_.extend( save, {
				't_description': panel.find('[data-role="description"]').val()
			});
			
			// Group
			_.extend( save, {
				't_group': panel.find('input[data-role="group"]').val()
			});

			// If this is a template, add its variables
			if( panel.attr('data-location') == 'block' || panel.attr('data-location') == 'database' || panel.attr('data-location') == 'page' ){
				_.extend( save, {
					't_variables': panel.find('[data-role="variables"]').val()
				});
			}

			// Show loading
			this.trigger( 'savingFile.templates' );

			// Send it
			ips.getAjax()( this._normalURL + '&do=save', {
				dataType: 'json',
				data: save,
				type: 'post'
			})
				.done( function (response) {
					if ( response.msg )
					{
						ips.ui.alert.show( {
							type: 'alert',
							message: response.msg,
							icon: 'warn'
						});
					}
					else
					{
						// Let everyone know
						self.trigger( 'savedFile.templates', {
							key: key,
							oldID: parseInt( panel.attr('data-itemID') ),
							newID: parseInt( response.template_id ),
							newTitle: response.template_title,
							oldContainer: parseInt( panel.attr('data-container') ),
							newContainer: parseInt( response.template_container ),
							status: ( response.template_user_added == 1 ) ? 'custom' : 'changed'
						});
	
						// Remove the unsaved status from the tab
						self._setChanged( false, key );
	
						// Update the toolbar
						self._updateToolbar( active.tab );
						
						// Update the tab name
						self._updateTabLabel( key, response.template_title );
					}
				})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						message: ips.getString('saveThemeError'),
						icon: 'warn'
					});
				})
				.always( function () {
					self.trigger( 'saveFileFinished.templates' );
				});
		},

		/**
		 * Reverts or deletes a file
		 * If the bypass parameter is false, this method will confirm the action with the user first
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{boolean} 	bypass	Bypass the user confirmation?
		 * @returns {void}
		 */
		revert: function (e, bypass) {
			e.preventDefault();
			var self = this;
			var active = this._getActiveTab();
			var panel = active.tabPanel;
			var key = panel.attr('data-fileid');

			var message = ( $( e.currentTarget ).attr('data-actionType') == 'revert' ) ? 
					ips.getString('skin_revert_confirm') : ips.getString('skin_delete_confirm');

			if( bypass !== true ){
				ips.ui.alert.show({
					type: 'confirm',
					message: message,
					icon: 'warn',
					callbacks: {
						ok: function () {
							self.revert( e, true );
						}
					}
				});

				return;
			}

			var save = this._getParametersFromPanel( panel );

			// Send it
			ips.getAjax()( this._normalURL + '&do=delete&wasConfirmed=1', {
				dataType: 'json',
				data: save,
				type: 'post'
			})
				.done( function (response) {
					if( response.template_id ){
						self._revertedFile( response, key, active );
					} else {
						self._deletedFile( key, active );
					}
				});
		},

		/**
		 * Handles updating the editor when a file is reverted
		 *
		 * @param 	{object} 	response 	JSON response object from ajax request
		 * @param	{string} 	key 	 	Key of the file that's been reverted
		 * @param 	{object} 	active 		Object containing keys 'tab' and 'tabPanel' referencing active items
		 * @returns {void}
		 */
		_revertedFile: function (response, key, active) {
			// Let the document know
			this.trigger( 'revertedFile.templates', {
				key: key,
				oldID: parseInt( active.tabPanel.attr('data-itemID') ),
				newID: parseInt( response.template_id ),
				status: response.InheritedValue
			});

			// Update the raw textarea
			$( '#editor_' + key ).val( response.template_content );

			// Update codemirror
			this._cmInstances[ key ].setValue( response.template_content );

			// Remove the unsaved status from the tab
			this._setChanged( false, key );

			// Update the toolbar
			this._updateToolbar( active.tab );
		},

		/**
		 * Handles updating the editor when a file is deleted
		 *
		 * @param	{string} 	key 	 	Key of the file that's been reverted
		 * @param 	{object} 	active 		Object containing keys 'tab' and 'tabPanel' referencing active items
		 * @returns {void}
		 */
		_deletedFile: function (key, active) {
			this.trigger( 'deletedFile.templates', {
				key: key,
				fileID: active.tabPanel.attr('data-itemID'),
				location: active.tabPanel.attr('data-location'),
				type: active.tabPanel.attr('data-type')
			});

			// Find close link in the tab
			active.tab.find('[data-action="closeTab"]').click();
		},

		/**
		 * Returns an object of parameters used by the ajax requests
		 *
		 * @param	{element} 	panel 	The panel being used as the source
		 * @returns {object}
		 */
		_getParametersFromPanel: function (panel) {
			return {
				t_type: panel.attr('data-type'),
				t_location: panel.attr('data-location'),
				t_item_id: panel.attr('data-itemID'),
				t_container: panel.find('input[data-role=container]').val(),
				t_group: panel.attr('data-group'),
				t_name: panel.attr('data-name'),
				t_key: panel.attr('data-fileid')
			};
		},

		/**
		 * A file has been saved or reverted
		 * Updates the ID of any element with the old ID, and changes the state
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		updateFile: function (e, data) {
			this.scope
				.find('[data-itemID="' + data.oldID + '"]')
					.attr( 'data-itemID', data.newID )
					.attr( 'data-container', data.newContainer )
					.attr( 'data-inherited-value', data.status );
		},

		/**
		 * Event handler for clicking a close tab button
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		closeTab: function (e) {
			var tab = $( e.currentTarget ).closest('.ipsTabs_item');
			this._doCloseTab( tab );
		},

		/**
		 * Handles closing a tab.
		 * We first check if the tab is in an 'unsaved' state, and if so, prompt the user to confirm losing changes.
		 * We then destroy the codemirror instance, remove the tab and panel, and switch to another open tab.
		 *
		 * @param	{element} 	tab 	The tab to be closed
		 * @param	{boolean} 	bypass 	Whether to bypass the unsaved check
		 * @returns {void}
		 */
		_doCloseTab: function (tab, bypass) {
			var self = this;
			var tabParent = tab.closest('[data-fileid]');
			var key = tabParent.attr('data-fileid');
			var allTabs = this._tabBar.find('.ipsTabs_item').closest('[data-fileid]');
			var newTab = null;

			// Check if there's unsaved content
			if( tabParent.attr('data-state') == 'unsaved' && bypass != true ){
				ips.ui.alert.show({
					type: 'confirm',
					message: ips.getString('themeUnsavedContent'),
					icon: 'warn',
					callbacks: {
						ok: function () {
							self._doCloseTab( tab, true );
						}
					}
				});

				return;
			} 

			// Is this tab active?
			var active = tab.hasClass('ipsTabs_activeItem');

			// Let the document know what we're up to
			this.trigger( 'closedTab.templates', {
				fileID: key
			});

			// Remove the codemirrrrr element & instance
			$( this._cmInstances[ key ].getWrapperElement() ).remove();
			delete( this._cmInstances[ key ] );

			// Find the next or prev tab, if this tab is active, and switch to it
			if( active && allTabs.length > 1 ){
				if( allTabs.first().attr('data-fileid') == tabParent.attr('data-fileid') ){
					newTab = tabParent.next();
				} else {
					newTab = tabParent.prev();
				}
			}

			if( newTab ){
				newTab.find('> a').click();
			}

			// Close the tab
			ips.utils.anim.go('fadeOutDown fast', tabParent)
				.done( function () {
					tabParent.remove();
					self._recalculatePanelWrapper();
				});

			// Remove the panel
			this._tabContent.find('[data-fileid="' + key + '"]').remove();
		},

		/**
		 * Tab widget has indicated that the user has changed tab
		 * If there's a file ID, trigger a new event with it, to enable the file listing to highlight it
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data 	Event data object
		 * @returns {void}
		 */
		changedTab: function (e, data) {
			var tab = data.tab;

			if( !_.isUndefined( tab.closest('[data-fileid]').attr('data-fileid') ) ){
				this.trigger( 'fileSelected.templates', {
					fileID: tab.closest('[data-fileid]').attr('data-fileid')
				});
			}

			this._updateToolbar( tab );
		},

		/**
		 * Updates the toolbar buttons
		 *
		 * @param	{element} 	tab 	The current tab
		 * @returns {void}
		 */
		_updateToolbar: function (tab) {
			var tabParent = tab.closest('[data-fileid]').attr('data-fileid');
			var tabPanel = this._tabContent.find('[data-fileid="' + tabParent + '"]');
			var status = tabPanel.attr('data-inherited-value');
			var type   = tabPanel.attr('data-type');
			var revert = this.scope.find('[data-action="revert"]');

			switch( status ){
				case 'original':
				case 'inherit':
					revert
						.addClass('ipsButton_disabled')
				break;
				case 'custom':
					revert
						.html( ips.getString('skin_delete') )
						.removeClass('ipsButton_disabled')
						.attr('data-actionType', 'delete')
						.show();
				break;
				case 'changed':
					revert
						.html( ips.getString('skin_revert') )
						.removeClass('ipsButton_disabled')
						.attr('data-actionType', 'revert')
						.show();
				break;
			}

			$('#elTemplateEditor_variables').show();
			$('#elTemplateEditor_attributes').hide();
		},

		/**
		 * Reponds to the openFile event, to open a file
		 * Either switch to it if already open, or hand off to _buildTab to load it
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data 	Event data object
		 * @returns {void}
		 */
		openFile: function (e, data) {
			// Is this file already open?
			if( !this._tabBar.find('[data-fileid="' + data.meta.key + '"]').length ){
				this._buildTab( data.meta );
			} else {
				this._tabBar.find('[data-fileid="' + data.meta.key + '"] > a').click();
			}
		},

		/**
		 * Builds a tab for the file with the given metadata
		 *
		 * @param	{object} 	meta 	Object of file metadata
		 * @returns {void}
		 */
		_buildTab: function (meta) {
			var self = this;
			this._tabContent.attr('data-haseditor', 'true');
			this.scope.find('#elTemplateEditor_panels_empty').hide();

			// Build the actual tab
			this._tabBar.append( ips.templates.render('templates.editor.newTab', {
				title: meta.title,
				fileid: meta.key,
				location: meta.location,
                group: meta.group,
				container: meta.container,
				id: 'tab_' + meta.key
			}));

			// Build the content container
			this._tabContent.append( ips.templates.render('templates.editor.tabPanel', {
				fileid: meta.key,
				name: meta.name,
				type: meta.type,
				location: meta.location,
				container: meta.container,
				group: meta.group,
				id: meta.id,
				inherited: meta.inherited
			}));

			// We may need to rejig the tab pane wrap to account for wrapped tabs,
			// so do that now both tab and panel have been added
			this._recalculatePanelWrapper();

			// Toggle the new tab
			this._tabBar.find('[data-fileid="' + meta.key + '"] > a').click();

			// Manually set the content area to loading since we aren't using ui.tabbar's load methods
			this._tabContent.addClass('ipsLoading ipsTabs_loadingContent');

			// Load the content
			ips.getAjax()( this._ajaxURL + '&do=loadTemplate&show=json', {
				dataType: 'json',
				data: { 
					't_container': meta.container,
					't_group':     meta.group,
					't_name':      meta.name,
					't_key':       meta.key,
					't_location':  meta.location,
					't_type':	   meta.type
				}
			})
				.done( function (response) {
					self._postProcessNewTab( response, meta );
				})
				.always( function () {
					self._tabContent.removeClass('ipsLoading ipsTabs_loadingContent');
				});
		},
		
		/**
		 * Update the tab label
		 *
		 * @param	{string}	key		File key (block__foo)
		 * @param	{string}	title	Label Title (Foo)
		 * @return	{void}
		 */
		_updateTabLabel: function( key, title )
		{
			var span = this._tabBar.find('[data-fileid="' + key + '"] > a span').clone();
			
			this._tabBar.find('[data-fileid="' + key + '"] > a').html( title ).append( span );
		},
		
		/**
		 * Once tab content has been returned by ajax, this method builds the content of a tab,
		 * and initializes codemirrior for syntax highlighting
		 *
		 * @param	{object} 	response  	Response JSON object from ajax request
		 * @param 	{object} 	meta 		Object of meta data for the tab being created
		 * @returns {void}
		 */
		_postProcessNewTab: function (response, meta) {
			var content = ips.templates.render('templates.editor.tabContent', {
				fileid: meta.key,
				content: response.template_content,
				variables: response.template_params,
				description: response.template_desc,
				title: response.template_title,
				container: response.template_container,
                group: response.template_group
			});

			this._tabContent.find('[data-fileid="' + meta.key + '"]').html( content );
			this._initCodeMirror( meta.key, meta.type );
		},

		/**
		 * Initializes CodeMirror on a textarea with the provided key
		 *
		 * @param 	{string}	key 	Key of the textarea to be turned into codemirrior
		 * @returns {void}
		 */
		_initCodeMirror: function (key, type) {
			var self = this;

			this._cmInstances[ key ] = CodeMirror.fromTextArea( document.getElementById('editor_' + key ), { 
				mode: (type == 'template' ? 'htmlmixed' : 'css'),
				lineWrapping: this._editorPreferences['wrap'],
				lineNumbers: this._editorPreferences['lines']
			} );
			this._cmInstances[ key ].setSize( null, this._getTabContentHeight() );

			this._cmInstances[ key ].on( 'change', function (doc, cm) {
				self._setChanged( true, key );
			});
		},

		/**
		 * Sets a tab to 'unsaved' state
		 *
		 * @returns {void}
		 */
		_setChanged: function (state, key) {

			if( state == true ){
				// Update 'x' in tab to an unsaved version, then set state on the tab
				this._tabBar
					.find('[data-fileid="' + key + '"]')
						.attr('data-state', 'unsaved')
						.find('[data-action="closeTab"]')
							.html( ips.templates.render('templates.editor.unsaved') );
			} else {
				this._tabBar
					.find('[data-fileid="' + key + '"]')
						.attr('data-state', 'saved')
						.find('[data-action="closeTab"]')
							.html( ips.templates.render('templates.editor.saved') );
			}
		},

		/**
		 * Calculates whether the tab bar has wrapped, and if so, resizes the panel wrapper and updates
		 * CodeMirror instances with the new height
		 *
		 * @returns {void}
		 */
		_recalculatePanelWrapper: function () {
			// Get height of the tab bar
			var tabHeight = this._tabBar.outerHeight();

			// Set the top value of the panel
			this._tabContent.css( { top: tabHeight + 'px' } );

			// Get the height of it
			var contentHeight = this._getTabContentHeight();

			// Find all codemirror instances and resize those
			this._tabContent.find('.CodeMirror').css( { height: contentHeight + 'px' } );

			this._currentHeight = tabHeight;
		},

		/**
		 * Returns references to both the active tab and the active tab panel
		 *
		 * @returns {object} 	Contains keys 'tab' and 'tabPanel', which are jQuery objects
		 */
		_getActiveTab: function () {
			var toReturn = {
				tab: null,
				tabPanel: null
			};

			var tab = this._tabBar.find('.ipsTabs_item.ipsTabs_activeItem').first().parent();

			if( !tab.length ){
				return toReturn;
			}

			// Get the associated panel
			toReturn = {
				tab: tab,
				tabPanel: this._tabContent.find('[data-fileid="' + tab.attr('data-fileid') + '"]')
			};

			return toReturn;
		},

		/**
		 * Returns the current height of the tab panel wrapper
		 *
		 * @returns {number}
		 */
		_getTabContentHeight: function () {
			var tabContentTop = this._tabContent.offset().top;
			var windowHeight = $( window ).height();
			var infoHeight = this.scope.find('#elTemplateEditor_info').outerHeight();

			this._panelHeight = windowHeight - tabContentTop - infoHeight - 31;
			return this._panelHeight;
		}
	});
}(jQuery, _));