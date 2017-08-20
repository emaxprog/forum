/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.members.restrictions.js - Controller for restrictions screen
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.members.restrictions', {

		initialize: function () {
			this.on( 'click', '.acpRestrictions_subHeader h3', this.toggleSubHeader );
			this.on( 'change', '.acpRestrictions_header input[type="checkbox"]', this.toggleHeader );
			this.on( 'change', '.acpAppRestrictions_header input[type="checkbox"]', this.toggleAppHeader );
			this.on( 'click', '[data-action="checkAll"]', this.checkAll );
			this.on( 'click', '[data-action="checkNone"]', this.checkNone );
			this.on( 'click', '[data-action="expandAll"], [data-action="collapseAll"]', this.toggleDisplay );

			this.setup();
		},

		/**
		 * Event handler for both the expand and collapse links
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleDisplay: function (e) {
			e.preventDefault();

			var row = $( e.currentTarget ).closest('.acpRestrictions_header');
			var subHeaders = row.next().find('.acpRestrictions_subHeader');
			var self = this;
			var action = ( $( e.currentTarget ).attr('data-action') == 'expandAll' ) ? 'expand' : 'collapse';

			subHeaders.each( function () {
				if( action == 'expand') {
					self._expandSection( $( this ) );	
				} else {
					self._collapseSection( $( this ) );
				}				
			});
		},

		/**
		 * Disables all the toggles in an app when the app header is unchecked
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleAppHeader: function (e) {
			var check = $( e.currentTarget );
			var row = check.closest('.acpAppRestrictions_header');

			if( !check.is(':checked') ){
				row
					.siblings('.acpAppRestrictions_panel')
					.find('.acpRestrictions_header input[type="checkbox"]')
						.each( function () {
							// Loops through each checkbox, disables it, stores the original state as an attr,
							// unchecks it, and triggers a change event to update the JS toggle widget.
							$( this )
								.prop('disabled', true)
								.attr( 'data-originalState', $( this ).is(':checked') )
								.attr( 'checked', false )
								.trigger('change');
						});
			} else {
				// Top panel rows
				row
					.siblings('.acpAppRestrictions_panel')
					.find('input[type="checkbox"]')
						.each( function () {
							var thisCheck = $( this );
							thisCheck.prop( 'disabled', false );

							if( thisCheck.attr('data-originalState') == 'true' ){
								thisCheck
									.prop( 'checked', true )
									.trigger('change');
							}
						});

				// Sub panel rows
				row
					.siblings('.acpAppRestrictions_panel')
					.find('.acpRestrictions_panel input[type="checkbox"]')
						.each( function () {
							var thisCheck = $( this );
							var checked = thisCheck.closest('.acpRestrictions_panel').siblings('.acpRestrictions_header').find('input[type="checkbox"]').is(':checked');

							if( !checked ){
								thisCheck.prop('disabled', true);
							} else {
								thisCheck.prop('disabled', false);
							}

							if( thisCheck.attr('data-originalState') == 'true' ){
								thisCheck
									.prop( 'checked', true )
									.trigger('change');
							}
						});
			}
		},

		/**
		 * Disables all the toggles in a section when the section header is unchecked
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleHeader: function (e) {
			var check = $( e.currentTarget );
			var row = check.closest('.acpRestrictions_header');
			var unChecked = !check.is(':checked');

			row
				.next()
				.find('input[type="checkbox"]')
					.each( function () {
						var thisCheck = $( this );

						if( unChecked ){
							thisCheck
								.attr( 'data-originalState', thisCheck.is(':checked') )
								.prop( 'checked', false );
						} else if ( ( thisCheck.attr('data-originalState') == 'true' ) ){
							thisCheck.prop( 'checked', true );
						}
						
						thisCheck
							.prop( 'disabled', unChecked )
							.trigger('change');
					});
		},

		/**
		 * Toggles the display of a section when a subheader is clicked
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleSubHeader: function (e) {
			var header = $( e.currentTarget ).parent();

			if( header.hasClass('acpRestrictions_open') ){
				this._collapseSection( header );
			} else {
				this._expandSection( header );
			}
		},

		/**
		 * Displays a section with animation
		 *
		 * @param	{element} 	section 	The section to show
		 * @returns {void}
		 */
		_expandSection: function (section) {
			var next = section.next('ul');

			section
				.addClass('acpRestrictions_open')
				.removeClass('acpRestrictions_closed');

			ips.utils.anim.go( 'fadeInDown fast', next );
		},

		/**
		 * Hides a section
		 *
		 * @param	{element} 	section  	The section to hide
		 * @returns {void}
		 */
		_collapseSection: function (section) {
			section
				.removeClass('acpRestrictions_open')
				.addClass('acpRestrictions_closed');
		},

		/**
		 * Checks all toggles in the section, opening the section too if necessary
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkAll: function (e) {
			e.preventDefault();
			var self = this;
			var header = $( e.currentTarget ).parents('.acpRestrictions_subHeader');
			var next = header.next('ul');

			// If the section isn't visible, do the toggling after the section has
			// animated in, so that the user can see the change happen. Otherwise, just do it immediately
			if( !next.is(':visible') ){
				next.animationComplete( function () {
					self._togglePermissions( true, next );
				});

				this._expandSection( header );	
			} else {
				this._togglePermissions( true, next );
			}
			
		},

		/**
		 * Unchecks all toggles in the section, opening the section too if necessary
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkNone: function (e) {
			e.preventDefault();
			var self = this;
			var header = $( e.currentTarget ).parents('.acpRestrictions_subHeader');
			var next = header.next('ul');

			// If the section isn't visible, do the toggling after the section has
			// animated in, so that the user can see the change happen. Otherwise, just do it immediately
			if( !next.is(':visible') ){
				next.animationComplete( function () {
					self._togglePermissions( false, next );
				});

				this._expandSection( header );	
			} else {
				this._togglePermissions( false, next );
			}
			
		},

		/**
		 * Sets all checkboxes to the given state in the given container
		 *
		 * @param	{boolean} 	state 		The state to which checkboxes will be set
		 * @param 	{element} 	container 	The container in which the checkboxes must exist
		 * @returns {void}
		 */
		_togglePermissions: function (state, container) {
			container.find('input[type="checkbox"]:not( [disabled] )').prop('checked', state).change();
		},

		/**
		 * Setup method
		 * Collapses all sections initially
		 *
		 * @returns {void}
		 */
		setup: function () {
			this.scope
				.find('.acpRestrictions_open')
					.removeClass('acpRestrictions_open')
					.addClass('acpRestrictions_closed');
		}
	});
}(jQuery, _));