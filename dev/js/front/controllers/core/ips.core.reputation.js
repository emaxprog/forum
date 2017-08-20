/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.reputation.js - Controller for reputation controls
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.reputation', {

		initialize: function () {
			this.on( 'click', '[data-action="giveReputation"]', this.giveReputation ); 
		},
		
		/**
		 * Event handler for the reputation buttons.
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		giveReputation: function (e) {
			e.preventDefault();
			
			var self = this;
			var url = $( e.currentTarget ).attr('href');
			var thisParent = this.scope.parent();

			this.scope.css({ opacity: 0.5 });
			
			ips.getAjax()( url )
				.done( function (response) {
					var newHTML = $('<div>' + response + '</div>').find('[data-controller="core.front.core.reputation"]').html();
					self.scope
						.html( newHTML )
						.css({
							opacity: 1
						});
				})
				.fail( function ( jqXHR, textStatus, errorThrown ) {
					if ( jqXHR.responseJSON['error'] ) {
						ips.ui.alert.show( {
							type: 'alert',
							icon: 'warn',
							message: jqXHR.responseJSON['error'],
							callbacks: {}
						});
					} else {
						window.location = url;
					}
				});
		}

	});
}(jQuery, _));
