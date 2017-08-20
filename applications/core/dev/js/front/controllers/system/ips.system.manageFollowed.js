/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.manageFollowed.js - Followed content controll
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.manageFollowed', {

		initialize: function () {
			$( document ).on( 'followingItem', _.bind( this.followingItemChange, this ) );
			this.setup();
		},

		setup: function () {
			this._followID = this.scope.attr('data-followID');
		},

		followingItemChange: function (e, data) {
			if( data.feedID != this._followID ){
				return;
			}

			if( !_.isUndefined( data.unfollow ) ){
				this.scope.find('[data-role="followDate"], [data-role="followFrequency"]').html('');
				this.scope.find('[data-role="followAnonymous"]').addClass('ipsHide');
				this.scope.find('[data-role="followButton"]').addClass('ipsButton_disabled');
				this.scope.addClass('ipsFaded');
				return;
			}

			// Update anonymous badge
			this.scope.find('[data-role="followAnonymous"]').toggleClass( 'ipsHide', !data.anonymous );

			// Update notification type
			if( data.notificationType ){
				this.scope.find('[data-role="followFrequency"]').html( ips.templates.render( 'follow.frequency', {
					hasNotifications: ( data.notificationType !== 'none' ),
					text: ips.getString( 'followFrequency_' + data.notificationType )
				} ));	
			}			
		}
	});
}(jQuery, _));