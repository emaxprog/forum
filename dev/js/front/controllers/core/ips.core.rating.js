/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.quickSearch.js - Controller for search in header
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.rating', {
	
		initialize: function () {
			this.on( 'ratingSaved', '[data-ipsRating]', this.ratingClick );
			var scope = this.scope;
		},
		
		ratingClick: function(e, data){
			var scope = $(this.scope);
			ips.getAjax()( scope.attr('action'), {
				data: scope.serialize(),
				type: 'post'
			})
				.done( function (response, textStatus, jqXHR) {	
					// Don't need to actually do anything here
				})
				.fail(function(){
					scope.submit();
				});
		}
	});
}(jQuery, _));