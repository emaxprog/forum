/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.pagination.js - Pagination controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.pagination', {

		initialize: function () {
			this.on( 'paginationClicked paginationJump', this.paginationClick );
		},
		
		paginationClick: function (e, data) {
			var self = this;

			if( !data.href ){
				return;
			}

			ips.getAjax()( data.href )
				.done( function (response) {
					self.scope.hide().html( response );
					ips.utils.anim.go('fadeIn', self.scope);

					// Open external links in a new window
					if( ips.getSetting('links_external') ) {
						this.scope.find('a[rel*="external"]').each( function( index, elem ){
							elem.target = "_blank";
						})
					}
				})
				.fail( function () {
					window.location = data.href;
				});
		}

	});
}(jQuery, _));
