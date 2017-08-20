/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.datetime.js - Controller to update the contents of cached <time> tags with the appropriate timezone
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.datetime', {

		initialize: function () {
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			$(this.scope).text( ips.utils.time.formatTime( new Date( $(this.scope).attr('data-time') ), { format: $(this.scope).attr('data-format') } ) );
		}
		
	});
}(jQuery, _));