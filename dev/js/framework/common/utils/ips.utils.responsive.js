/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.responsive.js - A library for managing breakpoints in a responsive layout, 
 * and setting callbacks to be executed when breakpoints are hit.
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.responsive', function (options) {

		options = $.extend({
			breakpoints: {
				980: 'desktop',
				768: 'tablet',
				0: 'phone'
			}
		});

		var self = this,
			previousBreakpoint = [],
			currentBreakpoint = [],
			breakpointsBySize = {},
			breakpointsByKey = {},
			callbacks = {};

		// --------------------------------------------------------------------
		// PUBLIC METHODS
		
		/**
		 * Returns boolean denoting whether the supplied key name is
		 * the current size
		 *
		 * @param 	{mixed} 	toCheck 	The breakpoint value or key name to check
		 * @returns {boolean}
		 */
		var currentIs = function (toCheck) {

			if( _.isNumber( toCheck ) ){
				return currentBreakpoint[0] == toCheck;
			} else {
				return toCheck && currentBreakpoint[1] == toCheck;
			}
		},

		/**
		 * Returns the key name of the current size (e.g. 'phone')
		 *
		 * @returns 	{string}
		 */
		getCurrentKey = function () {
			return currentBreakpoint[1];
		},

		/**
		 * Returns all breakpoints, as an object
		 *
		 * @returns 	{object}
		 */
		getAllBreakpoints = function () {
			return breakpointsBySize;
		},

		/**
		 * Adds a breakpoint value
		 *
		 * @param 	{number}	breakpoint 	The size in px being registered
		 * @param 	{string}	name		An alphanumeric name to identify this breakpoint
		 * @returns {void}
		 */
		addBreakpoint = function (breakpoint, name) {
			breakpointsBySize[ breakpoint ] = name;
			breakpointsByKey[ name ] = breakpoint;

			// Add an empty array to the callback stack for later
			callbacks[ breakpoint ] = { enter: [], exit: [] };
		},

		/**
		 * Adds a callback to the queue for the specified breakpoint
		 * 
		 * @param 	breakpoint 		The breakpoint at which the callback will fire
		 * @param 	type 			Type of callback to add (enter or exit)
		 * @param 	callback 		The callback to be fired
		 * @returns {mixed} 		Void, or false if invalid callback is provided
		 */
		addCallback = function (breakpoint, type, callback) {

			if( !breakpointsBySize[ breakpoint ] || ( type != 'enter' && type != 'exit' ) ){
				return false;
			}

			callbacks[ breakpoint ][ type ].push( callback );
		},

		/**
		 * Fetches the current relevant breakpoint, and determines whether
		 * it has changed from the previous firing. If so, calls the callbacks
		 *
		 * @returns 	{void}
		 */
		checkForBreakpointChange = function () {
			
			var newBreak = getCurrentBoundary();

			// Different to the last round?
			if( newBreak != currentBreakpoint[0] ){

				// Execute any callbacks
				executeCallbacks( newBreak, currentBreakpoint[0] );

				// Update our previous/current breakpoint records
				previousBreakpoint = currentBreakpoint;
				currentBreakpoint = [ newBreak, breakpointsBySize[ newBreak ] ];

				// Fire event
				$( document ).trigger('breakpointChange', {
					curBreakSize: newBreak,
					curBreakName: breakpointsBySize[ newBreak ]
				});
			}
		},

		/**
		 * Runs the enter/exit callbacks for given breakpoints
		 *
		 * @param 	enterPoint	The breakpoint for the 'enter' callback
		 * @param 	exitPoint	The breakpoint for the 'exit' callback
		 *
		 * @returns {void}
		 */
		executeCallbacks = function (enterPoint, exitPoint) {

			if( !_.isUndefined( enterPoint ) && !_.isUndefined( callbacks[ enterPoint ] ) &&
				 !_.isUndefined( callbacks[ enterPoint ]['enter'] ) && callbacks[ enterPoint ]['enter'].length ){
				$.each( callbacks[ enterPoint ]['enter'], function (idx, thisCallback) {
					thisCallback();
				});
			}

			if( !_.isUndefined( exitPoint ) && !_.isUndefined( callbacks[ exitPoint ] ) &&
				 !_.isUndefined( callbacks[ exitPoint ]['exit'] ) && callbacks[ exitPoint ]['exit'].length ){
				$.each( callbacks[ exitPoint ]['exit'], function (idx, thisCallback) {
					thisCallback();
				});
			}
		},

		/**
		 * Works out the most relevant breakpoint based on window width
		 *
		 * @returns 	{number} 	Breakpoint size in px
		 */
		getCurrentBoundary = function () {

			var curWidth = window.innerWidth || $( window ).width();
			var curBreak;

			// Iterate to find which breakpoints are within range,
			// given the current window width
			var possibleSizes = _.filter( breakpointsByKey, function (num) { 
				return curWidth >= num; 
			});

			// If we have any breakpoints in range, get the biggest,
			// otherwise we'll get the smallest possible size
			if( possibleSizes.length ){
				curBreak = _.max( possibleSizes, function (num) { 
					return parseInt( num ); 
				});
			} else {
				curBreak = _.min( breakpointsByKey, function (num) {
					return parseInt( num );
				});
			}

			return curBreak;
		},

		// --------------------------------------------------------------------
		// PRIVATE METHODS

		/**
		 * Initialization method; imports default breakpoints and set up
		 * window.resize event
		 *
		 * @returns 	{void}
		 */
		init = function (){

			// Add our default breakpoints to start with
			$.each( options.breakpoints, function (size, name) {
				addBreakpoint(size, name);
			});

			$( window ).resize( windowResize );

			checkForBreakpointChange();
		},

		/**
		 * Event handler fired when window resizes
		 *
		 * @returns 	{void}
		 */
		windowResize = function () {
			checkForBreakpointChange();
		},

		enabled = function () {
			return true;
		};

		// Initialize this module
		init();

		// Expose public methods
		return {
			addBreakpoint: addBreakpoint,
			addCallback: addCallback,
			currentIs: currentIs,
			getCurrentKey: getCurrentKey,
			getAllBreakpoints: getAllBreakpoints,
			enabled: enabled
		}
	});

}(jQuery, _));