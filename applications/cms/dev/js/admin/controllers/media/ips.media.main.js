/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.media.main.js - Main media controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.media.main', {

		_fileListing: null,
		_sidebar: null,
		_folderListing: null,
		_cachedFileInfo: {},
		_cachedFolders: {},
		_folderAjax: null,
		_searchTimer: null,
		_uploadURL: '',

		initialize: function () {
			this.on( 'click', '[data-role="mediaItem"]', this.clickItem );
			this.on( 'click', '[data-role="fileListing"]', this.clickWrapper );
			this.on( 'click', '[data-role="mediaFolder"] > a', this.clickMediaFolder );
			this.on( 'click', '[data-action="deleteSelected"]', this.deleteSelected );
			this.on( 'keydown', '[data-role="mediaSearch"]', this.searchKeyPress );
			this.on( 'submitDialog', '[data-role="uploadButton"]', this.dialogSubmitted );
			this.on( window, 'resize', this.resizePanels );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._fileListing = this.scope.find('[data-role="fileListing"]');
			this._searchResults = this.scope.find('[data-role="searchResults"]');
			this._sidebar = this.scope.find('[data-role="mediaSidebar"]');
			this._folderListing = this.scope.find('[data-role="folderList"]');
			this._uploadURL = this.scope.find('[data-role="uploadButton"]').attr('href');
			this._newFolderURL = this.scope.find('[data-role="folderButton"]').attr('href');
			this._deleteFolderURL = this.scope.find('[data-action="deleteFolder"]').find('a').attr('href');
			
			this.scope.find('[data-role="uploadButton"]').attr('href', this._uploadURL + '&media_parent=0' );
			this.scope.find('[data-role="folderButton"]').attr('href', this._newFolderURL + '&media_parent=0' );

			this.resizePanels();
		},

		/**
		 * Resize panels
		 *
		 * @returns {void}
		 */
		resizePanels: function () {
			var windowHeight = $( window ).height();

			this.scope.find('#elMedia_sidebar, #elMedia_fileList, #elMedia_searchResults').each( function () {
				var top = $( this ).offset().top;
				
				$( this ).css({
					height: ( windowHeight - top ) + 'px'
				});
			});
		},

		/**
		 * Dialog submit handler from uploading process
		 * The dialog response will include an array of media items in this folder. We'll use
		 * this data to rebuild the file listing, thereby showing the new files immediately.
		 * 
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data 	Event data object
		 * @returns {void}
		 */
		dialogSubmitted: function (e, data) {
			var newHTML = [];
			var folderID = data.response.folderID;

			_.each( data.response.rows, function (file, key) {
				newHTML.push( file );
			});

			this._cachedFolders[ folderID ] = newHTML;
			this._buildFileListing( folderID, newHTML );

			ips.ui.flashMsg.show( ips.pluralize( ips.getString('mediaUploadedCount'), data.response.count ) );
		},

		/**
		 * keypress event handler for the search text box
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		searchKeyPress: function (e) {
			clearTimeout( this._searchTimer );
			this._searchTimer = setTimeout( _.bind( this._doSearch, this ), 500 );
		},

		/**
		 * Event handler for clicking a folder in the list
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		clickMediaFolder: function (e) {
			e.preventDefault();

			var self = this;
			var allRows = this._folderListing.find('[data-role="mediaFolder"]');
			var row = $( e.currentTarget ).closest('[data-role="mediaFolder"]');
			var rowURL = row.find('> a').attr('href');
			var rowID = row.attr('data-folderID');

			this._resetSearch();

			if( row.hasClass('ipsTreeList_activeBranch') ){
				row
					.removeClass('ipsTreeList_activeBranch')
					.addClass('ipsTreeList_inactiveBranch');
			} else {
				row
					.removeClass('ipsTreeList_inactiveBranch')
					.addClass('ipsTreeList_activeBranch');
			}

			allRows.removeClass('ipsTreeList_activeNode');
			row.addClass('ipsTreeList_activeNode');

			// Update the upload/new folder buttons
			this.scope.find('[data-role="uploadButton"]').attr('href', this._uploadURL + '&media_parent=' + rowID );
			this.scope.find('[data-role="folderButton"]').attr('href', this._newFolderURL + '&media_parent=' + rowID );
			this.scope.find('[data-role="folderButton"]').attr('href', this._newFolderURL + '&media_parent=' + rowID );
			this.scope.find('[data-action="deleteFolder"]').find('a').attr('href', this._deleteFolderURL + '&id=' + rowID );
			
			if ( rowID > 0 ) {
				this.scope.find('[data-action="deleteFolder"]').removeClass('ipsHide');
			} else {
				this.scope.find('[data-action="deleteFolder"]').addClass('ipsHide');
			}
			
			// Load subfolders
			this._loadFolders( rowID, rowURL );

			// And folder contents
			this._loadFiles( rowID, rowURL );

			this._unselectAll();
			this._updatePreview();
			this._checkDeleteButton();
		},

		/**
		 * Prompts and deletes selected files
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		deleteSelected: function (e) {
			var self = this;
			var selected = this._getSelected().closest('[data-role="mediaItem"]');
			var selectedIDs = [];

			$.each( selected, function () {
				selectedIDs.push( $( this ).attr('data-fileid') );
			});

			// Confirm with user
			ips.ui.alert.show({
				type: 'confirm',
				message: ips.pluralize( ips.getString('mediaConfirmDelete'), selected.length ),
				icon: 'warn',
				callbacks: {
					ok: function () {
						selected.find('.cMedia_itemSelected').removeClass('cMedia_itemSelected')

						// Hide and remove them
						ips.utils.anim.go( 'fadeOutDown', selected )
							.done( function () {
								selected.remove();
								self._updatePreview();
								self._checkDeleteButton();
							});

						// Delete them on the server
						ips.getAjax()( '?app=cms&module=pages&controller=media&do=deleteByFileIds', {
							data: {
								fileIds: selectedIDs
							}
						})
							.fail( function () {
								ips.ui.alert.show({
									type: 'alert',
									message: ips.pluralize( ips.getString('mediaErrorDeleting'), selected.length )
								});
							})
					}
				}
			});
		},

		/**
		 * Event handler for clicking in the whitepace of the file listing
		 * Unselects any selected files
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		clickWrapper: function (e) {
			if( !$( e.target ).closest('[data-role="mediaItem"]').length ) {
				this._unselectAll();
				this._updatePreview();
				this._checkDeleteButton();
			}
		},

		/**
		 * Event handler for clicking a file in the file listing
		 * Modifier keys change how we handle the selection in order to mimic file managers
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		clickItem: function (e) {
			var item = $( e.currentTarget ).find('> .cMedia_item');
			var metaPressed = e.metaKey;
			var shiftPressed = e.shiftKey;

			if( !metaPressed && !shiftPressed ){
				// If no special keys are pressed, unhighlight all and highlight this one
				this._unselectAll();
				item.addClass('cMedia_itemSelected');
				this._switchToTab('overview');
			} else if( metaPressed ) {
				// If meta key is pressed, toggle the state of the clicked image
				item.toggleClass( 'cMedia_itemSelected', ( !item.hasClass('cMedia_itemSelected') ) );
			} else if( shiftPressed ) {
				// If shift is pressed, select the whole run

				// Find the first selected file
				var all = this._fileListing.find('.cMedia_item');
				var indexOfFirst = all.index( all.filter('.cMedia_itemSelected').first() );
				var indexOfClicked = all.index( item );
				var itemsToSelect = null;

				// Unselect all to start with
				this._unselectAll();

				// Select the run
				if( indexOfFirst == indexOfClicked ){
					itemsToSelect = item;
				} else if( indexOfFirst < indexOfClicked ){
					itemsToSelect = all.slice( indexOfFirst, indexOfClicked ).addBack( item );
				} else if( indexOfFirst > indexOfClicked ){
					itemsToSelect = all.slice( indexOfClicked, indexOfFirst + 1 );
				}

				itemsToSelect.addClass('cMedia_itemSelected');
			}

			this._updatePreview();
			this._checkDeleteButton();
		},

		/**
		 * Checks whether any files are selected and displays the delete button if so
		 *
		 * @returns {void}
		 */
		_checkDeleteButton: function () {
			var selected = this._getSelected().closest('[data-role="mediaItem"]');

			if( selected.length == 0 ){
				this.scope.find('[data-action="deleteSelected"]').addClass('ipsHide');
			} else {
				this.scope.find('[data-action="deleteSelected"]').removeClass('ipsHide');
			}
		},

		/**
		 * Loads sub-folders of the given folder id
		 *
		 * @param	{number} 	rowID 		Folder row ID to load
		 * @param	{string} 	url 		Url for this folder
		 * @returns {void}
		 */
		_loadFolders: function (rowID, url) {
			var self = this;
			var row = this._folderListing.find('[data-folderID="' + rowID + '"]');

			if( this._folderAjax && _.isFunction( this._folderAjax.abort ) ){
				this._folderAjax.abort();
			}

			// If this row is loaded, we can just show it
			if( row.attr('data-loaded') ){
				return;
			}

			this._folderAjax = ips.getAjax()( url, {
				data: {
					get: 'folders'
				}
			} )
				.done( function (response) {
					var subFolder = row.find('ul');
					var newHTML = [];

					_.each( response, function (folder, key) {
						newHTML.push( folder );
					});

					subFolder.html( newHTML.join('') );
					row.attr('data-loaded', true);
				});
		},

		/**
		 * Loads files inside the given folder ID
		 *
		 * @param	{number} 	folderID	Folder row ID to load
		 * @param	{string} 	url 		Url for this folder
		 * @returns {void}
		 */
		_loadFiles: function (folderID, url) {
			var self = this;

			if( this._filesAjax && _.isFunction( this._filesAjax.abort ) ){
				this._filesAjax.abort();
			}

			// Are we already viewing this folder?
			if( this._fileListing.attr('data-showing') == folderID ){
				return;
			}

			// Do we have a cache already?
			if( !_.isUndefined( this._cachedFolders[ folderID ] ) ){
				this._buildFileListing( folderID, this._cachedFolders[ folderID ] );
				return;
			}

			// No cache, so load the file listing
			this._fileListing.addClass('ipsLoading').html('');

			ips.getAjax()( url, {
				data: {
					get: 'files'
				}
			} )
				.done( function (response) {
					var newHTML = [];

					_.each( response, function (file, key) {
						newHTML.push( file );
					});

					self._cachedFolders[ folderID ] = newHTML;
					self._buildFileListing( folderID, newHTML );
				})
				.always( function () {
					self._fileListing.removeClass('ipsLoading');
				});
		},

		/**
		 * Builds the file listing for the given folder ID from the given data
		 *
		 * @param	{number} 	folderID	Folder row ID to build
		 * @param	{array} 	data 		Array of file item HTML fragments
		 * @returns {void}
		 */
		_buildFileListing: function (folderID, data) {
			var output;

			if( !data.length ){
				output = ips.templates.render('templates.media.noItems');
			} else {
				output = ips.templates.render( 'templates.media.grid', {
					contents: data.join('')
				});
			}

			this._fileListing.attr( 'data-showing', folderID ).html( output );
			$( document ).trigger( 'contentChange', [ this._fileListing ] );
		},

		/**
		 * Updates the preview panel in the sidebar by finding the selected item and extracting
		 * relevant information about it to display
		 *
		 * @returns {void}
		 */
		_updatePreview: function () {
			// How many selected?
			var self = this;
			var selected = this._getSelected().closest('[data-role="mediaItem"]');

			if( selected.length == 0 || selected.length > 1 ){
				// Build the string
				var language = ( selected.length == 0 ) ? ips.getString('mediaNoneSelected') : ips.pluralize( ips.getString('mediaMultipleSelected'), selected.length );
				// Insert it
				this._sidebar.find('[data-role="multipleItemsMessage"]').html( language );
				// Show the message box
				this._sidebar.find('[data-role="itemInformation"]').hide().end().find('[data-role="multipleItems"]').show();
			} else {

				// Build the file info
				var info = {
					itemFilename: selected.attr('data-filename'),
					itemUploaded: selected.attr('data-uploaded'),
					itemTag: '{media="' + selected.attr('data-path') + '"}',
					itemID: selected.attr('data-fileid'),
					itemIsImage: selected.is('[data-isImage]'),
					itemFilesize: null,
					itemDimensions: null
				};

				// Dimensions & filesize
				var cache = this._cachedFileInfo[ info.itemID ];

				if( !_.isUndefined( cache ) ){
					info.itemFilesize = cache['itemFilesize'];
					info.itemDimensions = cache['itemDimensions'];
				} else {
					// Do ajax
					this._infoAjax = ips.getAjax()( '?app=cms&module=pages&controller=media&do=getFileInfo&id=' + info.itemID )
						.done( function (response) {
							self._cachedFileInfo[ info.itemID ] = {
								itemFilesize: response.fileSize,
								itemDimensions: response.dimensions
							};

							self._sidebar.find('[data-role="itemFilesize"]').text( response.fileSize );
							self._sidebar.find('[data-role="itemDimensions"]').text( response.dimensions );
						});
				}

				// Build thumbnail
				if( info.itemIsImage ){
					info.itemPreview = $('<img/>').attr( 'src', selected.attr('data-url') ).attr('data-ipsLightbox', true );
				} else {
					info.itemPreview = $('<div/>').addClass('ipsNoThumb');
				}

				// Update the easy info
				_.each( info, function (value, key) {
					var elem = self._sidebar.find('[data-role="' + key + '"]');

					if( !elem.length ){
						return;
					}

					if( elem.is('input') ){
						elem.val( value );
					} else if( key == 'itemPreview' ) {
						elem.html( value );
					} else if( value === null ){
						elem.html( $('<span/>').addClass('ipsType_light').text('Loading...') );
					} else {
						elem.text( value );
					}
				});

				// If this is an image, show the dimensions row
				this._sidebar.find('[data-role="itemDimensionsRow"]').toggle( info.itemIsImage );

				// Pre-select the tag box
				this._sidebar.find('[data-role="itemTag"]').get(0).select();

				// Hide the 'multiple items selected' div and show our info div
				this._sidebar.find('[data-role="itemInformation"]').show().end().find('[data-role="multipleItems"]').hide();

				$( document ).trigger( 'contentChange', [ this._sidebar ] );
			}
		},

		/**
		 * Performs a tree search and displays results
		 *
		 * @returns {void}
		 */
		_doSearch: function () {
			if( this._searchAjax && _.isFunction( this._searchAjax.abort ) ){
				this._searchAjax.abort();
			}

			var self = this;
			var value = this.scope.find('[data-role="mediaSearch"]').val();

			if( !_.isEmpty( value ) ){
				this._searchResults.show().addClass('ipsLoading');
				this._fileListing.hide();
				this._folderListing.addClass('cMedia_treeDisabled');

				this._searchAjax = ips.getAjax()( '?app=cms&module=pages&controller=media&do=search', {
					data: {
						input: value
					}
				})
					.done( function (response) {
						var newHTML = [];
						var output = '';

						_.each( response, function (file, key) {
							newHTML.push( file );
						});

						if( !newHTML.length ){
							output = ips.templates.render('templates.media.noSearchResults');
						} else {
							output = ips.templates.render( 'templates.media.grid', {
								contents: newHTML.join('')
							});
						}

						self._searchResults.removeClass('ipsLoading').html( output );
						$( document ).trigger( 'contentChange', [ self._searchResults ] );

						self._unselectAll();
						self._updatePreview();
						self._checkDeleteButton();
					})
			} else {
				this._searchResults.hide().html('');
				this._fileListing.show();
				this._folderListing.removeClass('cMedia_treeDisabled');
				this._updatePreview();
				this._checkDeleteButton();
			}
		},

		/**
		 * Returns selected files, from the file listing or search results panels depending
		 * on which is active
		 *
		 * @returns {object}	jQuery collection of selected files
		 */
		_getSelected: function () {
			if( this._fileListing.is(':visible') ){
				return this._fileListing.find('.cMedia_itemSelected');
			} else {
				return this._searchResults.find('.cMedia_itemSelected');
			}
		},

		/**
		 * Resets the search box, hiding the results in the process
		 *
		 * @returns {void}
		 */
		_resetSearch: function () {
			this.scope.find('[data-role="mediaSearch"]').val('');
			this._searchResults.hide();
			this._fileListing.show();
			this._unselectAll();
			this._updatePreview();
			this._checkDeleteButton();
		},

		/**
		 * Unselects all files
		 *
		 * @returns {void}
		 */
		_unselectAll: function () {
			this._fileListing.find('.cMedia_item').removeClass('cMedia_itemSelected');	
			this._searchResults.find('.cMedia_item').removeClass('cMedia_itemSelected');	
		},

		/**
		 * Switches the sidebar to the given tab
		 *
		 * @param	{string} 	tab 		Tab to switch to
		 * @returns {void}
		 */
		_switchToTab: function (tab) {
			if( tab == 'overview' ){
				this.scope.find('#elTab_overview').click();
			}
		}
	});
}(jQuery, _));