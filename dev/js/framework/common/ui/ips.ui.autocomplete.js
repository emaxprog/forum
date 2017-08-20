/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.autocomplete.js - Autocomplete widget for text fields
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.autocomplete', function(){

		var defaults = {
			multiValues: true,
			freeChoice: true,
			itemSep: { chr: ',', keycode: 188, charcode: 44 },
			disallowedCharacters: JSON.stringify( [ "<", ">", "'", "\"" ] ),
			unique: false,
			customValues: true,
			fieldTemplate: 'core.autocomplete.field',
			resultsTemplate: 'core.autocomplete.resultWrapper',
			resultItemTemplate: 'core.autocomplete.resultItem',
			tokenTemplate: 'core.autocomplete.token',
			addTokenTemplate: 'core.autocomplete.addToken',
			addTokenText: ips.getString( 'add_tag' ),
			queryParam: 'q',
			forceLower: false,
			minLength: 1,
			minAjaxLength: 1,
			commaTrigger: true
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_autocomplete') ){
				$( elem ).data('_autocomplete', autocompleteObj(elem, _.defaults( options, defaults ) ) );
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
		 * Retrieve the autocomplete instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The dialog instance or undefined
		 */
		getObj = function (elem) {
			elem = $( elem );

			if( elem.data('_autocomplete') ){
				return elem.data('_autocomplete');
			} else if(  $( '[name="' + elem.attr('name') + '_original' + '"]' ).length &&  $( '[name="' + elem.attr('name') + '_original' + '"]' ).data('_autocomplete') ){
				return  $( '[name="' + elem.attr('name') + '_original' + '"]' ).data('_autocomplete');
			}

			return undefined;
		};

		ips.ui.registerWidget('autocomplete', ips.ui.autocomplete, 
			[ 'multiValues', 'freeChoice', 'dataSource', 'maxItems', 'itemSep', 'resultsElem', 'unique', 'commaTrigger', 
				'fieldTemplate', 'resultsTemplate', 'resultItemTemplate', 'tokenTemplate', 'addTokenTemplate',
				'addTokenText', 'queryParam', 'minLength', 'maxLength', 'forceLower', 'disallowedCharacters', 'minAjaxLength' ]
		);

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});

	/**
	 * autocomplete instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var autocompleteObj = function (elem, options, e) {

		var timer,
			blurTimer,
			lastValue = '',
			originalTextField,
			valueField,
			textField,
			dataSource,
			elemID = $( elem ).identify().attr('id'),
			wrapper,
			inputItem,
			resultsElem,
			selectedToken,
			disabled = false,
			required = false,
			tooltip = null,
			tooltipTimer = null,
			mouseOverResults = false,
			hasError = false;

		/**
		 * Sets up this instance. The datasource object is chosen depending on what options and/or
		 * attributes are provided. We can fetch results from a local <datalist>, remotely via ajax
		 * or not look up results from a data source at all.
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			if( $( elem ).is('textarea, input[type="text"], input[type="search"]') ){
				originalTextField = $( elem );
			} else {
				originalTextField = $( elem ).find('textarea, input[type="text"], input[type="search"]').first();
			}

			try {
				options.disallowedCharacters = $.parseJSON( options.disallowedCharacters );
			} catch (err) {
				Debug.error("Couldn't parse disallowed characters option");
			}

			// Add our autocomplete wrapper to the page, and move the element into it
			_buildWrapper();

			// Set up the data source for this control
			_getDataSource();

			// Remove list from original field
			originalTextField.removeAttr('list');

			// Build the list
			if( dataSource.type != 'none' ){
				_buildResultsList();
			}

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

			if( options.maxLength ){
				textField.attr( 'maxlength', options.maxLength + 1 );
			}

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
				.on( 'keyup', _keyupField )
				.on( 'keypress', _keypressField );

			wrapper
				.on( 'click', _clickWrapper )
				.on( 'click', '[data-action="addToken"]', _clickAddToken )
				.on( 'keydown', _keydownWrapper )
				.on( 'propChanged', _propChanged )
				.toggleClass( 'ipsField_autocompleteDisabled', disabled );

			_buildInitialTokens();
			
			elem
				.on( 'blur', function () {
					// For closed tagging, our text field is the same element as the autocomplete widget
					// In that case, we don't want to blur otherwise we go into a death loop.
					if( textField !== elem ){
						textField.trigger('blur');
					}
				})
				.trigger( 'autoCompleteReady', {
					elemID: elemID,
					elem: elem,
					currentValues: tokens.getValues()
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
 		 * Determines whether any errors are present in the autocomplete widget (e.g. duplicates)
		 *
		 * @returns {void}
		 */
		hasErrors = function () {
			return hasError;
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
 		 * Builds tokens from whatever values exist in the original text field
		 *
		 * @returns {void}
		 */
		_buildInitialTokens = function () {
			var value = _getOriginalValue();
			
			if( !value ){
				return;
			}

			// Get individual values
			var splitValues = _.without( value.split( "\n" ), '' );
			var itemCount = 0;
			itemCount = splitValues.length;
			
			// Clear field, as tokens.add() will re-add value
			originalTextField.val('');

			if( splitValues.length ){
				for( var i = 0; i < itemCount; i++ ){
					_addToken( splitValues[i] );
				}
			}
		},

		/**
 		 * Returns the value from the original text field (i.e. the value provided by the backend on pag load)
		 *
		 * @returns {string}
		 */
		_getOriginalValue = function () {
			return originalTextField.val();
			//return _.unescape( originalTextField.val() ).replace("&#039;", "'").replace("&apos;", "'");
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
				.on('mouseover', '[data-value]', function (e) {
					results.select( $( e.currentTarget ) );
				})
				.on('mouseenter', function () {
					mouseOverResults = true;
				})
				.on('mouseleave', function () {
					mouseOverResults = false;
				})
				.on('click', '[data-value]', function (e) {
					_addToken( $( e.currentTarget ).attr('data-value') );
					textField.focus();
				})
				.attr( 'aria-busy', 'false' );
		},

		/**
 		 * Builds the wrapper element that looks like a text input, but allows us to insert
 		 * items as tokens
		 *
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

			// If users have to choose from a predefined list, we'll hide the text field
			// and build a link which will show the results panel
			if( !options.freeChoice ){
				var insertElem = ips.templates.render('core.autocomplete.addToken', {
					text: options.addTokenText
				});

				textField = elem;
			} else {
				var insertElem = $('<input/>').attr( {
					type: 'text',
					id: elemID + '_dummyInput'
				})
				.prop( 'autocomplete', 'off' );

				textField = insertElem;
			}

			// Make a copy of the original text field using its name. This is because it's difficult to set
			// arbitrary values in the original text field later if it's associated with a datalist.
			var name = originalTextField.attr('name');

			originalTextField.attr( 'name', originalTextField.attr('name') + '_original' );
			valueField = $('<textarea/>').attr( 'name', name ).hide();

			originalTextField.hide();

			// Move any classnames on the original element onto our new wrapper to maintain styling,
			// then move the original element into our reserved list element
			wrapper
				.addClass( existingClasses )
				.append( elem )
				.append( valueField )
				.find('#' + elemID + '_inputItem')
					.append( insertElem );

			// Set events for clicking on tokens
			wrapper
				.on('click', '[data-value]', function (e) {
					if( !disabled ){
						tokens.select( $( e.currentTarget ) );
					}
				})
				.on('click', '[data-action="delete"]', function (e) {
					_deleteToken( $( e.currentTarget ).parent('[data-value]') );
				});
		},

		/**
 		 * Gets the apprioriate data source for this control
		 *
		 * @returns {void}
		 */
		_getDataSource = function () {
			if( ( options.dataSource && options.dataSource.indexOf('#') === 0 && $( options.dataSource ).length ) ||
					originalTextField.is('[list]') ){
				dataSource = localData( 
					originalTextField.is('[list]') ? $('#' + originalTextField.attr('list') ) : options.dataSource,
					options
				);
			} else if( ips.utils.validate.isUrl( options.dataSource ) ){
				dataSource = remoteData( options.dataSource, options );
			} else {
				dataSource = noData();
			}
		},

		/**
 		 * When the wrapper is clicked, we see if a token was clicked. If it was, select it. If not, focus the textbox.
		 *
		 * @returns {void}
		 */
		_clickWrapper = function (e) {
			if( $( e.target ).is('[data-token]') || $( e.target ).parents('li[data-token]').length ){
				var token = ( $( e.target )  );
			} else {				
				if( !$( e.target ).is( textField ) && ( !resultsElem || !$.contains( resultsElem.get(0), e.target ) ) ){
					textField.focus();
				}
			}
		},

		/**
 		 * Event handler for focusing on the text field
		 *
		 * @returns {void}
		 */
		_clickAddToken = function (e) {
			e.preventDefault();

			if( resultsElem && resultsElem.is(':visible') ){
				_closeResults();
			} else {
				_loadResults('');
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
			if( mouseOverResults ){
				return;
			}
			
			clearInterval( timer );

			_.delay( _timerBlurField, 300 );
		},

		/**
 		 * Timed event hides the results list
		 *
		 * @returns {void}
		 */
		_timerBlurField = function () {
			// See #47772
			/*if( dataSource.type == 'none' ){
				return;
			}*/

			if( textField.val() ){
				_addTokenFromCurrentInput();
			}

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
			var existingTokens = tokens.getValues(),
				newResults = {};

			if( options.unique ){
				$.each( results, function (key, data) {
					if( !data.value || _.indexOf( existingTokens, data.value ) === -1 ){
						newResults[ key ] = data;
					}
				});

				return newResults;
			}

			return results;
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

			if( options.multiValues ){
				if( value.indexOf( options.itemSep.chr ) === -1 || !options.commaTrigger ){
					// Multi items, but only one entered so far
					return $.trim( value );
				} else {
					// Get the last-entered item
					var pieces = value.split( options.itemSep.chr );
					return $.trim( pieces[ pieces.length - 1 ] );
				}
			} else {
				return value;
			}
		},

		/**
 		 * Event handler for keydown event in wrapper.
 		 * We check for esape here, because if options.freeChoice is disabled, there's no textbox to
 		 * watch for events. By watching for escape on the wrapper, we can still close the menu.
		 *
		 * @returns {void}
		 */
		_keydownWrapper = function (e) {
			if( e.which == ips.ui.key.ESCAPE ){
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
			if( !_( [ ips.ui.key.UP, ips.ui.key.DOWN, ips.ui.key.LEFT, ips.ui.key.RIGHT,
						 ips.ui.key.ENTER, ips.ui.key.TAB, ips.ui.key.BACKSPACE, ips.ui.key.ESCAPE
					 ] ).contains( e.which ) ){
				ignoreKey = true;
			}
			
			var value = $.trim( textField.val() );

			// If this is empty, remove errors
			if( !value.length ){
				hasError = false;
			}

			// If this is a normal key press and we're at our max length, prevent the keypress
			if( options.maxLength && value.length == options.maxLength && ignoreKey ){
				e.preventDefault();
				return;
			}

			// Check for duplicates if we're potentially adding a new tag
			if( _( [ ips.ui.key.ENTER, ips.ui.key.TAB ] ).contains( e.which ) && options.unique && _duplicateValue( value ) ){
				e.preventDefault();
				_showTooltip( ips.getString( 'ac_dupes' ) );
				return;
			}
			
			if( ignoreKey ){
				return;
			}

			switch(e.which){
				// Token keys
				case ips.ui.key.BACKSPACE:
					keyEvents.backspace(e);
				break;
				case ips.ui.key.TAB:
				case ips.ui.key.ENTER:
					keyEvents.enter(e);
				break;

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
			}
		},

		/**
 		 * Event handler for keyup in the text field.
		 *
		 * @returns {void}
		 */
		_keyupField = function (e) {
			// Check for prohibited characters
			var i;
			for( i in options.disallowedCharacters ){
				if ( textField.val().indexOf( options.disallowedCharacters[i] ) !== -1 ) {
					textField.val( textField.val().replace( options.disallowedCharacters[i], '' ) );
					_showTooltip( ips.getString( 'ac_prohibit_special', {
						chars: options.disallowedCharacters.join(' ')
					} ) );
					e.preventDefault();
					return;
				}
			}

			// 229 is the 'input waiting' keycode. We need to check for it here because on IME keyboards,
			// we won't necessarily get a real keycode. e.g. Chrome on android. Instead we need to see if
			// the comma character is in the input, and process it that way.
			var lastCharIsComma = ( textField.val().substr( textField.val().length - 1 ) === ',' );

			if( e.which === 229 && lastCharIsComma ){
				_addTokenFromCurrentInput();
				e.preventDefault();
			}
		},

		/**
 		 * Event handler for keypress in the text field.
		 *
		 * @returns {void}
		 */
		_keypressField = function (e) {

			// If we aren't concerned about commas, we can stop here
			if( !options.commaTrigger ){
				return;
			}

			// Get rid of the comma
			textField.val( textField.val().replace(',', '') );

			// Check for duplicates if we're potentially adding a new tag by pressing comma
			if( e.charCode == options.itemSep.charcode && options.unique && _duplicateValue( textField.val() ) ){
				e.preventDefault();
				_showTooltip( ips.getString( 'ac_dupes' ) );
				return;
			}

			if( e.charCode == options.itemSep.charcode ){
				_addTokenFromCurrentInput();
				e.preventDefault();
			}
		},

		/**
 		 * A wrapper method for tokens.add which also clears the text field
 		 * and hides it if options.maxItems is reached
		 *
		 * @returns {void}
		 */
		_addToken = function (value) {
			tokens.add( value );
			textField.val('');
			lastValue = '';
			_resetField();

			if( options.maxItems && tokens.total() >= options.maxItems ){
				inputItem.hide();
			}

			if( options.unique && options.freeChoice == false && 
				dataSource.totalItems() !== -1 && dataSource.totalItems() <= tokens.total() ){
				wrapper.find('[data-action="addToken"]').hide();
			}

			// If we're here, remove any errors
			hasError = false;
		},

		/**
 		 * A wrapper method for tokens.remove which shows the text field if we're under
 		 * our options.maxItems limit
		 *
		 * @returns {void}
		 */
		_deleteToken = function (token) {
			if( disabled ){
				return;
			}
			
			tokens.remove( token );
		},

		/**
 		 * Object containing event handlers bound to individual keys
 		 */
		keyEvents = {

			/**
	 		 * Backspace handler. If the textfield is empty, we highlight the previous token.
	 		 * If a token is selected, hitting backspace deletes it.
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void}
			 */
			backspace: function (e) {
				if( !textField.val() ){
					if( tokens.selected ){
						tokens.remove( tokens.selected );
					} else {
						if( inputItem.prev().length ){
							tokens.select( inputItem.prev() );
						}
					}
				}
			},

			/**
	 		 * Enter/tab handler. If text has been entered, we add it as a token, otherwise pass through
	 		 * to the browser to handle.
			 *
			 * @param 	{event} 	e 		Event object
			 * @returns {void,boolean} 		
			 */
			enter: function (e) {
				if( e.which == ips.ui.key.TAB && textField.val() == '' ){
					return false;
				}

				e.preventDefault();

				var currentResult = results.getCurrent();
				var value = '';

				if( currentResult ){
					value = currentResult.attr('data-value');
				} else {
					if( options.commaTrigger ){
						value = _stripHTML( textField.val().replace( options.itemSep.chr, '' ) );
					} else {
						value = _stripHTML( textField.val() );
					}
				}

				if( !value ){
					return false;
				}

				_addToken( value );
			},

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
				var prev = $( result ).prev('[data-value]');

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
				var next = $( result ).next('[data-value]');

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
				results.select( resultsElem.find('[data-value]').first() );
			},

			/**
	 		 * Selects the last result
			 *
			 * @returns {void}
			 */
			selectLast: function () {
				results.select( resultsElem.find('[data-value]').last() );
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

		/**
 		 * Object containing token methods
 		 */
		tokens = {

			selected: null,

			/**
	 		 * Adds a token to the control
			 *
			 * @param 	{string} 	value 	The value of this token
			 * @returns {void}
			 */
			add: function (value) {
				var html = '';

				value = $.trim( _.escape( value ) );

				if( options.minLength && value.length < options.minLength ){
					return false;
				}

				if( options.maxLength && value.length > options.maxLength ){
					return false;
				}

				if( options.forceLower ){
					value = value.toLowerCase();
				}

				tokens.deselectAll();

				inputItem.before( ips.templates.render( options.tokenTemplate, {
					id: elemID,
					value: value,
					title: value
				}));

				if( resultsElem ){
					_closeResults();
				}

				// Update hidden textbox
				valueField.val( tokens.getValues().join( "\n" ) );

				if( dataSource.type != 'none' ){
					html = resultsElem.find('[data-value="' + value.replace("\\", "\\\\") + '"]').html();
				} else {
					html = value;
				}

				elem.trigger('tokenAdded', {
					token: value,
					html: html,
					tokenList: tokens.getValues(),
					totalTokens: tokens.total()
				});

				return true;
			},

			/**
	 		 * Deletes the given token
			 *
			 * @param 	{element} 	token 	The token element to select
			 * @returns {void}
			 */
			remove: function (token) {
				if( tokens.selected == token ){
					tokens.selected = null;
				}

				var value = $( token ).attr('data-value');
				$( token ).remove();

				if( options.maxItems && tokens.total() < options.maxItems ){
					inputItem.show();
				}

				if( options.unique && options.freeChoice == false && 
					( dataSource.totalItems() === -1 || dataSource.totalItems() > tokens.total() ) ) {
					wrapper.find('[data-action="addToken"]').show();
				}
				
				// Update text field
				valueField.val( tokens.getValues().join( "\n" ) );

				elem.trigger('tokenDeleted', {
					token: value,
					tokenList: tokens.getValues(),
					totalTokens: tokens.total()
				});
			},

			/**
	 		 * Removes all tokens
			 *
			 * @returns {void}
			 */
			removeAll: function () {
				var allTokens = inputItem.siblings().filter('[data-value]');

				allTokens.each( function () {
					tokens.remove( $( this ) );
				});
			},

			/**
	 		 * Selects a given token
			 *
			 * @param 	{element} 	token 	The token element to select
			 * @returns {void}
			 */
			select: function (token) {
				tokens.deselectAll();
				tokens.selected = $( token ).addClass('cToken_selected');
			},

			/**
	 		 * Returns total number of tokens entered
			 *
			 * @returns {number}
			 */
			total: function () {
				return inputItem.siblings().filter('[data-value]').length;
			},

			/**
	 		 * Returns all of the values
			 *
			 * @param 	{element} 	token 	The token element to select
			 * @returns {void}
			 */
			getValues: function () {
				var values = [];
				var allTokens = inputItem.siblings().filter('[data-value]');

				if( allTokens.length ){
					values = _.map( allTokens, function( item ){
						return $( item ).attr('data-value');
					});
				}

				return values;
			},

			/**
	 		 * Returns selected token value
			 *
			 * @returns {string|null} 	Value or null if no token selected
			 */
			getSelected: function () {
				return tokens.selected.attr('data-value');
			},

			/**
	 		 * Deselects all tokens
			 *
			 * @returns {void}
			 */
			deselectAll: function () {
				wrapper.find('[data-value]').removeClass('cToken_selected');
				tokens.selected = null;
			}
		},

		/**
 		 * Creates a token out of the current value in the text field
		 *
		 * @returns {void}
		 */
		_addTokenFromCurrentInput = function () {
			var value = '';

			if( options.commaTrigger ){
				value = _stripHTML( textField.val().replace( options.itemSep.chr, '' ) );
			} else {
				value = _stripHTML( textField.val() );
			}

			if( options.minLength && value.length < options.minLength || options.maxLength && value.length > options.maxLength ){
				if( options.commaTrigger ){
					textField.val( textField.val().replace( options.itemSep.chr, '' ) );
				}
				return;
			}

			if( options.unique && _duplicateValue( value ) ){
				_showTooltip( ips.getString( 'ac_dupes' ) );
				return;
			}

			_addToken( value );
		},

		/**
 		 * Determines whether the value would be a duplicate
		 *
		 * @param 	{string} 	value 	Value to check
		 * @returns {void}
		 */
		_duplicateValue = function (value) {
			var values = tokens.getValues();

			if( values.indexOf( value ) !== -1 ){
				return true;
			}

			return false;
		},

		/**
 		 * Removes special characters from text
		 *
		 * @returns {string}
		 */
		_stripHTML = function (text) {
			return text.replace(/<|>|"|'/g, '');
		},

		/**
 		 * Shows a tooltip on the autocomplete with the provided message
		 *
		 * @param 	{string} 	msg 	Message to show
		 * @returns {void}
		 */
		_showTooltip = function (msg) {
			if( !tooltip ){
				_buildTooltip();
			}

			// Set errors to true
			hasError = true;

			// If we're already showing a tooltip, remove the timeout before
			// showing this one.
			if( tooltipTimer ){
				clearTimeout( tooltipTimer );
			}

			tooltip.hide().text( msg );

			_positionTooltip();

			// Hide it automatically in a few seconds
			tooltipTimer = setTimeout( function () {
				_hideTooltip();
			}, 2500);
		},

		/**
 		 * Hides the tooltip
		 *
		 * @returns {void}
		 */
		_hideTooltip = function () {
			if( tooltip && tooltip.is(':visible') ){
				ips.utils.anim.go( 'fadeOut', tooltip );
			}
		},

		/**
 		 * Positions the tooltip over the autocomplete
		 *
		 * @returns {void}
		 */
		_positionTooltip = function () {
			var positionInfo = {
				trigger: wrapper,
				target: tooltip,
				center: true,
				above: true
			};

			var tooltipPosition = ips.utils.position.positionElem( positionInfo );

			$( tooltip ).css({
				left: tooltipPosition.left + 'px',
				top: tooltipPosition.top + 'px',
				position: ( tooltipPosition.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});

			if( tooltipPosition.location.vertical == 'top' ){
				tooltip.addClass('ipsTooltip_top');
			} else {
				tooltip.addClass('ipsTooltip_bottom');
			}

			tooltip.show();
		},

		/**
 		 * Builds the tooltip element
		 *
		 * @param 	{string} 	msg 	Message to show
		 * @returns {void}
		 */
		_buildTooltip = function () {
			// Build it from a template
			var tooltipHTML = ips.templates.render( 'core.tooltip', {
				id: 'elAutoCompleteTooltip'
			});

			// Append to body
			ips.getContainer().append( tooltipHTML );

			tooltip = $('#elAutoCompleteTooltip');
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
			hasErrors: hasErrors,
			addToken: tokens.add,
			getTokens: tokens.getValues,
			removeToken: tokens.remove,
			removeAll: tokens.removeAll
		};
	};

	/**
	 * Handler for local data retrieval
	 */
	var localData = function (source) {
		
		var items = $( source ).find('option');

		/**
 		 * Searches through the source element, matching option values to our search string
		 *
		 * @param 	{string}	String to search for
		 * @returns {void}
		 */
		var getResults = function (text) {
			var deferred = $.Deferred(),
				output = [],
				text = text.toLowerCase();

			items.each( function (idx, item) {
				if( item.innerHTML.toLowerCase().startsWith( text ) ){
					output.push( { id: item.value, value: item.value, html: item.value } );
				}
			});		

			deferred.resolve( output );
			return deferred.promise();
		},

		/**
 		 * Returns the number of items in the result set
		 *
		 * @returns {number}
		 */
		totalItems = function () {
			return items.length;
		};

		return {
			type: 'local',
			getResults: getResults,
			totalItems: totalItems,
			stop: $.noop
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
			if( options.freeChoice ){
				return _remoteSearch( text );
			} else {
				return _remoteFetch( text );
			}
		},

		/**
 		 * Returns the number of items in the result set
		 *
		 * @returns {number}
		 */
		totalItems = function () {
			if( !options.freeChoice && loadedCache ){
				return _.size( cache );
			}

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

