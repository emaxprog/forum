/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.profile.main.js - Main profile wrapper
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.profile.main', {
		
		contentArea: null,

		/**
 		 * Initialize controller events
		 * Sets up the events from the view that this controller will handle
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			this.on( 'click', '[data-action="goToProfile"]', this.changeType );
			this.on( 'click', '[data-action="browseContent"]', this.changeType );
			this.on( 'click', '[data-action="repLog"]', this.changeType );

			// Primary event that watches for URL changes
			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );

			this.setup();
		},

		/**
 		 * Non-event-based setup
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this.contentArea = this.scope.find('[data-role="profileContent"]');
			this.contentHeader = this.scope.find('[data-role="profileHeader"]');
		},

		/**
		 * Called when History.js state changes
		 *	
		 * @returns 	{void}
		 */
		stateChange: function () {
			var state = History.getState();

			Debug.log( state.data.section );

			switch( state.data.section ){
				case 'goToProfile':
					this._showProfile( state.url );
				break;
				case 'browseContent':
					this._showContent( state.url );
				break;
				case 'repLog':
					this._showRepLog( state.url );
				break;
			}
		},

		/**
		 * User clicked something that changes the profile view
		 * Just change the URL, the state change handler does the rest
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeType: function (e) {
			e.preventDefault();
			var target = $( e.currentTarget );

			if( !target.is('a') ){
				target = target.find('a');
			}

			this._changeURL( 
				{ section: $( e.currentTarget ).attr('data-action') },
				target.attr('title'),
				target.attr('href') 
			);			
		},

		/**
		 * Shows the user's reputation log
		 *	
		 * @param 		{string} 	url 		URL to load the content
		 * @returns 	{void}
		 */
		_showRepLog: function (url) {
			var self = this;
			this._changeContent( true, url );
			this._showProfileButton();

			if( ips.utils.responsive.enabled() && ips.utils.responsive.currentIs('phone') ){
				$('#elProfileStats').addClass('cProfileHeaderContent');
			}
		},

		/**
		 * Shows the user's content
		 *	
		 * @param 		{string} 	url 		URL to load the content
		 * @returns 	{void}
		 */
		_showContent: function (url) {
			var self = this;
			
			this._changeContent( true, url );
			this._showProfileButton();

			if( ips.utils.responsive.enabled() && ips.utils.responsive.currentIs('phone') ){
				$('#elProfileStats').addClass('cProfileHeaderContent');
			}
		},

		/**
		 * Shows the 'view profile' button in the header
		 *	
		 * @returns 	{void}
		 */
		_showProfileButton: function () {
			var self = this;

			// Hide browse button
			this.contentHeader.find('[data-action="browseContent"]').each( function () {
				var elem = $( this );

				if( elem.is(':visible') ){
					elem.animationComplete( function () {
						ips.utils.anim.go( 'fadeIn fast', self.contentHeader.find('[data-action="goToProfile"][data-type="' + elem.attr('data-type') + '"]') );
					});
					
					ips.utils.anim.go( 'fadeOut fast', elem );
				} else {
					elem.hide();
					self.contentHeader.find('[data-action="goToProfile"][data-type="' + elem.attr('data-type')  + '"]').show();
				}
			});
		},

		/**
		 * Shows the user's profile
		 *	
		 * @param 		{string} 	url 		URL to load the content
		 * @returns 	{void}
		 */
		_showProfile: function (url) {
			var self = this;

			this._changeContent( false, url );
			this._showContentButton();

			$('#elProfileStats').removeClass('cProfileHeaderContent');
		},

		/**
		 * Shows the 'view profile' button in the header
		 *	
		 * @returns 	{void}
		 */
		_showContentButton: function () {
			var self = this;
			
			// Hide browse button
			this.contentHeader.find('[data-action="goToProfile"]').each( function () {
				var elem = $( this );

				if( elem.is(':visible') ){
					elem.animationComplete( function () {
						ips.utils.anim.go( 'fadeIn fast', self.contentHeader.find('[data-action="browseContent"][data-type="' + elem.attr('data-type') + '"]') );
					});
					
					ips.utils.anim.go( 'fadeOut fast', elem );
				} else {
					elem.hide();
					self.contentHeader.find('[data-action="browseContent"][data-type="' + elem.attr('data-type') + '"]').show();
				}
			});
		},

		/**
		 * Changes the content in the content section
		 *	
		 * @param 		{boolean} 	small 		Show the header in its minimal state?
		 * @param 		{string} 	url 		The URL to load
		 * @returns 	{void}
		 */
		_changeContent: function (small, url) {
			var self = this;

			// Get height and set it, so that it doesn't jolt the page
			this.contentArea.css({
				height: this.contentArea.outerHeight()
			});

			// Remove content and set to loading
			this.contentArea.html( 
				$('<div/>').addClass('ipsLoading').css({
					height: '300px'
				})
			);

			// Add class to the header to shrink it
			this.contentHeader.find('#elProfileHeader').toggleClass( 'cProfileHeaderMinimal', small );

			// Load the content
			ips.getAjax()( url )
				.done( function (response) {
					self.contentArea
						.hide()
						.html( response )
						.css({
							height: 'auto'
						});

					ips.utils.anim.go( 'fadeIn fast', self.contentArea );

					$( document ).trigger( 'contentChange', [ self.contentArea ] );
				})
				.fail( function () {
					window.location = url;
				});
		},

		/**
		 * Push a new URL to the browser
		 *	
		 * @param 		{object} 	data 		Object to save as the state data
		 * @param 		{string} 	title 		Page title
		 * @param 		{string} 	url 		Page URL
		 * @returns 	{void}
		 */
		_changeURL: function (data, title, url) {
			History.pushState( data, title, url );
		}

	});
}(jQuery, _));