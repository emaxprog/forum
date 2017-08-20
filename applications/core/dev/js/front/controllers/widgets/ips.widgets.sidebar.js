/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.widgets.sidebar.js - Special additional controller for the sidebar, to show/hide the whole sidebar as needed
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.widgets.sidebar', {

		initialize: function () {
			this.on( 'managingStarted.widgets', this.managingStarted );
			this.on( 'managingFinished.widgets', this.managingFinished );
			this.setup();
		},

		setup: function () {
			this._addBodyClass();
		},

		/**
		 * Called when we're managing widgets
		 * Shows the sidebar if it was hidden, and sets the height of the droppable area
		 *
		 * @returns {void}
		 */
		managingStarted: function () {
			var height = this.scope.height() + 'px';

			this.scope
				.removeClass('ipsLayout_sidebarUnused')
				.find('[data-role="widgetReceiver"], [data-role="widgetReceiver"] > ul')
					.css({
						minHeight: height
					});
		},

		/**
		 * Called when we've finished managing widgets
		 * Hides the sidebar completely if there's no widgets or contextual tools displaying
		 *
		 * @returns {void}
		 */
		managingFinished: function () {
			this._addBodyClass();

			this.scope
				.find('[data-role="widgetReceiver"], [data-role="widgetReceiver"] > ul')
					.css({
						height: 'auto'
					});
		},

		/**
		 * Adds a class to the body that indicates if the sidebar is shown
		 *
		 * @returns {void}
		 */
		_addBodyClass: function () {
			if( !this.scope.find('[data-blockID]').not('.ipsHide').length && !$('#elContextualTools').length ){
				$('body').addClass('ipsLayout_sidebarUnused').removeClass('ipsLayout_sidebarUsed');
			} else {
				$('body').addClass('ipsLayout_sidebarUsed').removeClass('ipsLayout_sidebarUnused');
			}
		}
	});
}(jQuery, _));