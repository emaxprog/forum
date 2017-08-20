/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.widgets.manager.js - Widget manager controller
 *
 * Author: Rikki Tissier
 */
	
;( function($, _, undefined){
	"use strict";
		
	ips.controller.register('core.front.widgets.manager', {

		_loadedManager: false,
		_loadingManager: false,
		_dragInitialized: false,
		_inManagingState: false,
		_wasUnused: false,
		_areasInUse: [],
		_blocksInUse: [],

		initialize: function () {
			this.on( 'click', '[data-action="openSidebar"]', this.openSidebarManager );
			this.on( 'click', '[data-action="closeSidebar"]', this.closeSidebarManager );
			this.on( 'click', '[data-role="availableBlocks"] [data-action="toggleSection"]', this.toggleSection );

			this.on( 'removeWidget.widgets', this.widgetRemoved );
			this.on( 'registerArea.widgets', this.registerWidgetArea );

			this.setup();
		},

		/**
		 * Setup method: ensures the block controller is available before we add any blocks
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;

			ips.loader.get( ['core/front/controllers/widgets/ips.widgets.block.js' ] ).then( function () {
				// Should we automatically open?
				if( ips.utils.url.getParam('_blockManager') ){
					self.openSidebarManager();
				}
			});

			// If the sidebar was hidden before we started managing, remember that so we can properly hide it
			// again after
			if( $('body').hasClass('ipsLayout_sidebarUnused') ){
				this._wasUnused = true;
			}
		},

		/**
		 * A widget area has told us it exists
		 *
		 * @param	{event} 	e 			The event
		 * @param 	{object} 	data 		Event data
		 * @returns {void}
		 */
		registerWidgetArea: function (e, data) {
			var self = this;

			this._areasInUse.push( data.areaID );

			if( data.ids ){
				for( var i = 0; i < data.ids.length; i++ ){
					self._blocksInUse.push( data.ids[ i ] );
				};
			}
		},

		/**
		 * Opens the manager panel, building it if necessary
		 *
		 * @param	{event} 	e 			The event
		 * @returns {void}
		 */
		openSidebarManager: function (e) {
			if( e ){
				e.preventDefault();				
			}			

			if( this._inManagingState ){
				return;
			}

			if( !this.scope.find('[data-role="manager"]').length ){
				this._buildSidebar();
			} else {
				// reset css code
				this.scope.find('#elSidebarManager > div:first-child').css({
					overflow: '',
					position: '',
					top: ''
				});
			}

			this.triggerOn( 'core.front.widgets.area', 'managingStarted.widgets');
			this._showManager();
			this.scope.addClass('cWidgetsManaging');
		},

		/**
		 * Closes the manager panel
		 *
		 * @param	{event} 	e 			The event
		 * @returns {void}
		 */
		closeSidebarManager: function (e) {
			e.preventDefault();

			if( this._inManagingState ){
				this._hideManager();
				this._cancelDragging();
				this.triggerOn( 'core.front.widgets.area', 'managingFinished.widgets' );
				this.scope.removeClass('cWidgetsManaging');
			}
		},

		/**
		 * Toggles a block list in the manager panel
		 *
		 * @param	{event} 	e 			The event
		 * @returns {void}
		 */
		toggleSection: function (e) {
			var target = $( e.currentTarget );

			if( target.hasClass('cSidebarManager_open') ){
				target
					.removeClass('cSidebarManager_open')
					.addClass('cSidebarManager_closed')
					.find('+ ul, + ul + p')
						.hide();
			} else {
				target
					.removeClass('cSidebarManager_closed')
					.addClass('cSidebarManager_open');

				if( target.find('+ ul > li:not( [data-hidden] )').length ) {
					ips.utils.anim.go( 'fadeIn', target.find('+ ul') );
				} else {
					target.find('+ ul + p').show();
				}
			}
		},

		widgetRemoved: function (e, data) {
			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-role="availableBlocks"]').find('[data-blockID="' + this._getBlockIDWithoutUniqueKey( data.blockID ) + '"]').removeAttr('data-hidden') );
		},
		
		/**
		 * Set up drags on the main list and manager lists
		 *
		 * @param	{event} 	e 			The event
		 * @returns {void}
		 */
		_setUpDragging: function () {
			var self = this;
			var managerList = this.scope.find('[data-role="availableBlocks"] ul');
			var selectors = self._buildAreaSelector();

			ips.loader.get( ['core/interface/jquery/jquery-ui.js'] ).then( function () {
				managerList.css({
					zIndex: ips.ui.zIndex(),
				})
				.sortable({
					dragHandle: '.cSidebarManager_block',
					connectWith: selectors,
					placeholder: 'cSidebarManager_placeholder',
					scroll: true,
					start: _.bind( self._startDragging, self ),
					stop: _.bind( self._cancelDragging, self )
				});

				self.triggerOn( 'core.front.widgets.area', 'prepareForDragging.widgets', {
					selector: selectors
				});
			});
		},

		/**
		 * When we start dragging, we need to set the overflow on the list to be 'visible' (rather
		 * than 'hidden') so that items in the list will be visible when they leave the element.
		 * At the same time, we have to adjust the top position of the list to imitate the previous scrolled
		 * position, then refresh the sortable so that the dragged element is in the right place. Phew.
		 *
		 * @returns {void}
		 */
		_startDragging: function () {
			var sidebarPanel = this.scope.find('#elSidebarManager > div:first-child');
			var scrollTop = sidebarPanel.scrollTop();

			sidebarPanel.css({
				overflow: 'visible',
				position: 'relative',
				top: '-' + scrollTop + 'px'
			});

			var managerList = this.scope.find('[data-role="availableBlocks"] ul');
			managerList.sortable('refresh');
		},

		/**
		 * Cancel the sorting, reversing the changes the above method makes.
		 *
		 * @returns {void}
		 */
		_cancelDragging: function () {
			this.scope.find('#elSidebarManager > div:first-child').css({
				overflow: '',
				position: '',
				top: ''
			});
		},

		/**
		 * Builds a selector list for selecting all widget areas
		 *
		 * @returns {void}
		 */
		_buildAreaSelector: function () {
			var output = [];

			for( var i = 0; i < this._areasInUse.length; i++ ){
				output.push( "[data-widgetArea='" + this._areasInUse[ i ] + "'] > ul" );
			}

			return output.join(',');
		},

		/**
		 * Shows the manager panel, loading the contents remotely if needed
		 *
		 * @returns {void}
		 */
		_showManager: function () {
			var self = this;

			if( $('html').attr("dir") == "rtl"){
				$('body').css({
					marginRight: '+=300px'
				});
			}
			else{
				$('body').css({
					marginLeft: '+=300px'
				});
			}

			this.scope.find('[data-action="openSidebar"]').hide();

			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-role="manager"]') )
				.done( function () {
					// Fade in the submit button
					$('#elSidebarManager_submit').hide().delay(700).fadeIn('fast');
				});

			// Fetch the sidebar list
			if( !this._loadedManager && !this._loadingManager ){
				ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=widgets&do=getBlockList', {
					data: {
						pageApp: $('body').attr('data-pageApp')
					}
				} )
					.done( function (response) {
						self._loadedManager = true;
						self.scope.find('[data-role="availableBlocks"]').html( response );
						self._setUpDragging();
						self._hideUsedBlocks();

						// Content change again
						$( document ).trigger('contentChange', [ $('#elSidebarManager') ] );
					})
					.fail( function () {
						ips.ui.alert.show( {
							type: 'alert',
							icon: 'warn',
							message: ips.getString('sidebar_fetch_blocks_error'),
							callbacks: {}
						});
					})
					.always( function () {
						self.scope.find('[data-role="availableBlocks"]').removeClass('ipsLoading ipsLoading_dark');
						self._loadingManager = false;
					});
			} else {
				// If we've loaded the data already, we still need to call these
				this._setUpDragging();
				this._hideUsedBlocks();
			}

			this._inManagingState = true;
		},

		/**
		 * Hides the manager panel
		 *
		 * @returns {void}
		 */
		_hideManager: function () {
			var self = this;

			if ($('html').attr("dir") == "rtl"){
				$('body').css({
					marginRight: '-=300px'
				}, 'fast');
			} else {
				$('body').css({
					marginLeft: '-=300px'
				}, 'fast');
			}

			this.scope.find('[data-action="openSidebar"]').show();
			this.scope.find('#elSidebarManager').hide();

			this._inManagingState = false;
		},

		/**
		 * Hides blocks in the available list which have been used in the live list
		 *
		 * @returns {void}
		 */
		_hideUsedBlocks: function () {
			var self = this;
			var manager = this.scope.find('[data-role="availableBlocks"]');

			// Show all blocks to start
			manager.find('[data-blockID]').show().removeAttr('data-hidden');

			if( this._blocksInUse.length ){
				for( var i = 0; i < this._blocksInUse.length; i++ ){
					var listedBlock = manager.find('[data-blockID="' + this._getBlockIDWithoutUniqueKey( self._blocksInUse[ i ] ) + '"]');
					
					if ( ! listedBlock.attr('data-allowReuse') )
					{
						listedBlock.hide().attr('data-hidden', true);
					}
				}
			}
		},

		/**
		 * Add the manager sidebar HTML to the page
		 *
		 * @param	{event} 	e 			The original event
		 * @returns {void}
		 */
		_buildSidebar: function () {
			this.scope.append( ips.templates.render('core.sidebar.managerWrapper') );
			this.scope.find('[data-role="availableBlocks"]').css({
				zIndex: ips.ui.zIndex()
			});

			$( document ).trigger( 'contentChange', [ this.scope ] );
		},

		/**
		 * Removes the unique key from the block ID
		 *
		 * @param	{string} 	block 			Block ID with unique key (app_core_whosOnline_4vbvzbw)
		 * @returns {string}
		 */
		_getBlockIDWithoutUniqueKey: function (block) {
			var bits = block.split('_');
			return bits[0] + '_' + bits[1] + '_'  + bits[2];
		}
	});
}(jQuery, _));