/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.insertable.js - Allows items to be inserted into the editor
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.insertable', {

		_editorID: '',
		_selectedItems: {},
		_tooltip: null,
		_tooltipTimer: null,

		initialize: function () {
			this.on( 'click', '[data-action="insertFile"]', this.insertFile );
			this.on( 'click', '[data-action="selectFile"]', this.selectFile );
			this.on( 'click', '[data-action="insertSelected"]', this.insertSelected );
			this.on( 'click', '[data-action="clearAll"]', this.clearSelection );
			this.on( 'fileInjected', this.fileInjected );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns	{void}
		 */
		setup: function () {
			this._editorID = this.scope.attr('data-editorID');
			this._selectedItems = {};
		},

		destruct: function () {
			Debug.log('destruct insertable');
		},

		/**
		 * Toggle a file selection
		 *
		 * @param	{event}	e	Event Object
		 * @returns	{void}
		 */
		selectFile: function (e) {
			e.preventDefault();

			var thisAttach = $( e.currentTarget ).closest('.ipsAttach');
			var thisToggle = thisAttach.find('[data-action="selectFile"]');
			var thisDataRow = thisAttach.closest('.ipsDataItem');
			
			if( thisToggle.hasClass('ipsAttach_selectionOn') ){
				thisToggle.removeClass('ipsAttach_selectionOn');
				
				if( thisDataRow.length ){
					thisDataRow.removeClass('ipsDataItem_selected');
				} else {
					thisAttach.removeClass('ipsAttach_selected');
				}

				this._removeSelectedItem( thisAttach );
			} else {
				thisToggle.addClass('ipsAttach_selectionOn');
				
				if( thisDataRow.length ){
					thisDataRow.addClass('ipsDataItem_selected');
				} else {
					thisAttach.addClass('ipsAttach_selected');
				}

				this._addSelectedItem( thisAttach );
			}
		},
		
		/**
		 * Clears currently-selected items
		 *
		 * @param	{event}		e	Event data
		 * @returns	{void}
		 */
		clearSelection: function (e) {
			if( e ){
				e.preventDefault();
			}

			if( !_.size( this._selectedItems ) ){
				return;
			}

			// Empty object
			this._selectedItems = {};

			// Remove class from all elements in the dom
			this.scope
				.find('.ipsAttach_selectionOn')
					.removeClass('ipsAttach_selectionOn')
					.closest('.ipsAttach')
						.removeClass('ipsAttach_selected')
					.end()
					.closest('.ipsDataItem')
						.removeClass('ipsDataItem_selected');

			// Update buttons
			this._checkSelectedButton();
		},

		/**
		 * Inserts selected files into the editor
		 *
		 * @param	{event}		e	Event data
		 * @returns	{void}
		 */
		insertSelected: function (e) {
			e.preventDefault();

			var self = this;

			if( !_.size( this._selectedItems ) ){
				return;
			}

			var editor = $( 'textarea[name="' + this._editorID + '"]' ).closest('[data-ipsEditor]').data('_editor');

			_.each( this._selectedItems, function (item) {
				editor.insertHtml( self._buildInsert( item ) );
			});

			this.clearSelection();
			
			if( !this.scope.closest('[data-role="attachmentArea"]').length ){
				this.trigger('closeDialog');
			}
		},

		/**
		 * Allows attachments to be inserted into the editor individually
		 *
		 * @param	{event}	e	Event Object
		 * @returns	{void}
		 */
		insertFile: function(e) {			
			if( e ){
				e.preventDefault();
			}
			
			var editor = $( 'textarea[name="' + this._editorID + '"]' ).closest('[data-ipsEditor]').data('_editor');
			var insertData = this._buildInsertData( $( e.target ) );
			var insertHtml = this._buildInsert( insertData );
			editor.insertHtml( insertHtml );

			if( !this.scope.closest('[data-role="attachmentArea"]').length ){
				this.trigger('closeDialog');
			}

			if( insertData.type == 'image' ){
				// Add a tooltip to let users know they can double click it
				this._showImageTooltip( insertData.fileID );
			}
		},
				
		/**
		 * File injected
		 *
		 * @param	{event}		e		Event Object
		 * @param	{event}		data	Event data object
		 * @returns	{void}
		 */
		fileInjected: function (e, data) {
			$(this.scope).trigger( 'injectedFileReadyForInsert', { content: this._buildInsert( this._buildInsertData( data.fileElem ) ), data: data.data } );
		},

		_showImageTooltip: function (fileID) {
			if( !this._tooltip ){
				// Build it from a template
				var tooltipHTML = ips.templates.render( 'core.tooltip', {
					id: 'elEditorImageTooltip_' + this.controllerID,
					content: ips.getString('editorEditImageTip')
				});

				// Append to body
				ips.getContainer().append( tooltipHTML );

				this._tooltip = $('#elEditorImageTooltip_' + this.controllerID );
			} else {
				this._tooltip.hide();
			}

			if( this._tooltipTimer ){
				clearTimeout( this._tooltipTimer );
			}

			// Get image
			var imageFile = $('#cke_' + this._editorID ).find('[data-fileID="' + fileID + '"]').last();
			var self = this;

			// Now position it
			var positionInfo = {
				trigger: imageFile,
				target: this._tooltip,
				center: true,
				above: true
			};

			var tooltipPosition = ips.utils.position.positionElem( positionInfo );

			$( this._tooltip ).css({
				left: tooltipPosition.left + 'px',
				top: tooltipPosition.top + 'px',
				position: ( tooltipPosition.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});

			if( tooltipPosition.location.vertical == 'top' ){
				this._tooltip.addClass('ipsTooltip_top');
			} else {
				this._tooltip.addClass('ipsTooltip_bottom');
			}

			this._tooltip.show();

			setTimeout( function () {
				if( self._tooltip && self._tooltip.is(':visible') ){
					ips.utils.anim.go( 'fadeOut', self._tooltip );
				}
			}, 3000);
		},

		/**
		 * Adds an item to the selected items list
		 *
		 * @param	{element}	element		The file element to be added
		 * @returns	{void}
		 */
		_addSelectedItem: function (element) {
			var fileID = element.attr('data-fileid');
			this._selectedItems[ fileID ] = this._buildInsertData( element );
			this._checkSelectedButton();
		},

		/**
		 * Removes an item from the selected items list
		 *
		 * @param	{element}	element		The file element to be removed
		 * @returns	{void}
		 */
		_removeSelectedItem: function (element) {
			var fileID = element.attr('data-fileid');

			if( !_.isUndefined( this._selectedItems[ fileID ] ) ){
				delete this._selectedItems[ fileID ];
			}

			this._checkSelectedButton();
		},

		/**
		 * Enables the 'clear selection' and 'insert selected files' buttons if there's any selected items
		 *
		 * @returns	{void}
		 */
		_checkSelectedButton: function () {
			var button = this.scope.find('[data-action="insertSelected"]');

			this.scope.find('[data-action="clearAll"]').toggleClass('ipsButton_disabled', !( _.size( this._selectedItems ) > 0 ) );
			button.toggleClass('ipsButton_disabled', !( _.size( this._selectedItems ) > 0 ) );

			if( !_.size( this._selectedItems ) ){
				button.text( ips.getString('insertSelected') );
			} else {
				button.text( ips.pluralize( ips.getString('insertSelectedNum'), _.size( this._selectedItems ) ) );
			}
		},

		/**
		 * Builds insertable element data based on the provides attached file element
		 *
		 * @param	{element}	element		The element on which the insert is based
		 * @returns	{void}
		 */
		_buildInsertData: function (element) {
			var element = element.closest('.ipsAttach');
			var fileID = element.attr('data-fileid');
			var type = ( element.attr('data-isImage') ) ? 'image' : 'file';
			var url = '';
			var image = '';
			var extension = '';
			
			if( type == 'image' ){
				url = ( element.attr('data-thumbnailurl') ) ? element.attr('data-thumbnailurl') : element.attr('data-fullsizeurl');

				if( url != element.attr('data-fullsizeurl') ){
					image = element.attr('data-fullsizeurl');
				}
			} else {
				url = ( element.attr('data-filelink') ) ? element.attr('data-filelink') : '';
			}
			
			extension = element.closest('[data-extension]').attr('data-extension');

			return {
				fileID: fileID,
				type: type,
				title: ( type != 'image' ) ? element.find('[data-role="title"]').html() : '',
				link: url,
				fullImage: image,
				extension: extension
			};
		},

		/**
		 * Builds an element that can be inserted into the editor
		 *
		 * @param	{object}	item		Item data used to build element
		 * @returns	{string}
		 */
		_buildInsert: function (item) {
			var element = null;
						
			if( item.type == 'image' ){
				// Give the img a unique ID, otherwise removing image in editor when added more than once will only remove one
				element = $('<img/>').attr({
					'data-fileid':	item.fileID,
					'src': item.link,
					'data-unique': Math.random().toString(36).substr(2, 9)
				}).addClass('ipsImage ipsImage_thumbnailed');
				
				if ( item.extension ) {
					element.attr( 'data-extension', item.extension );
				}
					
				if( item.fullImage ){
					var link = $('<a>').attr( 'href', item.fullImage ).addClass('ipsAttachLink ipsAttachLink_image');
					element.addClass( 'ipsImage_thumbnailed');
					link.append( element );

					element	= link;
				}
			} else {
				element = $('<a>').addClass('ipsAttachLink').html( item.title );

				if( item.link ){
					element.attr( 'href', item.link );
				} else {
					element.attr( 'href', ips.getSetting('baseURL') + 'applications/core/interface/file/attachment.php?id=' + item.fileID );
				}
			}
			
			if ( item.extension )
			{
				element.attr( 'data-extension', item.extension );
			}
			
			return $('<div/>').append( element ).html();
		}
	});
}(jQuery, _));