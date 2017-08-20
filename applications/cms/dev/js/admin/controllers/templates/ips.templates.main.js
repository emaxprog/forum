/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.templates.main.js - Templates: Parent controller for the template editor
 * Simply manages showing the loading thingy based on events coming from within
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.admin.templates.main', {

		initialize: function () {
			this.on( 'savingFile.templates', this.showLoading );
			this.on( 'saveFileFinished.templates', this.hideLoading );
		},

		/**
		 * Shows the loading thingy
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		showLoading: function (e) {
			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-role="loading"]') );
		},

		/**
		 * Hides the loading thingy
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		hideLoading: function (e) {
			ips.utils.anim.go( 'fadeOut', this.scope.find('[data-role="loading"]') );
		}

	});
}(jQuery, _));