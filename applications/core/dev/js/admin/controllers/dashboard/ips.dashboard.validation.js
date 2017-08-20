/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.dashboard.validation.js - AdminCP users awaiting validation widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.dashboard.validation', {

		initialize: function () {
			this.on( 'click', '[data-action="approve"], [data-action="ban"]', this.validateUser );
		},

		/**
		 * Event handler for the approve/ban buttons
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		validateUser: function (e) {
			e.preventDefault();
			var self = this;
			var button = $( e.currentTarget );
			var url = button.attr('href');
			var type = button.attr('data-action');
			var row = button.closest('.ipsDataItem');
			var name = row.find('[data-role="userName"]').text();
			var toggles = button.closest('[data-role="validateToggles"]');
			
			button
				.text( type == 'approve' ? ips.getString('widgetApproving') : ips.getString('widgetBanning') )
				.addClass('ipsButton_disabled');

			ips.getAjax()( url )
				.done( function () {
					// Highlight row
					row.addClass( type == 'approve' ? 'ipsDataItem_success' : 'ipsDataItem_error' );
					row.attr('data-status', 'done');
					button.text( type == 'approve' ? ips.getString('widgetApproved') : ips.getString('widgetBanned') );

					setTimeout( function () {
						ips.utils.anim.go( 'fadeOut', toggles );
					}, 750);

					// Show flash msg
					ips.ui.flashMsg.show( ips.getString( type == 'approve' ? 'userApproved' : 'userBanned', {
						name: name
					}));

					self._checkForFinished();
				});
		},

		/**
		 * Checks whether all users shown in the widget have been approved/banned
		 * If so, triggers an event whch will reload the content to show more users
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_checkForFinished: function (e) {
			var items = this.scope.find('[data-role="userAwaitingValidation"]');
			var doneItems = this.scope.find('[data-status="done"]');
			var self = this;

			if( items.length === doneItems.length ){
				setTimeout( function () {
					self.scope.trigger('refreshWidget');	
				}, 750);				
			}
		}
	});
}(jQuery, _));