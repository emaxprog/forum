/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.css.js - CSS utilities
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.css', function () {

		var prefixes = [ 'webkit', 'moz', 'ms', 'o', 'w3c' ];

		/**
		 * Initialize CSS module
		 *
		 * @returns 	{void}
		 */
		var init = function () {},

		/**
		 * Builds a CSS style block from the provided selector/styles object
		 *
		 * @param 		{string} 	selector 		Selector to use
		 * @param 		{object}	styles			Object of styles, with the key being the property. If value is an array, 
		 *		multiple entries for the same property will be added (good for vendor prefixed)
		 * @returns 	{string}	Complete CSS style block
		 */
		buildStyleBlock = function (selector, styles, important) {
			var output = selector + " {\n";

			var getValue = function (key, value) {
				return "\t" + key + ': ' + value + ( ( important ) ? ' !important' : '' ) + ";\n";
			};

			_.each( styles, function (value, key) {
				if( _.isArray( value ) ){
					for( var i = 0; i < value.length; i++ ){
						output += getValue( key, value[ i ] );
					}
				} else {
					output += getValue( key, value );
				}
			});

			output += "}";

			return output;
		},

		/**
		 * Checks support for CSS transforms
		 *
		 * @returns 	{boolean}
		 */
		supportsTransform = function() {
			var bs = document.body.style;

			if( !_.isUndefined( bs.transform ) || !_.isUndefined( bs.WebkitTransform ) || 
					!_.isUndefined( bs.MozTransform ) || !_.isUndefined( bs.OTransform ) ){
				return true;
			}

			return false;
		},

		/**
		 * Replaces a style rule based on selector, in the stylesheet with the provided ID
		 *
		 * @param		{string}	stylesheetID	ID of stylesheet to update
		 * @param 		{string}	selector 		Selector to replace
		 * @param 		{object}	styles 			Object of style rules to build into a style block
		 * @returns 	{void}
		 */
		replaceStyle = function (stylesheetID, selector, styles) {	
			var stylesheet = getStylesheetRef( stylesheetID );
			var styleBlock = buildStyleBlock( selector, styles );
			var rulesKey = ( stylesheet['cssRules'] ) ? 'cssRules' : 'rules';
			var done = false;		

			// Loop through rules
			for( var rules = 0; rules < stylesheet[ rulesKey ].length; rules++ ){
				if( stylesheet[ rulesKey ][ rules ].selectorText == selector ){
					// Remove rule completely then readd it
					stylesheet.deleteRule( rules );
					stylesheet.insertRule( styleBlock, rules );
					done = true;
				}
			}

			// If we need a new rule...
			if( !done ){
				var idx = stylesheet.insertRule( styleBlock, stylesheet[ rulesKey ].length );
			}
		},

		/**
		 * Returns a reference to the stylesheet DOM object with the given ID
		 *
		 * @param 		{string}		stylesheet 		ID of the stylesheet to match
		 * @returns 	{element|boolean}	False if not found in document
		 */
		getStylesheetRef = function (stylesheetID) {
			var stylesheets = document.styleSheets;

			for( var sheet = 0; sheet < stylesheets.length; sheet++ ){
				if( stylesheets[ sheet ].ownerNode.id == stylesheetID ){
					return stylesheets[ sheet ];
				}
			}
			
			return false;
		},
		
		/**
		 * Returns an escaped version of a selector to use in jQuery
		 *
		 * @param 		{string}		selector 		Selector to escape
		 * @returns 	{string}
		 */
		escapeSelector = function (selector) {
			return selector.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
		},

		/**
		 * Builds a prefixed CSS gradient
		 *
		 * @param 		{number}		angle 		The angle of the gradient (can be negative)
		 * @param		{array}			stops 		Array of stop data, in format [ [ color, location ], [ color, location ] ]
		 * @param 		{boolean} 		asPureCSS 	Should the method return ready-to-use javascript? If not, it returns an array
		 * @returns 	{string|array}
		 */
		generateGradient = function (angle, stops, asPureCSS) {
			var stops = _buildStops( stops );
			var angles = _buildAngles( angle );
			var output = [];			

			for( var i = 0; i < prefixes.length; i++ ){
				output.push( _buildPrefix( prefixes[ i ], 'linear-gradient' ) + 
					'(' + angles[ prefixes[ i ] ] + ', ' + stops + ')' );
			}

			if( !asPureCSS ){
				return output;
			} else {
				var prefixOutput = [];

				for( var i = 0; i < output.length; i++ ){
					prefixOutput.push( 'background-image: ' + output[ i ] + ';');
				}

				return prefixOutput.join("\n");
			}
		},

		/**
		 * Builds a string for stops in a gradient
		 *
		 * @param		{array}		stops 		Array of stop data, in format [ [ color, location ], [ color, location ] ]
		 * @returns 	{string}	Stops in the format: <code>#fff 0%,#333 50%,#000 100%</code>
		 */
		_buildStops = function (stops) {
			var line = [];

			for( var i = 0; i < stops.length; i++ ){
				if( stops[ i ][0].charAt(0) != '#' ){
					stops[ i ][0] = '#' + stops[ i ][0];
				}

				line.push( stops[ i ][0] + ' ' + stops[ i ][1] + '%' );
			}

			return line.join(',');
		},

		/**
		 * Returns the correct angle value for each supported vendor, accounting for w3c difference and directional keywords
		 *
		 * @param 		{number}	angle 		The angle of the gradient (can be negative)
		 * @returns 	{object} 	e.g. { w3c: 'to bottom', moz: 'top', webkit: 'top', o: 'top', ms: 'top' }
		 */
		_buildAngles = function (angle) {
			var mapDegrees = {
				'0': 'right',
				'90': 'top',
				'-90': 'bottom',
				'180': 'left'
			};

			var opposites = { '0':'180', '90':'-90', '-90':'90', '180':'0' };
			var output = {};

			for( var i = 0; i < prefixes.length; i++ ){
				if( !_.isUndefined( mapDegrees[ angle ] ) ){
					if( prefixes[ i ] == 'w3c' ){
						output[ prefixes[ i ] ] = 'to ' + mapDegrees[ opposites[ angle ] ];
					} else {
						output[ prefixes[ i ] ] = mapDegrees[ angle ];
					}
				} else {
					output[ prefixes[ i ] ] = angle + 'deg';
				}				
			}

			return output;
		},

		/**
		 * Builds a vendor-prefixed version of the given style property
		 * Does not validate that the style property is one that actually needs prefixing
		 *
		 * @param 		{string} 	vendor 		Vendor key to use
		 * @param 		{string}	style		Style property to prefix
		 * @returns 	{string}	e.g. -webkit-linear-gradient
		 */
		_buildPrefix = function (vendor, style) {
			return ( ( vendor != 'w3c' ) ? '-' + vendor + '-': '' ) + style;
		};

		return {
			generateGradient: generateGradient,
			replaceStyle: replaceStyle,
			getStylesheetRef: getStylesheetRef,
			buildStyleBlock: buildStyleBlock,
			escapeSelector: escapeSelector
		};
	});

}(jQuery, _));