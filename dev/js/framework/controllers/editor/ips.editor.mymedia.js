/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.mymedia.js - My media controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.mymedia', {

		initialize: function () {
			this.on( window, 'resize', _.bind( this._resizeContentArea, this ) );
			this.setup();
		},

		setup: function () {
			this._resizeContentArea();
		},

		/**
		 * Resizes the mymedia content area to be the correct height for the dialog
		 *
		 * @returns	{void}
		 */
		_resizeContentArea: function () {
			// Get size of dialog content
			var dialogHeight = this.scope.closest('.ipsDialog_content').outerHeight();
			var controlsHeight = this.scope.find('.cMyMedia_controls').outerHeight();

			// Set the content area to that height
			this.scope.find('[data-role="myMediaContent"]').css({
				height: ( dialogHeight - controlsHeight - 10 ) + 'px'
			});
		}
	});
}(jQuery, _));