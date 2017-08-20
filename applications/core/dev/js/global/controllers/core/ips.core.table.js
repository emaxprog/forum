/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.table.js - Basic table controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.table', {

		_urlParams: {},
		_baseURL: '',
		_otherParams: [],
		_pageParam: 'page',
		_updateURL: true,
		_currentPage: 1,
		_doneInitialState: false,
		_initialURL: '',
		_ajax: null,

		initialize: function () {
			this.on( 'paginationClicked paginationJump', this.paginationClicked );
			this.on( 'refreshResults', this._getResults );
			this.on( 'buttonAction', this.buttonAction );
			this.on( 'click', '[data-action="tableFilter"]', this.changeFiltering );
			this.on( 'menuItemSelected', '[data-role="tableFilterMenu"]', this.changeFilteringFromMenu );
			this.on( window, 'statechange', this.stateChange );
			this.on( 'click', 'tr[data-tableClickTarget]', this.rowClick );

			this.setup();	
		},

		setup: function () {
			if( this.scope.attr('data-pageParam') && this.scope.attr('data-pageParam') != 'page' ){
				this._pageParam = this.scope.attr('data-pageParam');
			}

			this._otherParams.push( this._pageParam );			
			this._baseURL = this.scope.attr('data-baseurl');
			this._currentPage = ips.utils.url.getParam( this._pageParam, this._baseURL );
			this._cleanUpBaseURL();

			if( this._baseURL.match(/\?/) ) {
				if( this._baseURL.slice(-1) != '?' ){
					this._baseURL += '&';	
				}				
			} else {
				this._baseURL += '?';
			}

			this._urlParams = this._getUrlParams();
			this._urlParams[ this._pageParam ] = this._currentPage;
			this._initialURL = window.location.href;

			Debug.log( this._currentPage );

			if( this.scope.closest('[data-disableTableUpdates]').length ){
				this._updateURL = false;
			}

			var tmpStateData = _.extend( _.clone( this._urlParams ), { controller: this.controllerID } );
			
			// Replace the current state to store our params object
			//History.replaceState( tmpStateData, document.title, window.location.href );				
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
			if( ( _.isUndefined( state.data.controller ) || state.data.controller != this.controllerID ) && this._initialURL != state.url ) {
				return;
			}

			/*if( state.data.bypassState ){
				Debug.log('got state, but bypassing update');
				//Debug.log( state );
				//return;
			}*/

			this._handleStateChanges( state );

			// Update data
			this._urlParams = state.data;
			
			// Get le new results
			// If the initial URL matches the URL for this state, then we'll load results by URL instead 
			// of by object (since we don't have an object for the URL on page load)
			if( this._initialURL == state.url ){
				this._getResults( state.url );
			} else {
				this._getResults();
			}
		},

		/**
		 * Refresh table contents
		 *
		 * @returns {void}
		 */
		buttonAction: function () {
			this._getResults();
		},

		/**
		 * Update the current URL
		 *
		 * @param	{object} 	newParams 		New values to use in the search
		 * @returns {void}
		 */
		updateURL: function (newParams) {

			// We don't insert a record into the history when the page loads. That means when a user
			// goes to page 1 -> page 2 then hits back, there's no record of 'page 1' in the history, and it doesn't work.
			// To fix that, we're tracking a 'doneInitialState' flag in this controller. The first time this method is called
			// and doneInitialState == false, we insert the *current* url into the stack before changing the URL. This gives
			// the History manager something to go back to when the user clicks back to the initial page.
			/*if( !this._doneInitialState ){
				History.replaceState(
					_.extend( _.clone( this._urlParams ), { controller: this.controllerID, bypassState: true } ),
					document.title,
					document.location
				);

				this._doneInitialState = true;
			}*/

			_.extend( this._urlParams, newParams );

			var tmpStateData	= _.extend( _.clone( this._urlParams ), { controller: this.controllerID } );
			var newUrl			= this._baseURL + this._getURL();

			if( newUrl.slice(-1) == '?' ){
				newUrl = newUrl.substring( 0, newUrl.length - 1 );
			}
			
			//Debug.log( tmpStateData );
			History.pushState( 
				tmpStateData,
				document.title,
				 newUrl
			);
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
			
			if( data.pageNo != this._urlParams[ this._pageParam ] ){
				var newObj = {};
				newObj[ this._pageParam ] = data.pageNo;

				this.updateURL( newObj );
			}
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
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			//var newFilter = $( data.originalEvent.target ).closest('li').attr('data-filter');
			var newFilter = data.selectedItemID || '';
			
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
		 * Cleans the base url of our default params
		 *
		 * @returns {void}
		 */
		_cleanUpBaseURL: function () {
			var urlObj = ips.utils.url.getURIObject( this._baseURL );
			
			var params = _.clone( urlObj.queryKey );
			var self = this;
			
			this._baseURL = urlObj.protocol + '://' + urlObj.host + ( urlObj.port ? ( ':' + urlObj.port ) : '' ) + urlObj.path + '?';
						
			// If we're using friendly URLs *without* rewriting, we need to 
			if( urlObj.file == 'index.php' ){
				_.each( params, function (val, key) {
					if( key.startsWith('/') ){
						self._baseURL += encodeURIComponent( key ).replace( /%2f/ig, '/' ); // We don't want '/' being encoded or it breaks URLs
						delete params[ key ];					
					}
				});

				this._baseURL += '&';
			}

			// Remove our default URL params
			_.each( _.extend( ['sortby', 'sortdirection', 'filter'], this._otherParams ), function (val) {
				if( !_.isUndefined( params[ val ] ) ){
					delete params[ val ];
				}
			});
			
			// Decode params as $.param() will encode it again (double encode)
			_.each( params, function( v, k ){
				delete params[k];
				params[ decodeURIComponent( k ).replace( /\+/g, ' ') ] = v.replace(/\+/g, ' ');
			});
		
			// When using index.php? URLs, a param key is the path /forums/2-forum/ but as the value is empty, params.length returns false
			if( ! _.isEmpty( params ) ){
				this._baseURL += decodeURIComponent( $.param( params ) );
			}

			// If the last character is &, we can remove that because it'll be added back later
			if( this._baseURL.slice(-1) == '&' ){
				this._baseURL = this._baseURL.slice( 0, -1)
			}
		},

		/**
		 * Checks whether any values in the provided state are different and need updating
		 *
		 * @param 	{object} 	state 	State from history.js
		 * @returns {void}
		 */
		_handleStateChanges: function (state) {
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

			if( !_.isUndefined( state.data[ this._pageParam ] ) && state.data[ this._pageParam ] != this._urlParams[ this._pageParam ] ){
				this._updatePage( state.data[ this._pageParam ] );
			}
		},

		/**
		 * Fetches new results from the server, then calls this._updateTable to update the
		 * content and pagination. Simply redirects to URL on error.
		 *
		 * @returns {void}
		 */
		_getResults: function () {
			var self = this;
			var urlBits = this._getURL();
			
			try {
				if( this._ajax && _.isFunction( this._ajax.abort ) ){
					this._ajax.abort();
					this._ajax = null;
				}
			} catch(err) {
				
			}
			
			this._ajax = ips.getAjax()( this._baseURL + ( ( urlBits ) ? this._getURL() + '&' : '' ) + this.scope.attr('data-resort') + '=1', {
				dataType: 'json',
				showLoading: this._showLoading()
			})
				.done( _.bind( this._getResultsDone, this ) )
				.fail( _.bind( this._getResultsFail, this ) )
				.always( _.bind( this._getResultsAlways, this ) );
		},

		/**
		 * Should the default loading throbber be used?
		 *
		 * @returns {boolean}
		 */
		_showLoading: function () {
			return true;
		},

		/**
		 * Callback when the results ajax is successful
		 *
		 * @param	{object} 	response 		JSON object containing new HTML pieces
		 * @returns {void}
		 */
		_getResultsDone: function (response) {
			this._updateTable( response );
		},

		/**
		 * Callback when the results ajax fails
		 *
		 * @param 	{object} 	jqXHR			jQuery XHR object
		 * @param	{string} 	textStatus		Error message
		 * @param 	{string}	errorThrown
		 * @returns {void}
		 */
		_getResultsFail: function (jqXHR, textStatus, errorThrown) {
			if( Debug.isEnabled() || textStatus == 'abort' ){
				Debug.error( "Ajax request failed (" + textStatus + "): " + errorThrown );
				Debug.error( jqXHR.responseText );
			} else {
				// rut-roh, we'll just do a manual redirect
				window.location = this._baseURL + this._getURL();
			}
		},

		/**
		 * Update the content and pagination elements
		 *
		 * @param	{object} 	response 		JSON object containing new HTML pieces
		 * @returns {void}
		 */
		_updateTable: function (response) {

			var rows = this.scope.find('[data-role="tableRows"]');
			var pagination = this.scope.find('[data-role="tablePagination"]');
			var extra = this.scope.find('[data-role="extraHtml"]');
			var autoCheck = this.scope.find('[data-ipsAutoCheck]');

			// Check the required elements are in the page
			if( !rows.length ){
				window.location = this._baseURL + this._getURL();
				return;
			}

			// Table body
			rows.html( response.rows ).trigger('tableRowsUpdated');
			// Pagination
			pagination.html( response.pagination ).trigger('tablePaginationUpdated');
			// Eztra
			extra.html( response.extraHtml );
			// Autocheck
			autoCheck.trigger('refresh.autoCheck');

			// New content loaded, so trigger contentChange event
			$( document ).trigger( 'contentChange', [ this.scope ] );
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
		 * Updates the sorting order classnames
		 *
		 * @param 	{string} 	by 			Key name of sort by value
		 * @param 	{string} 	direction	asc or desc order value
		 * @returns {void}
		 */
		_updateSort: function ( data ) {
			var current = this._getSortValue();

			if( !data.by ){
				data.by = current.by;
			}

			if( !data.order ){
				data.order = current.order;
			}

			var obj = {
				sortby: data.by,
				sortdirection: data.order,
			};

			obj[ this._pageParam ] = 1;

			this.updateURL( obj );
		},

		/**
		 * Builds a param string from values in this._urlParams, excluding empty values
		 *
		 * @returns {string}	Param string
		 */
		_getURL: function () {
			var tmpUrlParams = {};

			for( var i in this._urlParams ){
				if( this._urlParams[ i ] != '' && i != 'controller' && i != 'bypassState' && ( i != 'page' || ( i == 'page' && this._urlParams[ i ] != 1 ) ) ){
					tmpUrlParams[ i ] = this._urlParams[ i ];
				}
			}

			return $.param( tmpUrlParams );
		},

		/**
		 * Returns current parameters to be used in URLs
		 *
		 * @returns {object}
		 */
		_getUrlParams: function () {
			var sort = this._getSortValue();
			var obj = {	
				filter: this._getFilterValue() || '',
				sortby: sort.by || '',
				sortdirection: sort.order || '',
			};

			obj[ this._pageParam ] = ips.utils.url.getParam( this._pageParam ) || 1

			return obj;
		},
		
		/**
		 * Event handler for clicking a clickable row
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		rowClick: function (e) {
			var target = $( e.target );

			// Ignore if we clicked something clickable (besides the row)
			if ( target.is('a') || target.is('i') || target.is('input') || target.is('textarea') || target.is('code') || target.closest('a').length || target.closest('.ipsMenu').length ) {
				return;
			}
			
			// Ignore if we didn't use the left mouse button. 1 is left mouse button, 2 is middle
			// We allow 2 through here because we'll treat it differently shortly
			if( e.which !== 1 && e.which !== 2 ){
				return;
			}

			// Ignore if special keys are pressed
			if( e.altKey || e.shiftKey ){
				return;
			}
			
			// If we clicked into a cell with a checkbox, check that checkbox rather than redirect
			if ( target.is('td') ) {
				var checkbox = target.find('input[type="checkbox"]');
				if ( checkbox.length ) {
					checkbox.prop( 'checked', !checkbox.prop( 'checked' ) );
					return;
				}
			}
						
			var link = $( e.currentTarget )
 				.find('[data-ipscontrolstrip]').parent()
 					.find( '[data-controlStrip-action="' + $( e.currentTarget ).attr('data-tableClickTarget') + '"]' );

			// If we are using the meta key or middle mouse button, we're going to adjust the link
			// to include _blank, so that it opens in a new tab
			if( e.metaKey || e.ctrlKey || e.which == 2 ){
				link.attr('target', '_blank');
 				link.get(0).click();
 				link.attr('target', '');
			} else {
				// Okay, we can go...
 				link.get(0).click();
			}			
		},


		/**
		 * Abstract
		 */
		_getSortValue: $.noop,
		_getFilterValue: $.noop,
		_getResultsAlways: $.noop
	});
}(jQuery, _));