/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.patchwork.js - Turns a list of items into a patchwork, evenly distributed across equal columns
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.patchwork', function(){

		var defaults = {
			items: '[data-role="patchworkItem"]',
			minColSize: 300,
			maxColSize: 600
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_patchwork') ){
				$( elem ).data('_patchwork', patchWorkObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the patchwork instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The patchwork instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_patchwork') ){
				return $( elem ).data('_patchwork');
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
		 * Patchwork instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var patchWorkObj = function (elem, options) {
			var currentColCount = 1;
			var possibleSizes = [ 1, 2, 3, 4, 6, 12 ]; // Since we're doing an even grid
			var containerList = null;
			var itemList = null;
			var items = null;

			/**
			 * Initialization: get the current span, and make sure all items are using it for consistency
			 *
			 * @returns {void}
			 */
			var init = function () {
				// Get all the items in the list
				itemList = elem.find('[data-role="patchworkList"]');
				items = itemList.find( options.items );
				
				items.each( function (idx) {
					$( this ).attr( 'data-position', idx );
				});

				// Build new list
				_buildList();

				// Window resize event which keeps everything at the right size
				$( window ).on( 'resize', _checkItemWidth );
			},

			/**
			 * Destruct this widget on this element
			 *
			 * @returns {void}
			 */
			destruct = function () {
				$( window ).off( 'resize', _checkItemWidth );
			},

			/**
			 * Redraws the layout, adding new list items and distributing the patchwork items among them
			 *
			 * @param 	{boolean} 	force 	If true, the items will be redrawn even if the column count hasn't changed
			 * @returns {void}
			 */
			_redrawLayout = function (force) {

				// Hide all list items
				var columnElems = containerList.find('> [class*="ipsGrid_span"]').hide();				
				var elemSize = elem.outerWidth();
				var columns = Math.ceil( elemSize / options.maxColSize );

				if( possibleSizes.indexOf( columns ) === -1 ){
					columns = _getCorrectColumnCount( columns );
				}

				if( currentColCount === columns && force !== true ){
					columnElems.show();
					return;
				}

				// Hide the items
				items.css({
					'opacity': 0.001
				});

				var spanClass = _getSpanFromCount( columns );

				// Now add the new columns
				for( var i = 0; i < columns; i++ ){
					containerList.append( $('<li/>').addClass( 'ipsGrid_span' + spanClass ).attr('data-working', true) );
				}

				currentColCount = columns;

				// Sort items by position
				var currentItems = _.sortBy( items, function (item) {
					return parseInt( $( item ).attr('data-position') );
				});

				_distributeItems( currentItems );

				// Remove other list items
				containerList.find('> [class*="ipsGrid_span"]:not( [data-working] )').remove();
				containerList.find('> [data-working]').removeAttr('data-working');

				// Show the items
				setTimeout( function () {
					items.animate({
						opacity: 1
					});
				}, 250 );

			},

			/**
			 * Distributes the items as evenly as possible between columns
			 *
			 * @returns {void}
			 */
			_distributeItems = function (currentItems) {
				// Get columns
				var columns = containerList.find('> [class*="ipsGrid_span"][data-working]');
				var itemCount = currentItems.length;
				var heights = [];
				var isLastRow = false;

				columns.each( function () {
					heights.push( {
						column: $( this ),
						height: 0
					});
				});

				_.each( currentItems, function (item, idx) {
					// Determine if this item starts our last row
					if( ( ( itemCount - ( idx + 1 ) ) % columns.length === 0 ) && ( idx >= itemCount - columns.length ) ){
						isLastRow = true;
					}

					//Debug.log( isLastRow  );
					// Get column with shortest height
					var shortest = _.min( heights, function (value) {
						return value.height;
					});

					// Move item to shortest column
					if( shortest ){
						shortest.column.append( $( item ) );
						// Add height
						shortest.height += $( item ).outerHeight();
					}
				});
			},

			/**
			 * Builds the list into which patchwork items will be distributed
			 *
			 * @returns {void}
			 */
			_buildList = function () {
				var elemSize = elem.outerWidth();

				containerList = $('<ul/>').addClass('ipsGrid ipsGrid_collapsePhone ipsPatchwork');
				itemList.after( containerList );

				_redrawLayout( true );
			},

			/**
			 * Returns the CSS class span for the given column count (e.g. 2 visual columns spans 6 grid columns)
			 *
			 * @returns {number} 	Span number
			 */
			_getSpanFromCount = function (columns) {
				return possibleSizes[ ( possibleSizes.length - 1 ) - possibleSizes.indexOf( columns ) ];
			},

			/**
			 * Returns a valid column count. Using a 12-column grid system, certain values are not supported (e.g. 5).
			 * This method finds the closest valid column number.
			 *
			 * @returns {number} 	Valid column count
			 */
			_getCorrectColumnCount = function (columns) {
				if( columns > 12 ){
					return 12;
				}

				for( var i = 0; i <= possibleSizes.length; i++ ){
					if( columns == possibleSizes[ i ] ){
						return possibleSizes[ i ];
					}

					if( columns > i && columns <= possibleSizes[ i + 1 ] ){
						var diffA = columns - i;
						var diffB = possibleSizes[ i + 1 ] - columns;

						if( diffA > diffB ){
							return possibleSizes[ i + 1 ];
						} else {
							return possibleSizes[ i ];
						}
					}
				}
			},

			/**
			 * Return the first grid item
			 *
			 * @returns {element} 	First grid item
			 */
			_getFirst = function () {
				return elem.find('[data-role="patchwordGrid"] > [class*="ipsGrid_span"]').first();
			},

			/**
			 * Checks the column width, and if it's less or more than our min/max widths, apply a new span
			 *
			 * @returns {void}
			 */
			_checkItemWidth = function () {
				var firstItem = _getFirst();

				if( options.minColSize && firstItem.outerWidth() < parseInt( options.minColSize ) || options.maxItemSize && firstItem.outerWidth() >= parseInt( options.maxItemSize ) ){
					_redrawLayout();
				}
			};

			init();

			return {
				init: init,
				destruct: destruct
			};
		};

		ips.ui.registerWidget( 'patchwork', ips.ui.patchwork, [
			'minColSize', 'maxColSize', 'items'
		] );

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});
}(jQuery, _));