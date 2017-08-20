/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.approveQueue.js - Controller for using approval queue
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.approveQueue', {
	
		initialize: function () {
			this.on( 'click', '[data-action="approvalQueueNext"]', this.doAction );
		},
		
		/**
		 * Respond when an action button is clicked
		 *
		 * @param 		{event} 	e 		Event object
		 * @param		{object}	data	Event data
		 * @returns 	{void}
		 */
		doAction: function(e,data) {
			e.preventDefault();
			
			var scope = $(this.scope);
			
			if ( $( e.currentTarget ).hasClass('ipsButton_disabled') ) {				
				ips.ui.alert.show({
					type: 'alert',
					icon: 'warn',
					message: ips.getString('approvalQueueNoPerm')
				});
				return;
			}
			
			var height = $('#elApprovePanel').height();
			$('#elApprovePanel').html('').css( 'height', height ).addClass('ipsLoading');
						
			ips.getAjax()( $( e.currentTarget ).attr('href'), { bypassRedirect: true } )
				.done(function(){
					ips.getAjax()( scope.attr('data-url') )
						.done(function(response){
							scope.html( response.html );
							$('#elModCPApprovalCount').html( response.count );
						})
						.fail(function(failresponse){
							window.location = scope.attr('data-url');
						});
				})
				.fail(function(){
					window.location = $( e.currentTarget ).attr('href');
				});
		}
		
	});
}(jQuery, _));
