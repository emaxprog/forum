/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.streams.results.js - Manages results in a stream
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.streams.results', {		
		_streamID: 0,
		_newUpdates: $('<div/>'),
		_waitingCount: 0,
		_config: {},
		
		initialize: function () {
			this.on( 'updateResults.stream', this.updateResults );
			this.on( 'resultsTeaser.stream', this.resultsTeaser );
			this.on( 'click', '[data-action="insertNewItems"]', this.insertNewItems );
			this.on( 'click', 'a[data-linkType]', this.clickResult );
			
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			if( this.scope.attr('data-streamID') ){
				this._streamID = this.scope.attr('data-streamID');
			}
			
			this._config = ips.getSetting('stream_config');
			this._updateURLs();
		},
		
		/**
		 * Determine whether we need to replace all results, or append them
		 *
		 * @param 	{object} 	data 	Data object that originated from the ajax request
		 * @returns {void}
		 */
		updateResults: function (e, data) {
			if( data.append ){
				this._appendNewResults( data );
			} else {
				this._replaceWithNewResults( data );
			}
			
			this._updateURLs();
			
			$( document ).trigger( 'contentChange', [ this.scope ] );
		},
		
		/**
		 * Replaces all results in the stream with new results
		 *
		 * @param 	{object} 	data 	Data object that originated from the ajax request
		 * @returns {void}
		 */
		_replaceWithNewResults: function (data) {
			this._config = JSON.parse( data.response.config );
			// Do we need to replace the entire HTML
			if( data.response.results.indexOf('core.front.streams.results') !== -1 ){
				var content = $('<div>' + data.response.results + '</div>');
				var root = content.find('[data-controller="core.front.streams.results"]');
				
				this.scope
					.html( root.html() )
					.attr( 'data-streamReadType', root.attr('data-streamReadType') )
					.attr( 'data-streamURL', root.attr('data-streamURL') )
					.attr( 'data-streamID', root.attr('data-streamID') );				
			} else {
				this.scope.find('[data-role="streamContent"]').html( data.response.results );
			}
			
			this.trigger('resultsUpdated.stream', {
				response: data.response
			});
		},
		
		/**
		 * Appends new results to the existing results
		 *
		 * @param 	{object} 	data 	Data object that originated from the ajax request
		 * @returns {void}
		 */
		_appendNewResults: function (data) {			
			var content = $('<div>' + data.response.results + '</div>');

			// Get the latest time bubble
			var latestBubble = this.scope.find('[data-timeType]').last().attr('data-timeType');

			// If the new content has that bubble, get rid of it
			content.find('[data-timeType="' + latestBubble + '"]').remove();

			// Get items ready to display
			content
				.find('[data-role="activityItem"]')
					.attr('data-new', true)
					.css({
						opacity: 0
					});
			
			// Forms created on the next slice post back to the default URL which doesn't have this silce, so updated action here
			if ( ! _.isUndefined( data.url ) ) {
				content
					.find('.ipsComment_content form[action="' + this._config['url'] + '"]')
					.attr('action', data.url );
			}
			
			// Get th count of current items in the feed
			var existingItems = this.scope.find('[data-role="activityItem"]');
			var count = existingItems.length;

			// Get the last activity item and insert new content
			existingItems.last().after( content );

			// Init only the new items
			this.scope.find('[data-role="activityItem"]').slice( count ).each( function () {
				$( document ).trigger( 'contentChange', [ $( this ) ] );	
			});			
			
			this._updateURLs();			
			this._animateNewItems();
		},
		
		/**
		 * Adjust URLs if this is an unread stream
		 *
		 * @returns {void}
		 */
		_updateURLs: function() {
			if( this._config['stream_unread_links'] == 1 ) {
				this.scope.find('div.ipsStreamItem_unread').each( function() {
					var star = $(this).find('a[data-linkType="star"]');
					var link = $(this).find('a[data-linkType="link"]');
					
					// Replace with getLast link
					link.attr('href', star.attr('href'));
				} );
			}
		},
		
		/**
		 * When we click a result, we're going to track it in local storage
		 * so that when the user returns, we can scroll to it and highlight it
		 *
		 * @returns {void}
		 */
		clickResult: function (e, data) {
			
			var item = $( e.target ).closest( '[data-indexID]' );
			var star = item.find('a[data-linkType="star"]');
			
			// Remove 'active' from all items
			this.scope.find('.ipsStreamItem_active').removeClass('ipsStreamItem_active');
			
			// If this result is unread, mark it read.
			// Add a class that we'll use to indicate last click
			item
				.addClass('ipsStreamItem_active')
				.find('.ipsStreamItem_unread')
					.removeClass('ipsStreamItem_unread');
					
			// Hide the unread marker if needed
			if( star.attr('data-iPostedIn') ){
				star.find('span.ipsItemStatus').addClass('ipsItemStatus_read').addClass('ipsItemStatus_posted').unwrap();
			} else {
				star.addClass('ipsHide');
			}
		},

		/**
		 * Event handler for clicking the teaser button when there's new results queued to show
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		insertNewItems: function (e) {
			e.preventDefault();

			var insertBefore = null;

			// First, we need to figure out the timing bubble. Our new results may contain a bubble too,
			// so we have to square that away with the ones already showing in the feed.
			if( this.scope.find('[data-timeType="past_hour"]').length ){
				insertBefore = this.scope.find('[data-timeType="past_hour"]').siblings('[data-role="activityItem"]').first();
				// If we already have a 'past_hour' bubble in the stream, then remove it from the new content
				this._newUpdates.find('[data-timeType]').remove();
			} else {
				insertBefore = this.scope.find('[data-timeType], [data-role="activityItem"]').first();
			}

			// Add a bar at the end of the content to show the user where they've seen up to
			this.scope.find('[data-role="unreadBar"]').remove();
			this._newUpdates.append( ips.templates.render('core.streams.unreadBar') );

			// Lets set some styles on the items to show
			this._newUpdates
				.find('[data-role="activityItem"]')
					.attr('data-new', true)
					.css({
						opacity: 0
					});

			// Insert the new content
			insertBefore.before( this._newUpdates.html() );

			// Reinit
			$( document ).trigger( 'contentChange', [ this.scope ] );

			// Remove the teaser button and animate the new items in
			this.scope.find('[data-action="insertNewItems"]').remove();
			this._animateNewItems();

			// Reset our tracking vars
			this._newUpdates = $('<div/>');
			this._waitingCount = 0;
		},

		/**
		 * Finds the new items in the feed and animates them into view
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		_animateNewItems: function () {
			var newItems = this.scope.find('[data-new]');
			var delay = 200;

			// Slide down to make space for them
			newItems.slideDown( function () {
				// Now fade in one by one, with a delay
				newItems.each( function (index) {
					var d = ( index * delay );
					$( this ).delay( ( d > 1200 ) ? 1200 : d ).animate({
						opacity: 1
					}).removeAttr('data-new');
				});	
			});
		},

		/**
		 * Method to check for new activity results on the server.
		 * We don't show the results immediately, otherwise it would bounce the user around the page.
		 * Instead, we store the new results and show a teaser block at the top of the feed. When
		 * the user clicks the teaser, then we insert the results.
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		resultsTeaser: function (e, data) {
			var self = this;
			var response = data.response;
			var count = parseInt( response.count );

			// Get the count and latest timestamp
			var tmp = $('<div>' + response.results + '</div>');

			self.trigger( 'latestTimestamp.stream', {
				timestamp: parseInt( tmp.find('[data-timestamp]').first().attr('data-timestamp') )
			});

			self._waitingCount += count;

			// If we have a date bubble in this new content, we need to check any other new content we haven't
			// shown yet has them too, and remove them.
			if( tmp.find('[data-timeType]').length ){
				var type = tmp.find('[data-timeType]').attr('data-timeType');
				self._newUpdates.find('[data-timeType="' + type + '"]').remove();
			}

			self._newUpdates.prepend( tmp.contents() );

			// Build the teaser
			var teaser = ips.templates.render('core.streams.teaser', {
				count: self._waitingCount,
				words: ips.pluralize( ips.getString('newActivityItems'), [ self._waitingCount, self._waitingCount ] )
			});

			// If a teaser already exists, replace it; otherwise, insert at top
			if( self.scope.find('[data-action="insertNewItems"]').length ){
				self.scope.find('[data-action="insertNewItems"]').replaceWith( teaser );
				self.scope.find('[data-action="insertNewItems"]').show();
			} else {
				self.scope.find('[data-role="activityItem"]').first().before( teaser );
				self.scope.find('[data-action="insertNewItems"]').slideDown();
			}
		}
	});
}(jQuery, _));