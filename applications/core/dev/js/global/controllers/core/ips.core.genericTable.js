/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.genericTable.js - Controller for ACP tables that can be filtered and live-searched
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.genericTable', {

		_curSearchValue: '',
		_urlParams: {},
		_baseURL: '',
		_searchField: null,
		_timer: null,
		_currentValue: '',

		initialize: function () {
			this.on( 'paginationClicked paginationJump', this.paginationClicked );
			this.on( 'click', '[data-action="tableFilter"]', this.changeFiltering );
			this.on( 'menuItemSelected', '[data-role="tableFilterMenu"]', this.changeFilteringFromMenu );
			this.on( 'focus', '[data-role="tableSearch"]', this.startLiveSearch );
			this.on( 'blur', '[data-role="tableSearch"]', this.endLiveSearch );
			this.on( 'click', '[data-action="tableSort"]', this.changeSorting );
			this.on( 'menuItemSelected', '#elSortMenu', this.sortByMenu );
			this.on( 'menuItemSelected', '#elOrderMenu', this.orderByMenu );
			this.on( 'refreshResults', this._getResults );
			this.on( 'buttonAction', this.buttonAction );

			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );

			this.setup();	
		},

		/**
		 * Setup method
		 * Builds the initial page parameters, and replaces the current state with these initial
		 * values.
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._baseURL = this.scope.attr('data-baseurl');
			if ( this.scope.attr('data-baseurl').match(/\?/) ) {
				this._baseURL += '&';
			} else {
				this._baseURL += '?';
			}
			
			
			this._searchField = this.scope.find('[data-role="tableSearch"]');

			// Get the initial page parameters
			var sort = this._getSortValue();

			this._urlParams = {
				filter: this._getFilterValue() || '',
				sortby: sort.by || '',
				sortdirection: sort.order || '',
				quicksearch: this._getSearchValue() || '',
				page: ips.utils.url.getParam('page') || 1
			};

			// Replace the current state to store our params object
			History.replaceState( this._urlParams, document.title, window.location.href );

			// Show the search box
			this.scope.find('[data-role="tableSearch"]').removeClass('ipsHide').show();
		},

		buttonAction: function (e, data) {
			this._getResults();
		},

		/**
		 * Handles events from the sort menu (shown only on mobile)
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		sortByMenu: function (e, data) {
			data.originalEvent.preventDefault();

			this._updateSort( {
				by: data.selectedItemID
			});
		},

		/**
		 * Handles events from the order menu (shown only on mobile)
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		orderByMenu: function (e, data) {
			data.originalEvent.preventDefault();

			this._updateSort( {
				order: data.selectedItemID
			});
		},

		/**
		 * Responds to state changes triggered by History.js
		 *
		 * @returns {void}
		 */
		stateChange: function () {
			var state = History.getState();

			// Because tables can exist alongside other widgets that manage the URL, we use the controller property
			// of the state data to identify states set by this controller only.
			// If that property doesn't exist, or if it doesn't match us, just ignore it.
			if( _.isUndefined( state.data.controller ) || state.data.controller != 'genericTable' ) {
				return;
			}

			// See what's changed so we can update the display
			if( !_.isUndefined( state.data.filter ) && state.data.filter != this._urlParams.filter ){
				this._updateFilter( state.data.filter );
			}

			if( ( !_.isUndefined( state.data.sortby ) && !_.isUndefined( state.data.sortdirection ) ) && 
					( state.data.sortby != this._urlParams.sortby || state.data.sortdirection != this._urlParams.sortdirection ) ){
				this._updateSort( {
					by: state.data.sortby,
					order: state.data.sortdirection 
				});
			}

			if( !_.isUndefined( state.data.quicksearch ) && state.data.quicksearch != this._urlParams.quicksearch ){
				this._updateSearch( state.data.quicksearch );
			}

			if( !_.isUndefined( state.data.page ) && state.data.page != this._urlParams.page ){
				this._updatePage( state.data.page );
			}

			// Update data
			this._urlParams = state.data;

			// Get le new results
			this._getResults();
		},

		/**
		 * Update the current URL
		 *
		 * @param	{object} 	newParams 		New values to use in the search
		 * @returns {void}
		 */
		updateURL: function (newParams) {
			_.extend( this._urlParams, newParams );
			
			var tmpStateData	= _.extend( _.clone( this._urlParams ), { controller: 'genericTable' } );
			var newUrl			= this._baseURL + this._getURL();

			if( newUrl.slice(-1) == '?' )
			{
				newUrl = newUrl.substring( 0, newUrl.length - 1 );
			}

			History.pushState( 
				tmpStateData,
				document.title,
				newUrl
			);
		},

		/**
		 * Builds a param string from values in this._urlParams, excluding empty values
		 *
		 * @returns {string}	Param string
		 */
		_getURL: function () {
			var tmpUrlParams = {};

			for( var i in this._urlParams ){
				if( this._urlParams[ i ] != '' && i != 'controller' && ( i != 'page' || ( i == 'page' && this._urlParams[ i ] != 1 ) ) ){
					tmpUrlParams[ i ] = this._urlParams[ i ];
				}
			}

			return $.param( tmpUrlParams );
		},

		/**
		 * Event handler for pagination widget
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data	Event data object
		 * @returns {void}
		 */
		paginationClicked: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			if( data.pageNo != this._urlParams.page ){
				this.updateURL( { page: data.pageNo } );
			}
		},

		/**
		 * Update classname on new active page. Pagination actually gets overwritten
		 * by the ajax response, but by updating the class here, it feels more immediate
		 * for the user.
		 *
		 * @param	{number} 	newPage 		New active page number
		 * @returns {void}
		 */
		_updatePage: function (newPage) {
			this.scope
				.find('[data-role="tablePagination"] [data-page]')
					.removeClass('ipsPagination_pageActive')
				.end()
				.find('[data-page="' + newPage + '"]')
					.addClass('ipsPagination_pageActive');
		},

		/**
		 * Event handler for choosing a new filter
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		changeFiltering: function (e) {
			e.preventDefault();
			var newFilter = $( e.currentTarget ).attr('data-filter');

			// Select the one that was clicked, unselect others
			this._updateFilter( newFilter );

			if( newFilter != this._urlParams.filter ){
				this.updateURL( { 
					filter: newFilter,
					page: 1
				});
			}
		},
		
		/**
		 * Event handler for choosing a new filter from a dropdown menu
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		changeFilteringFromMenu: function (e,data) {
			var newFilter = $( data.originalEvent.target ).closest('li').attr('data-filter');
			
			// Select the one that was clicked, unselect others
			this._updateFilter( newFilter );

			if( newFilter != this._urlParams.filter ){
				this.updateURL( { 
					filter: newFilter,
					page: 1
				});
			}
		},

		/**
		 * Updates element classnames for filtering
		 *
		 * @param	{string} 	newFilter 		Filter ID of new filter to select
		 * @returns {void}
		 */
		_updateFilter: function (newFilter) {
			this.scope
				.find('[data-role="tableSortBar"] [data-action="tableFilter"] a')
					.removeClass('ipsButtonRow_active')
				.end()
				.find('[data-action="tableFilter"][data-filter="' + newFilter + '"] a')
					.addClass('ipsButtonRow_active');
		},

		/**
		 * Focus event handler for live search box
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		startLiveSearch: function (e) {
			this._timer = setInterval( _.bind( this._checkSearchValue, this ), 500 );
		},

		/**
		 * Blur event handler for live search box
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		endLiveSearch: function (e) {
			clearInterval( this._timer );
		},

		/**
		 * Determines whether the search field value has changed from the last loop run,
		 * and updates the URL if it has
		 *
		 * @returns {void}
		 */
		_checkSearchValue: function () {
			var val = this._searchField.val();

			if( this._currentValue != val ){
				this.updateURL({
					quicksearch: val,
					page: 1
				});

				this._currentValue = val;
			}
		},

		/**
		 * Updates the search field with a provided value
		 *
		 * @param	{string} 	searchValue 		Value to update
		 * @returns {void}
		 */
		_updateSearch: function (searchValue) {
			this._searchField.val( searchValue );
		},

		/**
		 * Event handler for choosing new sort column/order
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		changeSorting: function (e) {
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
		},

		/**
		 * Updates the sorting order classnames
		 *
		 * @param 	{string} 	by 			Key name of sort by value
		 * @param 	{string} 	direction	asc or desc order value
		 * @returns {void}
		 */
		_updateSort: function ( data ) {
			var directions = 'ipsTable_sortableAsc ipsTable_sortableDesc';
			var current = this._getSortValue();

			if( !data.by ){
				data.by = current.by;
			}

			if( !data.order ){
				data.order = current.order;
			}

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

			this.updateURL( {
				sortby: data.by,
				sortdirection: data.order,
				page: 1
			});
		},

		/**
		 * Fetches new results from the server, then calls this._updateTable to update the
		 * content and pagination. Simply redirects to URL on error.
		 *
		 * @returns {void}
		 */
		_getResults: function () {
			var self = this;

			ips.getAjax()( this._baseURL + this._getURL() + '&' + this.scope.attr('data-resort') + '=1', {
				dataType: 'json',
				showLoading: true
			})
				.done( function (response) {
					self._updateTable( response );
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					if( Debug.isEnabled() ){
						Debug.error( "Ajax request failed (" + status + "): " + errorThrown );
						Debug.error( jqXHR.responseText );
					} else {
						// rut-roh, we'll just do a manual redirect
						window.location = self._baseURL + self._getURL();
					}
				});
		},

		/**
		 * Update the content and pagination elements
		 *
		 * @param	{object} 	response 		JSON object containing new HTML pieces
		 * @returns {void}
		 */
		_updateTable: function (response) {
			// Table body
			this.scope.find('[data-role="tableRows"]').html( response.rows );
			// Pagination
			this.scope.find('[data-role="tablePagination"]').html( response.pagination );

			// New content loaded, so trigger contentChange event
			$( document ).trigger( 'contentChange', [ this.scope ] );
		},

		/**
		 * Returns the current filter value
		 *
		 * @returns {string}
		 */
		_getFilterValue: function () {
			var sortBar = this.scope.find('[data-role="tableSortBar"]');

			if( !sortBar.length ){
				return '';
			}

			return sortBar.find('.ipsButtonRow_active').closest('[data-filter]').attr('data-filter');
		},

		/**
		 * Returns the current sort by and sort order value
		 *
		 * @returns {object}	Object containing by and order keys
		 */
		_getSortValue: function () {
			var sortBy = this.scope.find('[data-role="table"] thead .ipsTable_sortable.ipsTable_sortableActive');
			var sortOrder = 'desc';

			if( sortBy.hasClass('ipsTable_sortableAsc') ){
				sortOrder = 'asc';
			}

			return { by: sortBy.attr('data-key'), order: sortOrder };
		},

		/**
		 * Gets the current search value, either from the URL or contents of the search box
		 *
		 * @returns {string}
		 */
		_getSearchValue: function () {
			if( ips.utils.url.getParam('quicksearch') ){
				return ips.utils.url.getParam('quicksearch');
			}

			return this.scope.find('[data-role="tableSearch"]').val();
		},

		/**
		 * Replaces a row in the table with the provided contents
		 *
		 * @param 	{element} 	target 		The element used as our reference inside the row we're replacing, or the row itself
		 * @param 	{string}	contents 	The HTML with which the row will be replaced
		 * @returns {void}
		 */
		_actionReplace: function (target, contents) {
			// Find the table row this applies to
			var tr = $( target ).closest( 'tr' );
			var prevElem = tr.prev();

			tr.replaceWith( contents );

			// Let document know. We can't use our tr variable here, because that references the old (removed) row.
			// So trigger it on prevElem.next() instead
			$( document ).trigger( 'contentChange', [ prevElem.next() ] );
		}
	});
}(jQuery, _));	