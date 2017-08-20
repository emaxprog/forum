/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.menuManager.js - Menu manager JS
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.menuManager', {

		_dropdownManager: null,
		_menuManager: null,
		_editForm: null,
		_previewWindow: null,
		_ajaxObj: null,
		_currentDropdown: 0,
		_previewOpen: false,

		initialize: function () {
			this.on( 'click', "[data-action='editDropdown']", this.editDropdown );
			this.on( 'click', "[data-role='menuItem']", this.editItem );
			this.on( 'click', "[data-action='removeItem']", this.removeItem );
			this.on( 'click', "[data-action='newDropdown']", this.newDropdown );
			this.on( 'click', "[data-action='newItem']", this.newItem );
			this.on( 'click', "[data-action='navBack']", this.navBack );
			this.on( 'submit', "[data-role='editForm'] form", this.saveEditForm );
			this.on( 'click', "[data-action='previewToggle']", this.togglePreview );
			this.on( document, 'menuToggle.acpNav', this.menuToggled );
			this.on( document, 'click', '[data-action="publishMenu"]:not( .ipsButton_disabled )', this.publishMenu );
			this.on( document, 'click', '[data-action="restoreMenu"]', this.restoreMenu );
			this.on( window, 'beforeunload', this.windowUnload );
			this.setup();
		},

		/**
		 * Setup method
		 * Sets up the sortable
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;

			this._dropdownManager = this.scope.find('[data-manager="dropdown"]');
			this._menuManager = this.scope.find('[data-manager="main"]');
			this._editForm = this.scope.find("[data-role='editForm']");
			this._previewWindow = this.scope.find('[data-role="preview"]');

			// Set up nested sortable for the root items
			this.scope.find('.cMenuManager_root > ol').nestedSortable({
				forcePlaceholderSize: true,
				handle: 'div',
				helper: 'clone',
				maxLevels: 2,
				items: '[data-role="menuNode"]',
				isTree: true,
				errorClass: 'cMenuManager_emptyError',
				placeholder: 'cMenuManager_emptyHover',
				start: _.bind( this._startDragging, this ),
				toleranceElement: '> div',
				tabSize: 30,
				update: _.bind( this._update, this )
			});

			// Append the update logic to the dropdown children
			this._applyDropDownSort();

			// Position the live preview
			this._positionPreviewWindow();
		},

		_applyDropDownSort: function() {
			var self = this;

			// Set up sortables for the dropdown menus
			this._dropdownManager.find('[data-dropdownID] > ol').sortable({
				items: '> li',
				update: function (event, ui) {
					self._changeOccurred();

					var parentID = ui.item.closest('[data-menuid]').attr('data-menuid');
					var items = $( this ).sortable( 'toArray' );
					var result = [];

					for( var i = 0; i < items.length; i++ ){
						result.push( "menu_order[" + items[i].replace('menu_', '') + "]=" + parentID );
					}

					ips.getAjax()( '?app=core&module=applications&controller=menu&do=reorder&reorderDropdown=1&' + result.join('&') )
						.done(function(){
							self._updatePreview();
						});
				}
			});
		},

		_update: function () {
			var self = this;
			this._changeOccurred();

			ips.getAjax()( '?app=core&module=applications&controller=menu&do=reorder&' + this.scope.find('.cMenuManager_root > ol').nestedSortable( 'serialize', { key: 'menu_order' } ) )
				.done(function(){
					self._updatePreview();
				});
		},

		/**
		 * Event handler called when user leaves the page
		 * If there's unsaved changes, we'll let the user know
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		windowUnload: function (e) {
			if( this._hasChanges ){
				return ips.getString('menuPublishUnsaved');
			}
		},

		/**
		 * Warns the user before proceeding with restoring the menu
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		restoreMenu: function (e) {
			e.preventDefault();

			var url = $( e.currentTarget ).attr('href');

			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'warn',
				message: ips.getString('menuRestoreConfirm'),
				subText: ips.getString('menuRestoreConfirmSubtext'),
				callbacks: {
					ok: function () {
						window.location = url;
					}
				}
			});
		},

		/**
		 * Publishes the menu via ajax
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		publishMenu: function (e) {
			e.preventDefault();

			var self = this;
			var button = $( e.currentTarget );
			var url = button.attr('href');

			// Change the text
			button
				.attr('data-currentTitle', button.find('span').text() )
				.addClass('ipsButton_disabled')
				.find('span')
					.text( ips.getString('publishing') );

			// Fire request
			ips.getAjax()( url, {
				bypassRedirect: true
			} )
				.done( function (response) {
					ips.ui.flashMsg.show( ips.getString("publishedMenu") );
					self._hasChanges = false;

					button
						.find('span')
							.text( button.attr('data-currentTitle') );
				})
				.fail( function () {
					window.location = url;
				});
		},

		/**
		 * Toggles the preview panel
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		togglePreview: function (e) {
			e.preventDefault();

			var toggle = $( e.currentTarget );

			if( this._previewOpen ){
				this._previewOpen = false;
				this._previewWindow.stop().animate({
					height: '48px'
				});
			} else {
				this._previewOpen = true;
				this._previewWindow.stop().animate({
					height: '350px'
				});
			}

			toggle.find('[data-role="closePreview"]').toggleClass( 'ipsHide', !this._previewOpen );
			toggle.find('[data-role="openPreview"]').toggleClass( 'ipsHide', this._previewOpen );
		},

		/**
		 * Handles adding a new item to a dropdown menu
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		newDropdown: function (e) {
			e.preventDefault();

			// Add temporary item for now
			var self = this;
			var newItem = ips.templates.render( 'menuManager.temporaryDropdown', {
				selected: true
			});
			var menuID = this._currentDropdown;
			var menu = this._dropdownManager.find( '[data-menuID="' + menuID + '"]' );
			var url = $( e.currentTarget ).attr('href');

			this._unselectAllItems();

			var doNew = function () {
				menu.append( newItem );

				self._checkForEmptyDropdown( menu );

				// Load the edit form
				self._loadEditForm( url, {
					parent: menuID
				});
			};

			this._checkTempBeforeCallback( doNew );
		},

		/**
		 * Handles adding a new item to the main menu
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		newItem: function (e) {
			e.preventDefault();

			// Add temporary item for now
			var self = this;
			var newItem = ips.templates.render( 'menuManager.temporaryMenuItem', {
				selected: true
			});
			var url = $( e.currentTarget ).attr('href');

			this._unselectAllItems();

			var doNew = function () {
				self.scope.find('.cMenuManager_root > ol').prepend( newItem );

				// Load the edit form
				self._loadEditForm( url, {
					parent: 0
				});
			};

			this._checkTempBeforeCallback( doNew );
		},

		/**
		 * Event handler for saving an add/edit form
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		saveEditForm: function (e) {
			e.preventDefault();

			var self = this;
			var form = $( e.currentTarget );
			var url = form.attr('action');
			var id = form.attr('data-itemID');
			var isNew = form.find('input[type="hidden"][name="newItem"]').val();

			ips.getAjax()( url, {
				type: 'post',
				data: form.serialize()
			})
				.done( function (response) {
					
					// If the form has just been returned back, that indicates an error
					if ( typeof response == 'string' ) {
						self._editForm.html( response );
						$( document ).trigger( 'contentChange', [ self._editForm ] );
						return;
					}
					
					// Update the menu item with new HTML
					if( isNew ){
						self.scope.find('[data-itemID="temp"]')
							.closest('[data-role="menuNode"]')
								.attr('id', 'menu_' + response.id )
							.end()
							.replaceWith( response.menu_item );
					} else {
						self.scope.find('[data-itemID="' + id + '"]').replaceWith( response.menu_item );
					}

					// Do we have a dropdown menu to replace?
					if( response.dropdown_menu ){
						var dropdownContent = $('<div>' + response.dropdown_menu + '</div>');

						dropdownContent.find('[data-dropdownid]').each( function () {
							var id = $( this ).attr('data-dropdownid');

							if( self._dropdownManager.find('[data-dropdownid="' + id + '"]').length ){
								self._dropdownManager.find('[data-dropdownid="' + id + '"]').html( $( this ).html() );
							} else {
								var newDropdown = $('<div/>').attr('data-dropdownid', id ).html( $( this ).html() );
								self._dropdownManager.append( newDropdown );
							}
						});
					}

					// Empty the edit form
					self._editForm
						.removeClass('cMenuManager_formActive')
						.find('> div').fadeOut( 'fast', function () {
							$( this ).remove();
						});

					// Animate item
					ips.utils.anim.go( 'pulseOnce', self.scope.find('[data-itemID="' + id + '"]') );

					if( isNew ){
						self.scope.find('.cMenuManager_root > ol').sortable('refreshPositions');

						self._applyDropDownSort();

						self._update();
					}
					
					self._changeOccurred();
					self._updatePreview();
				})
				.fail( function (err) {

				});
		},

		/**
		 * Event handler for removing an item
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		removeItem: function (e) {
			e.preventDefault();

			var self = this;
			var removeIcon = $( e.currentTarget );
			var item = removeIcon.closest('[data-role="menuItem"]');
			var li = item.closest('li');
			var menu = item.closest('ol');
			var url = removeIcon.attr('href');

			if( item.attr('data-itemID') == 'temp' ){
				// Just remove and reset the form
				ips.utils.anim.go( 'fadeOutDown', li )
					.done( function () {
						li.remove();
						self._checkForEmptyDropdown( menu );
					});

				this._unselectAllItems();
			}

			var removeItem = function () {
				// Remove item first
				self._changeOccurred();
				ips.utils.anim.go( 'fadeOutDown', li );
				ips.getAjax()( '?app=core&module=applications&controller=menu&do=remove&wasConfirmed=1&id=' + item.attr('data-itemID') );
			};

			// Check whether this item has any children
			if( item.find('+ ol > li').length ){
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'warn',
					message: ips.getString('menuItemHasChildren'),
					callbacks: {
						ok: removeItem
					}
				});
			} else if( item.find('[data-action="editDropdown"]').length ) {
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'warn',
					message: ips.getString('menuItemHasDropdown'),
					callbacks: {
						ok: removeItem
					}
				});
			} else {
				removeItem();
			}
		},

		/**
		 * Event handler for clicking on an item to edit it
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		editItem: function (e) {
			// Find edit URL
			var self = this;
			var clickFocus = $( e.target );
			var item = $( e.currentTarget );
			var editURL = item.find('[data-action="editItem"]').attr('href');

			var doEdit = function () {
				// Ignore it if we're inside another link
				if( clickFocus.closest('a').length ){
					return;
				}

				// Highlight this item; remove all other highlights
				self._menuManager.find('.cMenuManager_active').removeClass('cMenuManager_active');
				self._dropdownManager.find('.cMenuManager_active').removeClass('cMenuManager_active');
				self._editForm.addClass('cMenuManager_formActive');
				item.addClass('cMenuManager_active');

				// Load the edit form
				self._loadEditForm( editURL, {} );
			};

			this._checkTempBeforeCallback( doEdit );			
		},

		/**
		 * Event handler for clicking on the 'edit dropdown' icon
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		editDropdown: function (e) {
			e.preventDefault();
			var self = this;
			var icon = $( e.currentTarget );
			var dropdownID = icon.closest('[data-itemID]').attr('data-itemID');
			var menuWrapper = this._dropdownManager.find('[data-dropdownID="' + dropdownID + '"]');

			// Main edit functionality
			var doEdit = function () {
				// If we're currently viewing the roots, we'll slide it across
				if( !self._currentDropdown ){
					// Get column ready for animation
					self.scope.find('.cMenuManager_column').addClass('cMenuManager_readyToSlide');

					// Hide all menu wrappers
					self._dropdownManager.find('[data-dropdownID]').hide();

					// Show this menu
					menuWrapper.show();

					// Slide columns
					self.scope.find('[data-manager="dropdown"], [data-manager="main"]').show().animate({
						left: "-50%"
					}, function () {
						self.scope.find('.cMenuManager_column').addClass('cMenuManager_readyToSlide');
					});

					self._currentDropdown = 0;
				} else {

					// If we're already viewing a menu, we'll fade out and in
					var currentMenuWrapper = self._dropdownManager.find('[data-dropdownID="' + self._currentDropdown + '"]');

					currentMenuWrapper.find(' > ol').fadeOut( 'fast', function () {
						currentMenuWrapper.hide();
						menuWrapper
							.find('> ol')
								.hide()
							.end()
							.show()
							.find('> ol')
								.fadeIn();
					});
				}

				// Empty the edit form
				self._editForm
					.removeClass('cMenuManager_formActive')
					.find('> div').fadeOut( 'fast', function () {
						$( this ).remove();
					});

				self._currentDropdown = dropdownID;
				
				// Scroll to the top of the page as we could be two or three pages down so the form is never shown
				$('body').animate({
					scrollTop: $("#acpContent").offset().top - 40
				}, 1000);
			};

			this._checkTempBeforeCallback( doEdit );			
		},

		/**
		 * Goes back a level in the dropdown menu editor
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		navBack: function (e) {
			e.preventDefault();

			var self = this;
			var parentID = $( e.currentTarget ).attr('data-parentID');

			if( parentID == 0 ){
				// Back to the root
				this.scope.find('.cMenuManager_column').addClass('cMenuManager_readyToSlide');
				this.scope.find('[data-manager="dropdown"], [data-manager="main"]').show().animate({
					left: "0"
				}, function () {
					self._dropdownManager.find('[data-dropdownID]').hide();
					self.scope.find('.cMenuManager_column').removeClass('cMenuManager_readyToSlide');
				});

				this._currentDropdown = 0;
			} else {
				// Back to a parent dropdown
				var menuWrapper = this._dropdownManager.find('[data-dropdownID="' + parentID + '"]');
				var currentMenuWrapper = this._dropdownManager.find('[data-dropdownID="' + this._currentDropdown + '"]');

				currentMenuWrapper.find(' > ol').fadeOut( 'fast', function () {
					currentMenuWrapper.hide();
					menuWrapper
						.find('> ol')
							.hide()
						.end()
						.show()
						.find('> ol')
							.fadeIn();
				});
			}

			// Empty the edit form
			this._unselectAllItems();
		},

		/**
		 * Event handler that responds to the ACP main menu being toggled
		 * so that we can position the live preview bar
		 *
		 * @returns {void}
		 */
		menuToggled: function () {
			this._positionPreviewWindow();
		},

		/**
		 * Loads a new add/edit form
		 *
		 * @param 	{string} 	url 	URL to the form to load
		 * @param 	{object} 	obj 	Params object to pass to ajax
		 * @returns {void}
		 */
		_loadEditForm: function (url, obj) {
			var self = this;

			if( this._ajaxObj && _.isFunction( this._ajaxObj.abort ) ){
				this._ajaxObj.abort();
			}

			this._editForm
				.addClass('ipsLoading')
				.addClass('cMenuManager_formActive')
				.find('> div')
					.css( { opacity: 0.4 } )
					.after( $('<div/>').addClass('cMenuManager_formLoading ipsLoading') );
			
			this._ajaxObj = ips.getAjax()( url, {
				data: obj
			})
				.done( function (response){
					self._editForm.html( response );
					$( document ).trigger( 'contentChange', [ self._editForm ] );
				})
				.always( function () {
					self._editForm.removeClass('ipsLoading cMenuManager_formLoading');
				});
		},

		/**
		 * Checks whether a dropdown is empty, and removes/adds the empty message
		 *
		 * @param 	{element} 	menu 	Menu element
		 * @returns {void}
		 */
		_checkForEmptyDropdown: function (menu) {
			if( !menu.length ){
				return;
			}

			if( menu.find('[data-itemID]').length || menu.find('.ipsMenu_sep').length ){
				menu.find('.cMenuManager_emptyList').remove();
			} else {
				menu.append( ips.templates.render( 'menuManager.emptyList' ) );
			}
		},

		/**
		 * Checks for unsaved temporary items in the menu manager, and runs a callback after confirming
		 *
		 * @param 	{function} 	callback 	Callback method to run after confirming
		 * @returns {void}
		 */
		_checkTempBeforeCallback: function (callback) {
			var self = this;

			// Are there any temp items to warn about?
			if( this.scope.find('[data-itemID="temp"]').length ){
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'warn',
					message: ips.getString('menuManagerUnsavedTemp'),
					callbacks: {
						ok: function () {
							// Remove temp items
							self.scope.find('[data-itemID="temp"]').remove();
							callback.apply( self );
						}
					}
				});
			} else {
				callback.apply( self );
			}
		},		

		/**
		 * Clears the add/edit form area
		 *
		 * @returns {void}
		 */
		_unselectAllItems: function () {
			this._editForm.find('> div').fadeOut( 'fast', function () {
				$( this ).remove();
			});

			this._menuManager.find('.cMenuManager_active').removeClass('cMenuManager_active');
			this._dropdownManager.find('.cMenuManager_active').removeClass('cMenuManager_active');
			this._editForm.removeClass('cMenuManager_formActive');
		},

		/**
		 * Called when any data change happens, so that we can illuminate the Publish button
		 * and track state internally
		 *
		 * @returns {void}
		 */
		_changeOccurred: function () {
			this._hasChanges = true;

			// Light up the buttons
			// The buttons are in the header so we need to work out of scope here
			$('[data-action="publishMenu"]').removeClass('ipsButton_disabled');
		},

		/**
		 * Updates the preview panel
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_updatePreview: function (e) {
			this.scope.find("[data-role='previewBody'] iframe").get(0).contentWindow.location.reload( true );
		},

		_startDragging: function () {
			//
		},

		/**
		 * Positions the preview bar so it accounts for the ACP menu
		 *
		 * @returns {void}
		 */
		_positionPreviewWindow: function () {
			if( $('body').find('#acpAppList').is(':visible') ){
				var width = $('body').find('#acpAppList').width();
				this._previewWindow.css({
					left: width + 'px'
				});
			}
		}
	});
}(jQuery, _));