/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.authyOneTouch.js - Authy OneTouch controller
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.authyOneTouch', {
		initialize: function () {
			var scope = $(this.scope);
			setInterval( function(){
				ips.getAjax()( scope.closest('form').attr('action'), { data: { 'onetouchCheck': scope.find('[data-role="onetouchCode"]').val() } } )
					.done(function( response ) {
						if ( response.status == 1 ) {
							scope.closest('form').submit();
						}
					});
			}, 3000 );
		}
	});
}(jQuery, _));