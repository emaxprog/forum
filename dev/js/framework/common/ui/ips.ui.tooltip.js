/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.tooltip.js - Tooltip UI component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.tooltip', function(){

		var _animating = false,
			_tooltip = null,
			_timer = [],
			_currentElem = null;

		/**
		 * Widget responder
		 * Creates the tooltip if it doesn't exist, then gets the content and shows/hides tooltip
		 *
		 * @param 	{element} 	elem		Original element
		 * @param 	{object} 	options		Widget options
		 * @param 	{event} 	e 			Event object
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {

			// Don't show tooltips on touch devices
			if( ips.utils.events.isTouchDevice() ){
				return;
			}
			
			if( !_tooltip ){
				_createTooltipElement();
			}

			var content = _getContent( elem, options );

			if( e.type == 'mouseleave' || e.type == 'blur' || e.type == 'focusout' ){
				_hide();
			} else {
				if( content ){
					_show( elem, options, content );
				}
			}
		},

		/**
		 * Works out the positioning of the tooltip in order to show it
		 *
		 * @param 	{element} 	elem 		Original element
		 * @param 	{object} 	options		Widget options
		 * @param	{string}	content 	Content of tooltip
		 * @returns {void}
		 */
		_show = function (elem, options, content) {

			elem = $( elem );
			
			ips.utils.anim.cancel( _tooltip );

			// Hide the tooltip and update the content
			if( options.safe ){
				_tooltip.hide().html( content );
			} else {
				_tooltip.hide().text( content );
			}

			// Remove the title if any
			if( elem.attr('title') ){
				elem
					.attr( '_title', elem.attr('title') )
					.removeAttr('title');
			}

			// Set up the data we'll use to position it
			var positionInfo = {
				trigger: elem,
				target: _tooltip,
				center: true,
				above: true,
				stemOffset: { left: 10, top: 0 }
			};

			var tooltipPosition = ips.utils.position.positionElem( positionInfo );

			$( _tooltip ).css({
				left: tooltipPosition.left + 'px',
				top: tooltipPosition.top + 'px',
				position: ( tooltipPosition.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});

			if( tooltipPosition.location.vertical == 'top' ){
				_tooltip.addClass('ipsTooltip_top').removeClass('ipsTooltip_bottom');
			} else {
				_tooltip.addClass('ipsTooltip_bottom').removeClass('ipsTooltip_top');
			}

			_tooltip.removeClass('ipsTooltip_left').removeClass('ipsTooltip_right');

			if( tooltipPosition.location.horizontal == 'left' ){
				_tooltip.addClass('ipsTooltip_left');
			} else if( tooltipPosition.location.horizontal == 'right' ){
				_tooltip.addClass('ipsTooltip_right');
			}

			_tooltip.show();
			_currentElem = elem;

			// Set an interval which checks the element is still on the page (useful when a dialog closes, for example)
			_timer.push( setInterval( _checkForElemPresence, 100 ) );

			$( elem ).trigger( 'tooltipShown' );
		},

		/**
		 * Hides the tooltip
		 *
		 * @returns {void}
		 */
		_hide = function () {
			ips.utils.anim.go( 'fadeOut', _tooltip );
			_currentElem = null;

			// Clear out current timers
			if( _timer.length ){
				for( var i = 0; i < _timer.length; i++ ){
					clearInterval( _timer[ i ] );
				}

				_timer = [];
			}
		},

		/**
		 * Checks that an element exists
		 *
		 * @param 	{element} 	elem 	The element to look for
		 * @returns {void}
		 */
		_checkForElemPresence = function (element) {
			if( !_currentElem || !_currentElem.length || !_currentElem.is(':visible') ){
				_hide();
			}
		},

		/**
		 * Figures out which string should form the tooltip text
		 *
		 * @param 	{element} 	elem 		Original element
		 * @param 	{object} 	options		Widget options
		 * @returns {string}
		 */
		_getContent = function (elem, options) {
			elem = $( elem );

			// Option takes priority
			if( options.label ){
				if ( options.json ) {
					return $.parseJSON( options.label ).join("<br>");
				} else {
					return options.label;
				}
			} else if( elem.attr('aria-label') ){
				return elem.attr('aria-label');
			} else if( elem.attr('_title') ){
				return elem.attr('_title');
			} else if( elem.attr('title') ){
				return elem.attr('title');
			}

		},

		/**
		 * Creates the tooltip element from a template
		 *
		 * @returns {void}
		 */
		_createTooltipElement = function () {
			// Build it from a template
			var tooltip = ips.templates.render( 'core.tooltip', {
				id: 'ipsTooltip'
			} );

			// Append to body
			ips.getContainer().append( tooltip );

			_tooltip = $('#ipsTooltip');
		};

		// Register this module as a widget to enable the data API and
		// jQuery plugin functionality
		ips.ui.registerWidget('tooltip', ips.ui.tooltip, 
			['label', 'extraClass', 'safe', 'json' ], 
			{ lazyLoad: true, lazyEvents: 'mouseenter mouseleave focus blur' } 
		);

		return {
			respond: respond
		};
	});
}(jQuery, _));