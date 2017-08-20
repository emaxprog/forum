/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.pagination.js - Pagination UI component
 * Fires events that a controller can look for to facilitate AJAX pagination
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.pagination', function(){

		var defaults = {
			ajaxEnabled: true,
			perPage: 25, // number of items per perPage,
			pageParam: 'page'
		};

		/**
		 * Responder for pagination widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object passed through
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			options = _.defaults( options, defaults );

			if( !$( elem ).data('_pagination') ){
				$( elem ).data('_pagination', paginationObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		// Register this widget with ips.ui
		ips.ui.registerWidget('pagination', ips.ui.pagination,
			['ajaxEnabled', 'perPage', 'pages', 'pageParam']
		);

		return {
			respond: respond
		};
	});

	/**
	 * Pagination instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var paginationObj = function (elem, options) {

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			// The ajaxEnabled option is read at run-time in this case,
			// meaning controller can disable it on the fly if necessary
			if( !options.ajaxEnabled ){
				return;
			}

			// Set events
			// Click on a page number
			elem.on( 'click', '[data-page]', function (e) {

				var targetElem = $( e.currentTarget );

				$( elem ).trigger('paginationClicked', { 
					href: targetElem.attr('href') || '#',
					hrefTitle: targetElem.attr('title') || '',
					paginationElem: $(elem),
					pageElem: targetElem,
					perPage: options.perPage,
					pageParam: options.pageParam,
					pageNo: targetElem.attr('data-page'),
					lastPage: ( parseInt( targetElem.attr('data-page') ) === parseInt( options.pages ) ),
					originalEvent: e || null
				});
			});
				
			// Use the page jump
			elem.on( 'menuOpened', function (e, data) {
				$( elem ).find('input[type="number"]').focus();
			});

			elem.on( 'submit', '[data-role="pageJump"]', function (e) {
				var value = parseInt( $( e.currentTarget ).find('input[type="number"]').val() );
                var href = $( e.currentTarget ).closest('[data-baseURL]').attr('data-baseurl');

				if( value < 1 || value > options.pages ){
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warning',
						message: ips.getString('not_valid_page', [ options.pages ] ),
						callbacks: {}
					});

					return;
				}

				$( elem ).trigger('paginationJump', { 
					originalEvent: e || null,
					href: href || '#',
					paginationElem: $(elem),
					pageNo: value,
					perPage: options.perPage,
					pageParam: options.pageParam,
					lastPage: ( parseInt( value ) === parseInt( options.pages ) )
				});
			});
		};

		init();

		return {
			init: init
		};
	};
}(jQuery, _));