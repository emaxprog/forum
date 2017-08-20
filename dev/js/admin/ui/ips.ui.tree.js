/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.tree.js - Tree widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.tree', function(){

		var defaults = {
			openClass: 'ipsTree_open',
			closedClass: 'ipsTree_closed',
			searchable: false,
			sortable: true
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_tree') ){
				$( elem ).data('_tree', treeObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		ips.ui.registerWidget( 'tree', ips.ui.tree, [
			'openClass', 'closedClass', 'searchable', 'results', 'url', 'sortable', 'lockParents', 'protectRoots'
		]);

		return {
			respond: respond
		};
	});

	/**
	 * Tree instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var treeObj = function (elem, options, e) {

		var _timer = null;
		var _searchAjax = null;
		var _currentParentOver = null;


		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {

			if( !options.url ){
				Debug.error( "No URL provided for tree widget on " + elem.identify().attr('id') );
			}

			// Add a class to this widget so we can show/hide appropriate elements
			elem.addClass('ipsTree_js');
			
			// Set up sortables
			if( options.sortable ){
				_makeSortable();
			}
			/*$( elem ).find('.ipsTree_node').each( function () {
				_makeSortable( $( this ) );
			});*/


			// Set up events
			elem.on( 'click', '.ipsTree_parent:not( .ipsTree_noToggle )', _toggleRow ); 

			if( options.searchable && $( options.searchable ).length ){
				$( options.searchable )
					.on( 'keydown', _searchKeyPress )
					.on( 'search', _doSearch );
			}
		},

		/**
		 * Event handler for searching the tree
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		_searchKeyPress = function (e) {
			clearTimeout( _timer );
			_timer = setTimeout( _doSearch, 500 );
		},

		/**
		 * Executes a search
		 *
		 * @returns 	{void}
		 */
		_doSearch = function () {

			// Abort existing ajax if possible
			if( _searchAjax && _searchAjax.abort ){
				_searchAjax.abort();
			}

			var value = $.trim( $( options.searchable ).val() );
			var searchPane = elem.find('[data-role="treeResults"]');
			var listPane = elem.find('[data-role="treeListing"]');

			if( !_.isEmpty( value ) ){
				// Show results pane
				listPane.hide();
				searchPane.show();

				// Set loading
				searchPane.html( ips.templates.render('core.trees.loadingPane') );

				// Do the search
				_searchAjax = ips.getAjax()( options.url + '&do=search', {
					data: {
						input: value
					}
				})
					.done( function (response) {
						// Show rows if there were results
						if( _.isEmpty( $.trim( response ) ) ){
							searchPane.html( ips.templates.render('core.trees.noRows') );
						} else {
							searchPane.html( response );
							$( document ).trigger( 'contentChange', [ searchPane ] );							
						}
					});

			} else {
				listPane.show();
				searchPane.hide().html('');
			}
		},

		/**
		 * Event handler for clicking on a row
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		_toggleRow = function (e) {
			var target = $( e.target );
			var row = $( e.currentTarget );
			
			if( target.closest('.ipsTree_controls').length || target.closest('[data-ipsStatusToggle]').length ){
				return;
			}

			if( row.hasClass( options.openClass ) ){
				_closeRow( row );
			} else {
				_openRow( row );
			}
		},

		/**
		 * Closes an open row
		 *
		 * @param 		{element} 	row 	The row to close
		 * @returns 	{void}
		 */
		_closeRow = function (row) {
			row.removeClass( options.openClass ).addClass( options.closedClass );

			var realRow = row.closest('[data-role="node"]');
			var rowID = realRow.find('[data-nodeid]').first().attr('data-nodeid');

			if( realRow.find('> ol').length ){
				ips.utils.anim.go( 'fadeOut fast', realRow.find('> ol') );
			}
		},

		/**
		 * Opens a closed row
		 *
		 * @param 		{element} 	row 	The row to open
		 * @returns 	{void}
		 */
		_openRow = function (row) {
			row.removeClass( options.closedClass ).addClass( options.openClass );

			var realRow = row.closest('[data-role="node"]');
			var rowID = realRow.find('[data-nodeid]').first().attr('data-nodeid');
			realRow.attr('data-nodeid', rowID);

			if( _.isUndefined( rowID ) ){
				Debug.warn( 'No rowID for row ' + realRow.identify().attr('id') );
				return;
			}

			// Do we have results loaded or loading? Show them immediately if so
			if( realRow.data('_childrenLoaded') || realRow.data('_childrenLoading') ){
				ips.utils.anim.go('fadeInDown fast', realRow.find('> ol') );
				return;
			} 

			// Not loaded or loading, so we need to do that here
			// First build the loading box
			var loading = ips.templates.render('core.trees.loadingRow');
			var content = ips.templates.render('core.trees.childWrapper', {
				content: loading
			});

			// Set to loading, append loading content
			realRow
				.data('_childrenLoading', true)
				.append( content );

			// Fetch real content
			ips.getAjax()( options.url + '&root=' + rowID )
				.done( function (response) {

					realRow.find('> ol').remove();
					realRow.find('> .ipsTree_row').after( response );

					realRow
						.data('_childrenLoaded', true)
						.removeData('_childrenLoading');

					// Now animate
					ips.utils.anim.go( 'fadeInDown', realRow.find('> ol') );

					// Let document know
					$( document ).trigger( 'contentChange', [ realRow ] );

					// Are we sorting?
					if( options.sortable ){
						elem.find('.ipsTree_rows > .ipsTree').nestedSortable('refresh');
						elem.find('.ipsTree_rows > .ipsTree').nestedSortable('refreshPositions');
						//_makeSortable( realRow.find('.ipsTree_node') );
					}
				})
				.fail( function () {
					window.location = options.url + '&root=' + rowID;
				});
		},

		_checkParentStatus = function () {
			Debug.log( 'check parent status' );

			// Find each tree row and loop
			elem.find('.ipsTree_row:not( .ipsTree_root )').each( function () {
				var row = $( this );

				// Ignore if the row is closed since we don't know what's inside it
				if( row.hasClass('ipsTree_parent') && !row.hasClass('ipsTree_open') ){
					return;
				}

				var subList = row.siblings('ol');
				var currentlyParent = row.is('ipsTree_parent');
				var hasChildren = subList.find('> li').length > 0;

				Debug.log( 'sublist: ');
				Debug.log( subList );

				row.toggleClass('ipsTree_parent', hasChildren );

				if( hasChildren && !currentlyParent ){
					row.addClass('ipsTree_open');
				}

				// sortable removes the <ol> if it's now empty, so we need to add it back here
				// so that the user can carry on sorting properly
				if( row.hasClass('ipsTree_acceptsChildren') && !subList.length ){
					var newRow = $('<ol/>').addClass('ipsTree ipsTree_node');
					row.after( newRow );
					//newRow.find('li').remove();
				}
			});
		},

		/**
		 * Makes the tree sortable
		 *
		 * @returns 	{void}
		 */
		_makeSortable = function () {
			var sortableOptions = {
				placeholder: 'sortable-placeholder',
				handle: '.ipsTree_dragHandle',
				items: '[data-role="node"]',
				excludeRoot: true,
				update: function (event, ui) {
					var url = options.url + '&do=reorder';
					var rootID = elem.find('.ipsTree_root').attr('data-nodeid');
					var data = '';

					// We need to run this after a short delay to let sortable clean itself up first
					setTimeout( function () {
						_checkParentStatus();	
					}, 200);					

					if( rootID ){
						url += '&root=' + rootID;
					}

					// If we have a root item (that isn't technically part of the tree) we can't
					// use the standard serialize method or all items have the value null. Instead
					// we have to build a manual param string and replace null with the parent id.
					if( rootID ){
						var dataArray = $( this ).nestedSortable( 'toArray', { key: 'ajax_order'} );
						var outputArray = [];

						for( var i = 0; i < dataArray.length; i++ ){
							outputArray.push( 'ajax_order[' + dataArray[i].item_id + ']=' + ( ( dataArray[i].parent_id == null ) ? rootID : dataArray[i].parent_id ) );
						}

						data = outputArray.join('&');
					} else {
						data = $( this ).nestedSortable( 'serialize', { key: 'ajax_order' } );	
					}
					
					ips.getAjax()( url, {
						data: data
					})
						.fail( function () {
							window.location = url + "&" + data;
						});
				},
				toleranceElement: '> div',
				listType: 'ol',
				isTree: true,
				// Called by nestedSortable to determine whether an item can be dragged into
				// the current location. We check for the ipsTree_acceptsChildren class which
				// indicates it can be a parent item.
				isAllowed: function (placeholder, placeholderParent, currentItem) {
					// Hide tooltip
					$('#ipsTooltip').hide();

					var parent = null;

					// Find nearest list
					if( placeholderParent === null ){
						parent = elem.find('> .ipsTree_root');
					} else {
						parent = placeholderParent.closest('[data-role="node"]').find('> .ipsTree_row');	
					}			
					
					if( parent.hasClass('ipsTree_acceptsChildren') || ( !parent.length && !currentItem.find('> .ipsTree_row').hasClass('ipsTree_noRoot') ) ) {
						
						console.log( currentItem );
						
						placeholder.removeAttr('data-error');
						return true;
					} else {
						console.log('no');
						placeholder.attr('data-error', ips.getString('cannotDragInto') );
						return false;
					}
				},
				// This method is triggered by nestedSortable, and we piggy pack on it to call our _openRow
				// method to load closed nodes. _openRow calls the refresh() method of nestedSortable to enable
				// the item currently being dragged to be dropped in the newly-opened list. Phew.
				expand: function (event, ui) {
					var row = $( this ).find('.mjs-nestedSortable-hovering > .ipsTree_parent[data-nodeid]');

					if( !row.hasClass('ipsTree_open') ){
						_openRow( row );	
					}					
				},
				// Triggered when the dom position of the item changes.
				// We highlight the parent of the new position so it's clearer to users where the item is going
				change: function (event, ui) {
					// Remove the class from everywhere first
					$( this ).find('.ipsTree_draggingInto').removeClass('ipsTree_draggingInto');

					// Find the nearest list
					ui.placeholder.closest('[data-role="node"]').find('> .ipsTree_row').addClass('ipsTree_draggingInto');
				},
				// Triggered when dragging starts
				// Highlight the current parent
				start: function (event, ui) {
					// Find the nearest list
					ui.placeholder.closest('[data-role="node"]').find('> .ipsTree_row').addClass('ipsTree_draggingInto');
				},
				// Triggered when dragging stops
				// Remove all parent highlights
				stop: function (event, ui) {
					$( this ).find('.ipsTree_draggingInto').removeClass('ipsTree_draggingInto');
				}
			};

			// Locks the parents, allowing any items to be reordered but not moved out of their current list
			if( options.lockParents ){
				sortableOptions['disableParentChange'] = true;
			}

			// Protects the root items, preventing them from being turned into subitems, or subitems to be turned into roots
			if( options.protectRoots ){
				sortableOptions['protectRoot'] = true;
			}

			// Create the sortable
			elem.find('.ipsTree_rows > .ipsTree').nestedSortable( sortableOptions );
		};

		init();

		return {
			init: init
		};
	};
}(jQuery, _));