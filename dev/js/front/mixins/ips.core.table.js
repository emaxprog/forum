/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.table.js - Front-end mixin for tables 
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.mixin('contentListing', 'core.global.core.table', true, function () {

		this._rowSelector = 'li';

		/**
		 * Adds front-end table events
		 *
		 * @returns {void}
		 */
		this.after('initialize', function () {
			//this.on( 'submit', '[data-role="moderationTools"]', this.moderationSubmit );
			this.on( 'menuItemSelected', '[data-role="sortButton"]', this.changeSorting );
			this.on( 'change', '[data-role="moderation"]', this.selectRow );
			this.on( 'click', '[data-action="markAsRead"]', this.markAsRead );
			this.on( 'paginationClicked', this.frontPaginationClicked );
			this.on( 'markTableRead', this.markAllRead );

			$( document ).on( 'markTableRowRead', _.bind( this.markRowRead, this ) );
			$( document ).on( 'markAllRead', _.bind( this.markAllRead, this ) );
			$( document ).on( 'updateTableURL', _.bind( this.updateTableURL, this ) );
			$( document ).on( 'moderationSubmitted', _.bind( this.clearLocalStorage, this ) );
		});

		this.after('setup', function () {
			this._tableID = this.scope.attr('data-tableID');
			this._storeID = 'table-' + this._tableID;

			if( this.scope.attr('data-dummyLoadingSelector') ){
				this._rowSelector = this.scope.attr('data-dummyLoadingSelector');
			}

			this._findCheckedRows();
		});

		/**
		 * Handle state changes (called after we've already verified this controller *should* handle this state change)
		 *
		 * @param 	{object} 	state  History state object
		 * @returns {void}
		 */
		this.before('_handleStateChanges', function (state) {
			ips.utils.analytics.trackPageView( state.url );
		});

		/**
		 * Show the table as loading before the ajax
		 *
		 * @returns {void}
		 */
		this.before('_getResults', function () {
			this._setTableLoading( true );
		});

		/**
		 * Switch off table loading after results are fetched
		 *
		 * @returns {void}
		 */
		this.after('_getResultsAlways', function () {
			this._setTableLoading( false );
		});

		/**
		 * After the table is updated, check for any pageAction widgets and refresh them
		 *
		 * @returns {void}
		 */
		this.after('_updateTable', function () {
			this.scope.find('[data-ipsPageAction]').trigger('refresh.pageAction');
			this.scope.find('[data-role="tableRows"]')
				.css({ opacity: 0.0001 })
				.animate({
					opacity: 1
				});
		});

		/**
		 * Checks localStorage and checks any rows that we've previously selected in this topic
		 *
		 * @returns {void}
		 */
		this._findCheckedRows = function () {
			if( !this.scope.find('input[type="checkbox"]').length ){
				return;
			}

			// Fetch the checked comments for this feedID
			var dataStore = ips.utils.db.get( 'moderation', this._storeID ) || {};
			var self = this;
			var pageAction = this.scope.find('[data-ipsPageAction]');

			if( _.size( dataStore ) ){
				_.each( dataStore, function (val, key) {
					if( self.scope.find('[data-rowid="' + key + '"]').length ){
						self.scope
							.find('[data-rowid="' + key + '"]')
								.addClass( 'ipsDataItem_selected' )
								.find('input[type="checkbox"][data-role="moderation"]')
									.attr( 'checked', true )
									.trigger('change');
					} else {
						pageAction.trigger('addManualItem.pageAction', {
							id: 'moderate[' + key + ']',
							actions: val
						});
					}
				});
			}
		};

		/**
         * Clear local storage after form is submitted
         *
         * @returns {void}
         */
        this.clearLocalStorage = function () {
            ips.utils.db.remove( 'moderation', this._storeID );
        };

		/**
		 * Prevent the default loading throbber from being shown here
		 *
		 * @returns {void}
		 */
		this._showLoading = function () {
			return _.isUndefined( this.scope.attr('data-dummyLoading') );
		};

		/**
		 * Marks everything in this table as read
		 *
		 * @returns {void}
		 */
		this.markAllRead = function () {
			this.scope
				.find('.ipsDataItem, .ipsDataItem_subList .ipsDataItem_unread')
					.removeClass('ipsDataItem_unread')
					.find('.ipsItemStatus')
						.addClass('ipsItemStatus_read');
		};

		/**
		 * Marks a row in this table read
		 *
		 * @returns {void}
		 */
		this.markRowRead = function (e, data) {

			// Make sure we're working on the right table
			if( _.isUndefined( data.tableID ) || data.tableID != this._tableID ){
				return;
			}

			// Update row
			this.scope
				.find('[data-rowID="' + data.rowID + '"]')
					.removeClass('ipsDataItem_unread')
					.find('.ipsItemStatus')
						.addClass('ipsItemStatus_read');
		};
		
		/**
		 * Update the table URL from an external source
		 *
		 * @returns {void}
		 */
		this.updateTableURL = function (e, data) {

			this.updateURL( data );
		};

		/**
		 * Scroll to pagination when clicked
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.frontPaginationClicked = function () {
			// Get top postition of table
			var elemPosition = ips.utils.position.getElemPosition( this.scope );
			$('html, body').animate( { scrollTop: elemPosition.absPos.top + 'px' } );
		};

		/**
		 * Toggles classes when the moderation checkbox is checked
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.selectRow = function (e) {
			var row = $( e.currentTarget ).closest('.ipsDataItem');
			var rowID = row.attr('data-rowID');
			var dataStore = ips.utils.db.get( 'moderation', this._storeID ) || {};
			var rowActions = row.find('[data-role="moderation"]').attr('data-actions');

			// Toggle the row styling
			row.toggleClass( 'ipsDataItem_selected', $( e.currentTarget ).is(':checked') );

			// Add it to our dataStore object which will go into localstorage
			if( $( e.currentTarget ).is(':checked') ){
				if( _.isUndefined( dataStore[ rowID ] ) ){
					dataStore[ rowID ] = rowActions;
				}
			} else {
				delete dataStore[ rowID ];
			}

			// Store the updated value, or delete if it's empty  now
			if( _.size( dataStore ) ){
				ips.utils.db.set( 'moderation', this._storeID, dataStore );	
			} else {
				ips.utils.db.remove( 'moderation', this._storeID );
			}
		};

		/**
		 * Mark as read functionality for table rows
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.markAsRead = function (e) {
			e.preventDefault();

			var self = this;
			var item = $( e.currentTarget );
			var url = item.attr('href');

			var execMark = function () {
				// Update row
				var row = item.closest('.ipsDataItem');
				row.removeClass('ipsDataItem_unread').find('.ipsItemStatus').addClass('ipsItemStatus_read');
				row.find('.ipsDataItem_subList .ipsDataItem_unread').removeClass('ipsDataItem_unread');

				ips.utils.anim.go('fadeOut', $('#ipsTooltip'));
				item.removeAttr('data-ipstooltip').removeAttr('title');

				// Mark as read on server
				ips.getAjax()(url, {
					bypassRedirect: true
				})
					.done(function (response) {
						item.trigger('markedAsRead');
					})
					.fail(function () {
						// Reset styles
						item
							.closest('.ipsDataItem')
							.addClass('ipsDataItem_unread')
							.find('.ipsItemStatus')
							.removeClass('ipsItemStatus_read');

						ips.ui.alert.show({
							type: 'alert',
							icon: 'error',
							message: ips.getString('errorMarkingRead'),
							callbacks: {
								ok: function () {
								}
							}
						});
					});
			};

			if( ips.utils.events.isTouchDevice() ) {
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'question',
					message: ips.getString('notificationMarkAsRead'),
					callbacks: {
						ok: function () {
							execMark();
						}
					}
				});
			} else {
				execMark();
			}
		};

		/**
		 * Update the content and pagination elements
		 *
		 * @param	{object} 	response 		JSON object containing new HTML pieces
		 * @returns {void}
		 */
		this._setTableLoading = function (loading) {
			var rowElem = this.scope.find('[data-role="tableRows"]');
			var rows = rowElem.find('> ' + this._rowSelector);
			
			if( _.isUndefined( this.scope.attr('data-dummyLoading') ) ){
				this._basicLoading( loading );
				return;
			}

			if( !loading || !rowElem.length || !rows.length ){
				return;
			}

			var template = 'table.row.loading';

			if( this.scope.attr('data-dummyLoadingTemplate') ){
				template = this.scope.attr('data-dummyLoadingTemplate');
			}

			var newRows = [];

			// Build an array of rendered rows that we'll insert in one go
			for( var i = 0; i <= rows.length; i++ ){
				var rnd = parseInt( Math.random() * (10 - 1) + 1 );
				newRows.push( ips.templates.render( template, { extraClass: this.scope.attr('data-dummyLoadingClass') || '', rnd: rnd } ) );
			}

			this.scope.find('[data-role="tableRows"]').html( newRows.join('') );
		};

		/**
		 * Show a loading spinner over the top of the existing rows
		 *
		 * @param	{object} 	response 		JSON object containing new HTML pieces
		 * @returns {void}
		 */
		this._basicLoading = function ( loading ) {
			var rowElem = this.scope.find('[data-role="tableRows"]');

			if( !this._tableOverlay ){
				this._tableOverlay = $('<div/>').addClass('ipsLoading').hide();
				ips.getContainer().append( this._tableOverlay );
			}

			if( loading ){
				// Get dims & position			
				var dims = ips.utils.position.getElemDims( rowElem );
				var position = ips.utils.position.getElemPosition( rowElem );

				this._tableOverlay.show().css({
					left: position.viewportOffset.left + 'px',
					top: position.viewportOffset.top + $( document ).scrollTop() + 'px',
					width: dims.width + 'px',
					height: dims.height + 'px',
					position: 'absolute',
					zIndex: ips.ui.zIndex()
				});

				rowElem.css({
					opacity: 0.5
				});
			} else {
				rowElem.animate({
					opacity: 1
				});

				this._tableOverlay.hide();
			}
		};

		/**
		 * Change the sorting
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		this.changeSorting = function (e, data) {
			data.originalEvent.preventDefault();
			
			// Don't sort if there's no sort value on this item
			if( _.isUndefined( data.selectedItemID ) ){
				return;
			}

			var current = this._getSortValue();
			var menuItem = data.menuElem.find('[data-ipsMenuValue="' + data.selectedItemID + '"]');
			var sortBy = data.selectedItemID;
			var sortDirection = current.order;

			// Does this option also have a direction?
			if( menuItem.attr('data-sortDirection') ){
				sortDirection = menuItem.attr('data-sortDirection');
			}

			this.updateURL( {
				sortby: sortBy,
				sortdirection: sortDirection,
				page: 1
			});
		};

		/**
		 * Updates element classnames for filtering
		 *
		 * @param	{string} 	newFilter 		Filter ID of new filter to select
		 * @returns {void}
		 */
		this._updateFilter = function (newFilter) {
			// This space left intentionally blank
		};

		/**
		 * Returns the current sort by and sort order value
		 *
		 * @returns {object}	Object containing by and order keys
		 */
		this._getSortValue = function () {
			var by = ips.utils.url.getParam('sortby');
			var order = ips.utils.url.getParam('sortdirection');

			return { by: by || '', order: order || '' };
		};

		/**
		 * Returns the current sort by and sort order value
		 *
		 * @returns {object}	Object containing by and order keys
		 */
		this._getFilterValue = function () {
			var filter = ips.utils.url.getParam('filter');
			return filter || '';
		};
	
	});
}(jQuery, _));