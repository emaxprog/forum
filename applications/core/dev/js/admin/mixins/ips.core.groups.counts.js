/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.groups.counts.js - Mixin to fetch group counts in ACP
 *
 * Author: bfarber
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.mixin('group.counts', 'core.global.core.table', true, function () {

		/**
		 * After init, init
		 *
		 * @returns {void}
		 */
		this.after('setup', function () {
			this.getGroupCounts();
			$(document).on( 'tableRowsUpdated', _.bind( this.getGroupCounts, this ) );
		});

		/**
		 * Get the group count
		 *
		 * @returns {void}
		 */
		this.getGroupCounts = function() {
			this.scope.find('[data-ipsGroupCount].ipsLoading').each( function(){
				var element = $(this);
				var groupId = element.attr('data-ipsGroupId');

				ips.getAjax()( '?app=core&module=members&controller=groups&do=getCount&group=' + groupId )
					.done( function (response) {
						element
							.removeClass( 'ipsLoading' )
							.removeClass( 'ipsLoading_tiny' )
							.html( response );

						// Inform the document
						$( document ).trigger( 'contentChange', [ element ] );
					});
			} );
		}
	});
}(jQuery, _));