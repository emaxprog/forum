/* global ips, _ */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.filterBar.js - Filter bar widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.filterBar', function(){

		var defaults = {
			on: 'phone,tablet',
			viewDefault: 'filterContent'
		};

		/**
		 * Respond to a menu trigger being clicked
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			if( !$( elem ).data('_filterBar') ){
				$( elem ).data('_filterBar', filterBarObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the filterBar instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The filterBar instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_filterBar') ){
				return $( elem ).data('_filterBar');
			}

			return undefined;
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		};

		ips.ui.registerWidget( 'filterBar', ips.ui.filterBar, [ 'on', 'viewDefault' ] );

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});

	/**
	 * Filter bar instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var filterBarObj = function (elem, options) {

		var filterBar = null;
		var filterContent = null;
		var workOn = [];
		var currentBreak;
		var currentlyShowing = null;

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			if( !ips.utils.responsive.enabled() ){
				return;
			}

			filterBar = elem.find('[data-role="filterBar"]');
			filterContent = elem.find('[data-role="filterContent"]');
			workOn = options.on.split(',');
			currentBreak = ips.utils.responsive.getCurrentKey();

			// Document events
			$( document ).on( 'breakpointChange', _breakpointChange );

			// Widget events
			elem
				.on( 'switchTo.filterBar', function (e, data) {
					// Make sure we're in a breakpoint we're working with
					if( _.indexOf( workOn, ips.utils.responsive.getCurrentKey() ) === -1 ){
						return;
					}
					
					_switchView( data.switchTo );
				})
				.on( 'click', '[data-action="filterBarSwitch"]', _switchToggle );


			if( _.indexOf( workOn, currentBreak ) !== -1 ){
				_setUpBar();
			}					
		},

		/**
		 * Destruct the instance
		 *
		 * @returns {void}
		 */
		destruct = function () {
			$( document ).off( 'breakpointChange', _breakpointChange );
		},

		/**
		 * Sets up the filter bar on widget initialization
		 *
		 * @returns 	{void}
		 */
		_setUpBar = function () {
			if( options.viewDefault == 'filterBar' ){
				filterContent.addClass('ipsHide');
				currentlyShowing = 'filterBar';
			} else {
				filterBar.addClass('ipsHide');
				currentlyShowing = 'filterContent';
			}
		},

		/**
		 * A manual toggle by the user (e.g. clicking a link)
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		_switchToggle = function (e) {
			e.preventDefault();

			// Make sure we're in a breakpoint we're working with
			if( _.indexOf( workOn, ips.utils.responsive.getCurrentKey() ) === -1 ){
				return;
			}

			_switchView( $( e.currentTarget ).attr('data-switchTo') == 'filterBar' ? 'filterBar' : 'filterContent' );
		},

		/**
		 * Toggles the current view from filters to content or vice-versa
		 *
		 * @param 		{string} 	switchTo 	The view to switch to (filterBar or filterContent)
		 * @returns 	{void}
		 */
		_switchView = function (switchTo) {
			if( switchTo == currentlyShowing ){
				return;
			}

			// Set the height of the container
			elem.css({
				height: ( currentlyShowing == 'filterBar' ) ? filterBar.outerHeight() : filterContent.outerHeight() + 'px'
			});

			// Add the class that sets each column to absolute
			filterBar.addClass('ipsFilter_layout');
			filterContent.addClass('ipsFilter_layout');

			// Function to run when we've finished animating
			var done = function () {
				filterBar.removeClass('ipsFilter_layout');
				filterContent.removeClass('ipsFilter_layout');

				elem.css({
					height: 'auto'
				});

				currentlyShowing = switchTo;
			};

			// Set up and animate each column
			if( switchTo == 'filterBar' ){
				filterBar
					.css({ left: '-100%' })
					.removeClass('ipsHide')
					.animate({ left: '0%' }, {
						duration: 300
					});

				filterContent
					.css({ left: '0%' })
					.animate({ left: '100%'	}, {
						duration: 300,
						complete: function () {
							$( this ).addClass('ipsHide')
							done();
						}
					});
			} else {
				filterBar
					.css({ left: '0%' })
					.animate({ left: '-100%' }, {
						duration: 300,
						complete: function () {
							$( this ).addClass('ipsHide')
							done();
						}
					});

				filterContent
					.css({ left: '100%' })
					.removeClass('ipsHide')
					.animate({ left: '0%' }, {
						duration: 300
					});
			}
		},

		/**
		 * Cancels the widget from operating, cleaning up classes and positioning
		 *
		 * @returns 	{void}
		 */
		_cancel = function () {
			elem.find('[data-role="filterBar"], [data-role="filterContent"]' )
				.removeClass('ipsFilter_layout')
				.css({
					left: 'auto'
				})
				.removeClass('ipsHide');

			elem.css({
				height: 'auto'
			});

			currentlyShowing = null;
		},

		/**
		 * Event handler for the responsive breakpoint changing
		 *
		 * @returns 	{void}
		 */
		_breakpointChange = function (e, data) {
			currentBreak = data.curBreakName;

			if( _.indexOf( workOn, currentBreak ) !== -1 ){
				_switchView( options.viewDefault );
			} else {
				_cancel();
			}
		};

		init();

		return {
			init: init,
			destruct: destruct
		};
	};
}(jQuery, _));