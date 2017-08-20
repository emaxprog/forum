/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.reaction.js - Reaction handler HAHA THANKS
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.reaction', {

		_reactTypeContainer: null,
		_reactButton: null,
		_reactTypes: null,
		_reactClose: null,
		_ajaxObj: null,

		initialize: function () {
			this.on( 'click', '[data-role="reactionInteraction"]', this.clickLaunchReaction );
			this.on( 'mouseenter', '[data-role="reactionInteraction"]', this.launchReaction ); 
			this.on( 'mouseleave', '[data-role="reactionInteraction"]', this.unlaunchReaction );
			this.on( 'click', '[data-role="reaction"]', this.clickReaction );
			this.on( 'click', '[data-action="unreact"]', this.unreact );
			this.setup();
		},

		setup: function () {
			this._reactTypeContainer = this.scope.find('[data-role="reactionInteraction"]');
			this._reactTypes = this._reactTypeContainer.find('[data-role="reactTypes"]');
			this._reactButton = this._reactTypeContainer.find('[data-action="reactLaunch"]');
			this._reactClose = this._reactTypeContainer.find('[data-action="unreact"]');
			this._reactBlurb = this.scope.find('[data-role="reactionBlurb"]');
			this._reactCount = this.scope.find('[data-role="reactCount"]');
			this._singleReaction = !( this._reactTypes.length );
		},
		
		/**
		 * Click handler for the react button - only relevant on mobile
		 *
		 * @returns 	{void}
		 */
		clickLaunchReaction: function () {
			if( !ips.utils.events.isTouchDevice() ){
				return;
			}
			
			this._reactTypeContainer.addClass('ipsReact_types_active');
			this._launchReaction();
		},

		/**
		 * Launch event handler for mouseenter event
		 *
		 * @returns 	{void}
		 */
		launchReaction: function () {
			// Ignore these on mobile
			if( ips.utils.events.isTouchDevice() ){
				return;
			}

			this._launchReaction();
		},

		/**
		 * Handler for clickLaunchReaction and launchReaction to open the flyout
		 *
		 * @returns 	{void}
		 */
		_launchReaction: function () {
			var self = this;
			this._reactTypes.show().removeClass('ipsReact_hoverOut').addClass('ipsReact_hover');
		},

		/**
		 * Handler for hiding the reaction flyout
		 *
		 * @returns 	{void}
		 */
		unlaunchReaction: function () {
			var self = this;

			this._reactTypes.animationComplete( function () {
				if( self._reactTypes.hasClass('ipsReact_hoverOut') ){
					self._reactTypes.removeClass('ipsReact_hoverOut').hide();
				}
			});

			this._reactTypes.removeClass('ipsReact_hover').addClass('ipsReact_hoverOut');
			this._reactTypeContainer.removeClass('ipsReact_types_active');
		},

		/**
		 * Handler for unreacting to a post
		 *
		 * @param 		{event} 	[e] 	Event object
		 * @returns 	{void}
		 */
		unreact: function (e) {
			if( e ){
				e.preventDefault();
				e.stopPropagation();
			}

			var self = this;
			var defaultReaction = this.scope.find('[data-defaultReaction]');
			var	url = this._reactTypeContainer.attr('data-unreact');

			// If the user's reaction isn't the default one, we need to swap them around
			if( !defaultReaction.closest('[data-action="reactLaunch"]').length ){
				// We need to swap the buttons
				var currentReaction = this._reactButton.find('[data-role="reaction"]');
				var defaultReactionCopy = defaultReaction.clone();
				var currentReactionCopy = currentReaction.clone();

				currentReaction.replaceWith( defaultReactionCopy.removeClass('ipsReact_active') );
				defaultReaction.replaceWith( currentReactionCopy.removeClass('ipsReact_active') );
			}

			// Remove the reacted class
			this._reactButton.removeClass('ipsReact_reacted');

			// Hide the close button
			self._reactClose.fadeOut();

			// And trigger the close event
			self.unlaunchReaction();

			// Fire the ajax request
			ips.getAjax()( url )
				.done( function (response) {
					self._updateReaction( response, ips.getString('removedReaction') );
				});
		},

		_updateReaction: function (response, flashMsg) {
			// Are we only showing the score?
			if( this._reactCount.hasClass('ipsReact_reactCountOnly') ){
				this._reactCount.text( response.score ).removeClass('ipsAreaBackground_positive ipsAreaBackground_negative ipsAreaBackground_light');

				if( parseInt( response.score ) >= 1 ){
					this._reactCount.addClass('ipsAreaBackground_positive');
				} else if( parseInt( response.score ) < 0 ){
					this._reactCount.addClass('ipsAreaBackground_negative');
				} else {
					this._reactCount.addClass('ipsAreaBackground_light');
				}

				// Hide the count if there's no reactions; otherwise show
				if( response.count == 0 ){
					this._reactCount.hide();
				} else {
					this._reactCount.show();
				}
			} else {	
				this._reactBlurb.html( response.blurb );
				this._reactCount.text( response.count );

				if( parseInt( response.count ) > 0 ){
					this._reactBlurb.removeClass('ipsHide').fadeIn();
				} else {
					this._reactBlurb.fadeOut();
				}
			}

			this._reactTypeContainer.removeClass('ipsReact_types_active');

			// Let the user know
			if( flashMsg ){
				ips.ui.flashMsg.show( flashMsg );
			}
		},

		/**
		 * Handler for clicking a reaction
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		clickReaction: function (e) {
			e.preventDefault();

			// If this is a single reaction, and we're active, then we'll treat it as an 'unreact' action
			if( this._singleReaction && this._reactButton.hasClass('ipsReact_reacted') ){
				this.unreact(null);
				return;
			}

			// Mobile support - check whether we've activated the flyout first
			if( ips.utils.events.isTouchDevice() && !this._reactTypeContainer.hasClass('ipsReact_types_active') ){
				return;
			}

			var self = this;
			var reaction = $( e.currentTarget );
			var url = reaction.attr('href');
			var currentButton = this.scope.find('[data-action="reactLaunch"] > [data-role="reaction"]');
			var newReaction = ( !$( e.currentTarget ).closest('[data-action="reactLaunch"]').length || !this._reactButton.hasClass('ipsReact_reacted') ); 

			// Remove all 'active' classes to reset their states
			this._removeActiveReaction();

			// Trigger a pulse animation on the selected reaction
			reaction.addClass('ipsReact_active');

			// Add 'reacted' class to button
			this._reactButton.addClass('ipsReact_reacted');

			// If this isn't the current button already...
			if( reaction.closest('[data-action="reactLaunch"]').length == 0 ){

				var _complete = function () {
					// Clone and swap the current/new reaction
					var currentButtonCopy = currentButton.clone();
					var reactionCopy = reaction.clone();
					currentButton.replaceWith( reactionCopy.removeClass('ipsReact_active') );
					reaction.replaceWith( currentButtonCopy.removeClass('ipsReact_active') );

					// Show the x button, hide the flyout and remove active styles
					self._reactClose.fadeIn();
					self.unlaunchReaction();
					self._removeActiveReaction();
				};
			} else {
				var _complete = function () {
					// Show the x button, hide the flyout and remove active styles
					self._reactClose.fadeIn();
					self.unlaunchReaction();
					self._removeActiveReaction();
				};
			}

			// Use a timeout here to allow time for the 'pulse' animation to finish
			setTimeout( _complete, 400 );

			// Only bother with an ajax request if we're updating the reaction
			if( newReaction ){
				// Fire our ajax request to actually react
				if( this._ajaxObj && _.isFunction( this._ajaxObj.abort ) ){
					this._ajaxObj.abort();
				}
				
				this._ajaxObj = ips.getAjax()( url )
					.done( function (response) {
						self._updateReaction( response );
					} )
					.fail( function () {
						Debug.log('fail');
					} );
			}
		},

		/**
		 * Removes the active classname from all reactions to reset the animation
		 *
		 * @returns 	{void}
		 */
		_removeActiveReaction: function () {
			this._reactTypeContainer.find('.ipsReact_active').removeClass('ipsReact_active');
		}
	});
}(jQuery, _));
