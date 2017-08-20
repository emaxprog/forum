/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.articlePages.js - Turns content using the page bbcode into paginated content
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.articlePages', {

		_currentPage: 1,
		_pages: null,
		_articleID: '',

		initialize: function () {
			this.on( 'paginationClicked', this.paginationClicked );
			
			// Primary event that watches for URL changes
			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );

			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._articleID = this._getArticleID();
			this._setupPages();
		},

		/**
		 * stateChange event
		 *
		 * @returns {void}
		 */
		stateChange: function () {
			var state = History.getState();

			if( _.isUndefined( state.data.controller ) || state.data.controller != 'article-' + this._articleID ){
				return;
			}

			var newPage = parseInt( state.data[ 'page' + this._articleID ] );

			if( _.isUndefined( this._pages[ newPage - 1 ] ) ){
				return;
			}

			this._pages.hide();
			this._currentPage = newPage;

			ips.utils.anim.go( 'fadeIn', $( this._pages[ newPage - 1 ] ) );

			this._checkButtons();
		},

		/**
		 * Event handler for the pagination widget being clicked
		 *
		 * @param	{event} 	e 		Event object
		 * @param	{object} 	data 	Event data object
		 * @returns {void}
		 */
		paginationClicked: function (e, data) {
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
				data.originalEvent.stopPropagation();
			}

			// Don't allow these pagination events to bubble up to main comment feed pagination
			e.stopPropagation();

			var urlData = {
				controller: 'article-' + this._articleID
			};

			if( data.pageNo == 'next' ){
				urlData[ 'page' + this._articleID ] = this._currentPage + 1;
			} else {
				urlData[ 'page' + this._articleID ] = this._currentPage - 1;
			}

			var url = this._buildURL( urlData[ 'page' + this._articleID ] );

			History.pushState( urlData, document.title, url );
		},

		/**
		 * Determines an appropriate article ID for this controller
		 * If data-articleID isn't specified, it'll try and find a comment ID,
		 * or default to the sequential dom element ID.
		 *
		 * @returns {string}
		 */
		_getArticleID: function () {
			if( this.scope.attr('data-articleID') ){
				return this.scope.attr('data-articleID');
			} else if( this.scope.closest('[data-commentID]') ) {
				return 'comment' + this.scope.closest('[data-commentID]').attr('data-commentID');
			} else {
				// This isn't great because it'll change for each user, but if we've
				// got nothing else to go on...
				return this.scope.identify().attr('id');	
			}			
		},

		/**
		 * Builds a URL that is a link to this particular page of the document
		 *
		 * @param 	{number} 	pageNo 		Page number to include in the URL
		 * @returns {void}
		 */
		_buildURL: function (pageNo) {
			// Get URL object first
			var urlObj = ips.utils.url.getURIObject();
			// Build the base URL
			var url = urlObj.protocol + '://' + urlObj.host + ( urlObj.port ? ( ':' + urlObj.port ) : '' ) + urlObj.path + '?';

			// Add or replace our page number param
			urlObj.queryKey[ 'page' + this._articleID ] = pageNo;

			var params = _.clone( urlObj.queryKey );

			// If we're using index.php? urls, the keys may be /forum/forum-2/ style
			// The /../ part will have an empty value, so we add those to the URL manually first
			if( urlObj.file == 'index.php' ){
				_.each( params, function (val, key) {
					if( key.startsWith('/') ){
						url += key;
						delete params[ key ];					
					}
				});

				url += '&';
			}

			// If we still have other params, add those to the URL
			if( ! _.isEmpty( params ) ){
				url += $.param( params );
			}

			return url;
		},

		/**
		 * Checks the next/prev buttons, and shows/hides them as needed
		 *
		 * @returns {void}
		 */
		_checkButtons: function () {
			var indexedPage = this._currentPage - 1;

			this.scope.find('.ipsPagination_prev').toggle( !( indexedPage <= 0 ) );
			this.scope.find('.ipsPagination_next').toggle( !( indexedPage >= ( this._pages.length - 1 ) ) );
		},

		/**
		 * Sets up the content, showing pagination
		 *
		 * @returns {void}
		 */
		_setupPages: function () {
			// Find the pages
			this._pages = this.scope.find('[data-role="contentPage"]');

			if( this._pages.length < 2 ){
				return;
			}

			// Add pagination to the top and bottom
			this.scope.prepend( ips.templates.render('core.pagination') );
			this.scope.append( ips.templates.render('core.pagination') );

			// Hide all pages
			this._pages.hide();

			// Do we have a page in the URL?
			if( !_.isUndefined( ips.utils.url.getParam('page' + this._articleID ) ) ){
				this._currentPage = parseInt( ips.utils.url.getParam('page' + this._articleID ) );
			}

			// Show the right page
			$( this._pages[ this._currentPage - 1 ] ).show();

			// Hide the 'previous'
			this._checkButtons();

			// Hide the breaks
			this.scope.find('[data-role="contentPageBreak"]').hide();

			// And reinit content
			$( document ).trigger( 'contentChange', [ this.scope ] );
		}
	});
}(jQuery, _));