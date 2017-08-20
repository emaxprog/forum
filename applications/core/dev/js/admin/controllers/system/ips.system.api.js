/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.api.js - API Docs controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.api', {

		initialize: function () {
			this.on( 'click', '[data-action="showEndpoint"]', this.showEndpoint );
			this.on( 'click', '[data-action="toggleBranch"]', this.toggleBranch );
		},

		/**
		 * Event handler for clicking a branch in the listing.
		 * Expends or collapses the branch
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		toggleBranch: function (e) {
			e.preventDefault();
			var branchTrigger = $( e.currentTarget );
			var branchItem = branchTrigger.parent();

			if( branchItem.hasClass('cApiTree_inactiveBranch') ){
				ips.utils.anim.go( 'fadeInDown', branchItem.find(' > ul') );

				branchItem
					.removeClass('cApiTree_inactiveBranch')
					.addClass('cApiTree_activeBranch');
			} else {
				branchItem.find(' > ul').hide();

				branchItem
					.removeClass('cApiTree_activeBranch')
					.addClass('cApiTree_inactiveBranch');
			}
		},

		/**
		 * Dynamically loads an endpoint reference
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		showEndpoint: function (e) {
			e.preventDefault();

			var self = this;
			var url = $( e.currentTarget ).attr('href');

			// Make all endpoints inactive
			this.scope.find('.cApiTree_activeNode').removeClass('cApiTree_activeNode');

			// Make this one active
			$( e.currentTarget ).parent('li').addClass('cApiTree_activeNode');

			// Set the content area to loading
			this.scope.find('[data-role="referenceContainer"]')
				.css({
					height: this.scope.find('[data-role="referenceContainer"]').height()
				})
				.html( 
					$('<div/>')
						.addClass('ipsLoading')
						.css({ height: '300px' })
				);

			ips.getAjax()( url )
				.done( function (response) {
					self.scope.find('[data-role="referenceContainer"]')
						.html( response )
						.css({ 
							height: 'auto'
						});
				})
				.fail( function () {
					window.location = url;
				});
		}
	});
}(jQuery, _));