/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.panelBackground.js - VSE background panel controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.panelBackground', {

		_data: {},
		_gradientStops: null,
		_gradientEditor: null,
		_currentAngle: 0,

		initialize: function () {
			this.setup();
			this.on( 'click', '[data-action="launchGradientEditor"]', this.launchGradientEditor );
			this.on( 'click', '[data-action="gradientAngle"]', this.changeGradientAngle );
			this.on( 'click', '[data-action="gradientAddStop"]', this.addGradientStop );
			this.on( 'click', '[data-action="gradientRemoveStop"]', this.removeGradientStop );
			this.on( 'click', '[data-action="saveGradient"]', this.saveGradient );
			this.on( 'click', '[data-action="cancelGradient"]', this.cancelGradient );
			this.on( 'click', '[data-action="removeGradient"]', this.removeGradient );
			this.on( 'change', '[data-role="backgroundColor"]', this.changeBackground );
			this.on( 'change', '[data-role="gradientEditor"] input', this.refreshGradientPreview );
		},

		/**
		 * Setup: builds the background widget HTML
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._data = this.scope.data('styleData');

			// Build itself
			this.scope.append( ips.templates.render('vse.panels.wrapper', {
				content: ips.templates.render('vse.panels.background', {
					backgroundColor: this._data.color || '417ba3'
				}),
				type: 'background'
			}));

			this._updateBackgroundPreview();

			// Add jscolor to boxes
			this.scope.find('input[type="text"].color').each( function () {
				new jscolor.color( this );
			});
		},

		/**
		 * Event handler for the background color field changing
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeBackground: function (e) {
			this._data.color = $( e.currentTarget ).val();
			this._updateBackgroundPreview();
			this.trigger('widgetStyleUpdated');
		},

		/**
		 * Shows the gradient editor view
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		launchGradientEditor: function (e) {
			e.preventDefault();

			if( !this.scope.find('[data-role="gradientEditor"]').length ){
				this._buildGradientEditor();
			}

			this.scope.find('[data-role="backgroundControls"]').hide();
			
			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-role="gradientEditor"]') );
		},

		/**
		 * Saves an edited gradient
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		saveGradient: function (e) {
			e.preventDefault();

			// Get gradient data
			var stops = this._getGradientStops();
			var angle = this._currentAngle;

			// Update gradient data
			// Because our data object is referenced, updating here updates it in all controllers automatically
			// so we don't need to send this data upwards manually
			this._data.gradient = {
				angle: angle,
				stops: stops
			};

			this._resetGradientEditor();
			this._updateBackgroundPreview();

			// Let the panel know a widget style has changed
			this.trigger('widgetStyleUpdated');
		},

		/**
		 * Cancels an edited gradient
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		cancelGradient: function (e) {
			e.preventDefault();
			this._resetGradientEditor();
		},

		/**
		 * Removes an existing gradient
		 *
		 * @returns 	{void}
		 */
		removeGradient: function (e) {
			e.preventDefault();

			delete this._data.gradient;

			this._resetGradientEditor();
			this._updateBackgroundPreview();

			// Let the panel know a widget style has changed
			this.trigger('widgetStyleUpdated');
		},

		/**
		 * Refreshes the gradient preview box (called when color, location etc. changes)
		 *
		 * @returns 	{void}
		 */
		refreshGradientPreview: function () {
			var gradient = ips.utils.css.generateGradient( this._currentAngle, this._getGradientStops(), false );
			var previewer = this._gradientEditor.find('[data-role="gradientPreview"]');

			_.each( gradient, function (val, idx) {
				previewer.css( { background: val } );
			});

			// Enable the cancel/save buttons
			this._gradientEditor.find('[data-action="cancelGradient"], [data-action="saveGradient"]').prop( 'disabled', false );
		},

		/**
		 * Event handler for changing the angle of the gradient by clicking one of the angle buttons
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeGradientAngle: function (e) {
			this._gradientEditor.find('[data-action="gradientAngle"]').removeClass('ipsButton_normal').addClass('ipsButton_primary');
			$( e.currentTarget ).removeClass('ipsButton_primary').addClass('ipsButton_normal');

			this._currentAngle = $( e.currentTarget ).attr('data-angle');

			this.refreshGradientPreview();
		},

		/**
		 * Adds a new stop to the gradient
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		addGradientStop: function (e) {
			e.preventDefault();

			this._gradientStops
				.find('li:last-child')
					.before( ips.templates.render('vse.gradient.stop', {
						color: '444444',
						location: 100
					}) );

			this._gradientStops
				.find('li:last-child')
				.prev('li')
					.find('input[type="text"]')
					.each( function () {
						new jscolor.color( this );
					});
		},

		/**
		 * Called when the order changes. We need to adjust the positions so that they are in numerical order
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeStopOrdering: function (e, ui) {
			var stops = this._gradientStops.find('li:not( :first-child ):not( :last-child ) input[type="range"]');
			var self = this;

			// If we just have two, switch them
			if( stops.length == 2 ){
				var firstInput = stops.first();
				var secondInput = stops.last();
				var firstPos = firstInput.val();
				var secondPos = secondInput.val();

				firstInput.val( secondPos );
				secondInput.val( firstPos );
			} else {

				var gaps = Math.floor( 100 / ( stops.length - 1 ) );
				var pos = 0;

				stops.each( function (index) {
					var value = $( this ).val();

					// get prev and next values
					var prev = parseInt( $( stops[ index - 1 ] ).val() || 0 );
					var next = parseInt( $( stops[ index + 1 ] ).val() || 100 );

					// Try and reposition the stops so that they're in order
					if( index == 0 && value >= next ){
						// If this is the first stop, and the value is bigger than the next stop, halve it
						$( this ).val( Math.floor( next / 2 ) );
					} else if( index == ( stops.length - 1 ) && value <= prev ){
						// If this is the last stop, and the value is smaller than the prev stop, add one (up to 100)
						$( this ).val( _.min( [ 100, prev + 1 ] ) );
					} else if( ( index > 0 && index < ( stops.length - 1 ) ) && ( value <= prev || value >= next ) ){
						// If the value is less than the prev or more than the next, then adjust it
						if( next > prev ){
							$( this ).val( prev + ( ( next - prev ) / 2 ) );
						} else {
							$( this ).val( prev + 1 );
						}
					}
				});

			}

			this.refreshGradientPreview();
		},

		/**
		 * Removes a gradient stop from the list
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		removeGradientStop: function (e) {
			// Find the row
			$( e.currentTarget ).closest('li').remove();
			this.refreshGradientPreview();
		},

		/**
		 * Resets the gradient editor, removing it from the dom and resetting controller properties
		 *
		 * @returns 	{void}
		 */
		_resetGradientEditor: function () {
			// Hide the editor
			this._gradientEditor.hide().remove();
			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-role="backgroundControls"]') );

			// Reset data
			this._gradientEditor = null;
			this._currentAngle = 0;
			this._currentStops = null;
		},

		/**
		 * Updates the background preview chip using current data
		 *
		 * @returns 	{void}
		 */
		_updateBackgroundPreview: function () {
			var chip = this.scope.find('[data-role="backgroundPreview"]');

			// Reset the properties first
			chip.css({
				backgroundColor: 'transparent',
				backgroundImage: 'none'
			});

			// Add color
			if( this._data.color ){
				chip.css({
					backgroundColor: '#' + this._data.color
				});
			}

			// Gradient
			if( this._data.gradient ){
				var gradient = ips.utils.css.generateGradient( this._data.gradient.angle, this._data.gradient.stops, false );

				_.each( gradient, function (val) {
					chip.css({
						backgroundImage: val
					});	
				});				
			}
		},

		/**
		 * Builds the gradient editor HTML, either in a default state or based on the data we have for an existing gradient
		 *
		 * @returns 	{void}
		 */
		_buildGradientEditor: function () {
			var self = this;
			var buttons = ( _.isUndefined( this._data.gradient ) ) ? ips.templates.render('vse.gradient.twoButtons') : ips.templates.render('vse.gradient.threeButtons');

			this.scope.find('[data-role="backgroundControls"]').after(
				$('<div/>').attr('data-role', 'gradientEditor').html( ips.templates.render('vse.gradient.editor', {
					buttons: buttons
				}) )
			);

			this._gradientEditor = this.scope.find('[data-role="gradientEditor"]');
			this._gradientStops = this._gradientEditor.find('[data-role="gradientStops"]');

			// Do we have an existing gradient to show?
			if( !_.isUndefined( this._data.gradient ) ){
				_.each( this._data.gradient.stops, function (value) {
					self._gradientStops
						.find('li:last-child')
							.before( ips.templates.render('vse.gradient.stop', {
								color: value[0],
								location: parseInt( value[1] )
							}));
				});
			} else {
				// No existing gradient - add two default rows
				this._gradientStops
					.find('li:last-child')
						.before( ips.templates.render('vse.gradient.stop', { color: '6592c4', location: 0 } ))
						.before( ips.templates.render('vse.gradient.stop', { color: '2b517b', location: 100 } ));
			}

			this._currentAngle = ( _.isUndefined( this._data.gradient ) ) ? 90 : this._data.gradient.angle || 90;
			this.refreshGradientPreview();

			// Highlight the correct angle button
			this._gradientEditor
				.find('[data-action="gradientAngle"][data-angle="' + this._currentAngle + '"]')
					.addClass('ipsButton_normal')
					.removeClass('ipsButton_primary');

			// Set up jscolor on inputs
			this._gradientStops.find('input[type="text"]').each( function () {
				new jscolor.color( this );
			});

			// Disable the save & cancel buttons for now
			this._gradientEditor.find('[data-action="cancelGradient"], [data-action="saveGradient"]').prop( 'disabled', true );

			// Allow stops to be sortable
			ips.loader.get( ['core/interface/jquery/jquery-ui.js'] ).then( function () {
				self._gradientStops.sortable({
					handle: '.fa-bars',
					axis: 'y',
					update: _.bind( self.changeStopOrdering, self )
				})
			});
		},

		/**
		 * Returns an array of the current stops the gradient editor has
		 *
		 * @returns 	{array}		Format: [ [ color, location ], [ color, location ] ]
		 */
		_getGradientStops: function () {
			var self = this;
			var output = [];

			this._gradientStops.find('> li:not( :first-child ):not( :last-child )').each( function () {
				output.push( [ $( this ).find('input[type="text"]').val(), $( this ).find('input[type="range"]').val() ] );
			});

			return output;
		}
	});
}(jQuery, _));