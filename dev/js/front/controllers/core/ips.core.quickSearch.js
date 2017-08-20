/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.quickSearch.js - Controller for search in header
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.quickSearch', {

		_initialSize: 0,
		_expanded: false,
		_blurTimeout: null,
		_focused: false,

		initialize: function () {
			this.on( 'focus', '#elSearchField', this.focusSearch );
			this.on( 'blur', '#elSearchField', this.blurSearch );
			this.on( 'menuItemSelected', '#elSearchFilter', this.menuItemSelected );
			this.on( document, 'menuOpened', this.menuOpened );
			this.on( document, 'updateContextualSearchOptions', this.updateContextualSearchOptions );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._expanded = false;
		},

		/**
		 * Update menu items that select particular nodes
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		updateContextualSearchOptions: function (e, data) {
			if( !data ){
				return;
			}

			var menuItem = this.scope.find('#elSearchFilter_menu').find('[data-options]');
			
			menuItem
				.attr('data-options', data)
				.attr('data-ipsMenuValue', data);

			if( menuItem.hasClass('ipsMenu_itemChecked') ){
				this.scope.find('[data-role="searchFilter"]').remove();
				this._buildNodeFilterElements( data );
			}
		},

		/**
		 * Event handler for the menu filter
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		menuItemSelected: function (e, data) {
			if( !data.selectedItemID ){
				return;
			}

			data.originalEvent.preventDefault();

			for( var i in data.selectedItems )
			{
				var selectedItem = $('#'+i);
			}

			//var selectedItem = data.menuElem.find('[data-ipsMenuValue="' + data.selectedItemID + '"]');
			var form = this.scope.find('form');

			// Add correct text
			var title = selectedItem.find('a').html();
			this.scope.find('[data-role="searchingIn"]').text( title );

			// Remove form inputs for selected option
			this.scope.find('[data-role="searchFilter"]').remove();

			// Add new inputs
			if( data.selectedItemID != 'all' ){
				var options = selectedItem.attr('data-options');
				this._buildNodeFilterElements( options || data.selectedItemID );
			}
			
		},

		_buildNodeFilterElements: function ( options ) {
			var form = this.scope.find('form');
			
			// Build the form inputs from the options data on this item
			try {
				options = $.parseJSON( options );

				_.each( options, function (val, i) {
					form.append(
						$('<input/>')
							.attr( 'type', 'hidden' )
							.attr( 'name', i )
							.attr( 'value', val )
							.attr( 'data-role', 'searchFilter' )
					);
				});
			} catch (err) {
				form.append( 
					$('<input/>')
						.attr( 'type', 'hidden' )
						.attr( 'name', 'type' )
						.attr( 'value', options )
						.attr( 'data-role', 'searchFilter' )
				);
				return;
			}
		},

		/**
		 * Event handler for focusing the search box
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		focusSearch: function (e) {	
			var self = this;
			var url = ips.getSetting('baseURL') + 'index.php?app=core&module=search&controller=search&do=globalFilterOptions&checked=' + this.scope.attr('data-default');

			if( this._expanded ){
				return;
			}

			$('#elSearch').addClass('cSearchExpanded');
			$('#elSearchFilter').show();
			
			if( this.scope.find('[data-role="globalSearchMenuOptions"]').length ){
				ips.getAjax()( url )
					.done(function( response ){
						self.scope.find('[data-role="globalSearchMenuOptions"]').replaceWith( response );
					});
			}

			this._expanded = true;
		},

		/**
		 * Shrinks search box when blurred. Sets a timer and hands off to _cancelSearch to actually shrink it.
		 *
		 * @returns {void}
		 */
		blurSearch: function () {
			var self = this;

			// First set a small timeout so we can cancel this if we want
			this._blurTimeout = setTimeout( function (){
				self._cancelSearch();
			}, 500 );	
		},

		/**
		 * Shrinks search box when blurred.
		 *
		 * @param	{boolean} 	loseFocus
		 * @returns {void}
		 */
		_cancelSearch: function () {

			if( ips.utils.responsive.currentIs('phone') ){
				ips.utils.anim.go('fadeIn fast', $('#elHeaderNavigation') );
			}

			$('#elSearch')
				.removeClass('cSearchExpanded');

			$('#elSearchFilter').hide();

			this._expanded = false;
		},

		/**
		 * Event handler for the filter menu being opened
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		menuOpened: function (e, data) {
			Debug.log( data.elemID );
			if( data.elemID == 'elSearchFilter' ){
				clearTimeout( this._blurTimeout );
			}
		}
	});
}(jQuery, _));