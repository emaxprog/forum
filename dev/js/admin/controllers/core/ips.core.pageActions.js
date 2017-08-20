/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.pageActions.js - Expands/contracts page actions
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.pageActions', {

		_expanded: false,

		initialize: function () {
			this.on( 'click', '[data-action="expandPageActions"]', this.togglePageActions );	
		},

		/**
		 * Toggles the page action buttons
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		togglePageActions: function (e) {
			e.preventDefault();

			if( this._expanded ){
				this.scope.find('> li:not( .acpToolbar_primary ):not( .acpToolbar_more )').slideUp();
			} else {
				this.scope.find('> li:not( .acpToolbar_primary ):not( .acpToolbar_more )').slideDown();
			}

			this.scope.find('[data-role="more"]').toggle( this._expanded );
			this.scope.find('[data-role="fewer"]').toggle( !this._expanded );

			this._expanded = !this._expanded;
		}
	});
}(jQuery, _));