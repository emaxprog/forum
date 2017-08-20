/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.chart.js - Converts a table into a Google Graph
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.chart', function(){
		
		var defaults = {};

		/**
 		 * Widget respond method
 		 * Simply sets a callback that will execute when the google visualization JS has loaded
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed
		 * @returns {void}
		 */
		var respond = function (elem, options) {

			var doInit = function () {
				if( !$( elem ).data('_chart') ){
					$( elem ).data('_chart', chartObj(elem, _.defaults( options, defaults ) ) );
				}
			};

			try {
				doInit();
			} catch (err) {
				ips.loader.get( ['https://www.google.com/jsapi'] ).then( function () {
					google.load( 'visualization', '1.0', {'packages': ['corechart', 'gauge', 'table'], 'callback': doInit } ); 
				});
			}
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
		},

		/**
		 * Retrieve the carousel instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The carousel instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_chart') ){
				return $( elem ).data('_chart');
			}

			return undefined;
		};

		/**
		 * Chart instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var chartObj = function (elem, options) {
						
			var data = new google.visualization.DataTable();
			var headerTypes = {};
			var extraOptions = {};
			var chartElem = $(elem).next();
			//chartElem.css( 'height', Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - chartElem.offset().top );
			var chart = null;

			/**
	 		 * Initialize this chart
			 *
			 * @returns {void}
			 */
			var init = function () {
							
				// Add headers
				elem.find('thead th').each( function (idx) {
					headerTypes[ idx ] = $( this ).attr('data-colType');										
					data.addColumn( $( this ).attr('data-colType'), $( this ).text() );
				});
								
				// Add rows
				elem.find('tbody tr').each( function () {
					var row = [];

					$( this ).find('td').each( function( idx ) {
						
						if( headerTypes[ idx ] == 'number' ){
							var val;
							if ( val = $( this ).text() ) {
								val = Number( val );
							} else {
								val = null;
							}
						} else if ( headerTypes[ idx ] == 'date' || headerTypes[ idx ] == 'datetime' || headerTypes[ idx ] == 'timeofday'  ) {
							var val = new Date( $( this ).text() );
						} else {
							var val = $( this ).text();
						}

						if( !_.isNaN( val ) ){
							row.push( val );	
						}
					});
					
					data.addRow(row);
				});
				
				if ( options.format ) {
					var formatter = new google.visualization.NumberFormat({pattern:'# ' + options.format} );
					formatter.format( data, 1 );
				}
				
				// Set options
				extraOptions = $.parseJSON( options.extraOptions );

				if( !_.isUndefined( extraOptions.height ) ){
					chartElem.css({
						height: extraOptions.height + 'px'
					});
				} else {
					chartElem.css({
						minHeight: '250px'
					});
				}
				
				// Add Chart wrapper
				elem.hide().after( chartElem );
				
				// We need to redraw the chart when the window resizes
				$( window ).on( 'resize', drawChart );

				drawChart();

				// Callback to let the page know
				google.visualization.events.addListener( chart, 'ready', function () {
					$( elem ).trigger( 'chartInitialized');
				});

				// If this chart is in a tab, we need to re-initialize it after the tab is shown so that
				// it sizes properly
				$( document ).on( 'tabShown', tabShown );
			},

			/**
	 		 * Draws a Google graph using the data in a table
			 *
			 * @returns {void}
			 */
			drawChart = function (e) {
				chart = new google.visualization[ options.type ]( chartElem.get(0) );
				chart.draw( data, extraOptions );
			},

			/**
	 		 * Destruct the graph widget on this instance
			 *
			 * @returns {void}
			 */
			destruct = function () {
				$( window ).off( 'resize', drawChart );
				$( document ).off( 'tabShown', tabShown );
			},

			/**
	 		 * Event handler for a tab showing
			 *
			 * @param 	{event} 	e 		Event object
			 * @param 	{object} 	data 	Event data object
			 * @returns {void}
			 */
			tabShown = function (e, data) {
				if( $.contains( data.panel.get(0), elem.get(0) ) ){
					drawChart();
				}
			};

			if( _.isUndefined( google.visualization ) ){
				google.setOnLoadCallback( init );	
			} else {
				init();
			} 

			return {
				init: init,
				drawChart: drawChart
			};
		};

		// Register this module as a widget to enable the data API and
		// jQuery plugin functionality
		ips.ui.registerWidget( 'chart', ips.ui.chart, [
			'type', 'extraOptions', 'format'
		] );

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});
}(jQuery, _));