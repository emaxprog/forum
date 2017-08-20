/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.tabbar.js - A tab bar UI component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.tabbar', function(){

		// Default widget options
		var defaults = {
			itemSelector: '.ipsTabs_item', // The CSS selector used to find clickable tab items
			activeClass: 'ipsTabs_activeItem', // Classname applied to the active item
			loadingClass: 'ipsLoading ipsTabs_loadingContent', // Classname applied to loading panel
			panelClass: 'ipsTabs_panel', // Classname applied to panels
			panelPrefix: 'ipsTabs',
			updateURL: true, // Whether the browser URL should be updated when tab is switched
			updateTitle: false, // Whether the browser title should also be updated, when updateURL is true
			disableNav: false // Disables fancy tab loading functionality. Ideal for using this widget just for the mobile tab menu.
		};

		/**
		 * Responder for tab widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			$( elem ).data('_tabbar', tabBarObj(elem, _.defaults( options, defaults ) ) );
		};

		// Register this widget with ips.ui
		ips.ui.registerWidget('tabbar', ips.ui.tabbar, [ 
			'contentArea', 'itemSelector', 'activeClass', 'loadingClass', 'disableNav',
			'panelClass', 'updateURL', 'updateTitle', 'panelPrefix', 'defaultTab'
		]);

		return {
			respond: respond
		};
	});
	
	/**
	 * Tab Bar instance
	 * Handles events and logic for a single tab bar instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var tabBarObj = function (elem, options) {
				
		var rawElem = elem.get(0), //Non-jQuery element
			barId = rawElem.id, // ID of this tab bar
			tabs = $( elem ).find( options.itemSelector ),	// Collection of the tabs in this bar
			active,	// The active tab
			ajaxObj, // Reference to the ajax object we use
			loadPanel; // Reference to our loading panel

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {

			if( !barId ){
				barId = $( rawElem ).identify().attr('id');
			}
			
			if( !options.contentArea || !$( options.contentArea ).length ) {
				options.contentArea = '#' + $( rawElem ).next().identify().attr('id');
			}

			if( !tabs.length ){
				Debug.warn( "No tabs found in tab bar" + barId );
				return;
			}

			// Find our active tab
			active = _getActiveTab();

			// And do we need to enable it?
			_initializeActive();

			// Finally set the event handlers
			$( elem ).on( 'click', options.itemSelector, _handleTabClick );
			$( elem ).on( 'click', "[data-action='expandTabs']", _expandMenu );
		},

		/**
		 * Event handler for a tab click
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		_handleTabClick = function (e) {

			// If we aren't handling any navigation here, then let the browser handle it
			if( options.disableNav ){
				return;
			}

			e.preventDefault();

			_tabClickPhone( e );

			// Is this tab active?
			if( $( this ).hasClass( options.activeClass ) ){
				return;
			}

			var thisId = $( this ).identify().attr('id'),
				thisContent = $( '#' + options.panelPrefix + '_' + barId + '_' + thisId + '_panel' );

			// Does this tab content area exist already?
			if( !thisContent.length ) {
				thisContent = _createTabPanel( thisId );
				// Load content
				_loadContent( this, thisContent )
					.done( function () {
						_switchTab( thisId );
					})
					.fail( function () {
						Debug.log('failed');
					});
			} else {
				_hideAllPanels();
				_switchTab( thisId );				
			}

			// Update URL if necessary
			_updateURL( thisId );
		},

		/**
		 * Shows the phone-accessible tab menu
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		_expandMenu = function (e) {
			e.preventDefault();
				
			if( $( elem ).find( options.itemSelector ).length > 1 ){
				if( $( elem ).hasClass('ipsTabs_showMenu') ){
					$( elem ).removeClass('ipsTabs_showMenu');
				} else {
					$( elem ).addClass('ipsTabs_showMenu');
				}	
			}			
		},

		/**
		 * Clicked on a tab on the phone menu
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		_tabClickPhone = function (e) {
			$( elem ).removeClass('ipsTabs_showMenu');
		},

		/**
		 * Switches to the specified tab
		 *
		 * @param	{string} 	tabId 		ID of the tab to make active
		 * @param 	{boolean} 	immediate	Show immediately, rather than fading in?
		 * @returns {void}
		 */
		_switchTab = function (tabId, immediate) {

			// Hide all panels
			_hideAllPanels();

			// Get the new panel
			var thisContent = $( '#' + options.panelPrefix + '_' + barId + '_' + tabId + '_panel' );

			// Animate it
			if( !immediate ){
				ips.utils.anim.go( 'fadeIn', thisContent ).done( function () {
					thisContent.attr( 'aria-hidden', 'false' );

					$( elem ).trigger('tabShown', {
						barID: barId,
						tabID: tabId,
						tab: active,
						panel: thisContent
					});

					// Let everyone know
					$( document ).trigger( 'contentChange', [ thisContent ] );
				});
			} else {
				thisContent.show().attr( 'aria-hidden', 'false' );

				$( elem ).trigger('tabShown', {
					barID: barId,
					tabID: tabId,
					tab: active,
					panel: thisContent
				});

				// Let everyone know
				$( document ).trigger( 'contentChange', [ thisContent ] );
			}

			// Set as active
			active = $( '#' + tabId );

			// Switch tab
			_makeTabActive( active );

			// Let document know
			$( elem ).trigger('tabChanged', {
				barID: barId,
				tabID: tabId,
				tab: active,
				panel: thisContent
			});
		},

		/**
		 * Updates the browser URL
		 *
		 * @param	{string} 	tabId 	ID of the tab to make active
		 * @returns {void}
		 */
		_updateURL = function (tabId) {
			if( !options.updateURL ){
				return;
			}

			var href = $( '#' + tabId ).attr('href'),
				title = ( options.updateTitle && $( '#' + tabId ).attr('title') ) ? $( '#' + tabId ).attr('title') : document.title;

			if( !_.isEmpty( href ) && !href.startsWith('#') ){
				// Replace state
				History.replaceState( {}, title, href );
				// Track page view
				ips.utils.analytics.trackPageView( href );
			}
		},

		/**
		 * Determines which tab is 'active'
		 *
		 * @returns 	{element}	The tab deemed to be 'active'
		 */
		_getActiveTab = function () {

			// Try css class first
			var activeTab = elem.find( '.' + options.activeClass );
			
			if( activeTab.length ){
				return activeTab.get(0);
			}

			// Next see if a default is specified
			if( options.defaultTab && $( elem ).find( options.defaultTab ) ){
				return $( elem ).find( options.defaultTab ).get(0);
			}

			// Finally just return the first tab
			return $( elem ).find( options.itemSelector ).first();
		},

		/**
		 * Initializes the tab that is first to be active
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		_initializeActive = function () {			
			// Do we have an active panel?
			var activeId = $( active ).identify().attr('id');

			if( !$( '#' + options.panelPrefix + '_' + barId + '_' + activeId + '_panel' ).length ){
				if( $( options.contentArea ).children().length ){
					// We have content in the content area, so make that this panel
					$( options.contentArea ).wrapInner( _createTabPanel( activeId, true ) );
					_switchTab( activeId, true );
				} else {
					// Load content
					var newPanel = _createTabPanel( activeId );
					_loadContent( active, newPanel ).done( function () {
						_switchTab( activeId );
					});
				}
			} else {
				_switchTab( activeId, true );
			}
		},

		/**
		 * Makes a tab active and other tabs inactive
		 *
		 * @param 	{element} 	activeTab 	Reference to the tab to make active
		 * @returns {void}
		 */
		_makeTabActive = function (activeTab) {

			// Unselect all tabs
			$( elem )
				.find( options.itemSelector )
				.removeClass( options.activeClass )
				.removeAttr( 'aria-selected' );

			// Select the new tab
			$( activeTab )
				.addClass( options.activeClass )
				.attr( 'aria-selected', 'true' );
		},

		/**
		 * Loads and inserts content via ajax
		 *
		 * @param	{element} 	tab 		The tab element being loaded
		 * @param	{element} 	container 	The container panel for the content
		 * @returns {promise} 	Promise object
		 */
		_loadContent = function (tab, container) {
			var deferred = $.Deferred();

			// Hide all other panels before we start
			_hideAllPanels();

			// Which URL should we load?
			if( $( tab ).attr('data-tabURL') ){
				var url = $( tab ).attr('data-tabURL');
			} else {
				var url = $( tab ).attr('href');
			}

			// Set loading class
			$( options.contentArea ).addClass( options.loadingClass );

			// Get ajax object
			ajaxObj = ips.getAjax();
			
			ajaxObj( url )
				.done( function (response) {
					container.html( response );

					// Let everyone know
					//$( document ).trigger( 'contentChange', [ container ] );

					// Resolve promise so callbacks can execute
					deferred.resolve();
				})
				.fail( function (jqXHR, status, errorThrown) {
					window.location = $( tab ).attr('href');
				})
				.always( function () {
					$( options.contentArea ).removeClass( options.loadingClass );
				});

			return deferred.promise();
		},

		/**
		 * Hides all tab panels
		 * @returns 	{element} 	The new panel
		 */
		_hideAllPanels = function () {
			$( options.contentArea )
				.find( '.' + options.panelClass )
				.hide()
				.attr('aria-hidden', 'true');
		},

		/**
		 * Creates an empty panel for the specific tab
		 *
		 * @param	{string} 	tabId 		Tab ID from which the panel is being created
		 * @returns {element} 	The new panel
		 */
		_createTabPanel = function (tabId, noAppend) {

			var newPanel = $('<div/>')
					.attr( { 'id': options.panelPrefix + '_' + barId + '_' + tabId + '_panel' } )
					.addClass( options.panelClass )
					.attr( { 'aria-labelledby': tabId } );

			if( !noAppend ){
				$( options.contentArea ).append( newPanel );
			}

			return newPanel;
		};

		init();

		return {
			init: init
		}
	};

}(jQuery, _));