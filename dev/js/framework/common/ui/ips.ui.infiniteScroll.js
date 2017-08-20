/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.infiniteScroll.js - Infinite scrolling widget
 * Loads new content into the bottom of the container when the user approaches the bottom
 * Infinite scrolling can be a real usability problem if used in the wrong place. Please use responsibly ;)
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.infiniteScroll', function(){

		var defaults = {
			distance: 50,
			loadingTpl: 'core.infScroll.loading',
			scrollScope: 'body',
			pageParam: 'page',
			pageBreakTpl: 'core.infScroll.pageBreak',
			totalPages: null,
			disableIn: 'phone'
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_infinite') ){
				$( elem ).data('_infinite', infiniteScrollObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the infinite scroll instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The dialog instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_infinite') ){
				return $( elem ).data('_infinite');
			}

			return undefined;
		};

		ips.ui.registerWidget( 'infScroll', ips.ui.infiniteScroll, [
			'container', 'scrollScope', 'distance', 'url', 'pageParam', 'loadingTpl',
			'pageBreakTpl', 'disableIn'
		] );

		/**
		 * Infinite scroll instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var infiniteScrollObj = function (elem, options) {

			var state = 'ready',
				scrollScope = null,
				container = null,
				ajaxObj = null,
				currentPage = 1;

			/**
			 * Initializes this Infinite Scroll instance
			 *
			 * @returns 	{void}
			 */
			var init = function () {
				container = $( options.container );
				scrollScope = $( options.scrollScope );				
				scrollScope.on( 'scroll', _scrollEvent );

				options.disableIn = options.disableIn.split(',');

				if( _.isString( options.distance ) && options.distance.indexOf('%') !== -1 ){
					var percent = parseInt( options.distance );
					options.distance = ( scrollScope.height() / 100 ) * percent;
				}
				
				if ( options.totalPages == null ) {
					options.totalPages = _getTotalPages();
				}

				currentPage = _getStartPage();

				elem.on( 'refresh.infScroll', _refresh );
			},

			/**
			 * Refreshes the data the infScroll widget uses
			 *
			 * @returns 	{void}
			 */
			_refresh = function () {
				options.totalPages = _getTotalPages();
				currentPage = _getStartPage();

				try {
					ajaxObj.abort();
				} catch (err) {}
			},

			/**
			 * Event handler for scrolling in the scroll scope element
			 * If we're within the 'distance' value from the bottom, load more results into the container
			 * Won't do anything if we're finished or loading, though
			 * 
			 * @param 		{event}	 	e 		Event object
			 * @returns 	{void}
			 */
			_scrollEvent = function (e) {
					
				// Only be concerned if we are working in this device
				if( ips.utils.responsive.enabled() && _.indexOf( options.disableIn, ips.utils.responsive.getCurrentKey() ) !== -1 ){
					return;
				}

				if( state == 'loading' || state == 'done' ){
					return;
				}

				if( currentPage >= _getTotalPages() ){
					return;
				}

				var distanceFromBottom = _getDistance();
				
				if( distanceFromBottom <= options.distance ){
					state = 'loading';
					_loadMoreResults();
				}
			},

			/**
			 * Fetches more results to display 
			 *
			 * @returns 	{void}
			 */
			_loadMoreResults = function () {
							
				_showLoadingElem();

				if( ajaxObj && ajaxObj.abort ){
					ajaxObj.abort();
				}
				
				ajaxObj = ips.getAjax()( _getPageURL( currentPage + 1 ) )
					.done( function (response) {
						currentPage++;
						_insertNewResults( response );
						state = 'ready';
						$( elem ).trigger( 'infScrollPageLoaded', {
							page: currentPage
						});
					})
					.fail( function () {

					})
					.always( function () {
						_removeLoadingElem();
					});
			},

			/**
			 * Inserts new results into the container
			 * 
			 * @param 		{string}	 	response 		Response from ajax request
			 * @returns 	{void}
			 */
			_insertNewResults = function (response) {
				var output = '';

				if( options.pageBreakTpl ){
					output += ips.templates.render( options.pageBreakTpl, {
						page: currentPage
					});
				}

				output += response;

				// count how many children container *currently* has
				var oldChildLength = container.children().length;

				// append new results
				container.append( output );

				// Now trigger content change on only the new items
				container.children().slice( oldChildLength ).each( function (child) {
					$( document ).trigger( 'contentChange', [ $( this ) ] );
				});				
			},

			/**
			 * Appends the loading row to the container
			 *
			 * @returns 	{void}
			 */
			_showLoadingElem = function () {
				container.append( ips.templates.render( options.loadingTpl ) );
			},

			/**
			 * Removes the loading row from the container
			 *
			 * @returns 	{void}
			 */
			_removeLoadingElem = function () {
				container.find('[data-role="infScroll_loading"]').remove();
			},

			/**
			 * Works out the distance remaining in the scroll scope, in pixels
			 * Different logic is used depending on whether the scope is the body, or an overflow'd element
			 *
			 * @returns 	{void}
			 */
			_getDistance = function () {

				if( options.scrollScope == 'body' ){
					var scrollHeight = $( document ).height();
					var distanceFromBottom = scrollHeight - $( window ).height() - $( window ).scrollTop();
				} else {
					var scrollHeight = scrollScope[0].scrollHeight;
					var distanceFromBottom = scrollHeight - scrollScope.height() - scrollScope.scrollTop();
				}

				return distanceFromBottom;
			},

			/**
			 * Builds a page url with the given page number
			 * 
			 * @param 		{number}	pageNo 		Page number
			 * @returns 	{string}	Query string
			 */
			_getPageURL = function (pageNo) {
				return elem.attr('data-ipsInfScroll-url') + '&' + options.pageParam + '=' + parseInt( pageNo );
			},

			/**
			 * Returns the current/starting page number based on the currently-active item from pagination
			 * 
			 * @returns 	{number}
			 */
			_getStartPage = function () {
				var paginationElem = elem.find('.ipsPagination').first();

				if( !paginationElem.length ){
					return 1;
				}

				var activePage = paginationElem.find('.ipsPagination_active').attr('data-page');

				if( !activePage ){
					return 1;
				} else {
					return parseInt( activePage );
				}
			},

			/**
			 * Returns the total number of pages based on the value provided in the pagination HTML
			 * 
			 * @returns 	{number}
			 */
			_getTotalPages = function () {				
				var paginationElem = elem.find('.ipsPagination').first();

				if( !paginationElem.length ){
					return 1;
				}

				var totalPages = paginationElem.attr('data-pages');

				if( !totalPages ){
					return 1;
				} else {
					return parseInt( totalPages );
				}
			};

			init();

			return {
				init: init
			};
		};

		return {
			respond: respond
		};
	});
}(jQuery, _));