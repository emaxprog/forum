/* global ips, _, Debug */
/**
 * IPS 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.contentItem.js - Autocomplete widget for text fields
 *
 * Author: MTM and Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.contentItem', function(){

		var defaults = {
			multiValues: true,
			unique: false,
			fieldTemplate: 'core.contentItem.field',
			resultsTemplate: 'core.contentItem.resultWrapper',
			resultItemTemplate: 'core.contentItem.resultItem',
			itemTemplate: 'core.contentItem.item',
			queryParam: 'q',
			minAjaxLength: 1
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_contentItem') ){
				$( elem ).data('_contentItem', contentItemObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Destruct the autocomplete widget on this elem
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		},

		/**
		 * Retrieve the  instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The dialog instance or undefined
		 */
		getObj = function (elem) {
			elem = $( elem );

			if( elem.data('_contentItem') ){
				return elem.data('_contentItem');
			} else if(  $( '[name="' + elem.attr('name') + '_original' + '"]' ).length &&  $( '[name="' + elem.attr('name') + '_original' + '"]' ).data('_contentItem') ){
				return  $( '[name="' + elem.attr('name') + '_original' + '"]' ).data('_contentItem');
			}

			return undefined;
		};

		ips.ui.registerWidget('contentItem', ips.ui.contentItem, 
			[ 'resultsTemplate', 'resultItemTemplate', 'itemTemplate', 'queryParam', 'dataSource', 'maxItems', 'minAjaxLength' ]
		);

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});

	/**
	 * Content item instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var contentItemObj = function (elem, options, e) {

		var timer,
			blurTimer,
			lastValue = '',
			originalTextField,
			valueField,
			hiddenValueField,
			itemListWrapper,
			textField,
			dataSource,
			elemID = $( elem ).identify().attr('id'),
			wrapper,
			inputItem,
			resultsElem,
			disabled = false,
			required = false,
			tooltip = null,
			tooltipTimer = null;

		/**
		 * Sets up this instance. The datasource object is chosen depending on what options and/or
		 * attributes are provided.
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			if( $( elem ).is('input[type="text"], input[type="search"]') ){
				originalTextField = $( elem );
			} else {
				originalTextField = $( elem ).find('input[type="text"], input[type="search"]').first();
			}

			// Add our autocomplete wrapper to the page, and move the element into it
			_buildWrapper();

			// Set up the data source for this control
			_getDataSource();

			// Remove list from original field
			originalTextField.removeAttr('list');

			// Build the list
			_buildResultsList();

			if( originalTextField.is(':disabled') ){
				disabled = true;
			}

			if( originalTextField.is('[required]') ){
				required = true;
				originalTextField
					.removeProp('required')
					.removeAttr('aria-required');
			}

			// Turn off autocomplete and spellcheck so the browser menu doesn't get in the way
			textField
				.prop( 'autocomplete', 'off' )
				.prop( 'spellcheck', false )
				.prop( 'disabled', disabled )
				.attr( 'aria-autocomplete', 'list' )
				.attr( 'aria-haspopup', 'true' )
				.attr( 'tabindex', originalTextField.attr('tabindex') || '' );

            $( document ).on( 'click', _documentClick );

            wrapper.click(function(e) {
                e.stopPropagation();
                return false;
            });

			// Set up events
			textField
				.on( 'focus', _focusField )
				.on( 'blur', _blurField )
				.on( 'keydown', _keydownField )

			wrapper
				.on( 'click', _clickWrapper )
				.on( 'keydown', _keydownWrapper )
				.on( 'propChanged', _propChanged )
				.toggleClass( 'ipsField_autocompleteDisabled', disabled );
			
			elem.trigger( 'autoCompleteReady', {
				elemID: elemID,
				elem: elem,
				currentValues: contentItems.getValues()
			});
		},
		
		/**
		 * Destruct
		 * Removes event handlers assosciated with this instance
		 *
		 * @returns {void}
		 */
		destruct = function () {
			$( document ).off( 'click', _documentClick );
		},

		/**
 		 * Responds to the propChange event, which we use to determine whether the original field has been toggled
		 *
		 * @returns {void}
		 */
		_propChanged = function (e) {
			disabled = originalTextField.is(':disabled');

			wrapper.toggleClass( 'ipsField_autocompleteDisabled', disabled );
		},

		/**
 		 * Builds the element that results will appear in
		 *
		 * @returns {void}
		 */
		_buildResultsList = function () {

			if( options.resultsElem && $( options.resultsElem ).length ){
				resultsElem = $( options.resultsElem );
				return;
			}

			var resultsList = ips.templates.render( options.resultsTemplate, {
				id: elemID
			});

			wrapper.append( resultsList );

			resultsElem = $('#' + elemID + '_results');

			resultsElem
				.on('mouseover', '[data-id]', function (e) {
					results.select( $( e.currentTarget ) );
				})
				.on('click', '[data-id]', function (e) {
					_addContentItem( $( e.currentTarget ) );
					textField.focus();
				})
				.attr( 'aria-busy', 'false' );
		},

		/**
 		 * Builds the wrapper element that looks like a text input, but allows us to search for items
		 * @returns {void}
		 */
		_buildWrapper = function () {
			var existingClasses = elem[0].className;
			
			$( elem )
				.after( ips.templates.render( options.fieldTemplate, {
					id: elemID
				}))
				.removeClass( existingClasses );

			wrapper = $( '#' + elemID + '_wrapper' );
			inputItem = $( '#' + elemID + '_inputItem' );

			var insertElem = $('<input/>').attr( {
				type: 'text',
				id: elemID + '_dummyInput'
			})
			.prop( 'autocomplete', 'off' );

			textField = insertElem;
			
			// Make a copy of the original text field using its name. This is because it's difficult to set
			// arbitrary values in the original text field later if it's associated with a datalist.
			var name = originalTextField.attr('name');

			originalTextField.attr( 'name', originalTextField.attr('name') + '_original' );
			valueField = $('<input/>').attr( 'name', name ).hide();
			hiddenValueField = $('input[name=' + name + '_values]');
			itemListWrapper = $('[data-contentitem-results=' + name + ']');
			
			originalTextField.hide();

			// Move any classnames on the original element onto our new wrapper to maintain styling,
			// then move the original element into our reserved list element
			wrapper
				.addClass( existingClasses )
				.append( elem )
				.append( valueField )
				.find('#' + elemID + '_inputItem')
					.append( insertElem );
			
			if ( options.maxItems && contentItems.total() >= options.maxItems )
			{
				wrapper.hide();
			}
				
			// Set events for clicking on item
			itemListWrapper
				.on('click', '[data-action="delete"]', function (e) {
					_deleteContentItem( $( e.currentTarget ).parent('[data-id]') );
				});
		},

		/**
 		 * Gets the apprioriate data source for this control
		 *
		 * @returns {void}
		 */
		_getDataSource = function () {
			if( ips.utils.validate.isUrl( options.dataSource ) ){
				dataSource = remoteData( options.dataSource, options );
			} else {
				dataSource = noData();
			}
		},

		/**
 		 * When the wrapper is clicked, we see if a item was clicked. If it was, select it. If not, focus the textbox.
		 *
		 * @returns {void}
		 */
		_clickWrapper = function (e) {
			if( !$( e.target ).is( textField ) && ( !resultsElem || !$.contains( resultsElem.get(0), e.target ) ) ){
				textField.focus();
			}
		},

		/**
 		 * Event handler for focusing on the text field
		 *
		 * @returns {void}
		 */
		_focusField = function (e) {
			if( dataSource.type == 'none' ){
				return;
			}

			timer = setInterval( _timerFocusField, 400 );
		},

		/**
 		 * Event handler for blurring on the text field
		 *
		 * @returns {void}
		 */
		_blurField = function (e) {
			clearInterval( timer );

			_.delay( _timerBlurField, 300 );
		},

		/**
 		 * Timed event hides the results list
		 *
		 * @returns {void}
		 */
		_timerBlurField = function () {
			
			_closeResults();
		},

		/**
 		 * Timed event, checks whether the value has changed, and fetches the results
		 *
		 * @returns {void}
		 */
		_timerFocusField = function () {
			if( dataSource.type == 'none' ){
				return;
			}

			// Fetch the current item value
			var currentValue = _getCurrentValue();

			// If the value hasn't changed, we can leave
			if( currentValue == lastValue ){
				return;
			}

			lastValue = currentValue;

			_loadResults( currentValue );
		},

		/**
 		 * Requests results from the data source, and shows/hides the loading widget
 		 * while that is happening.
		 *
		 * @returns {void}
		 */
		_loadResults = function (value) {
			_toggleLoading('show');

			// Set elem to busy
			resultsElem.attr( 'aria-busy', 'true' );

			// Get the results
			dataSource.getResults( value )
				.done( function (results) {
					// Show the results after processing them
					_showResults( _processResults( results, value ) );
				})
				.fail( function () {

				})
				.always( function () {
					resultsElem.attr( 'aria-busy', 'false' );
					_toggleLoading('hide');
				});
		},

		/**
 		 * Toggles the loading thingy in the control to signify data is loading
		 *
		 * @param 	{string} 	doWhat 	 Acceptable values: 'show' or 'hide'
		 * @returns {void}
		 */
		_toggleLoading = function (doWhat) {
			if( doWhat == 'show' ){
				wrapper.addClass('ipsField_loading');
			} else {
				wrapper.removeClass('ipsField_loading');
			}
		},

		/**
 		 * Closes the suggestions menu, sets the aria attrib, and tells the data source
 		 * to stop loading new results
		 *
		 * @returns {void}
		 */
		_closeResults = function (e) {
			if( e ){
				e.preventDefault();
			}

			if( resultsElem && resultsElem.length ){
				resultsElem
					.hide()
					.attr('aria-expanded', 'false');	
			}		

			dataSource.stop();
		},

		/**
 		 * Handles a click on the document, closing the results dropdown
		 *
		 * @returns {void}
		 */
		_documentClick = function () {
			_closeResults();
		},

		/**
 		 * Processes the results that are returned by the data source
		 *
		 * @returns {void}
		 */
		_processResults = function (results, text) {
			var existingItems = contentItems.getValues(),
				newResults = {};

			$.each( results, function (key, data) {
				if( !data.id || _.indexOf( existingItems, data.id ) === -1 ){
					newResults[ key ] = data;
				}
			});

			return newResults;
		},

		/**
 		 * Gets the current item value from the text field
		 *
		 * @returns {string}
		 */
		_showResults = function (results) {

			var output = '';

			$.each( results, function (idx, value) {
				output += ips.templates.render( options.resultItemTemplate, value );
			});
		
			if( resultsElem.attr('id') == ( elemID + '_results' ) ){
				_positionResults();
			}

			resultsElem
				.show()
				.html( output )
				.attr('aria-expanded', 'true');
		},

		/**
 		 * Sizes and positions the results menu to match the wrapper
		 *
		 * @returns {void}
		 */
		_positionResults = function () {

			resultsElem.css( {
				width: wrapper.outerWidth() + 'px'
			});

			var positionInfo = {
				trigger: wrapper,
				targetContainer: wrapper,
				target: resultsElem,
				center: false
			};

			var resultsPosition = ips.utils.position.positionElem( positionInfo );

			$( resultsElem ).css({
				left: '0px',
				top: resultsPosition.top + 'px',
				position: ( resultsPosition.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});
		},

		/**
 		 * Gets the current item value from the text field
		 *
		 * @returns {string}
		 */
		_getCurrentValue = function () {
			var value = textField.val();
			return value;
		},

		/**
 		 * Event handler for keydown event in wrapper.
 		 * We check for esape here, because if options.freeChoice is disabled, there's no textbox to
 		 * watch for events. By watching for escape on the wrapper, we can still close the menu.
		 *
		 * @returns {void}
		 */
		_keydownWrapper = function (e) {
			if( e.keyCode == ips.ui.key.ESCAPE ){
				keyEvents.escape(e);
			}
		},

		/**
 		 * Event handler for keydown event in text field
		 *
		 * @returns {void}
		 */
		_keydownField = function (e) {
			_expandField();
			var ignoreKey = false;

			// Ignore irrelevant keycodes
			if( !_( [ ips.ui.key.UP, ips.ui.key.DOWN, ips.ui.key.ESCAPE, ips.ui.key.ENTER
					 ] ).contains( e.keyCode ) ){
				ignoreKey = true;
			}
			
			var value = $.trim( textField.val() );
			
			if( ignoreKey ){
				return;
			}
			
			switch(e.keyCode){
				// Suggestions keys
				case ips.ui.key.UP:
					keyEvents.up(e);
				break;
				case ips.ui.key.DOWN:
					keyEvents.down(e);
				break;
				case ips.ui.key.ESCAPE:
					keyEvents.escape(e);
				break;
				case ips.ui.key.ENTER:
					keyEvents.enter(e);
				break;
			}
		},

		/**
 		 * A wrapper method for contentItems.add which also clears the text field
 		 * and hides it if options.maxItems is reached
		 *
		 * @returns {void}
		 */
		_addContentItem = function (elem) {
			contentItems.add( elem );
			textField.val('');
			lastValue = '';
			_resetField();

			if( options.maxItems && contentItems.total() >= options.maxItems ){
				wrapper.hide();
			}
		},

		/**
 		 * A wrapper method for contentItems.remove which shows the text field if we're under
 		 * our options.maxItems limit
		 *
		 * @returns {void}
		 */
		_deleteContentItem = function (item) {
			if( disabled ){
				return;
			}
			
			contentItems.remove( item );
		},

		/**
 		 * Object containing event handlers bound to individual keys
 		 */
		keyEvents = {

			/**
	 		 * Handler for 'up' key press. Selects previous item in the results list.
			 *
			 * @returns {void}
			 */
			up: function (e) {
				if( !resultsElem || !resultsElem.is(':visible') ){
					return;
				}

				e.preventDefault();

				var selected = results.getCurrent();				

				if( !selected ){
					results.selectLast();
				} else {
					var prev = results.getPrevious( selected );

					if( prev ){
						results.select( prev );
					} else {
						results.selectLast();
					}
				}
			},

			/**
	 		 * Handler for 'down' key press. Selects next item in the results list.
			 *
			 * @returns {void}
			 */
			down: function (e) {
				if( !resultsElem || !resultsElem.is(':visible') ){
					return;
				}

				e.preventDefault();

				var selected = results.getCurrent();
				
				if( !selected ){
					results.selectFirst();
				} else {
					var next = results.getNext( selected );

					if( next ){
						results.select( next );
					} else {
						results.selectFirst();
					}
				}

			},
			
			/**
	 		 * Enter/tab handler. If text has been entered, we add it as a item, otherwise pass through
	 		 * to the browser to handle.
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void,boolean} 		
			 */
			enter: function (e) {
				e.preventDefault();

				var currentResult = results.getCurrent();
				var value = '';

				if( currentResult ){
					value = currentResult.attr('data-id');
				}
				
				if( !value ){
					return false;
				}

				_addContentItem( currentResult );
			},

			/**
	 		 * Handler for 'escape' key press. Closes the suggestions menu, if it's open.
			 *
			 * @returns {void}
			 */
			escape: function (e) {
				if( resultsElem && resultsElem.is(':visible') ){
					_closeResults();
				}
			}

		},

		/**
 		 * Object containing methods for dealing with the results list.
 		 */
		results = {

			/**
	 		 * Deselects any selected results
			 *
			 * @returns {void}
			 */
			deselectAll: function () {
				resultsElem
					.find('[data-selected]')
					.removeAttr('data-selected');
			},

			/**
	 		 * Returns the currently selected result
			 *
			 * @returns {element,boolean} 	Returns the jQuery object containing the selected result, or false
			 */
			getCurrent: function () {
				if( dataSource.type == 'none' ){
					return;
				}

				var cur = resultsElem.find('[data-selected]');

				if( cur.length && resultsElem.is(':visible') ){
					return cur;
				} 

				return false;
			},

			/**
	 		 * Gets the result preceding the provided result
			 *
			 * @returns {element,boolean} 	Returns the jQuery object containing the selected result, or false
			 */
			getPrevious: function (result) {
				var prev = $( result ).prev('[data-id]');

				if( prev.length ){
					return prev;
				}

				return false;
			},

			/**
	 		 * Gets the result following the provided result
			 *
			 * @returns {element,boolean} 	Returns the jQuery object containing the selected result, or false
			 */
			getNext: function (result) {
				var next = $( result ).next('[data-id]');

				if( next.length ){
					return next;
				}

				return false;
			},

			/**
	 		 * Selects the first result
			 *
			 * @returns {void}
			 */
			selectFirst: function () {
				results.select( resultsElem.find('[data-id]').first() );
			},

			/**
	 		 * Selects the last result
			 *
			 * @returns {void}
			 */
			selectLast: function () {
				results.select( resultsElem.find('[data-id]').last() );
			},

			/**
	 		 * Selects the provided item
			 *
			 * @returns {void}
			 */
			select: function (result) {
				results.deselectAll();
				
				result.attr('data-selected', true);
			}
		},

		/* ! Content Items */
		/**
 		 * Object containing item methods
 		 */
		contentItems = {

			selected: null,

			/**
	 		 * Adds an item to the control
			 *
			 * @param 	{object} 	elem 	Element from result list to add
			 * @returns {void}
			 */
			add: function (elem) {
				var html = '';
				var obj  = $(elem).find('[data-role=contentItemRow]');
				html = obj.html();

				itemListWrapper.append( ips.templates.render( options.itemTemplate, {
					id: obj.attr('data-itemid'),
					html: html
				}));

				if( resultsElem ){
					_closeResults();
				}

				// Update hidden field
				hiddenValueField.val( contentItems.getValues().join( ',' ) );
				
				if ( options.maxItems && contentItems.total() >= options.maxItems )
				{
					wrapper.hide();
				}
				
				elem.trigger('contentItemAdded', {
					html: html,
					itemList: contentItems.getValues(),
					totalItems: contentItems.total()
				});

				return true;
			},

			/**
	 		 * Deletes the given item
			 *
			 * @param 	{element} 	item 	The item element to select
			 * @returns {void}
			 */
			remove: function (item) {
				if( contentItems.selected == item ){
					contentItems.selected = null;
				}

				var value = $( item ).attr('data-value');
				$( item ).remove();

				if( options.maxItems && contentItems.total() < options.maxItems ){
					wrapper.show();
				}

				// Update text field
				hiddenValueField.val( contentItems.getValues().join( ',' ) );

				elem.trigger('contentItemDeleted', {
					item: item,
					itemList: contentItems.getValues(),
					totalItems: contentItems.total()
				});
			},

			/**
	 		 * Returns total number of items entered
			 *
			 * @returns {number}
			 */
			total: function () {
				return itemListWrapper.find('[data-id]').length;
			},

			/**
	 		 * Returns all of the values
			 *
			 * @param 	{element} 	item 	The item element to select
			 * @returns {void}
			 */
			getValues: function () {
				var values = [];
				var allContentItems = itemListWrapper.find('[data-id]');
				if( allContentItems.length ){
					values = _.map( allContentItems, function( item ){
						return $( item ).attr('data-id');
					});
				}

				return values;
			}
		},

		/**
 		 * Determines whether the value would be a duplicate
		 *
		 * @param 	{string} 	value 	Value to check
		 * @returns {void}
		 */
		_duplicateValue = function (value) {
			var values = contentItems.getValues();

			if( values.indexOf( value ) !== -1 ){
				return true;
			}

			return false;
		},
		
		/**
 		 * Expands the text field to fit the given text
		 *
		 * @returns {void}
		 */
		_expandField = function () {
			var text = textField.val();
			var widthOfElem = wrapper.width();

			widthOfElem -= ( parseInt( wrapper.css('padding-left') ) + parseInt( wrapper.css('padding-right') ) );

			// Create temporary span
			var span = $('<span/>').text( text ).css({
				'font-size': textField.css('font-size'),
				'letter-spacing': textField.css('letter-spacing'),
				'position': 'absolute',
				'top': '-100px',
				'left': '-300px',
				'opacity': 0.1
			});

			ips.getContainer().append( span );

			// Get the width
			var width = span.width() + 20;

			// Remove it
			span.remove();

			textField.css({
				width: ( ( width >= widthOfElem ) ? widthOfElem : width ) + 'px'
			});
		},

		/**
 		 * Resets the width of the text input
		 *
		 * @returns {void}
		 */
		_resetField = function () {
			textField.css({
				width: '15px'
			});
		};

		init();

		return {
			init: init,
			destruct: destruct,
			addContentItem: contentItems.add,
			getContentItem: contentItems.getValues,
			removeContentItem: contentItems.remove
		};
	};

	/**
	 * Handler for remote data retrieval
	 */
	var remoteData = function (source, options) {

		var ajaxObj,
			loadedCache = false,
			cache = {};

		/**
 		 * Initiates either a remote search or a remote fetch
		 *
		 * @returns {promise}
		 */
		var getResults = function (text) {
			return _remoteSearch( text );
		},

		/**
 		 * Returns the number of items in the result set
		 *
		 * @returns {number}
		 */
		totalItems = function () {
			return -1;
		},

		/**
 		 * Does a remote search (i.e. passing search string to backend, and returning results)
		 *
		 * @param 	{string}	String to search for
		 * @returns {promise}
		 */
		_remoteSearch = function (text) {
			var deferred = $.Deferred();

			if( ajaxObj ){
				ajaxObj.abort();
			}

			if( options.minAjaxLength > text.length ){
				deferred.reject();
				return deferred.promise();
			}

			if( cache[ text ] ){
				deferred.resolve( cache[ text ] );
			} else {				
				ajaxObj = ips.getAjax()( source + '&' + options.queryParam + '=' + encodeURI( text ), { dataType: 'json' } )
					.done( function (response) {
						deferred.resolve( response );
						cache[ text ] = response;
					})
					.fail( function (jqXHR, status, errorThrown) {
						if( status != 'abort' ){
							Debug.log('aborting');
						}
						deferred.reject();
					});
			}

			return deferred.promise();
		},

		/**
 		 * Fetches remote data, and then performs a local search on the data to find results
		 *
		 * @param 	{string}	String to search for
		 * @returns {promise}
		 */
		_remoteFetch = function (text) {
			var deferred = $.Deferred();

			if( !loadedCache ){
				if( ajaxObj ){
					return;
				}

				if( options.minAjaxLength > text.length ){
					return;
				}

				ajaxObj = ips.getAjax()( source, { dataType: 'json' } )
					.done( function (response) {
						loadedCache = true;
						cache = response;
						_remoteFetch( text );
					})
					.fail( function (jqXHR, status, errorThrown) {
						if( status != 'abort' ){
							Debug.log('aborting');
						}
						deferred.reject();
					});
			}

			// Search through the cache for results
			cache.each( function (idx, item) {
				if( item.value.toLowerCase().startsWith( text ) ){
					output.push( item );
				}
			});

			return deferred.promise();
		},

		/**
 		 * Aborts the ajax request
		 *
		 * @param 	{string}	String to search for
		 * @returns {void}
		 */
		stop = function () {
			if( ajaxObj ){
				ajaxObj.abort();
			}
		};

		return {
			type: 'remote',
			getResults: getResults,
			totalItems: totalItems,
			stop: stop
		};
	};

	var noData = function () {
		return {
			type: 'none',
			getResults: $.noop,
			totalItems: -1,
			stop: $.noop
		};
	};

}(jQuery, _));

