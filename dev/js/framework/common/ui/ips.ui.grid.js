/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.grid.js - Widget for managing contents of a grid, such that parts scale in proportion, and cells do not become too small 
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.grid', function(){

		var defaults = {
			patchwork: false,
			items: '[data-role="gridItem"]',
			equalHeights: false
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_grid') ){
				$( elem ).data('_grid', gridObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the grid instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The grid instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_grid') ){
				return $( elem ).data('_grid');
			}

			return undefined;
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		};


		/**
		 * Grid instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var gridObj = function (elem, options) {
			var originalSpan = 3;
			var currentSpan = 3;
			var possibleSizes = [ 1, 2, 3, 4, 6, 12 ]; // Since we're doing an even grid
			var deferInit = false;

			/**
			 * Initialization: get the current span, and make sure all items are using it for consistency
			 *
			 * @returns {void}
			 */
			var init = function () {
				if( !elem.is(':visible') ){
					deferInit = true;
					Debug.log('ui.ipsGrid is not visible; deferring init...');
				}

				if( !deferInit ){
					_initWhenVisible();
				}

				// If we have images inside, we'll need to redraw after they are loaded
				elem.imagesLoaded( function () {
					redrawGrid();
				});

				// Window resize event which keeps everything at the right size
				$( window ).on( 'resize', redrawGrid );

				// If this chart is in a tab, we need to re-initialize it after the tab is shown so that
				// it sizes properly
				$( document ).on( 'tabShown', _tabShown );

				// A new item has been added to the grid
				$( elem ).on( 'newItem', function (e, data) {
					data = $( data );
					_removeSpans( data );
					_addSpan( data, currentSpan );

					_checkDeferredInit();

					if( !deferInit ){
						_scaleProportions( data );	
						_equalHeights();
					}					
				});
			},

			/**
			 * Destruct this instance
			 *
			 * @returns {void}
			 */
			destruct = function () {
				$( window ).off( 'resize', redrawGrid );
				$( document ).off( 'tabShown', _tabShown );
			},

			redrawGrid = function () {
				_checkDeferredInit();

				if( !deferInit ){
					if( options.minItemSize || options.maxItemSize ){
						_checkItemWidth(0);
					}
					_scaleProportions( _getAll() );
					_equalHeights();
				}
			},

			/**
			 * Event handler for when a tab is shown
			 *
			 * @param 	{event} 	e 		Event object
			 * @param 	{object} 	data 	Event data object
			 * @returns {void}
			 */
			_tabShown = function (e, data) {
				if( $.contains( data.panel.get(0), elem.get(0) ) ){
					redrawGrid();
				}
			},

			/**
			 * Init stuff that can only be done when the elem is visible
			 *
			 * @returns {void}
			 */
			_initWhenVisible = function () {
				var firstItem = _getFirst();
				var allItems = _getAll();

				if( !options.defaultSpan ){
					for( var i = 1; i <= 12; i++ ){
						if( firstItem.hasClass( 'ipsGrid_span' + i ) ){
							originalSpan = currentSpan = i;
							break;
						}
					}
				} else {
					originalSpan = currentSpan = options.defaultSpan;
				}

				_changeSpan( currentSpan );
				_scaleProportions( _getAll() );
				_equalHeights();
			},

			/**
			 * Checks if init is deferred, and if so and the element is now visible, runs it
			 *
			 * @returns {void}
			 */
			_checkDeferredInit = function () {
				if( deferInit && elem.is(':visible') ){
					Debug.log('ui.ipsGrid is visible; now running init...');
					deferInit = false;
					_initWhenVisible();
				}
			},

			/**
			 * Scales the proportions of elements with data-grid-ratio
			 *
			 * @returns {void}
			 */
			_scaleProportions = function (item) {
				var width = _getFirst().outerWidth();

				item.addBack().find('[data-grid-ratio]').each( function () {
					var item = $( this );
					var newHeight = ( width / 100 ) * parseInt( item.attr('data-grid-ratio') );

					item.css({
						height: Math.ceil( newHeight ) + 'px'
					});
				});
			},

			/**
			 * Scales the proportions of elements with data-grid-ratio
			 *
			 * @returns {void}
			 */
			_equalHeights = function () {
				if( !options.equalHeights ){
					return;
				}

				var items = _getAll();

				if( options.equalHeights == 'row' ){
					var numPerRow = 12 / currentSpan;
					var loops = Math.ceil( items.length / numPerRow );
					var idx = 0;

					// If we are on a phone, and collapsed, reset the heights
					if( elem.hasClass('ipsGrid_collapsePhone') && ips.utils.responsive.currentIs('phone') ){
						items.css({
							height: 'auto'
						});
						
						return;
					}

					for( var i = 0; i < loops; i++ ){
						var rowItems = items.slice( idx, idx + numPerRow );
						idx = idx + numPerRow;

						// Reset the height so that we recalculate properly
						rowItems.css({
							height: 'auto'
						});

						var max = _.max( rowItems, function (item) {
							return $( item ).outerHeight();
						});

						rowItems.css({
							height: $( max ).outerHeight() + 'px'
						});
					}
				} else {
					// Reset the height so that we recalculate properly
					items.css({
						height: 'auto'
					});

					var max = _.max( items, function (item) {
						return $( item ).outerHeight();
					});

					items.css({
						height: $( max ).outerHeight() + 'px'
					});
				}
			},

			/**
			 * Checks the item width, and if it's less or more than our min/max widths, apply a new span
			 *
			 * @returns {void}
			 */
			_checkItemWidth = function (iteration) {

				var firstItem = _getFirst();
				var bestFit = originalSpan;

				// Here we loop through each possible size, fetch the actual pixel width it results in,
				// and then determine if it meets our params. We go backwards through possibleSizes because
				// we want the smallest possible size to win
				for( var i = possibleSizes.length - 1; i > 0; i-- ){
					// Add this span to the element, figure out if this is a good width
					_removeSpans( firstItem );
					_addSpan( firstItem, possibleSizes[ i ] );

					var size = firstItem.outerWidth();

					if( options.minItemSize && size < parseInt( options.minItemSize ) ){
						continue;
					}

					if( options.maxItemSize && size > parseInt( options.maxItemSize ) ){
						continue;
					}

					bestFit = possibleSizes[ i ];
				}

				// Now update the span
				_changeSpan( bestFit );
			},

			/**
			 * Return the first grid item
			 *
			 * @returns {element} 	First grid item
			 */
			_getFirst = function () {
				return elem.find('> [class*="ipsGrid_span"]').first()
			},

			/**
			 * Return all grid items
			 *
			 * @returns {element} 	All grid items
			 */
			_getAll = function () {
				return elem.find('> [class*="ipsGrid_span"]');
			},

			/**
			 * Remove all grid spans from the provided item(s)
			 *
			 * @param	{element} 	items 		Items to remove span from
			 * @returns {void}
			 */
			_removeSpans = function (items) {
				for( var i = 1; i <= 12; i++ ){
					items.removeClass( 'ipsGrid_span' + i );
				}
			},

			/**
			 * Adds the given span to the given items
			 *
			 * @param	{element} 	items 		The elements to apply the new span to
			 * @param	{number} 	size 		The new span size
			 * @returns {void}
			 */
			_addSpan = function (items, size) {
				items.addClass( 'ipsGrid_span' + size );
			},

			/**
			 * Change the current span size on the given elements
			 *
			 * @param	{number} 	newSize 	New span size
			 * @returns {void}
			 */
			_changeSpan = function (newSize) {
				if( newSize <= 1 ){
					return;
				}

				var items = _getAll();

				_removeSpans( items );
				_addSpan( items, newSize );

				currentSpan = newSize;
			};

			init();

			return {
				init: init,
				destruct: destruct
			};
		};

		ips.ui.registerWidget( 'grid', ips.ui.grid, [
			'minItemSize', 'maxItemSize', 'items', 'equalHeights'
		] );

		return {
			respond: respond,
			getObj: getObj,
			destruct: destruct
		};
	});
}(jQuery, _));