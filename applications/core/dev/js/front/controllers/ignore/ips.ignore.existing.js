/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ignore.existing.js - Controller for an ignored user on ignore preferences page
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.ignore.existing', {

		initialize: function () {
			this.on( 'menuItemSelected', '[data-action="ignoreMenu"]', this.ignoreMenu );
			this.on( 'submitDialog', this.editedUser );
		},

		/**
 		 * Event handler for edit dialog saving
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Data object from the event. Contains token information.
		 * @returns 	{void}
		 */
		editedUser: function (e, data) {
			this.trigger('refreshResults');

			ips.ui.flashMsg.show( ips.getString('editedIgnore') );
		},

		/**
 		 * Event handler for the ignore menu
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Data object from the event. Contains token information.
		 * @returns 	{void}
		 */
		ignoreMenu: function (e, data) {
			data.originalEvent.preventDefault();

			switch (data.selectedItemID) {
				case 'remove':
					this._removeIgnore(e, data);
				break;
			}
		},

		/**
 		 * Removes the ignore from this user
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Data object from the event. Contains token information.
		 * @returns 	{void}
		 */
		_removeIgnore: function (e, data) {
			var url =  data.menuElem.find('[data-ipsMenuValue="remove"] a').attr('href');
			var self = this;

			Debug.log('here');

			// Confirm it
			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'question',
				message: ips.getString('confirm_unignore'),
				subText: ips.getString('confirm_unignore_desc'),
				callbacks: {
					ok: function () {
						ips.getAjax()( url + '&wasConfirmed=1' )
							.done( function (response) {
								self.trigger('refreshResults');
							});
					}
				}
			});
		}
	});
}(jQuery, _));