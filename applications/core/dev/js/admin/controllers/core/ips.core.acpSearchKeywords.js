/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.acpSearchKeywords.js - Faciliates editing keywords for ACP search when IN_DEV
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.acpSearchKeywords', {

		initialize: function () {
			this.on( 'click', '[data-action="save"]', this.saveKeywords );
		},
		
		/**
		 * Save the keywords
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		saveKeywords: function (e) {			
			e.preventDefault();
			var scope = this.scope;
			
			var data = {
				url: scope.attr('data-url'),
				lang_key: scope.find( "[data-role='lang_key']" ).val(),
				restriction: scope.find( "[data-role='restriction']" ).val(),
				keywords: []
			};
			
			scope.find( "[data-role='keywords']" ).each(function(){
				if( $(this).val() ){
					data.keywords.push( $(this).val() );
				}
			});
						
			ips.getAjax()( scope.attr('data-action'), {
			   data: data,
			   type: 'post',
			   showLoading: true
			})
			.done( function(response) {
			   scope.trigger('closeMenu');
			   ips.ui.flashMsg.show('Keywords saved');
			});
		},
	});
}(jQuery, _));
