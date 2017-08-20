/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.profile.followers.js - Follower JS
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.profile.followers', {

		_feedID: null,

		initialize: function () {
			this.on( document, 'followingItem', this.followUser );
			this.on( 'menuItemSelected', "[data-role='followOption']", this.toggleFollowOption );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */	 
		setup: function () {
			this._feedID = this.scope.attr('data-feedID');
		},

		/**
		 * Event handler for document-wide followingItem event
		 * Checks if the event is for this member (based on 'feedID'), and fetches new HTML
		 * for the followers block
		 *
		 * @param 	{event} 	Event object
		 * @param 	{object} 	Event data object
		 * @returns {void}
		 */	 
		followUser: function (e, data) {
			if( data.feedID != this._feedID ){
				return;
			}

			var self = this;
			var memberID = data.feedID.replace('member-', '');

			// Get the new followers
			// If there's an error we can just ignore it, it's not a big deal
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=members&controller=profile&do=followers&id=' + parseInt( memberID ) )
				.done( function (response) {
					self.scope.html( response );
				})
				.fail( function () {
					Debug.log('Error fetching follower HTML');
				});
		},

		/**
		 * Event handler for changing the follower preference (for profile owner)
		 *
		 * @param 	{event} 	Event object
		 * @param 	{object} 	Event data object
		 * @returns {void}
		 */	 
		toggleFollowOption: function (e, data) {
			data.originalEvent.preventDefault();

			var url = data.menuElem.find('[data-ipsMenuValue="' + data.selectedItemID + '"] a').attr('href');

			// Ping
			ips.getAjax()( url )
				.done( function (response) {
					ips.ui.flashMsg.show( ips.getString('followerSettingToggled') );
				})
				.fail( function () {
					window.location = url;
				});
		}
	});
}(jQuery, _));