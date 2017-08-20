/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.topic.answers.js - Profile body controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('forums.front.topic.answers', {

		ajaxObj: null,

		/**
 		 * Initialize controller events
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			this.on( 'click', 'a.cAnswerRate', this.rate );
		},

		/**
		 * Rate answers
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		rate: function (e) {
			e.preventDefault();

			var self = this;
			var clicked = $( e.currentTarget );
			var positive = clicked.hasClass('cAnswerRate_up');
			var voteCount = this.scope.find('[data-role="voteCount"]');
			var currentVotes = parseInt( voteCount.attr('data-voteCount') );

			this.scope.find('.cAnswerRate_up').toggleClass( 'ipsType_positive', positive );
			this.scope.find('.cAnswerRate_down').toggleClass( 'ipsType_negative', !positive );
			this.scope.toggleClass( 'cRatingColumn_up', positive ).toggleClass( 'cRatingColumn_down', !positive );

			var newVoteCount = 0;

			if( positive ){
				newVoteCount = currentVotes + 1;
			}
			else {
				newVoteCount = currentVotes - 1;
			}

			voteCount
				.toggleClass( 'ipsType_positive', positive )
				.toggleClass( 'ipsType_negative', !positive )
				.text( newVoteCount )
				.attr( 'data-voteCount', newVoteCount );

			// Send request
			if( this.ajaxObj && _.isFunction( this.ajaxObj.abort ) ){
				this.ajaxObj.abort();
			}

			if( positive ){
				this.scope.find('a.cAnswerRate_up').addClass('ipsHide');
				this.scope.find('span.cAnswerRate_up').removeClass('ipsHide');
			} else {
				this.scope.find('a.cAnswerRate_down').addClass('ipsHide');
				this.scope.find('span.cAnswerRate_down').removeClass('ipsHide');
			}

			this.ajaxObj = ips.getAjax()( clicked.attr('href') )
				.done( function (response) {

					Debug.log( response );

					if( !response.canVoteUp ){
						self.scope.find('a.cAnswerRate_up').addClass('ipsHide');
						self.scope.find('span.cAnswerRate_up').removeClass('ipsHide');
					} else {
						self.scope.find('a.cAnswerRate_up').removeClass('ipsHide');
						self.scope.find('span.cAnswerRate_up').addClass('ipsHide');
					}

					if( !response.canVoteDown ){
						self.scope.find('a.cAnswerRate_down').addClass('ipsHide');
						self.scope.find('span.cAnswerRate_down').removeClass('ipsHide');
					} else {
						self.scope.find('a.cAnswerRate_down').removeClass('ipsHide');
						self.scope.find('span.cAnswerRate_down').addClass('ipsHide');
					}

					voteCount.text( response.votes );
					self.scope.find('.ipsType_light').text( ips.pluralize( ips.getString( 'votes_no_number' ), response.votes ) );
				});
		}
	});
}(jQuery, _));