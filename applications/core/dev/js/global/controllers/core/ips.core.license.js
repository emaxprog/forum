/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.license.js - License message
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.license', {
		initialize: function () {
			this.on( 'click', '[data-role="closeMessage"]', this.hideMessage );
		},

		hideMessage: function () {
			var date = new Date();
			date.setTime( date.getTime() + ( 14 * 86400000 ) );
			ips.utils.cookie.set( 'licenseDismiss', true, date.toUTCString() );
			this.scope.slideUp();
		}
	});
}(jQuery, _));