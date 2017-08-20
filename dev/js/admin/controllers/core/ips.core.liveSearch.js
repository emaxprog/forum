/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.liveSearch.js - ACP livesearch controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.liveSearch', {
		_textField: null,
		_searchMenu: null,
		_resultsContainer: null,
		_lastValue: '',
		_results: {},
		_timers: {},
		_modal: null,
		_activePanel: null,
		_ajax: {},
		_defaultTab: null,

		initialize: function () {
			this.setup();

			this.on( document, 'focus', '#acpSearchKeyword', this.fieldFocus );
			this.on( document, 'blur', '#acpLiveSearch', this.fieldBlur );
			this.on( document, 'click', '.ipsModal', this.clickModal );
			this.on( 'itemClicked.sideMenu', this.changeSection );
		},

		setup: function () {
			this._searchMenu = this.scope.find('[data-role="searchMenu"]');
			this._resultsContainer = this.scope.find('[data-role="searchResults"]');
			this._defaultTab = this.scope.find('[data-role="defaultTab"]').attr('data-ipsMenuValue');
			this._textField = $('#acpSearchKeyword');
			this._textField
				.prop( 'autocomplete', 'off' )
				.prop( 'spellcheck', false )
				.attr( 'aria-autocomplete', 'list' )
				.attr( 'aria-haspopup', 'true' );

			// Is there an active panel?
			this._activePanel = this._searchMenu.find('.ipsSideMenu_itemActive').attr('data-ipsMenuValue');
			//this._activePanel = 'core_Members';
		},

		/**
		 * Event handler for the itemClicked event fired by the sideMenu widget
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		changeSection: function (e, data) {
			this._activePanel = data.selectedItemID;
			
			this.scope.find( '[data-ipsMenuValue] [data-role="resultCount"]' ).removeClass('ipsLoading_dark ipsSideMenu_clearCount');
			this.scope.find( '[data-ipsMenuValue="' + data.selectedItemID + '"] [data-role="resultCount"]' ).addClass('ipsLoading_dark');
			
			this._showResultsInPanel( this._activePanel, this._results[ this._activePanel ] );
		},

		/**
		 * Event handler for focusing in the search box
		 * Set a timer going that will watch for value changes. If there's already a value,
		 * we'll show the results immediately
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		fieldFocus: function (e) {
			// Set the timer going
			this._timers.focus = setInterval( _.bind( this._timerFocus, this ), 700 );

			// Show immediately?
			if( this._textField.val() && this._textField.val().length >= 3 ){
				this._showResults();
			}
		},

		/**
		 * Event handler for field blur
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		fieldBlur: function (e) {
			clearInterval( this._timers );
		},

		/**
		 * Event handler for clicking the modal
		 * We have to check this is our modal by comparing IDs. If it is, we close the results.
		 *
		 * @param 	{event} 	e 	Event object 
		 * @returns {void}
		 */
		clickModal: function (e) {
			if( this._modal == null || $( e.currentTarget ).attr('id') != this._modal.attr('id') ){
				return;
			}

			this._hideResults();
		},

		/**
		 * Timer callback from this.fieldFocus
		 * Compares current value to previous value, and shows/loads new results if it's changed
		 *
		 * @returns {void}
		 */
		_timerFocus: function () {
			var currentValue = $.trim( this._textField.val() );

			if( currentValue == this._lastValue || $.trim( this._textField.val().length ) < 3 ){
				return;
			}

			this._lastValue = currentValue;

			this._showResults();
			this._loadResults();
		},

		/**
		 * Hides the results and modal
		 *
		 * @returns {void}
		 */
		_hideResults: function () {
			ips.utils.anim.go( 'fadeOut fast', this._modal );
			ips.utils.anim.go( 'fadeOut', this.scope );
		},

		/**
		 * Shows the results panel and modal, setting the zIndex on them so they stay in order
		 *
		 * @returns {void}
		 */
		_showResults: function () {
			if( !this._modal ){
				this._buildModal();
			}

			// Set new z-indexes to keep everything in order
			this._modal.css( { zIndex: ips.ui.zIndex() } );
			$('#ipsLayout_header').css( { zIndex: ips.ui.zIndex() } );
			this.scope.css( { zIndex: ips.ui.zIndex() } );

			// Show the results and or modal
			if( !this.scope.is(':visible') ){
				ips.utils.anim.go( 'fadeIn fast', this.scope );
			}

			if( !this._modal.is(':visible') ){
				ips.utils.anim.go( 'fadeIn fast', this._modal );
			}
		},

		/**
		 * Load results from the server
		 *
		 * @returns {void}
		 */
		_loadResults: function () {
			var self = this;

			// Abort any requests running now
			if( this._ajax ){
				for( var i = 0; i < this._ajax.length; i++ ) {
					if( _.isFunction( this._ajax[i].abort ) ) {
						this._ajax[i].abort();
					}
				}
			}

			this.scope.find( '[data-ipsMenuValue] [data-role="resultCount"]' ).addClass('ipsLoading ipsPad_top').html('&nbsp;');
			this.scope.find( '[data-ipsMenuValue] [data-role="resultCount"]' ).removeClass('ipsLoading_dark ipsSideMenu_clearCount');
			this.scope.find( '[data-ipsMenuValue].ipsSideMenu_itemActive [data-role="resultCount"]' ).addClass('ipsLoading_dark ipsSideMenu_clearCount');

			var value = $.trim( this._lastValue );

			this.scope.find('[data-ipsMenuValue]').each( function () {
				var tab = this;
				var key = $( this ).attr('data-ipsMenuValue');

				self._setPanelToLoading( key );

				self._ajax[ key ] = ips.getAjax()('?app=core&module=system&controller=livesearch', {
					dataType: 'json',
					data: {
						search_key: key,
						search_term: encodeURI( value )
					}
				}).done( function (response) {
					
					self._results[key] = response;
					
					$( tab )
						.find('[data-role="resultCount"]')
							.removeClass('ipsLoading ipsPad_top ipsLoading_dark ipsSideMenu_clearCount')
							.text( parseInt( response.length ) )
						.end()
						.toggleClass( 'ipsSideMenu_itemDisabled', ( response.length === 0 ) ? true : false );

					if( $( tab ).attr('data-ipsMenuValue') == self._activePanel ){
						self._showResultsInPanel( self._activePanel, response, true );
					}
					
					if( !self._searchMenu.find('[data-ipsMenuValue].ipsSideMenu_itemActive:not( .ipsSideMenu_itemDisabled )').length ) {
						self._selectFirstResultsTab();
					}
					if ( response.length > 0 && key == self._defaultTab ) {
						tab.click();
					}
				}).fail( function (err) {
					// fail gets called when it's aborted, so deliberately do nothing here
				});
			});
		},

		/**
		 * Selects the first section that has some results to show
		 *
		 * @returns {void}
		 */
		_selectFirstResultsTab: function () {
			var first = this._searchMenu.find('[data-ipsMenuValue]:not( .ipsSideMenu_itemDisabled )').first();
			first.click();
		},

		/**
		 * Sets the given panel into loading state
		 *
		 * @returns {void}
		 */
		_setPanelToLoading: function (panel) {
			var panelContainer = this._resultsContainer.find('[data-resultsSection="' + panel + '"]');
			panelContainer.addClass('ipsLoading').find('> ol').hide();
		},

		/**
		 * Shows the results in the relevant panel, building it if it doesn't exist
		 *
		 * @param 	{string}	panel 		Panel ID
		 * @param 	{object}	results 	Results object
		 * @param 	{booolean}	animate		Animate the results being shown?
		 * @returns {void}
		 */
		_showResultsInPanel: function (panel, results, animate) {
						
			// Hide all panels
			this._resultsContainer.find('[data-resultsSection]').hide();

			var panelContainer = this._resultsContainer.find('[data-resultsSection="' + panel + '"]');
			var panelList = panelContainer.find('> ol');

			// Build the container if needed
			if( !panelContainer.length ){
				this._buildResultsContainer( panel );
				panelContainer = this._resultsContainer.find('[data-resultsSection="' + panel + '"]');
				panelList = panelContainer.find('> ol');
			}

			panelContainer.removeClass('ipsLoading');
			panelList.hide().html('');

			// Any results to show?
			if( _.isUndefined( results ) || _.isUndefined( results ) || _.size( results ) == 0 ){
				// No results
				panelList.html( ips.templates.render('core.livesearch.noResults') ).show();
				return;
			}

			// Loop through each result to build it
			_.each( results, function (val) {
				panelList.append( val );
			});

			// Find all results
			var resultItems = panelList.find('[data-role="result"]').hide();
			var delay = 25;

			panelList.show();
			panelContainer.show();

			if( animate == true ){
				resultItems.each( function () {
					var item = $( this );

					setTimeout( function () {
						ips.utils.anim.go( 'fadeIn fast', item );
					}, delay);

					delay += 25;				
				});
			} else {
				resultItems.show();
			}
		},

		/**
		 * Builds a results container
		 *
		 * @param 	{string} 	panel 	Panel ID
		 * @returns {void}
		 */
		_buildResultsContainer: function (panel) {
			this._resultsContainer.append( 
				$('<div/>')
					.attr('data-resultsSection', panel )
					.addClass('ipsScrollbar') 
					.append( $('<ol/>')
								.addClass('ipsList_reset') 
					)
			);
		},

		/**
		 * Builds the modal element
		 *
		 * @returns {void}
		 */
		_buildModal: function () {
			this._modal = ips.ui.getModal();
		}
	});
}(jQuery, _));