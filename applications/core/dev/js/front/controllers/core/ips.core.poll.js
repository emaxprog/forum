/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.poll.js - Poll controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.poll', {

		initialize: function () {
			this.on( 'submit', 'form', this.submitPoll );
			this.on( 'click', '[data-action="viewResults"]', this.viewResults );
		},

		/**
		 * Event handler for clicking a link to view results
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		viewResults: function (e) {
			e.preventDefault();
						
			var url = $( e.currentTarget ).attr('href') + '&fetchPoll=1&viewResults=1';
			if ( $(e.currentTarget).attr('data-viewResults-confirm') ) {
				var self = this;
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'warn',
					message: ips.getString('generic_confirm'),
					subText: ips.getString('warn_allow_result_view'),
					callbacks: {
						ok: function () {
							self._viewResults( url + '&nullVote=1' );
						}
					}
				});
			} else {
				this._viewResults( url );
			}
		},
		
		_viewResults: function( url ) {
			var self = this;
			self._setContentsLoading();
			ips.getAjax()( url )
				.done( function (response) {
					self.cleanContents();
					self.scope.html( response );
					
					$( document ).trigger( 'contentChange', [ self.scope ] );
				});
		},

		/**
		 * Sets the poll container to loading state
		 *
		 * @returns 	{void}
		 */
		_setContentsLoading: function () {
			var container = this.scope.find('[data-role="pollContents"]');
			var height = container.outerHeight();

			container
				.css({
					height: height + 'px'
				})
				.html('')
				.addClass('ipsLoading');
		},

		/**
		 * Event handler for submitting the poll form to vote
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitPoll: function (e) {
			var form = $( e.currentTarget );

			if( form.attr('data-bypassAjax') ){
				return
			}
			
			e.preventDefault();
			var url = form.attr('action');
			var self = this;

			// Set button to voting
			this.scope.find('button[type="submit"]').prop( 'disabled', true ).text( ips.getString('votingNow') );

			if ( url.match(/\?/) ) {
				url += '&';
			} else {
				url += '?';
			}
			
			ips.getAjax()( url + 'fetchPoll=1', {
				data: form.serialize(),
				type: 'POST'
			})
				.done( function (response) {
					self.cleanContents();
					self.scope.html( response );

					$( document ).trigger( 'contentChange', [ self.scope ] );
					ips.ui.flashMsg.show( ips.getString('thanksForVoting') );
				})
				.fail( function () {
					form
						.attr( 'data-bypassAjax', true )
						.submit();	
				});
		}
	});
}(jQuery, _));