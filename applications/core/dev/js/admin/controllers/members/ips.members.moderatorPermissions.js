/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.members.moderatorPermissions.js - 
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.members.moderatorPermissions', {

		initialize: function () {
			this.on( 'change', '#ipsTabs_tabs_form_form_tab_modperms__core_Content_panel input[type="checkbox"]', this.toggle );
			this.on( 'click', '[data-role="checkAll"]', this.checkAll );
			this.on( 'click', '[data-role="uncheckAll"]', this.checkAll );
			this.setup();
		},

		/**
		 * Setup method; checks initial states of toggles
		 *
		 * @returns {void}
		 */
		setup: function () {
			var mainPanel = this.scope.find('#ipsTabs_tabs_form_form_tab_modperms__core_Content_panel');
			var self = this;

			mainPanel.find('input[type="checkbox"]').each( function () {
				self._toggleChanged( $( this ) );
			});
			
			$(this.scope).find('.ipsTabs_panel').each(function(){
				var controls = $( ips.templates.render( 'moderatorPermissions.checkUncheckAll' ) );
				controls.find('a').attr( 'data-scope', $(this).attr('id') );
				$(this).children('ul').prepend( controls );
			});

			this._checkEachTab();
		},
		
		/**
		 * Check/uncheck all
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkAll: function (e) {
			
			var check = $(e.currentTarget).attr('data-role') == 'checkAll';
			
			if ( $(e.currentTarget).attr('data-scope') ) {
				var scope = $( '#' + $(e.currentTarget).attr('data-scope') );
			} else {
				var scope = $(this.scope);
			}
			
			var self = this;
			scope.find('input[type="checkbox"]').each(function(){
				if ( check && !$(this).is(':checked') ) {
					$(this).prop( 'checked', true ).change();
				} else if ( !check && $(this).is(':checked') ) {
					$(this).prop( 'checked', false ).change();
				} 
			})
		},

		/**
		 * Toggle event handler
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggle: function (e) {
			this._toggleChanged( $( e.currentTarget ) );
			this._checkEachTab();
		},

		/**
		 * Called when a toggle changes in the main panel. If checked, other toggles of this type in other panels are hidden
		 *
		 * @param	{element} 	thisToggle 		The toggle that has changed
		 * @returns {void}
		 */
		_toggleChanged: function (thisToggle) {
			var id = thisToggle.closest('.ipsFieldRow').attr('id').replace('_content', '');
			var panels = this.scope.find('.ipsTabs_panel:not( #ipsTabs_tabs_form_form_tab_modperms__core_Content_panel )');
			var otherToggles =  panels.find('.ipsFieldRow[id^="' + id + '"]').not( thisToggle.closest('.ipsFieldRow') );

			if( thisToggle.is(':checked') ){
				// Find all other toggles of this type and hide them
				otherToggles.hide();
				otherToggles.find('input[type="checkbox"]').prop( 'disabled', true );
			} else {
				otherToggles.show();
				otherToggles.find('input[type="checkbox"]').prop( 'disabled', false );
			}
		},

		/**
		 * Checks each tab on the form to see whether any permissions are showing, hiding it if not
		 *
		 * @returns {void}
		 */
		_checkEachTab: function () {
			var self = this;
			var panels = this.scope.find('.ipsTabs_panel:not( #ipsTabs_tabs_form_form_tab_modperms__core_Content_panel )');

			// Now check each tab to make sure there's some to show
			panels.each( function () {
				var count = $( this ).find('input[type="checkbox"]:enabled:not( [data-role="zeroVal"] )').length;
				var id = $( this ).attr('id').replace('ipsTabs_tabs_form_', '').replace('_panel', '');

				if( !count ){
					self.scope.find('#' + id).closest('li').hide();
				} else {
					self.scope.find('#' + id).closest('li').show();
				}
			});
		}
	});
}(jQuery, _));