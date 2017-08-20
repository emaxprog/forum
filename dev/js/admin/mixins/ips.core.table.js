/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.table.js - ACP mixin for tables 
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.mixin('acpTable', 'core.global.core.table', true, function () {

		this._timer = null;
		this._searchField = null;
		this._curSearchValue = '';
		this._currentValue = '';

		/**
		 * Add acp-specific events
		 *
		 * @returns {void}
		 */
		this.after('initialize', function () {
			this.on( 'focus', '[data-role="tableSearch"]', this.startLiveSearch );
			this.on( 'blur', '[data-role="tableSearch"]', this.endLiveSearch );
			this.on( 'click', '[data-action="tableSort"]', this.changeSorting );
			this.on( 'paginationClicked', this.adminPaginationClicked );
			this.on( 'menuItemSelected', '#elSortMenu', this.sortByMenu );
			this.on( 'menuItemSelected', '#elOrderMenu', this.orderByMenu );
		});

		/**
		 * Set up search
		 *
		 * @returns {void}
		 */
		this.before('setup', function () {			
			this._searchField = this.scope.find('[data-role="tableSearch"]');
			this.scope.find('[data-role="tableSearch"]').removeClass('ipsHide').show();			
		});

		/**
		 * Mixin for _getUrlParams, adding our current search value
		 *
		 * @returns {object}	Extended object including search value
		 */
		this.around('_getUrlParams', function (origFn) {
			return _.extend( origFn(), {
				quicksearch: this._getSearchValue() || ''
			});
		});

		/**
		 * Updates the sorting order classnames
		 *
		 * @param 	{object} 	data 	Sort data
		 * @returns {void}
		 */
		this.after('_updateSort', function (data) {
			var directions = 'ipsTable_sortableAsc ipsTable_sortableDesc';
			
			// Do the cell headers
			this.scope
				.find('[data-role="table"] [data-action="tableSort"]')
					.removeClass('ipsTable_sortableActive')
					.removeAttr('aria-sort')
				.end()
				.find('[data-action="tableSort"][data-key="' + data.by + '"]')
					.addClass('ipsTable_sortableActive')
					.removeClass( directions )
					.addClass( 'ipsTable_sortable' + data.order.charAt(0).toUpperCase() + data.order.slice(1) )
					.attr( 'aria-sort', ( data.order == 'asc' ) ? 'ascending' : 'descending' );

			// Do the menus
			$('#elSortMenu_menu, #elOrderMenu_menu')
				.find('.ipsMenu_item')
					.removeClass('ipsMenu_itemChecked')
				.end()
				.find('[data-ipsMenuValue="' + data.by + '"], [data-ipsMenuValue="' + data.order + '"]')
					.addClass('ipsMenu_itemChecked');
		});	

		/**
		 * Mixin for _handleStateChange, checking for an updated search value
		 *
		 * @returns {object}	Extended object including search value
		 */
		this.after('_handleStateChanges', function (state) {
			if( !_.isUndefined( state.data.quicksearch ) && state.data.quicksearch != this._urlParams.quicksearch ){
				this._updateSearch( state.data.quicksearch );
			}
		});

		/**
		 * Scroll to pagination when clicked
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.adminPaginationClicked = function () {
			// Get top postition of table
			var elemPosition = ips.utils.position.getElemPosition( this.scope );
			$('html, body').animate( { scrollTop: ( elemPosition.absPos.top - 60 ) + 'px' } );
		};

		/**
		 * Handles events from the sort menu (shown only on mobile)
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		this.sortByMenu = function (e, data) {
			data.originalEvent.preventDefault();

			this._updateSort( {
				by: data.selectedItemID
			});
		};

		/**
		 * Handles events from the order menu (shown only on mobile)
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		this.orderByMenu = function (e, data) {
			data.originalEvent.preventDefault();

			this._updateSort( {
				order: data.selectedItemID
			});
		};

		/**
		 * Event handler for choosing new sort column/order
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.changeSorting = function (e) {
			e.preventDefault();
			var cell = $( e.currentTarget );
			var order = '';

			// Apply asc or desc classnames to the cell, depending on its current state
			if( cell.hasClass('ipsTable_sortableActive') ){
				order = ( cell.hasClass('ipsTable_sortableDesc') ) ? 'asc' : 'desc';
			} else {
				order = ( cell.hasClass('ipsTable_sortableDesc') ) ? 'desc' : 'asc';
			}

			this._updateSort( {
				by: cell.attr('data-key'),
				order: order
			});
		};

		/**
		 * Focus event handler for live search box
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.startLiveSearch = function (e) {
			this._timer = setInterval( _.bind( this._checkSearchValue, this ), 500 );
		};

		/**
		 * Blur event handler for live search box
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		this.endLiveSearch = function (e) {
			clearInterval( this._timer );
		};

		/**
		 * Determines whether the search field value has changed from the last loop run,
		 * and updates the URL if it has
		 *
		 * @returns {void}
		 */
		this._checkSearchValue = function () {
			var val = this._searchField.val();

			if( this._currentValue != val ){
				this.updateURL({
					quicksearch: val,
					page: 1
				});

				this._currentValue = val;
			}
		};
		
		/**
		 * Updates the search field with a provided value
		 *
		 * @param	{string} 	searchValue 		Value to update
		 * @returns {void}
		 */
		this._updateSearch = function (searchValue) {
			this._searchField.val( searchValue );
		};

		/**
		 * Updates element classnames for filtering
		 *
		 * @param	{string} 	newFilter 		Filter ID of new filter to select
		 * @returns {void}
		 */
		this._updateFilter = function (newFilter) {
			this.scope
				.find('[data-role="tableSortBar"] [data-action="tableFilter"] a')
					.removeClass('ipsButtonRow_active')
				.end()
				.find('[data-action="tableFilter"][data-filter="' + newFilter + '"] a')
					.addClass('ipsButtonRow_active');
		};

		/**
		 * Returns the current sort by and sort order value
		 *
		 * @returns {object}	Object containing by and order keys
		 */
		this._getSortValue = function () {
			var sortBy = this.scope.find('[data-role="table"] thead .ipsTable_sortable.ipsTable_sortableActive');			
			var sortOrder = 'desc';
			if( sortBy.hasClass('ipsTable_sortableAsc') ){
				sortOrder = 'asc';
			}

			return { by: sortBy.attr('data-key'), order: sortOrder };
		};

		/**
		 * Returns the current filter value
		 *
		 * @returns {string}
		 */
		this._getFilterValue = function () {
			var sortBar = this.scope.find('[data-role="tableSortBar"]');

			if( !sortBar.length ){
				return '';
			}

			return sortBar.find('.ipsButtonRow_active').closest('[data-filter]').attr('data-filter');
		};

		/**
		 * Gets the current search value, either from the URL or contents of the search box
		 *
		 * @returns {string}
		 */
		this._getSearchValue = function () {
			if( ips.utils.url.getParam('quicksearch') ){
				return ips.utils.url.getParam('quicksearch');
			}

			return this.scope.find('[data-role="tableSearch"]').val();
		};
	});
}(jQuery, _));