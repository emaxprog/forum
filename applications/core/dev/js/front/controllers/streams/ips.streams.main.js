/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.streams.main.js - Main stream view
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.streams.main', {

		_streamLoadingOverlay: null,
		_tooltip: null,
		_tooltipTimer: null,
		_baseURL: '',
		_streamID: 0,
		_currentView: '',

		_shortInterval: 15, // Seconds
		_longInterval: 45, // Seconds
		_killUpdate: 45, // Minutes
		_timer: null,
		_killTimer: null,
		_activityUpdate: null,
		_loadMore: null,
		_timestamp: 0,
		_autoUpdate: false,
		_windowFocus: false,

		initialize: function () {
			this.on( 'formSubmitted.stream', this.formSubmitted );
			this.on( 'initialFormData.stream', this.initialFormData );
			this.on( 'loadMoreResults.stream', this.loadMoreResults );
			this.on( 'latestTimestamp.stream', this.latestTimestamp );
			this.on( 'click', '[data-action="switchView"]', this.switchView );
			this.on( 'menuOpened', '#elStreamShare', this.menuOpened );
			this.on( 'click', '[data-action="toggleStreamDefault"]', this.toggleDefault );
			this.on( 'click', '[data-action="removeStream"]', this.removeStream );
			this.on( 'click', '[data-action="loadMore"]', this.loadMoreResults );
			this.on( 'resultsUpdated.stream', this.resultsUpdated );
			this.on( 'stickyStatusChange.sticky', '#elStreamFilterForm', this.stickyChange );
			this.on( 'click', '[data-action="toggleFilters"]', this.toggleFilters );
			this.on( document, 'breakpointChange', this.breakpointChange );

			// Figure out the visibility event we need
			this.on( document, ips.utils.events.getVisibilityEvent(), this.windowVisibilityChange );

			// Primary event that watches for URL changes
			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );
			
			this.setup();
		},

		setup: function () {
			this._streamID = this.scope.attr('data-streamID');			
			this._baseURL = ips.getSetting('stream_config')['url'];

			if ( this._baseURL.match(/\?/) ) {
				this._baseURL += '&';
			} else {
				this._baseURL += '?';
			}

			// If the last character is &, we can remove that because it'll be added back later
			if( this._baseURL.slice(-1) == '&' ){
				this._baseURL = this._baseURL.slice( 0, -1)
			}

			// Get the newest timestamp
			this._timestamp = parseInt( this.scope.find('[data-timestamp]').first().attr('data-timestamp') );
			this._currentView = this.scope.find('[data-action="switchView"].ipsButtonRow_active').attr('data-view');

			if( !_.isUndefined( this.scope.find('[data-role="streamResults"]').attr('data-autoPoll') ) ){
				this._autoUpdate = true;
				this.windowVisibilityChange(); // Call our visibility method manually to determine window visibility
			}

			// Are we on mobile?
			if( ips.utils.responsive.currentIs('phone') ){
				this.scope.find('[data-role="filterBar"]').addClass('ipsHide');
				this.scope.find('[data-action="toggleFilters"]').html( ips.getString('toggleFiltersHidden') );
			}
		},
		
		/**
		 * Event handler for the page state changing
		 * We have a few different states to support:
		 * - Form changes
		 * - Load More button
		 * - View type
		 * Each is handled a little differently but ultimately passes data to this._loadResults
		 *
		 * @returns 	{void}
		 */
		stateChange: function () {
			var state = History.getState();
			var self = this;
			
			if( ( !state.data.controller || state.data.controller != 'core.front.streams.main' ) && this._initialURL !== state.url ){
				return;
			}
			
			if( state.data.action == 'saveForm' || state.data.action == 'updateForm' ){
				
				// If this state alters the form, let the form know
				this.triggerOn( 'core.front.streams.form', 'streamStateUpdate.streamForm', {
					filterData: state.data.filterData,
					hideSaveBar: ( _.isEmpty( this._getUrlDiff( state.data.filterData ) ) || state.data.action == 'saveForm' )
				});

				// Track page view
				ips.utils.analytics.trackPageView( state.url );

				// Are we changing the sorting?
				if( !_.isUndefined( state.data.filterData.stream_sort ) ){
					this._togglePolling( !( state.data.filterData.stream_sort == 'oldest' ) );
				}
				
				var data = _.extend( { view: this._currentView }, state.data.filterData );
				
				switch (state.data.action) {
					case 'updateForm':
						data = _.extend( data, false, { 'updateOnly': 1 } );
					break;
					case 'saveForm':
						data = _.extend( data, false, { 'form': 'save' } );
					break;
				}
				
				this._loadResults( data )
					.done( function (response) {
						self.triggerOn( 'core.front.streams.results', 'updateResults.stream', {
							append: false,
							response: response
						});
						
						// Do we need to reset the URL & config?
						if( state.data.action == 'saveForm' ){
							ips.setSetting( 'stream_config', JSON.parse( response.config ) );
							
							History.replaceState( {
								controller: 'core.front.streams.main',
								url: ips.getSetting( 'stream_config' )['url'],
								skipUpdate: true
							}, document.title, ips.getSetting( 'stream_config' )['url'] );
						}
					})
				
			} else if( state.data.action == 'loadMore' ){
				
				var data = _.extend( { 
					before: state.data.before, 
					view: this._currentView 
				}, state.data.filters );
				
				// If it's from 'load more', load them and pass the results down
				var before = this.scope.find('[data-role="activityItem"]').last().attr('data-timestamp');
				var _this  = this;
				this._loadResults( data )
					.done( function (response) {
						var content = $('<div>' + response.results + '</div>');
						// We deduct one here because the SQL does a > or < which won't match all items if the timestamp is exact
						var latest = parseInt( content.find('[data-role="activityItem"]').last().attr('data-timestamp') ) - 1;
						History.replaceState( {
							controller: 'core.front.streams.main',
							latest: latest
						}, document.title, _this._buildRequestURL( { before: before, latest: isNaN( latest ) ? 0 : latest } ) );
			
						self.triggerOn( 'core.front.streams.results', 'updateResults.stream', {
							append: true,
							response: response,
							url: _this._buildRequestURL( { before: before, latest: isNaN( latest ) ? 0 : latest } )
						});
					});
					
			} else if( state.data.action == 'viewToggle' ){
				this._setViewType( state.data.view );
				
				// If it's from the view toggle, load them and pass the results down
				this._loadResults( _.extend( { view: state.data.view }, state.data.filters ) )
					.done( function (response) {
						self.triggerOn( 'core.front.streams.results', 'updateResults.stream', {
							response: response
						});
					});
					
			} else {
				
				// Don't do anything
				Debug.log('skip update');
			}	
		},
		
		/**
		 * Event handler for clicking the Load More button
		 *
		 * @param 		{event} 	e 		Event Object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		loadMoreResults: function (e, data) {
			e.preventDefault();
			
			// Get the last timestap being shown
			var timestamp = this.scope.find('[data-role="activityItem"]').last().attr('data-timestamp');
			var url = this._buildRequestURL( { before: timestamp } );

			this.scope
				.find('[data-role="loadMoreContainer"] [data-action="loadMore"]')
					.addClass('ipsButton_disabled')
					.text( ips.getString('loading') );
			
			History.pushState( {
				controller: 'core.front.streams.main',
				before: timestamp,
				filters: this._getUrlDiff( this._formData ),
				action: 'loadMore'
			}, document.title, url );
		},

		/**
		 * Toggles filters on mobile
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		toggleFilters: function (e) {
			e.preventDefault();

			var filterBar = this.scope.find('[data-role="filterBar"]');
			var toggleButton = $( e.currentTarget );

			if( filterBar.is(':visible') ){
				filterBar.slideUp();
				toggleButton.html( ips.getString('toggleFiltersHidden') ).removeClass('cStreamFilter_toggleShown');
				this.scope.find('[data-role="saveButtonContainer"]').addClass('ipsHide');
			} else {
				filterBar.slideDown();
				toggleButton.html( ips.getString('toggleFiltersShown') ).addClass('cStreamFilter_toggleShown');
			}

			$( document ).trigger( 'closeMenu' );
		},

		/**
		 * When the user switches breakpoints, hide/show filters as appropriate
		 *
		 * @param 		{event} 	e 		Event data
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		breakpointChange: function (e, data) {
			if( data.curBreakName == 'phone' ){
				this.scope.find('[data-role="filterBar"]').addClass('ipsHide').hide();
				this.scope.find('[data-action="toggleFilters"]')
					.html( ips.getString('toggleFiltersHidden') )
					.removeClass('cStreamFilter_toggleShown')
			} else {
				this.scope.find('[data-role="filterBar"]').removeClass('ipsHide');
				/* Slide up animation adds display:none to filterbar */
				if ( ! this.scope.find('[data-role="filterBar"]').is(':visible') ) {
					this.scope.find('[data-role="filterBar"]').slideDown();
					this.scope.find('[data-action="toggleFilters"]')
						.html( ips.getString('toggleFiltersShown') )
						.addClass('cStreamFilter_toggleShown');
				}
			}
		},

		/**
		 * Called when the view is changing
		 *
		 * @param 		{string} 	type 		The view type we're switching to
		 * @returns 	{void}
		 */
		_setViewType: function (type) {
			this._currentView = type;
			
			// Update the button
			this.scope
				.find('[data-action="switchView"]')
					.removeClass('ipsButton_primary')
					.addClass('ipsButton_link')
					.filter('[data-view="' + type + '"]')
						.removeClass('ipsButton_link')
						.addClass('ipsButton_primary');
						
			// Set a cookie
			ips.utils.cookie.set( 'stream_view_' + this._streamID, type, true );
		},

		/**
		 * If we switch into sticky mode on the filter bar, hide any menus
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		stickyChange: function (e, data) {
			this.scope.find('[data-ipsMenu]').trigger('closeMenu');
		},
		
		/**
		 * Handles switching views
		 * Sets a cookie so the preference is remembered
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		switchView: function (e) {
			e.preventDefault();
			
			var type = $( e.currentTarget ).attr('data-view');			
			var url = this._buildRequestURL( { view: type } );
			
			History.pushState( {
				controller: 'core.front.streams.main',
				view: type,
				filters: this._getUrlDiff( this._formData ),
				action: 'viewToggle'
			}, document.title, url );
		},
		
		/**
		 * Handler for the filter form being submitted. When this happens we determine
		 * what data is different, then update the page state in order to get new results
		 *
		 * @param 		{event} 	e 		Event Object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		formSubmitted: function (e, data) {
			this._formData = this._getFormData( data.data );
			var url = this._buildRequestURL();

			History.pushState( {
				controller: 'core.front.streams.main',
				url: url,
				filterData: this._formData,
				action: data.action
			}, document.title, url );
		},
		
		/**
		 * The form has passed us its initial values on page load
		 *
		 * @param 		{event} 	e 		Event Object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		initialFormData: function (e, data) {
			this._formData = this._getFormData( data.data );
		},

		/**
		 * The results controller has sent us the latest-shown timestamp
		 *
		 * @param 		{event} 	e 		Event Object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		latestTimestamp: function (e, data) {
			this._timestamp = data.timestamp;
		},

		/**
		 * Event handler for windw visibility changing
		 * Allows us to slow the rate of auto-updates if the user isn't looking at the page
		 *
		 * @returns 	{void}
		 */
		windowVisibilityChange: function () {
			var hiddenProp = ips.utils.events.getVisibilityProp();

			if( !_.isUndefined( hiddenProp ) ){
				if( document[ hiddenProp] ){
					this._windowFocus = false;
					this._startTimer( this._longInterval );
					this._killTimer = setTimeout( _.bind( this._stopPolling, this ), this._killUpdate * 60 * 1000 );
					Debug.log("Set the kill timer");
				} else {
					this._windowFocus = true;
					this._startTimer( this._shortInterval );
					this._updateTitle(0);
					clearTimeout( this._killTimer );
					Debug.log("Cleared the kill timer");
				}
			} else {
				this._startTimer( this._longInterval );
			}
		},
		
		/**
		 * Loads new results from the server
		 *
		 * @param 		{object} 	data 		Params data object
		 * @param 		{string} 	updateType	The type of update we're doing, e.g. 'update' or 'save'
		 * @param 		{boolean} 	silent		Fetch silently? If true, won't show loading or update stream UI
		 * @returns 	{void}
		 */
		_loadResults: function (data, resetConfig, silent) {
			var self = this;			
			var promise = $.Deferred();
			
			if( !silent ){
				this._setStreamLoading( true );	
			}						
			
			ips.getAjax()( ips.getSetting('stream_config')['url'], {
				type: 'post',
				data: data || {}
			})
				.done( function (response) {
					if( !silent ){
						self._setStreamLoading( false );
						self._updateStreamUI( response );	
					}
					
					promise.resolve( response );
				})
				.fail( function (response) {
					if( !silent ){
						ips.ui.alert.show( {
							type: 'alert',
							message: ips.getString('errorLoadingStream'),
							icon: 'warn'
						});	
					}				
					
					promise.reject();
				});
				
			return promise;
		},
		
		/**
		 * Perform actions after the results have been updated and added to the DOM
		 *
		 * @param 		{event} 	e 		Event Object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		resultsUpdated: function(e, data) {
			if ( this.scope.find('[data-role="activityItem"]').length == 0  ) {
				this.scope.find('[data-role="loadMoreContainer"]').hide();
				this.scope.find('[data-role="streamContent"]').removeClass('ipsStream_withTimeline');
			}
			else{
				this.scope.find('[data-role="streamContent"]').addClass('ipsStream_withTimeline');
				this.scope.find('[data-role="loadMoreContainer"]').show();
			}
		},
		
		/**
		 * Processes an update after new results have been loaded
		 * This method is responsible for the stream UI. The actual results
		 * are processed by core.front.streams.results.
		 *
		 * @param 		{object} 	data 	Event data object from form controller
		 * @returns 	{void}
		 */
		_updateStreamUI: function (response) {
			Debug.log("Updating stream UI...");
			
			// Update blurb
			this.scope.find('[data-role="streamBlurb"]').text( response.blurb.replace(/&#039;/g, "'") );
			this.scope.find('[data-role="streamTitle"]').html( response.title );
		
			// Hide or reset "Load more" button if needed
			if( response.count == 0 ){
				this.scope.find('[data-role="loadMoreContainer"]').show().html( ips.templates.render('core.streams.noMore') );
			} else {
				this.scope.find('[data-role="loadMoreContainer"]').show().html( ips.templates.render('core.streams.loadMore') );
			}	
			
			// Update menu
			if( response.id ){
				var menuItem = $('body').find('[data-streamid="' + response.id + '"] > a');
				menuItem.text( response.title );
			}
		},
		
		/**
		 * Takes a raw form data object and returns only the keys we're interested in
		 *
		 * @param 		{object} 	data	Form data object
		 * @returns 	{object}
		 */
		_getFormData: function (data) {			
			var returnValues = {};
			
			// Keep any data prefixed with 'stream'
			_.each( data, function (val, key){
				if( key.startsWith('stream_') ){
					returnValues[ key ] = val;
				}
			});

			// Remove the __EMPTY from classes
			try {
				if( !_.isUndefined( returnValues['stream_classes']['__EMPTY'] ) ){
					returnValues['stream_classes'] = _.omit( returnValues['stream_classes'], '__EMPTY' );
				}	
			} catch (err) { }			
			
			return returnValues;
		},
		
		/**
		 * Returns an object that only contains the params that are
		 * different to our base stream config, allowing us to use them in
		 * the URL but not duplicate the 'default' stream values
		 *
		 * @param 		{object} 	data	Form data object
		 * @returns 	{object}
		 */
		_getUrlDiff: function (data) {
			
			var returnedValues = {};
			var defaultValues = ips.getSetting( 'stream_config' );
			
			if( !_.size( data ) ){
				return returnedValues;
			}
			
			// Reset any values that have been altered 
			if ( ! _.isUndefined( defaultValues['changed'] ) ) {
				_.each( defaultValues['changed'], function( val, key ) {
					defaultValues[ key ] = val;
				}  );
			}

			// Simple values
			_.each( ['stream_sort', 'stream_include_comments', 'stream_read', 'stream_unread_links', 'stream_default_view', 'stream_club_select', 'stream_club_filter'], function (val) {
				if( defaultValues[ val ] != data[ val ] ){
					returnedValues[ val ] = data[ val ];
				}
			});
			
			// Ownership
			if( data['stream_ownership'] == 'custom' ){
				// We're filtering by custom members, so work out if there's any differences				
				var newNames = _.isObject( data['stream_custom_members'] ) ? data['stream_custom_members'] : data['stream_custom_members'].split(',');
				var oldNames = defaultValues['stream_custom_members'];
				
				if ( ! _.isObject( oldNames ) ) {
					oldNames = [];
				}
				
				var nameIntersection = _.intersection( newNames, oldNames );
				// Got any names now?
				if ( ! newNames.length ) {
					returnedValues['stream_ownership'] = 'all';
				}
				// If the lengths don't match, include them
				else if( newNames.length !== oldNames.length || nameIntersection.length !== newNames.length ){
					returnedValues['stream_ownership'] = 'custom';
					returnedValues['stream_custom_members'] = data['stream_custom_members'];
				}
			} else if( defaultValues['stream_ownership'] !== data['stream_ownership'] ) {
				returnedValues['stream_ownership'] = data['stream_ownership'];
			}
			
			// Follows
			if( !( defaultValues['stream_follow'] == 'all' && data['stream_follow'] == 'all' ) ){
				if( data['stream_follow'] == 'followed' ){
					var newFollowTypes = _.keys( data['stream_followed_types'] );
					var oldFollowTypes = _.keys( defaultValues['stream_followed_types'] );
					var followIntersection = _.intersection( newFollowTypes, oldFollowTypes );
					
					if( newFollowTypes.length !== oldFollowTypes.length || followIntersection.length !== newFollowTypes.length ){
						returnedValues['stream_follow'] = 'followed';
						returnedValues['stream_followed_types'] = data['stream_followed_types'];
					}
				} else {
					returnedValues['stream_follow'] = data['stream_follow'];
				}			
			}
			
			// Tags
			if( ! _.isEmpty( $.trim( data['stream_tags'] ) ) ){
				var newTags = _.compact( ( data['stream_tags'] || '' ).split(',') );
				var oldTags = _.compact( ( defaultValues['stream_tags'] || '' ).split(',') );
				var tagIntersection = _.intersection( newTags, defaultValues['stream_tags'] );

				if( newTags.length !== oldTags.length || tagIntersection.length !== newTags.length ){
					returnedValues['stream_tags'] = newTags.join(',');
				}
			} else if ( defaultValues['stream_tags'] ) {
				// There were tags
				returnedValues['stream_tags'] = '';
			}
			
			// Dates
			if( data['stream_date_type'] == 'custom' ){
				var startTest = data['stream_date_range']['start'];

				if( startTest.toString().match( /^[0-9]{9,10}$/ ) )
				{
					var start = data['stream_date_range']['start'];
					var end = data['stream_date_range']['end'];
				}
				else
				{
					var start = new Date( data['stream_date_range']['start'] ).getTime() / 1000;
					var end = new Date( data['stream_date_range']['end'] ).getTime() / 1000;
				}
				
				// Check if there's a start date, and if so, is it different to the stream default?
				if( data['stream_date_range']['start'] && 
					( _.isUndefined( defaultValues['stream_date_range'] ) || start !== defaultValues['stream_date_range']['start'] ) ){
					returnedValues['stream_date_type'] = 'custom';
					returnedValues['stream_date_start'] = start;
				}
				// Check if there's an end date, and if so, is it different to the stream default?
				if( data['stream_date_range']['end'] && 
					( _.isUndefined( defaultValues['stream_date_range'] ) || end !== defaultValues['stream_date_range']['end'] ) ){
					returnedValues['stream_date_type'] = 'custom';
					returnedValues['stream_date_end'] = end;
				}
			} else if( data['stream_date_type'] == 'relative' ){
				// Has the number of relative days changed?
				if( defaultValues['stream_date_relative_days'] !== data['stream_date_relative_days'] ){
					returnedValues['stream_date_type'] = 'relative';
					returnedValues['stream_date_relative_days'] = data['stream_date_relative_days'];
				}
			} else if( defaultValues['stream_date_type'] !== data['stream_date_type'] ){
				returnedValues['stream_date_type'] = data['stream_date_type'];
			}
			
			// Classes
			if( data['stream_classes_type'] == 0 && defaultValues['stream_classes_type'] == 1 ){
				returnedValues['stream_classes'] = {};
			} else {
				var newClasses = _.without( _.keys( data['stream_classes'] ), '__EMPTY' );
				var classIntersection = _.intersection( newClasses, _.keys( defaultValues['stream_classes'] ) );
			
				if( classIntersection.length !== newClasses.length ){
					returnedValues['stream_classes'] = _.omit( data['stream_classes'], '__EMPTY' );
				}	
			}			
			
			// Containers
			var containers = {};
			if ( ! _.isUndefined( data['stream_classes'] ) && _.isObject( data['stream_classes'] ) ) {
				_.each( _.without( _.keys( data['stream_classes'] ), '__EMPTY' ), function( val, key ) {
					var contentType = $('div[data-role="streamContainer"][data-className="' + val.replace( /\\/g, '\\\\' ) + '"]').attr('data-contentKey');
					if ( ! _.isUndefined( contentType ) && $('input[name="stream_containers_' + contentType + '"]').length ) {
						containers[ val ] = $('input[name="stream_containers_' + contentType + '"]').val();
					}
				} );
			}
			
			if ( ! _.isEmpty( containers ) ) {
				if ( ! _.isUndefined( defaultValues['containers'] ) && ! _.isEqual( containers, defaultValues['containers'] ) ) {
					returnedValues['stream_containers'] = containers;
				}
			}
			
			return returnedValues;
		},
		
		/**
		 * Builds a request URL by getting a diff of the current stream params,
		 * and adding any extra params we need.
		 *
		 * @param 		{object} 	extraParams 	Any extra request params to use
		 * @returns 	{void}
		 */
		_buildRequestURL: function (extraParams) {			
			var urlDiff = this._getUrlDiff( this._formData );
			var params = [];
			
			// Loop through each 'diffed' param to build the request URL
			_.each( urlDiff, function (val, key) {
				if( _.isObject( val ) ){
					if( !_.size( val ) ){
						params.push( key + '=' );
					} else {
						var keys = _.keys( val );
						var values = _.values( val );
						
						for( var i = 0; i < keys.length; i++ ){
							var paramValue = ( ! _.isUndefined( values[i] ) ? values[i] : 1 );
							params.push( key + '[' + encodeURIComponent( keys[i] ) + ']=' + paramValue );
						}	
					}					
				} else {
					params.push( key + '=' + encodeURIComponent( val ) );
				}
			});
			
			// Do we have extra params?
			if( _.isObject( extraParams ) ){
				_.each( extraParams, function (val, key) {
					params.push( key + '=' + encodeURIComponent( val ) );
				});
			}

			return this._baseURL + '&' + params.join('&');
		},

		/**
		 * Selects the value of the textbox in the share popup
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		menuOpened: function (e, data) {
			data.menu.find('input[type="text"]').focus().get(0).select();
		},
		
		/**
		 * Confirms user click to remove this stream
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		removeStream: function (e) {
			e.preventDefault();
			
			ips.ui.alert.show({
				type: 'confirm',
				message: ips.getString('confirmRemoveStream'),
				callbacks: {
					ok: function () {
						window.location = $(e.currentTarget).attr('href') + '&wasConfirmed=1';
					},
				}
			});
		},
		
		/**
		 * Toggles a stream as the shortcut
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleDefault: function (e) {
			e.preventDefault();
		
			var self  = this;
			var link  = $( e.currentTarget );
			var value = link.attr('data-change');
			var url   = link.attr('href');
			
			ips.getAjax()( url )
				.done( function (response) {					
					if( value == 1 ){
						self.scope.find('a[data-action="toggleStreamDefault"][data-change="0"]').removeClass('ipsHide');
						self.scope.find('a[data-action="toggleStreamDefault"][data-change="1"]').addClass('ipsHide');
					} else {
						self.scope.find('a[data-action="toggleStreamDefault"][data-change="0"]').addClass('ipsHide');
						self.scope.find('a[data-action="toggleStreamDefault"][data-change="1"]').removeClass('ipsHide');
					}
						
					if( !response.title ) {
						$('a[data-action="defaultStream"]').hide();
					} else {
						$('a[data-action="defaultStream"]')
							.attr('href', response.url )
							.show()
							.find('span')
								.html( response.title );
					}
	
					if( value == 1 ){
						if( !ips.utils.responsive.enabled || !ips.utils.responsive.currentIs('phone') && $('a[data-action="defaultStream"]').is(':visible') ){
							self._showStreamTooltip( response.tooltip );
						} else {
							ips.utils.anim.go( 'pulseOnce', $('a[data-action="defaultStream"]') );
						}
					}			
			});
		},

		/**
		 * Shows a tooltip on the 'default stream' link to help the user
		 *
		 * @param 		{string} 	title 		TItle of the default stream
		 * @returns 	{void}
		 */
		_showStreamTooltip: function (title) {
			if( !this._tooltip ){
				// Build it from a template
				var tooltipHTML = ips.templates.render( 'core.tooltip', {
					id: 'elDefaultStreamTooltip_' + this.controllerID
				});

				// Append to body
				ips.getContainer().append( tooltipHTML );

				this._tooltip = $('#elDefaultStreamTooltip_' + this.controllerID );
			} else {
				this._tooltip.hide();
			}

			if( this._tooltipTimer ){
				clearTimeout( this._tooltipTimer );
			}

			this._tooltip.text( ips.getString('streamDefaultTooltip', {
				title: title
			}));

			// Get image
			var streamLink = $('a[data-action="defaultStream"]:visible');
			var self = this;

			// Now position it
			var positionInfo = {
				trigger: streamLink.first(),
				target: this._tooltip,
				center: true,
				above: true
			};

			var tooltipPosition = ips.utils.position.positionElem( positionInfo );

			$( this._tooltip ).css({
				left: tooltipPosition.left + 'px',
				top: tooltipPosition.top + 'px',
				position: ( tooltipPosition.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});

			if( tooltipPosition.location.vertical == 'top' ){
				this._tooltip.addClass('ipsTooltip_top');
			} else {
				this._tooltip.addClass('ipsTooltip_bottom');
			}

			this._tooltip.show();

			setTimeout( function () {
				if( self._tooltip && self._tooltip.is(':visible') ){
					ips.utils.anim.go( 'fadeOut', self._tooltip );
				}
			}, 3000);
		},
		
		/**
		 * Puts the stream into loading mode by adding an overlaid loadinb div
		 *
		 * @param 		{boolean} 	loading 		Are we loading?
		 * @returns 	{void}
		 */
		_setStreamLoading: function (loading) {
			var stream = this.scope.find('[data-role="streamContent"]');

			if( !loading ){
				this._streamLoadingOverlay.hide();
				stream.css({
					opacity: 1
				});
				return;
			} else {

				if( !this._streamLoadingOverlay ){
					this._streamLoadingOverlay = $('<div/>').addClass('ipsLoading');
					ips.getContainer().append( this._streamLoadingOverlay );
				}

				// Get dims & position			
				var dims = ips.utils.position.getElemDims( stream );
				var position = ips.utils.position.getElemPosition( stream );

				this._streamLoadingOverlay.show().css({
					left: position.viewportOffset.left + 'px',
					top: position.viewportOffset.top + $( document ).scrollTop() + 'px',
					width: dims.width + 'px',
					height: dims.height + 'px',
					position: 'absolute',
					zIndex: ips.ui.zIndex()
				});

				stream.css({
					opacity: 0.5
				});
			}

		},

		/**
		 * Sets or resets the timer to check for new posts
		 *
		 * @param 		{number} 	interval 		Interval (in seconds) between checks
		 * @returns 	{void}
		 */
		_startTimer: function (interval) {
			if( !this._autoUpdate ){
				return;
			}
			
			if( !interval ){
				interval = this._shortInterval;
			}

			if( this._timer ){
				clearInterval( this._timer );
			}

			this._timer = setInterval( _.bind( this._autoFetchNew, this ), interval * 1000 );	
		},

		/**
		 * Toggles auto-polling for new content depending on the status passed in as a param
		 *
		 * @param 		{boolean} 	status 		Enable polling?
		 * @returns 	{void}
		 */
		_togglePolling: function (status) {
			// Only enable if we have polling possible
			if( !this._autoUpdate ){
				clearInterval( this._timer );
				return;
			}

			if( status ){
				this._startTimer();
				this.scope.find('[data-role="updateMessage"]').show();
			} else {
				if( this._timer ){
					clearInterval( this._timer );
					this.scope.find('[data-role="updateMessage"]').hide();
				}
			}
		},

		/**
		 * Method to check for new activity results on the server.
		 *
		 * @returns 	{void}
		 */
		_autoFetchNew: function () {
			var self = this;

			if( !_.isNumber( this._timestamp ) || _.isNaN( this._timestamp ) ){
				Debug.log("Timestamp not a number");
				clearInterval( this._timer );
				return;
			}

			// Fetch the results, then pass them to the results controller to display
			this._loadResults( { after: this._timestamp }, false, true )
				.done( function (response) {

					var count = parseInt( response.count );

					// If auto-polling is now disabled, stop everything
					if( response.error && response.error == 'auto_polling_disabled' ){
						self.scope.find('[data-role="updateMessage"]').remove();
						clearInterval( self._timer );
						return;
					}

					// Nothing returned?
					if( _.isNaN( count ) || count == 0 ){
						return;
					}

					self.triggerOn( 'core.front.streams.results', 'resultsTeaser.stream', {
						response: response
					});
				});
		},

		/**
		 * Stops the auto-updating from running for good
		 *
		 * @returns 	{void}
		 */
		_stopPolling: function () {
			clearInterval( this._timer );
			this._autoUpdate = false;
			this.scope.find('[data-role="updateMessage"]').html( ips.getString('autoUpdateStopped') );
			Debug.log("Stopped polling due to user inactivity");
		},

		/**
		 * Updates the browser title with an 'unseen count' of new items
		 *
		 * @param 		{number} 	count 		Number of unseen items
		 * @returns 	{void}
		 */
		_updateTitle: function (count) {
			// Moved to instant notifications		
		}
	});
}(jQuery, _));