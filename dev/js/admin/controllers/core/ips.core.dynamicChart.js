/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.dynamicChart.js - Dynamic chart controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.dynamicChart', {

		storedValues: {},
		identifier: '',
		
		type: '',

		initialize: function () {
			// Set up the events that will capture chart changes
			this.on( 'click', '[data-timescale]', this.changeTimescale );
			this.on( document, 'submit', '[data-role="dateForm"]', this.changeDateRange );
			this.on( 'menuItemSelected', '[data-action="chartFilter"]', this.changeFilter );
			this.on( 'click', '[data-type]', this.changeChartType );

			this.setup();
		},

		/**
		 * Setup method. Sets the default storeValues values.
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;
			this.identifier = this.scope.attr('data-chart-identifier');

			// Get the initial values
			// Timescale & type
			this.storedValues.timescale = this.scope.find('[data-timescale][data-selected]').attr('data-timescale');
			this.storedValues.type = this.scope.find('[data-type][data-selected]').attr('data-type');
			this.storedValues.filters = [];
			this.storedValues.dates = { start: '', end: '' };
			this.type = this.scope.attr('data-chart-type');
			this.timescale = this.scope.attr('data-chart-timescale');
			
			// Filters
			$('#el' + this.identifier + 'Filter_menu').find('.ipsMenu_itemChecked').each( function () {
				self.storedValues.filters.push( $( this ).attr('data-ipsMenuValue') );
			});
			
			this.checkType();
		},

		/**
		 * Event handler for changing the timescale
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		changeTimescale: function (e) {
			this.timescale = $(e.currentTarget).attr('data-timescale');
			this._toggleButtonRow( e, 'timescale');
		},

		/**
		 * Event handler for changing the chart type
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		changeChartType: function (e) {
			this.type = $(e.currentTarget).attr('data-type');
			this._toggleButtonRow( e, 'type' );
			this.checkType();
		},
		
		/**
		 * Check type
		 */
		checkType: function() {
			if ( this.type == 'Table' || this.type == 'PieChart' || this.type == 'GeoChart' ) {
				$(this.scope).find('[data-role="groupingButtons"] a.ipsButton').addClass('ipsButton_disabled ipsButton_veryLight').removeClass('ipsButton_primary');
			} else {
				$(this.scope).find('[data-role="groupingButtons"] a.ipsButton').removeClass('ipsButton_disabled');
				$(this.scope).find('a.ipsButton[data-timescale="' + this.timescale + '"]').removeClass('ipsButton_veryLight').addClass('ipsButton_primary');
			}
		},

		/**
		 * Event handler for changing the filter
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Data object from the menu widget
		 * @returns {void}
		 */
		changeFilter: function (e, data) {
			data.originalEvent.preventDefault();

			if( _.indexOf( this.storedValues.filters, data.selectedItemID ) !== -1 ){
				this.storedValues.filters.splice( _.indexOf( this.storedValues.filters, data.selectedItemID ), 1 );
			} else {
				this.storedValues.filters.push( data.selectedItemID );
			}

			data.menuElem.trigger('closeMenu');
			this._updateURL();
		},

		/**
		 * Changes the range of the graph being shown
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		changeDateRange: function (e) {
			e.preventDefault();

			var form = $('#el' + this.identifier + 'Date_menu');

			this.storedValues.dates.start = form.find('[name="start"]').val();
			this.storedValues.dates.end = form.find('[name="end"]').val();

			form.trigger('closeMenu');

			this._updateURL();
		},

		/**
		 * Method for toggling buttons and setting new values in the store
		 *
		 * @param 	{event} 	e 		Event object from the event handler
		 * @param 	{string} 	type 	The type being handled (timescale or type)
		 * @returns {void}
		 */
		_toggleButtonRow: function (e, type) {
			e.preventDefault();

			var val = $( e.currentTarget ).attr( 'data-' + type );

			this.scope.find('[data-' + type + ']')
				.removeClass('ipsButton_primary')
				.addClass('ipsButton_veryLight')
				.removeAttr('data-selected')
				.filter('[data-' + type + '="' + val + '"]')
					.addClass('ipsButton_primary')
					.removeClass('ipsButton_veryLight')
					.attr('data-selected', true);

			this.storedValues[ type ] = val;

			// Reset filters
			var self = this;
			this.storedValues.filters = [];

			$('#el' + this.identifier + 'Filter_menu').find('.ipsMenu_itemChecked').each( function () {
				self.storedValues.filters.push( $( this ).attr('data-ipsMenuValue') );
			});

			this._updateURL();
		},

		/**
		 * Fetches new chart HTML from the server, then reinits the chart widget
		 *
		 * @returns {void}
		 */
		_updateURL: function () {
			var url = this._buildURL();
			var chartArea = this.scope.find('[data-role="chart"]');
			chartArea.css( 'height', chartArea.height() ).html( '' ).addClass('ipsLoading');

			ips.getAjax()( this.scope.attr('data-chart-url'), {
				data: url
			})
				.done( function (response) {
					chartArea.css( 'height', 'auto' ).html( response );
					$( document ).trigger( 'contentChange', [ chartArea ] );
				})
				.always( function () {
					chartArea.removeClass('ipsLoading');
				});
		},

		/**
		 * Builds a query param based on the values we have stored
		 *
		 * @returns {string}
		 */
		_buildURL: function () {
			var pieces = [];
			var self = this;

			// Needed for dynamic chart buttons. We can't simply rely on checking request isAjax() as it could be loaded inside tabs etc. 
			pieces.push( "noheader=1" );
			
			// Timescale
			pieces.push( "timescale[" + this.identifier + "]=" + this.storedValues.timescale );

			// Type
			pieces.push( "type[" + this.identifier + "]=" + this.storedValues.type );

			// Filters
			_.each( this.storedValues.filters, function (value, idx ) {
				pieces.push( "filters[" + self.identifier + "][" + idx + "]=" + value );
			});

			// Dates
			if( this.storedValues.dates.start || this.storedValues.dates.start ){
				pieces.push( "start[" + this.identifier + "]=" + this.storedValues.dates.start );
				pieces.push( "end[" + this.identifier + "]=" + this.storedValues.dates.end );
			}

			return pieces.join('&');
		}
	});
}(jQuery, _));