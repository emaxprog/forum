/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.colorizer.js - VSE colorizer controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.colorizer', {

		initialize: function () {
			this.on( 'change', "input[type='text']", this.colorChanged );
			this.on( 'click', '[data-action="revertColorizer"]', this.revertChanges );
			this.setup();
		},

		setup: function () {
			var colors = {};

			Debug.log( this.scope.data('styleData') );

			_.each( colorizer.startColors, function (value, key) {
				colors[ key ] = '#' + value;
			});

			this.scope.html( ips.templates.render( 'vse.colorizer.panel', colors ) );

			// Set up jscolor on the items
			this.scope.find('input[type="text"].color').each( function () {
				$( this ).attr( 'data-original', $( this ).val() );
				new jscolor.color( this, {
					slider: false
				});
			});
		},

		/**
		 * Event handler for a color value being changed
		 * Determines the hue/sat for the selected color, then loops through all styles and applies it to the relevant ones
		 *
		 * @param		{event}		e 	Event object
		 * @returns 	{void}
		 */
		colorChanged: function (e) {
			var self = this;
			var type = $( e.currentTarget ).attr('data-role');
			var color = $( e.currentTarget ).val().replace('#', '');
			var h = $( e.currentTarget ).get(0).color.hsv[0] * 60;
			var s = $( e.currentTarget ).get(0).color.hsv[1] * 100;

			if( _.isUndefined( colorizer[ type ] ) ){
				Debug.error("Can't find data for " + type);
				return;
			}

			// We need the HSL for the color chosen
			/*var r = ips.utils.color.hexToRGB( color.slice(0, 2) ) / 255;
			var g = ips.utils.color.hexToRGB( color.slice(2, 4) ) / 255;
			var b = ips.utils.color.hexToRGB( color.slice(4, 6) ) / 255;*/

			//var hsl = ips.utils.color.RGBtoHSL( r, g, b );

			// Get the classes for which we're updating the color
			var toUpdate = colorizer[ type ];

			// Loop through every section and check if it's in our type object
			_.each( ipsVSEData.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					if( !_.isUndefined( toUpdate[ styleKey ] ) ){
						for( var i = 0; i < toUpdate[ styleKey ].length; i++ ){
							if( self[ '_update' + toUpdate[ styleKey ][ i ] ] ){
								self[ '_update' + toUpdate[ styleKey ][ i ] ]( styleData, styleKey, h, s );
							}
						}
					}
				});
			});

			// Enable button
			this.scope.find('[data-action="revertColorizer"]').attr('disabled', false);
		},

		/**
		 * Reverts colors back to their default state
		 *
		 * @param		{object}	e 		Event object
		 * @returns 	{void}
		 */
		revertChanges: function (e) {
			var self = this;

			// Confirm with the user this is OK
			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'warn',
				message: ips.getString('vseRevert'),
				subText: ips.getString('vseRevert_subtext'),
				callbacks: {
					ok: function () {
						self.trigger('revertChanges');
						self.trigger('closeColorizer');

						// Revert the colors in our text boxes too
						self.scope.find('.vseColorizer_swatch').each( function () {
							this.color.fromString( $( this ).attr('data-original') );
						});
					}
				}
			});
		},

		/**
		 * Updates a style background (color & gradient)
		 *
		 * @param		{object}	styleData 		Data for this style
		 * @param 		{string}	styleKey		Key in the main object that identifies this style
		 * @param 		{number}	h 				New hew
		 * @param 		{number}	s 				New saturation
		 * @returns 	{void}
		 */
		_updatebackground: function (styleData, styleKey, h, s) {
			if( _.isUndefined( styleData.background ) ){
				return;
			}

			if( styleData.background.color ){
				styleData.background.color = ips.utils.color.convertHex( styleData.background.color, h, s );
			}

			if( styleData.background.gradient ){
				for( var i = 0; i < styleData.background.gradient.stops.length; i++ ){
					styleData.background.gradient.stops[ i ][0] = ips.utils.color.convertHex( styleData.background.gradient.stops[ i ][0], h, s );
				}
			}

			this.trigger( 'styleUpdated', {
				selector: styleData.selector
			});
		},

		/**
		 * Updates a style font (color)
		 *
		 * @param		{object}	styleData 		Data for this style
		 * @param 		{string}	styleKey		Key in the main object that identifies this style
		 * @param 		{number}	h 				New hew
		 * @param 		{number}	s 				New saturation
		 * @returns 	{void}
		 */
		_updatefont: function (styleData, styleKey, h, s) {
			if( _.isUndefined( styleData.font ) || _.isUndefined( styleData.font.color ) ){
				return;
			}

			styleData.font.color = ips.utils.color.convertHex( styleData.font.color, h, s );

			this.trigger( 'styleUpdated', {
				selector: styleData.selector
			});
		}		
	});
}(jQuery, _));