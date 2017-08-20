/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.report.js - Controller for viewing a report
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.report', {
	
		initialize: function () {
			this.on( document, 'submitDialog', '[data-role="warnUserDialog"]', this.dialogSubmitted );
			this.on( 'menuItemSelected', this.menuItemSelected );
		},
		
		/**
		 * Respond when a menu item is selected
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Event data
		 * @returns 	{void}
		 */
		menuItemSelected: function(e, data) {
			data.originalEvent.preventDefault();

			var link = data.menuElem.find('[data-ipsMenuValue="' + data.selectedItemID + '"] a');
			var langString = ( data.selectedItemID == 'spamFlagButton' ) ? ips.getString( 'confirmFlagAsSpammer' ) : ips.getString( 'confirmUnFlagAsSpammer' );
			var descString = ( data.selectedItemID == 'spamUnFlagButton' ) ? ips.getString( 'confirmUnFlagAsSpammerDesc' ) : '';
			var self = this;

			if( data.selectedItemID == 'spamFlagButton' || data.selectedItemID == 'spamUnFlagButton' ){
				ips.ui.alert.show({
					type: 'confirm',
					message: langString,
					subText: descString,
					callbacks: {
						ok: function () {
							self._startLoading();

							ips.getAjax()( link.attr('href'), {
								bypassRedirect: true
							} )
								.done( function (response) {
									self._refreshPanel();
								});
						},
					}
				});
			}
		},
		
		/**
		 * Respond when a dialog is submitted
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Event data
		 * @returns 	{void}
		 */
		dialogSubmitted: function(e, data) {
			this._startLoading();
			this._refreshPanel();
		},
		
		/**
		 * Start Loading
		 */
		_startLoading: function() {
			this.scope
				.find('[data-role="authorPanel"]')
					.css( 'height', this.scope.find('[data-role="authorPanel"]').height() + 'px' )
					.addClass('ipsLoading')
					.find('*')
						.hide();
		},
		
		/**
		 * Refresh Panel
		 */
		_refreshPanel: function() {
			var self = this;
			ips.getAjax()( window.location, {
				bypassRedirect: true
			} )
				.done( function(response){
					self.scope
						.find('[data-role="authorPanel"]')
							.css( 'height', 'auto' )
							.removeClass('ipsLoading')
							.html( response );
				} );
		}
		
	});
}(jQuery, _));
