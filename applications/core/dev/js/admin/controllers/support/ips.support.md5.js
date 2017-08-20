/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.support.md5.js
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.support.md5', {

		initialize: function () {
			this.on( 'click', '[data-action="downloadDelta"]', this.downloadDelta );
		},

		downloadDelta: function (e) {
			e.preventDefault();
			
			$(this.scope).find('[data-role="initialScreen"]').hide();
			$(this.scope).find('[data-role="downloadForm"]').show();
			
		}
	});
}(jQuery, _));