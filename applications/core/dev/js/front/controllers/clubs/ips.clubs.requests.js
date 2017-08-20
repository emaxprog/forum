/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.clubs.requests.js - Requests handler
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.clubs.requests', {

		_interval: null,

		initialize: function () {
			this.on( 'click', '[data-action="requestApprove"], [data-action="requestDecline"]', this.handleRequest );
			this.on( window, 'resize', this.resizeCovers );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			
		},

		/**
		 * Handles resizing cover divs when the window resizes
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		resizeCovers: function (e) {
			var self = this;
			var cards = this.scope.find('.ipsMemberCard[data-hasCover]');

			if( cards.length ){
				$.each( cards, function () {
					var id = $( this ).identify().attr('id');
					var cover = $('body').find('.cClubRequestCover[data-cardId="' + id + '"]');
					self._positionCover( $( this ), cover );
				});
			}
		},

		/**
		 * Handles approving/declining a request
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		handleRequest: function (e) {
			e.preventDefault();

			var self = this;
			var url = $( e.currentTarget ).attr('href');
			var card = $( e.currentTarget ).closest('.ipsMemberCard');
			var id = card.identify().attr('id');

			// Disable the buttons while we wait
			card.find('[data-action]').addClass('ipsButton_disabled');

			ips.getAjax()( url, {
				showLoading: true
			})
				.done( function (response) {

					card.attr('data-hasCover', true);

					// Fade out the card
					card.animate({
						opacity: 0.2
					});

					// Build a cover
					var cover = $('<div/>').addClass('cClubRequestCover').attr('data-cardId', id);
					$('body').append( cover );

					self._positionCover( card, cover );

					cover
						.append( ips.templates.render( response.status == 'approved' ? 'club.request.approve' : 'club.request.decline' ) )
						.fadeIn();

					// Show flash message
					ips.ui.flashMsg.show( response.status == 'approved' ? ips.getString('clubMemberApproved') : ips.getString('clubMemberDeclined') );

					if( !self._interval ){
						self._interval = window.setInterval( _.bind( self._checkCardsExist, self ), 200 );
					}
				})
				.fail( function () {
					window.location = url;
				});
		},

		/**
		 * Fired by an interval timer, checks whether a card still exists, and removes the cover if not
		 *
		 * @returns {void}
		 */
		_checkCardsExist: function () {
			var self = this;
			var covers = $('body').find('.cClubRequestCover');
			var cards = this.scope.find('.ipsMemberCard[data-hasCover]');

			// If we have the same count, we can leave
			if( cards.length == covers.length ){
				return;
			}

			if( covers.length ){
				$.each( covers, function () {
					var cardId = $( this ).attr('data-cardId');
					var card = self.scope.find('#' + cardId);

					if( !card.length ){
						$( this ).remove();
					}
				});
			}
		},
		
		/**
		 * Position the cover over the card
		 *
		 * @param 	{element} 	card 	Card div
		 * @param 	{element} 	cover 	Cover div
		 * @returns {void}
		 */
		_positionCover: function (card, cover) {
			var elemPosition = ips.utils.position.getElemPosition( card );
			var dims = ips.utils.position.getElemDims( card );

			cover.css({
				position: 'absolute',
				top: elemPosition.absPos.top,
				left: elemPosition.absPos.left,
				width: dims.outerWidth,
				height: dims.outerHeight
			});
		}
	});
}(jQuery, _));