/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.followButton.js - Controller for follow button
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.followForm', {

		initialize: function () {
			this.on( 'submit', this.submitForm );
			this.on( 'click', '[data-action="unfollow"]', this.unfollow );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._app = this.scope.attr('data-followApp');
			this._area = this.scope.attr('data-followArea');
			this._id = this.scope.attr('data-followID');
		},

		/**
		 * Event handler for unfollowing an item
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		unfollow: function (e) {
			e.preventDefault();
			this._doFollowAction( $( e.currentTarget ).attr('href'), {}, true );
		},

		/**
		 * Event handler for submitting the follow form
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitForm: function (e) {
			e.preventDefault();
			this._doFollowAction( this.scope.attr('action'), this.scope.serialize(), false );
		},

		/**
		 * Performs an ajax action. Shows the hovercard as loading, and calls the URL
		 *
		 * @param 		{string} 	url		URL to call
		 * @param 		{object} 	data 	Object of data to include in the request
		 * @returns 	{void}
		 */
		_doFollowAction: function (url, data, unfollow) {
			var self = this;
			var dims = ips.utils.position.getElemDims( this.scope.parent('div') );

			// Set it to loading
			this.scope
				.hide()
				.parent('div')
					.css({
						width: dims.outerWidth + 'px',
						height: dims.outerHeight + 'px'
					})
					.addClass('ipsLoading');

			// Update follow preference via ajax
			ips.getAjax()( url, {
				data: data,
				type: 'post'
			})
				.done( function (response) {
					// Success, so trigger event to update button
					if( unfollow ){
						self.trigger('followingItem', {
							feedID: self._area + '-' + self._id,
							unfollow: true
						});	
					} else {
						self.trigger('followingItem', {
							feedID: self._area + '-' + self._id,
							notificationType: self.scope.find('[name="follow_type"]:checked').val(),
							anonymous: !self.scope.find('[name="follow_public_checkbox"]').is(':checked')
						});
					}				

					ips.ui.flashMsg.show( ips.getString('followUpdated') ); 
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					window.location = url;
				})
				.always( function () {
					// If we're in a hovercard, remove it
					self.scope.parents('.ipsHovercard').remove();
				});
		}
	});
}(jQuery, _));
