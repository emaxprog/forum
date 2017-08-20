/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.selectTree.js - Allows users to select values from a dynamic tree select
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.selectTree', function(){

		var defaults = {
			multiple: false,
			selected: false,
			searchable: true,
			placeholder: ips.getString('select')
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_selecttree') ){
				$( elem ).data('_selecttree', selectTreeObj( $( elem ), _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the select tree instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The select tree instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_selecttree') ){
				return $( elem ).data('_selecttree');
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
		 * Select Tree instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var selectTreeObj = function (elem, options) {

			var results = null,
				elemID = null,
				selectedItems = [],
				name = '';

			var init = function () {
				elemID = elem.identify().attr('id');
				results = elem.find('.ipsSelectTree_nodes');
				name = elem.attr('data-name');

				// Events
				elem.on( 'click', _toggleResults );
				elem.on( 'click', '[data-action="getChildren"]', _toggleChildren );
				elem.on( 'click', '[data-action="nodeSelect"]', _toggleNodeSelection );

				if( $('input[name="' + name + '-zeroVal"]') ){
					$('input[name="' + name + '-zeroVal"]').on( 'change', _zeroValChange );
				}

				// Show the placeholder if nothing is selected
				if( options.selected ){
					try {
						var preSelected = $.parseJSON( options.selected );
					} catch( err ) { }

					if( preSelected && _.isObject( preSelected ) && _.size( preSelected ) ){
						_buildPreSelected( preSelected );
						return;
					}
				}

				elem
					.find('.ipsSelectTree_value')
						.addClass('ipsSelectTree_placeholder')
						.text( ( options.placeholder ) ? options.placeholder : ips.getString('select') );

				_zeroValChange();
			},

			/**
			 * Destruct this widget on this element
			 *
			 * @returns {void}
			 */
			destruct = function () {
				$( document ).off('click.' + elemID );
			},

			/**
			 * Builds the values that are already selected
			 *
			 * @param 	{object} 	preSelected 	Object containing pre-selected node data
			 * @returns {void}
			 */
			_buildPreSelected = function (preSelected) {
				if( _.size( preSelected ) ){
					_.each( preSelected, function (val, key) {
						selectedItems.push( key );

						if( options.multiple ){
							var id = key;
							if ( val.id ) {
								id = val.id;
							}
							_addToken( val.title, id );
						} else {
							_setValue( val.title );
						}

						// Check our results panel and select if it exists
						if( results.find('[data-id="' + key + '"]').length ){
							results.find('[data-id="' + key + '"]').addClass('ipsSelectTree_selected');
						}
					});

					_updateSelectedValues();
					
					// Emit event that indicates our initial values are in place
					elem.trigger( 'nodeInitialValues', {
						selectedItems: selectedItems
					});
				}
			},

			/**
			 * Event handler for changing the state of the 'zero val' checkbox
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_zeroValChange = function (e) {
				elem.toggleClass('ipsSelectTree_disabled', $('input[name="' + name + '-zeroVal"]').is(':checked') );

				if( !$('input[name="' + name + '-zeroVal"]').is(':checked') && results.is(':visible') ){
					_closeResults();
				}
			},

			/**
			 * Show or hide children in this node
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_toggleChildren = function (e, ignoreClosed) {
				e.preventDefault();
				e.stopPropagation();

				var item = $( e.currentTarget ).closest('.ipsSelectTree_item');
				var listItem = item.closest('li');
				var id = item.attr('data-id');
				var url = options.url + '&_nodeSelect=children&_nodeId=' + id;

				if( !item.hasClass('ipsSelectTree_withChildren') ){
					// No children to load in this node
					return;
				}

				if( item.hasClass('ipsSelectTree_itemOpen') ){
					if( ignoreClosed !== true ){
						item.removeClass('ipsSelectTree_itemOpen')
						listItem.find('> [data-role="childWrapper"]').hide();
					}
				} else {
					item.addClass('ipsSelectTree_itemOpen');

					// Does this node already have children loaded?
					if( item.attr('data-childrenLoaded') ){	
						ips.utils.anim.go( 'fadeIn fast', listItem.find('> [data-role="childWrapper"]') );
					} else {
						listItem.append( $('<div/>').attr('data-role', 'childWrapper').html( ips.templates.render('core.general.loading', { text: ips.getString('loading') } ) ) );

						// Fetch it
						ips.getAjax()( url )
							.done( function (response) {
								item.attr( 'data-childrenLoaded', true );
								listItem.find('[data-role="childWrapper"]').html( response.output );
								listItem.find('[data-role="childWrapper"] .ipsSelectTree_item').each(function(){
									if ( $(this).attr('data-id') && selectedItems.indexOf( $(this).attr('data-id') ) != -1 ) {
										$(this).addClass('ipsSelectTree_selected');
									}
								});	
							});

					}
				}
			},

			/**
			 * Toggles the selected state of a node
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_toggleNodeSelection = function (e) {
				var node = $( e.currentTarget );

				// Is this node already selected?
				if( node.hasClass('ipsSelectTree_selected') ){
					_unselectNode( node, e );
				} else {
					_selectNode( node, e );
				}

				_updateSelectedValues();
			},

			/**
			 * Selects the provided node
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_selectNode = function (node, e) {				
				// Remove selected class from other nodes
				if( !options.multiple ){
					elem.find('.ipsSelectTree_selected').removeClass('ipsSelectTree_selected');
				}

				// Add our selected class
				node.addClass('ipsSelectTree_selected');

				var title = node.find('[data-role="nodeTitle"]').text();
				var id = node.attr('data-id');

				// Add the value to the select box
				if( !options.multiple ){
					_setValue( title );
				} else {
					_addToken( title, id );
				}

				// Add value to our array
				if( options.multiple ){
					selectedItems.push( node.attr('data-id') );
				} else {
					selectedItems = [ node.attr('data-id') ];
				}

				// If this node has children, we'll also load them
				if( e ){
					_toggleChildren(e, true);
				}

				// Emit event that node items have been updated
				elem.trigger( 'nodeItemSelected', {
					title: title,
					id: id
				});

				// If we aren't allowing multiple selections, close the widget now
				if( !options.multiple && !node.hasClass('ipsSelectTree_withChildren') ){
					setTimeout( function () {
						_closeResults();
					}, 200 );
				}
			},

			/**
			 * Unselects the provided node
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_unselectNode = function (node, e) {
				// Remove selected class from this node
				node.removeClass('ipsSelectTree_selected');

				// Remove value from our selected items
				selectedItems = _.without( selectedItems, node.attr('data-id') );
				
				// Emit event that node items have been updated
				elem.trigger( 'nodeItemUnselected', {
					title: node.find('[data-role="nodeTitle"]').text(),
					id: node.attr('data-id')
				});
				
				if( !options.multiple ){
					_setValue();
				} else {
					_removeToken( node );
				}
			},

			/**
			 * Adds a token to the select
			 *
			 * @param 	{string} 	value 		Value to set
			 * @returns {void}
			 */
			_addToken = function (title, id) {
				var valueElem = elem.find('.ipsSelectTree_value');
				var elemHeight = elem.outerHeight();

				if( !elem.find('[data-role="tokenList"]').length ){
					valueElem.html( $('<ul/>').addClass('ipsList_inline').attr('data-role', 'tokenList' ) );
				}

				elem.find('[data-role="tokenList"]').append( ips.templates.render('core.selectTree.token', {
					title: title,
					id: id
				}) );

				// Recheck the height
				if( elemHeight != elem.outerHeight() ){
					_positionResults();
				}
			},

			/**
			 * Removes a token from the selector
			 *
			 * @param 	{string} 	value 		Value to set
			 * @returns {void}
			 */
			_removeToken = function (node) {
				var id = node.attr('data-id');
				var tokenList = elem.find('[data-role="tokenList"]');
				var elemHeight = elem.outerHeight();

				// Find the token
				var token = tokenList.find('[data-nodeId="' + id + '"]').closest('li').remove();

				if( !tokenList.find('[data-nodeId]').length ){
					tokenList.remove();
					_setValue();
				}

				// Recheck the height
				if( elemHeight != elem.outerHeight() ){
					_positionResults();
				}

			},

			/**
			 * Updates the hidden form field containing our current values
			 *
			 * @returns {void}
			 */
			_updateSelectedValues = function () {
				elem.find('[data-role="nodeValue"]').val( _.uniq( selectedItems ).join(',') );

				// Emit event that node items have been updated
				elem.trigger( 'nodeSelectedChanged', {
					selectedItems: selectedItems
				});
			},

			/**
			 * Changes the value of the select box
			 *
			 * @param 	{string} 	value 		Value to set
			 * @returns {void}
			 */
			_setValue = function (value) {
				if( value ){
					elem.find('.ipsSelectTree_value').text( value ).removeClass('ipsSelectTree_placeholder');
				} else {
					elem.find('.ipsSelectTree_value').text( ( options.placeholder ) ? options.placeholder : ips.getString('select') ).addClass('ipsSelectTree_placeholder');
				}
			},

			/**
			 * Toggle showing the results list
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_toggleResults = function (e) {
				if( results.is(':visible') ){
					_maybeHideResults(e);
				} else {
					_showResults(e);
				}
			},

			/**
			 * Hides the results panel if the click is not within the results (i.e. if it's on the select itself)
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_maybeHideResults = function (e) {
				var rawResults = results.get(0);

				if( ( !$.contains( rawResults, e.target ) && rawResults != e.target ) ){
					_closeResults();
				}
			},

			/**
			 * Closes the results list
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_closeResults = function () {
				ips.utils.anim.go( 'fadeOut fast', results );
				$( document ).off('click.' + elemID );
				elem.removeClass('ipsSelectTree_active');
				elem.trigger( 'nodeSelectionClosed' );
			},

			/**
			 * Show the results list
			 *
			 * @returns {void}
			 */
			_showResults = function () {
				$( document ).on('click.' + elemID, _closeResultsOnBlur );

				_positionResults();

				results.show();

				elem.addClass('ipsSelectTree_active');

				// Focus the text box if searching is enabled
				if( elem.find('[data-role="nodeSearch"]') ){
					elem.find('[data-role="nodeSearch"]').focus();
				}
			},

			/**
			 * Position the results panel so that it appears attached to the select
			 *
			 * @returns {void}
			 */
			_positionResults = function () {
				// Get position of select box
				var positionInfo = {
					trigger: elem,
					target: results,
					targetContainer: elem
				};

				var selectWidth = elem.outerWidth();
				var resultsPosition = ips.utils.position.positionElem( positionInfo );

				results.css({
					left: -parseFloat( results.css('borderLeftWidth') ) - parseFloat( results.css('marginLeft') ),
					position: 'absolute',
					zIndex: ips.ui.zIndex(),
					minWidth: selectWidth + 'px'
				});
			},

			/**
			 * Close the results list when the element is blurred
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			_closeResultsOnBlur = function (e) {
				if( !_clickIsInElem( e.target ) ){
					_closeResults();
				}
			},

			/**
			 * Determines whether the provided target element is contained within the select or results list
			 *
			 * @param 	{element} 	target 		Target element
			 * @returns {boolean}
			 */
			_clickIsInElem = function (target) {
				var rawElem = elem.get(0);
				var rawResults = results.get(0);

				if( target == rawElem || target == rawResults || $.contains( rawResults, target ) || $.contains( rawElem, target ) ){
					return true;
				}

				return false;
			};

			init();

			return {
				destruct: destruct
			};
		};

		ips.ui.registerWidget( 'selectTree', ips.ui.selectTree, [
			'placeholder', 'multiple', 'selected', 'url', 'searchable'
		] );

		return {
			respond: respond,
			destruct: destruct
		};
	});
}(jQuery, _));