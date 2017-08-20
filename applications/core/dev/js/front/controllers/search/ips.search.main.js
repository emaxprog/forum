/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.search.main.js - Main search JS controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.search.main', {

		_content: null,
		_formData: {},
		_loadingDiv: null,
		_initialURL: '',
		_initialData: {},

		initialize: function () {
			this.on( 'initialData.search', this.initialData );
			this.on( 'formSubmitted.search', this.submittedSearch );
			this.on( 'paginationClicked paginationJump', this.paginationClicked );

			// Primary event that watches for URL changes
			History.Adapter.bind( window, 'statechange', _.bind( this.stateChange, this ) );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._content = this.scope.find('#elSearch_main');
			this._baseURL = this.scope.attr('data-baseURL');

			if ( this._baseURL.match(/\?/) ) {
				this._baseURL += '&';
			} else {
				this._baseURL += '?';
			}

			// If the last character is &, we can remove that because it'll be added back later
			if( this._baseURL.slice(-1) == '&' ){
				this._baseURL = this._baseURL.slice( 0, -1)
			}

			this._initialURL = window.location.href;
		},

		/**
		 * Filters have sent up their initial data
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		initialData: function (e, data) {
			this._formData = this._getFormData( data.data );
			this._initialData = _.clone( this._formData );
		},

		/**
		 * Main state change event handler that responds to URL changes
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		stateChange: function () {
			var state = History.getState();

			if( ( !state.data.controller || state.data.controller != 'core.front.search.main' ) && this._initialURL !== state.url ){
				return;
			}

			if( this._initialURL == state.url && _.isUndefined( state.data.url ) ){
				// If we don't have a URL, get it from our initial data
				this._loadResults( this._getUrlFromData( this._initialData ) );
			} else {
				// Otherwise use the state url
				this._loadResults( state.data.url );	
			}			
		},

		/**
		 * Responds to event from filters indicating the filter form has been submitted
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		submittedSearch: function (e, data) {
			this._formData = this._getFormData( data.data );
			var url = this._getUrlFromData( this._formData );

			History.pushState( {
				controller: 'core.front.search.main',
				url: url,
				filterData: this._formData
			}, this._getBrowserTitle(), url );	
		},

		/**
		 * Builds a search URL from the provided data
		 *
		 * @param 		{object} 	data 	Object containing search data
		 * @returns 	{string} 	url
		 */
		_getUrlFromData: function (data) {
			var params = [];

			// Basic params
			_.each( ['q', 'type', 'page'], function (val) {
				if( !_.isUndefined( data[ val ] ) && data[ val ] !== '' ){
					params.push( val + '=' + data[ val ] );
				}
			});

			// Are we searching content or members?
			if( data['type'] == 'core_members' ){

				// Joined date
				if( !_.isUndefined( data['joinedDate'] ) ){
					if( data['joinedDate'] !== 'custom' ){
						params.push( 'joinedDate=' + data['joinedDate'] );
					} else {
						if( !_.isUndefined( data['joinedDateCustom[start]'] ) ){
							params.push( 'start_after=' + encodeURIComponent( new Date( data['joinedDateCustom[start]'] ).getTime() / 1000 ) );	
						}
						if( !_.isUndefined( data['joinedDateCustom[end]'] ) ){
							params.push( 'start_before=' + encodeURIComponent( new Date( data['joinedDateCustom[end]'] ).getTime() / 1000 ) );	
						}						
					}
				}

				// Member group
				if( !_.isUndefined( data['group'] ) ){
					if( !_.isArray( data['group'] ) ){
						data['group'] = [ data['group'] ];
					}

					for( var i = 0; i < data['group'].length; i++ ){
						params.push( 'group[' + data['group'][ i ] + ']=1' );
					}
				}

				// Custom profile fields
				_.each( data, function (val, key){
					if( !key.startsWith('core_pfield') || val === 0 || val === '' ){
						return;
					}

					params.push( key + '=' + val );
				});
				
			} else {
				// Content-specific basic params
				_.each( ['item', 'author', 'search_min_replies', 
						'search_min_views', 'search_min_comments', 'search_min_reviews'], function (val) {
					if( !_.isUndefined( data[ val ] ) && data[ val ] !== '' && parseInt( data[ val ] ) !== 0 ){
						params.push( val + '=' + data[ val ] );
					}
				});

				if( !_.isUndefined( data['tags'] ) ){
					params.push( 'tags=' + data['tags'].replace(/\n/g, ',') );
				}

				// Are we searching nodes?
				if( !_.isUndefined( data[ data['type'] + '_node' ] ) ){
					params.push( 'nodes=' + data[ data['type'] + '_node' ] );
				}
				if( !_.isUndefined( data['club[]'] ) ){
					if ( _.isArray( data['club[]'] ) ) {
						params.push( 'club=' + data['club[]'].filter(function(v){
							return v != '__EMPTY';
						}));
					} else if ( data['club[]'].replace( '__EMPTY', '' ) ) {
						params.push( 'club=' + data['club[]'].replace( '__EMPTY', '' ) );
					}
				}

				// Only include eitherTermsOrTags if there's a term AND some tags
				if( !_.isUndefined( data['eitherTermsOrTags'] ) ){
					if( $.trim( data['q'] ) !== '' && $.trim( data['tags'] ) !== '' ){
						params.push( 'eitherTermsOrTags=' + data['eitherTermsOrTags'] );
					}
				}

				// Only include search_and_or if its 'or'
				if( !_.isUndefined( data['search_and_or'] ) && data['search_and_or'] == 'or' ){
					params.push( 'search_and_or=' + data['search_and_or'] );
				}
				
				// Only include search_and_or if its 'title'
				if( !_.isUndefined( data['search_in'] ) && data['search_in'] == 'titles' ){
					params.push( 'search_in=' + data['search_in'] );
				}

				// Date params
				_.each( [ ['startDate', 'start_after'], ['updatedDate', 'updated_after'] ], function (val) {
					if( !_.isUndefined( data[ val[0] ] ) ){
						if( data[ val[0] ] !== 'any' && data[ val[0] ] !== 'custom' ){
							params.push( val[1] + '=' + data[ val[0] ] );
						}
					}
				});

				// Custom date param
				_.each( [ ['startDateCustom[start]', 'start_after'], ['startDateCustom[end]', 'start_before'],
						['updatedDateCustom[start]', 'updated_after'], ['updatedDateCustom[end]', 'updated_before'] ], function (val) {
					if( !_.isUndefined( data[ val[0] ] ) ){
						// If we have selected 'any' for dates', do not add these
						if ( ( val[0] == 'startDateCustom[start]' || val[0] == 'startDateCustom[end]' ) && !_.isUndefined( data['startDate'] ) && data['startDate'] == 'any' ) {
							// Do nothing
						} else if ( ( val[0] == 'updatedDateCustom[start]' || val[0] == 'updatedDateCustom[end]' ) && !_.isUndefined( data['updatedDate'] ) && data['updatedDate'] == 'any' ) {
							// Do nothing
						} else {
							// We have to pass the form field to getDateFromInput() to account for polyfill
							params.push( val[1] + '=' + encodeURIComponent( ips.utils.time.getDateFromInput( $('[name="' + val[0] + '"]') ).getTime() / 1000 ) );
						}
					}
				});
			}
			
			// Sort
			if( !_.isUndefined( data['sortby'] ) ){
				params.push( 'sortby=' + data['sortby'] );
			}
			
			if( !_.isUndefined( data['sortdirection'] ) ){
				params.push( 'sortdirection=' + data['sortdirection'] );
			}

			return this._baseURL + '&' + params.join('&');
		},

		/**
		 * Main method to load new results from the server
		 *
		 * @param 		{string} 	url 				URL to load
		 * @param 		{boolean} 	showFiltersLoading 	Show the loading indicator on the filter bar?
		 * @returns 	{void}
		 */
		_loadResults: function (url ) {
			var self = this;

			this.triggerOn( 'core.front.search.filters', 'resultsLoading.search' );
			this._setContentLoading( true );

			ips.getAjax()( url )
				.done( function (response) {
									
					if ( typeof response !== 'object' ) {
						window.location = url;
					}
					
					if( response.css ){
						self._addCSS( response.css );	
					}

					// Hide filters
					self.triggerOn( 'core.front.search.filters', 'resultsDone.search', {
						contents: response.filters,
						hints: response.hints
					});	

					// Update content
					self._content.html( response.content );
					$( document ).trigger( 'contentChange', [ self._content ] );

					// Update title
					self.scope.find('[data-role="searchBlurb"]').show().html( response.title );

					// Make sure cancel button is shown
					self.scope.find('[data-action="cancelFilters"]').show();
					
					// Animate new items
					var newItems = self.scope.find('[data-role="resultsArea"] [data-role="activityItem"]').css({
						opacity: 0
					});
					var delay = 100;

					// Slide down to make space for them
					newItems.slideDown( function () {
						// Now fade in one by one, with a delay
						newItems.each( function (index) {
							var d = ( index * delay );
							$( this ).delay( ( d > 1200 ) ? 1200 : d ).animate({
								opacity: 1
							});
						});	
					});
				})
				.fail( function (jqXHR, textStatus) {
					window.location = url;
				})
				.always( function () {
					self._setContentLoading( false );
				});
		},

		/**
		 * Responds to pagination event in conversation
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object	
		 * @returns 	{void}
		 */
		paginationClicked: function (e, data){
			if( data.originalEvent ){
				data.originalEvent.preventDefault();
			}		

			this._formData['page'] = data.pageNo;
						
			var url = this._getUrlFromData( this._formData );

			History.pushState( {
				controller: 'core.front.search.main',
				url: url
			}, document.title, url );
			
			var elemPosition = ips.utils.position.getElemPosition( this.scope );
			$('html, body').animate( { scrollTop: elemPosition.absPos.top + 'px' } );
		},

		/**
		 * Returns form data, converting jquery serializedArray objects into
		 * simple key/value pairs
		 *
		 * @param 		{object} 	data 	Form data object
		 * @returns 	{object}
		 */
		_getFormData: function (data) {
			if( !_.isObject( data ) ){
				return;
			}

			var returnData = {};
			var skipData = [ 'page', 'csrfKey' ];

			for( var i = 0; i < data.length; i++ ){
				if( _.indexOf( skipData, data[ i ].name ) === -1 && data[ i ].value !== '' ){

					// If we already have a value set for this param and it isn't an array, juggle it
					// so that it is an array and push the existing value into it
					if( !_.isUndefined( returnData[ data[ i ].name ] ) && !_.isArray( returnData[ data[ i ].name ] ) ){
						var tmp = returnData[ data[ i ].name ];
						returnData[ data[ i ].name ] = [];
						returnData[ data[ i ].name ].push( tmp );
					}

					// If we're an array, push it into it, otherwise just set the value
					if( !_.isUndefined( returnData[ data[ i ].name ] ) ){
						returnData[ data[ i ].name ].push( data[ i ].value );
					} else {
						returnData[ data[ i ].name ] = data[ i ].value;	
					}
					
					// Unlimited checkbox? Overwrite value
					if ( data[i].name != 'club[]' ) {
						if ( $('#' + data[i].name + '-unlimitedCheck').length )
						{
							if ( ! $('#' + data[i].name + '-unlimitedCheck:checked').length )
							{
								returnData[ data[ i ].name ] = $('input[type=number][name=' + data[ i ].name + ']').val();
							}
							else
							{
								delete( returnData[ data[ i ].name ] );
							}
						}
					}
				}
			}
			
			if( ! _.isUndefined( data['type'] ) && data['type'] != 'core_members' ){
				if ( ! _.isUndefined( data['sortby'] ) ){
					delete( data['sortby'] );
				}
				
				if ( ! _.isUndefined( data['sortdirection'] ) ){
					delete( data['sortdirection'] );
				}
			}

			return returnData;
		},

		/**
		 * Builds a string to use in the browser titlebar
		 *
		 * @returns 	{string}
		 */
		_getBrowserTitle: function () {
			var title = ips.getString('searchTitle');
			var currentType = this.scope.find('input[type="radio"][name="type"]:checked');
			var q = this._formData['q'];
			if ( _.isUndefined( q ) ) {
				q = '';
			}
			
			if( q !== '' && !currentType.length ){
				title = ips.getString('searchTitleTerm', {
					term: q
				});
			} else if( q !== '' && currentType.length ){
				title = ips.getString('searchTitleTermType', {
					term: q,
					type: currentType.next('[data-role="searchAppTitle"]').text()
				});
			} else if( q === '' && this._currentType !== '' ){
				title = ips.getString('searchTitleType', {
					type: currentType.next('[data-role="searchAppTitle"]').text()
				});
			}
			
			return title;
		},

		/**
		 * Adds css files to the page header
		 *
		 * @param 		{array} 	css 	Array of CSS urls to add
		 * @returns 	{void}
		 */
		_addCSS: function (css) {
			var head = $('head');

			if( css && css.length ){
				for( var i = 0; i < css.length; i++ ){
					head.append( $('<link/>').attr( 'href', css[i] ).attr( 'type', 'text/css' ).attr('rel', 'stylesheet') );
				}
			}
		},

		/**
		 * Toggles the loading state on the main search body area
		 *
		 * @param 		{boolean} 	showLoading 		Enable loading state?
		 * @returns 	{void}
		 */
		_setContentLoading: function (state) {
			var results = this.scope.find('[data-role="resultsContents"]');

			if( !results.length ){
				if( this._loadingDiv ){
					this._loadingDiv.hide();
				}

				return;
			}

			var dims = ips.utils.position.getElemDims( results );
			var position = ips.utils.position.getElemPosition( results );
			

			if( !this._loadingDiv ){
				this._loadingDiv = $('<div/>').append( 
					$('<div/>')
						.css({
							height: _.min( [ 200, results.outerHeight() ] ) + 'px'
						})
						.addClass('ipsLoading')
				);

				ips.getContainer().append( this._loadingDiv );
			}

			this._loadingDiv
				.show()
				.css({
					left: position.viewportOffset.left + 'px',
					top: position.viewportOffset.top + $( document ).scrollTop() + 'px',
					width: dims.width + 'px',
					height: dims.height + 'px',
					position: 'absolute',
					zIndex: ips.ui.zIndex()
				})
				

			if( state ){
				results
					.animate({
						opacity: 0.6
					})
					.css({
						height: results.height() + 'px'
					});				
			} else {
				results.css({
					height: 'auto',
					opacity: 1
				});

				this._loadingDiv.hide();
			}	
		}
	});
}(jQuery, _));