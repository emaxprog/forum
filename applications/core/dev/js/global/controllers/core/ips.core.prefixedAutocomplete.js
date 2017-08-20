/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.prefixedAutocomplete.js - Controller for prefix functionality
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.prefixedAutocomplete', {

		initialize: function () {
			this.setup();

			this.on( 'autoCompleteReady', this.autoCompleteReady );
			this.on( 'tokenAdded', this.tokensChanged );
			this.on( 'tokenDeleted', this.tokensChanged );
			this.on( 'menuItemSelected', '[data-role="prefixButton"]', this.prefixSelected );
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._prefixRow = this.scope.find('[data-role="prefixRow"]');
			this._prefixValue = this.scope.find('[data-role="prefixValue"]');
			this._prefixButton = this.scope.find('[data-role="prefixButton"]');
			this._prefixMenu = this.scope.find('[data-role="prefixMenu"]');
		},

		/**
		 * Event handler called when autocomplete is ready and has generated all existing tokens
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Data object from the autocomplete widget
		 * @returns 	{void}
		 */
		autoCompleteReady: function (e, data) {
			var tokens = data.currentValues;
			
			// Do we need to show the prefix menu immediately?
			if( this._prefixValue && tokens.length ){
				this._prefixMenu.html( this._buildTokenList( tokens, this._prefixValue.val() ) );
				this._prefixButton.find('span').html( this._getPrefixText( this._prefixValue.val() ) );
				this._prefixRow.show();
			}
		},
		
		/**
		 * Event handler for the autocomplete adding/removing tokens. Updates the menu, and shows the row if needed
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Data object from the menu widget
		 * @returns 	{void}
		 */
		tokensChanged: function (e, data) {			
			if( data.totalTokens > 0 && !this._prefixRow.is(':visible') ){
				ips.utils.anim.go( 'fadeIn', this._prefixRow );
			} else if( data.totalTokens === 0 && this._prefixRow.is(':visible') ){
				ips.utils.anim.go( 'fadeOut', this._prefixRow );
				this._prefixRow.find('input[type="checkbox"]').prop( 'checked', false );
			}

			// Update button
			if( e && e.type == 'tokenDeleted' && data.token == this._prefixValue.val() ){
				this._prefixButton.find('span').html( ips.getString('selectPrefix') );
				this._prefixValue.val('');
			}

			// Get current value
			var value = this._prefixValue.val();
			var list = this._buildTokenList( data.tokenList, value );

			// Update list contents
			this._prefixMenu.html( list );
		},

		/**
		 * Event handler for when a prefix menu item is selected
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Data object from the menu widget
		 * @returns 	{void}
		 */
		prefixSelected: function (e, data) {
			data.originalEvent.preventDefault();

			var itemValue = ( data.selectedItemID == '-' ) ? '' : data.selectedItemID;
			var selectedText = this._getPrefixText( data.selectedItemID );

			this._prefixButton.find('span').html( selectedText );
			this._prefixValue.val( itemValue );

			this._prefixRow.find('input[type="checkbox"]').prop( 'checked', true );
		},

		/**
		 * Loops through provided tokens, building menu items for each
		 *
		 * @param 		{array} 	tokens 		Tokens array from the autocomplete widget
		 * @param		{string}	value 		Currently-selected item
		 * @returns 	{string}	Menu HTML
		 */
		_buildTokenList: function (tokens, value) {
			var output = '';
			
			output += ips.templates.render('core.menus.menuItem', {
				value: '',
				title: ips.getString('selectedNone'),
				checked: ( value == '' )
			});

			output += ips.templates.render('core.menus.menuSep');

			$.each( tokens, function (i, item) {
				output += ips.templates.render('core.menus.menuItem', {
					value: item,
					title: _.unescape( item ),
					checked: ( item == value )
				});
			});
			
			Debug.log( output );

			return output;
		},

		/**
		 * Gets the string for the prefix selector
		 *
		 * @param 		{string} 	prefix 		A selected prefix
		 * @returns 	{string}	
		 */
		_getPrefixText: function (prefix) {
			var selectedText = '';

			if( prefix && prefix != '-' ){
				selectedText = ips.getString( 'selectedPrefix', { tag: prefix } );
			} else {
				selectedText = ips.getString( 'selectedPrefix', { tag: ips.getString('selectedNone') } );
			}

			return selectedText;
		}
	});
}(jQuery, _));