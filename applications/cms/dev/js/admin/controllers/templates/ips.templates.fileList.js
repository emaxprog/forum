/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.templates.fileList.js - Templates: controller for the file listing component of the template manager
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.templates.fileList', {

		_tabBar: null,
		_tabContent: null,

		initialize: function () {
			// Events started here			
			this.on( 'click', '[data-action="openFile"]', this.openFile );
			this.on( 'click', '[data-action="toggleBranch"]', this.toggleBranch );
			this.on( 'modifiedFile.templates', this.refreshFileList );
			
			// Events coming from elsewhere
			this.on( document, 'fileSelected.templates', this.selectFile );
			this.on( document, 'savedFile.templates revertedFile.templates', this.updateItemMeta );
			this.on( document, 'savedFile.templates revertedFile.templates', this.fileChangedStatus );

			this.on( document, 'addedFile.templates', this.refreshFileList );
			this.on( document, 'deletedFile.templates', this.refreshFileList );
			
			var debounce = _.debounce( _.bind( this.resizeFileList, this ), 100 );
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
			this._tabBar = this.scope.find('#elTemplateEditor_typeTabs');
			this._tabContent = this.scope.find('#elTemplateEditor_fileList');
			this.resizeFileList();
		},

		/**
		 * Resizes the file list to full height
		 *
		 * @returns {void}
		 */
		resizeFileList: function () {
			// Get height of parts we want to exclude
			var fileListTop = this._tabContent.offset().top;
			var infoHeight = this.scope.find('#elTemplateEditor_info').height();
			var browserHeight = $( window ).height();

			var fileListNewTop = browserHeight - fileListTop - infoHeight - 30;

			this._tabContent.css({
				height: fileListNewTop + 'px'
			});
		},
		
		/**
		 * Something has changed in the file list, so we refresh it and try and remember
		 * the position we were at. If a new file ID is provided, we'll also select it.
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		refreshFileList: function (e, data) {
			var self = this;
			var type = data.type;
			var panel = this._tabContent.find('.cTemplateList[data-type="' + type + '"]');
			var activeItem = panel.find('.cTemplateList_activeNode > a').attr('data-key');

			// If the panel isn't actually open, we'll just show it
			if( !panel.length ){
				this._tabBar.find('[data-type="' + type + '"]').click();
			} else {
				var open = this._getOpenNodes( panel );

				// Now fetch the new list
				var url = this._tabBar.find('[data-type]').attr('data-tabURL');

				ips.getAjax()( url )
					.done( function (response) {
						panel.html( response );

						// Now reopen all the nodes
						self._openNodes( open, panel, activeItem );

						if( data.fileID ){
							// Click it
							panel.find('[data-itemid="' + data.fileID + '"]').click();
						}

						// Let everyone know
						self.trigger('fileListRefreshed.templates');
					});	
			}
		},

		/**
		 * Opens the nodes provided in the toOpen param
		 *
		 * @param	{object} 	toOpen 		Object of nodes to open, containing three keys: apps, locations, groups
		 * @returns {void}
		 */
		_openNodes: function (toOpen, panel, activeItem) {

			var selector = [];

			// Get the locations
			if( toOpen.locations.length ){	
				for( var i = 0; i < toOpen.locations.length; i++ ){
					selector.push('[data-location="' + toOpen.locations[i] + '"]');
				}
			}

			// Get groups
			if( toOpen.groups.length ){
				for( var i = 0; i < toOpen.groups.length; i++ ){
					var str = '[data-location="' + toOpen.groups[i][0] + '"] ';
						str += '[data-group="' + toOpen.groups[i][1] + '"]';

					selector.push( str );
				}
			}

			// Now close all branches, then reopen the ones matching our selector
			panel
				.find('.cTemplateList_activeBranch')
					.removeClass('cTemplateList_activeBranch')
					.addClass('cTemplateList_inactiveBranch')
				.end()
				.find( selector.join(',') )
					.removeClass('cTemplateList_inactiveBranch')
					.addClass('cTemplateList_activeBranch');

			// Anything to make active?
			if( activeItem ){
				panel
					.find('[data-key="' + activeItem + '"]')
						.click();
			}
		},

		/**
		 * Returns an object containing the open nodes in the provided panel
		 *
		 * @param	{element} 	panel 	Panel element to fetch from
		 * @returns {object}	Three array keys: apps, locations, groups
		 */
		_getOpenNodes: function (panel) {
			var locations = [];
			var groups = [];

			// Fetch all open nodes
			panel.find('.cTemplateList_activeBranch').each( function (i, item) {
				var el = $( item );

				if( el.attr('data-location') ){
					locations.push( el.attr('data-location') );
				}

				if( el.attr('data-group') ){
					groups.push( [ 	
						el.closest('[data-location]').attr('data-location'), 
						el.attr('data-group')
					]);
				}
			});

			return {
				locations: locations,
				groups: groups
			};
		},

		/**
		 * The editor controller has indicated that a file tab has been selected
		 * We respond to this event by highlighting the file in the list
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		selectFile: function (e, data) {
			if( data.fileID ){
				this._makeActive( data.fileID );
			}
		},

		/**
		 * Event handler for clicking a file node in the listing.
		 * Gather metadata from the file, then trigger an event so that the editor controller
		 * can load it.
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		openFile: function (e) {
			e.preventDefault();
			var elem = $( e.currentTarget );

			// Get meta data for this file
			var meta = {
				name: elem.attr('data-name'),
				key: elem.attr('data-key'),
				type: elem.closest('[data-type]').attr('data-type'),
				title: elem.text(),
				group: elem.closest('[data-group]').attr('data-group'),
				location: elem.closest('[data-location]').attr('data-location'),
				id: elem.closest('[data-itemID]').attr('data-itemID'),
				inherited: elem.closest('[data-inherited-value]').attr('data-inherited-value')
			};

			Debug.log( meta );

			this.trigger( 'openFile.templates', {
				meta: meta
			});
		},

		/**
		 * Event handler for clicking a branch in the listing.
		 * Expends or collapses the branch
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleBranch: function (e) {
			e.preventDefault();
			var branchTrigger = $( e.currentTarget );
			var branchItem = branchTrigger.parent();

			if( branchItem.hasClass('cTemplateList_inactiveBranch') ){
				ips.utils.anim.go( 'fadeInDown', branchItem.find(' > ul') );

				branchItem
					.removeClass('cTemplateList_inactiveBranch')
					.addClass('cTemplateList_activeBranch');
			} else {
				branchItem.find(' > ul').hide();

				branchItem
					.removeClass('cTemplateList_activeBranch')
					.addClass('cTemplateList_inactiveBranch');
			}
		},

		/**
		 * Updates the ID of any element with the old ID
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		updateItemMeta: function (e, data) {
			if( data.oldID != data.newID ){
				this.scope
					.find('[data-itemID="' + data.oldID + '"]')
						.attr( 'data-itemID', data.newID );
			}
			
			/* Update name */
			this.scope
					.find('[data-itemID="' + data.newID + '"]')
						.attr( 'data-name', data.newTitle )
						.html( data.newTitle );
						
			/* Update container */
			if ( data.oldContainer != data.newContainer )
			{
				data.fileID = data.newID;
			
				// Let everyone know
				this.trigger( 'modifiedFile.templates', data );
			}
		},

		/**
		 * A file's status has changed, so we update it with the new status
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		fileChangedStatus: function (e, data) {
			this.scope
				.find('[data-key="' + data.key + '"]')
					.attr( 'data-inherited-value', data.status );
		},

		/**
		 * Finds the provided fileID in the list, highlights it and opens all branches to it
		 *
		 * @param	{string} 	fileID 		fileID of node to higlight
		 * @returns {void}
		 */
		_makeActive: function (fileID) {
			// Find the file entry
			var file = this.scope.find('[data-key="' + fileID +'"]');

			// Make all others inactive
			this.scope.find('[data-key]').parent().removeClass('cTemplateList_activeNode');

			// Make this one active
			file.parent().addClass('cTemplateList_activeNode');

			// Get all parent nodes, and show them
			file.parents('li[data-group], li[data-location]').each( function (idx, parent) {
				if( $( parent ).hasClass('cTemplateList_inactiveBranch') ){
					$( parent )
						.removeClass('cTemplateList_inactiveBranch')
						.addClass('cTemplateList_activeBranch')
						.find('> ul')
							.show();
				}
			});
		},
		
		/**
		 * Returns the currently-selected type being shown (templates or css)
		 *
		 * @returns {string}
		 */
		_currentType: function () {
			if( this._tabBar.find('[data-type="template"]').hasClass('ipsTabs_activeItem') ){
				return 'template';
			}
			if( this._tabBar.find('[data-type="js"]').hasClass('ipsTabs_activeItem') ){
				return 'js';
			} 
			
			return 'css';
		}
	});
}(jQuery, _));