/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.apiPermissions.js - API Permissions form
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.apiPermissions', {

		initialize: function () {
			this.on( 'click', '[data-action="toggleSection"]', this.toggleSection );
			this.on( 'click', '.cApiPermissions [data-action="checkAll"]', this.checkAll );
			this.on( 'click', '.cApiPermissions [data-action="checkNone"]', this.checkNone );
			this.on( 'click', '.cApiPermissions_header [data-action="checkAll"]', this.checkAllHeader );
			this.on( 'click', '.cApiPermissions_header [data-action="checkNone"]', this.checkNoneHeader );
			this.setup();
		},

		setup: function () {
			var self = this;
			var sections = this.scope.find('.cApiPermissions > li');

			sections.each( function () {
				self._calculatedCheckedEndpoints( $( this ) );
			});
		},

		/**
		 * Toggles the display of a section when a subheader is clicked
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleSection: function (e) {
			var header = $( e.currentTarget ).parent();

			if( header.hasClass('cApiPermissions_open') ){
				this._collapseSection( header );
			} else {
				this._expandSection( header );
			}
		},

		/**
		 * Checks all toggles for an app
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkAllHeader: function (e) {
			e.preventDefault();
			var self = this;
			var header = $( e.currentTarget ).closest('.cApiPermissions_header');
			var sections = header.next('.cApiPermissions').find('> li');

			sections.each( function () {
				var next = $( this ).find('> ul');

				if( !next.is(':visible') ){
					next.animationComplete( function () {
						setTimeout( function () {
							self._togglePermissions( true, next );
						}, 300 );
					});

					self._expandSection( $( this ) );	
				} else {
					self._togglePermissions( true, next );
				}
			})
		},

		/**
		 * Checks all toggles for an app
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkNoneHeader: function (e) {
			e.preventDefault();
			var self = this;
			var header = $( e.currentTarget ).closest('.cApiPermissions_header');
			var sections = header.next('.cApiPermissions').find('> li');

			sections.each( function () {
				var next = $( this ).find('> ul');

				if( !next.is(':visible') ){
					next.animationComplete( function () {
						setTimeout( function () {
							self._togglePermissions( false, next );
						}, 300 );
					});

					self._expandSection( $( this ) );	
				} else {
					self._togglePermissions( false, next );
				}	
			})
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
			var header = $( e.currentTarget ).parents('li').first();
			var next = header.find('> ul');

			// If the section isn't visible, do the toggling after the section has
			// animated in, so that the user can see the change happen. Otherwise, just do it immediately
			if( !next.is(':visible') ){
				next.animationComplete( function () {
					setTimeout( function () {
						self._togglePermissions( true, next );
					}, 300 );
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
			var header = $( e.currentTarget ).parents('li').first();
			var next = header.find('> ul');

			// If the section isn't visible, do the toggling after the section has
			// animated in, so that the user can see the change happen. Otherwise, just do it immediately
			if( !next.is(':visible') ){
				next.animationComplete( function () {
					setTimeout( function () {
						self._togglePermissions( false, next );
					}, 300 );
				});

				this._expandSection( header );	
			} else {
				this._togglePermissions( false, next );
			}			
		},

		_calculatedCheckedEndpoints: function (section) {
			var totalEndpoints = section.find('input[name*="access"]');
			var checkedEndpoints = totalEndpoints.filter(':checked');
			var endpointSpan = section.find('[data-role="endpointOverview"]');

			if( section.hasClass('cApiPermissions_open') ){
				endpointSpan.hide();
			} else {
				var text = ips.getString('apiEndpoints_all');

				if( !checkedEndpoints.length ){
					text = ips.getString('apiEndpoints_none');
				} else if( totalEndpoints.length !== checkedEndpoints.length ){
					text = ips.pluralize( ips.getString( 'apiEndpoints_some', { checked: checkedEndpoints.length } ), totalEndpoints.length );	
				}

				endpointSpan.text( text ).show();
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
		 * Displays a section with animation
		 *
		 * @param	{element} 	section 	The section to show
		 * @returns {void}
		 */
		_expandSection: function (section) {
			var next = section.find('> ul');

			section
				.addClass('cApiPermissions_open')
				.removeClass('cApiPermissions_closed');

			ips.utils.anim.go( 'fadeInDown fast', next );

			this._calculatedCheckedEndpoints( section );
		},

		/**
		 * Hides a section
		 *
		 * @param	{element} 	section  	The section to hide
		 * @returns {void}
		 */
		_collapseSection: function (section) {
			section
				.removeClass('cApiPermissions_open')
				.addClass('cApiPermissions_closed');

			this._calculatedCheckedEndpoints( section );
		},
	});
}(jQuery, _));