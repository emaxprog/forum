/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.sticky.js - A component that enables elements to be 'sticky'
 * A sticky element sits in place until it's about to scroll offscreen, at which
 * point it sticks to the top of the screen, making it always visible.
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.sticky', function(){

		// Default widget options
		var defaults = {
			stickyClass: 'ipsSticky',
			stickTo: 'top',
			spacing: 0,
			disableIn: 'phone'
		};

		/**
		 * Responder for sticky widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			$( elem ).data( '_sticky', stickyObj(elem, _.defaults( options, defaults ) ) );
		},

		/**
		 * Retrieve the sticky element instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The sticky element instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_sticky') ){
				return $( elem ).data('_sticky');
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

		// Register this widget with ips.ui
		ips.ui.registerWidget( 'sticky', ips.ui.sticky, [ 
			'stickyClass', 'relativeTo', 'spacing', 'stickTo', 'width', 'disableIn'
		]);

		/**
		 * Sticky instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var stickyObj = function (elem, options) {

			var relativeTo,
				originalStyles = {},
				originalOffsetTop,
				status,
				dummyElem,
				locked = false;

			/**
			 * Initialization
			 *
			 * @returns {void}
			 */
			var _init = function () {

				if( !$( elem ).is(':visible') ){
					Debug.warn("Can't set up a sticky element if the element is hidden when init is called.");
					return;
				}

				// Set scroll & resize event
				$( document )
					.on( 'scroll', _scrollDocument )
					.on( 'breakpointChange', _breakpointChange );

				$( window ).on( 'resize', _windowResize );

				// Sort out the parent wrapper
				relativeTo = options.relativeTo ? $( options.relativeTo ) : false;
				
				// Disable in breakpoints
				if( options.disableIn ){
					options.disableIn = _.map( options.disableIn.split(','), function (item) {
						return $.trim( item )
					});
				}

				// Remember the original styles
				originalStyles = {
					top: $( elem ).css('top'),
					bottom: $( elem ).css('bottom'),
					position: $( elem ).css('position'),
					width: $( elem ).get(0).style.width
				};

				status = 'normal';

				originalOffsetTop = $( elem ).offset().top;

				// Trigger now too
				_scrollDocument();

				$( elem ).trigger('stickyInit', {
					id: $( elem ).identify().attr('id'),
					status: status
				});
			},

			/**
			 * Destruct this widget on this element
			 *
			 * @returns {void}
			 */
			destruct = function () {
				$( document )
					.off( 'scroll', _scrollDocument )
					.off( 'breakpointChange', _breakpointChange );

				$( window ).off( 'resize', _windowResize );
			},

			/**
			 * Event handler for responsive breakpoint changes
			 * If the current breakpoint is included in the 'disableIn' option, then
			 * we reset the element to 'normal', and set locked to true, which will prevent
			 * fixed mode from being enabled. We unset locked if in an acceptable breakpoint.
			 *
			 * @returns {void}
			 */
			_breakpointChange = function (e, data) {
				if( !ips.utils.responsive.enabled ){
					return;
				}

				if( _.indexOf( options.disableIn, data.curBreakName ) !== -1 ){
					_makeNormal();
					locked = true;
				} else {
					locked = false;
				}
			},

			/**
			 * Event handler for window resizing
			 *
			 * @returns {void}
			 */
			_windowResize = function () {
				// This is expensive, but it's the easiest way to stop the element 'falling out' of its
				// wrapper when the window resizes.
				// If the window is resized, we have to remove the fixed positioning, calculate the new top
				// position, then call our method to see if it should return to being fixed.					
				_makeNormal();
				originalOffsetTop = $( elem ).offset().top;
				_scrollDocument();
			},

			/**
			 * Event handler for document scrolling
			 *
			 * @returns {void}
			 */
			_scrollDocument = function () {
				var bodyScroll = $( document ).scrollTop();
				var elemSize = $( elem ).outerHeight();
				var originalBottom = originalOffsetTop + elemSize;
				var wrapperSize = $( elem ).outerHeight();
				var viewportHeight = $( window ).height();

				if( _.indexOf( options.disableIn, ips.utils.responsive.getCurrentKey() ) !== -1 ){
					_makeNormal();
					locked = true;
				} else {
					locked = false;
				}
				
				if( options.stickTo == 'bottom' ){
					// If the bottom of the element is offscreen, and the status hasn't already been changed,
					// set it to fixed. Otherwise, it should be set to normal.
					if( ( ( viewportHeight + bodyScroll ) <= ( originalBottom + options.spacing ) ) &&
							status == 'normal' ){
						_makeFixed();
					} else if( ( ( viewportHeight + bodyScroll ) >= ( originalBottom + options.spacing ) ) &&
							status == 'fixed' ){
						_makeNormal();
					}
				} else {

					// If the top of our element goes off the screen and we're currently 'normal', then
					// set the element to fixed
					if( bodyScroll >= ( originalOffsetTop - options.spacing ) ){

						// If we're working relative to a parent, and the sticky element would go outside the bounds
						// of the parent, then we'll keep it fixed but adjust the top so it stays inside.
						if( relativeTo ){
							var relativeHeight = relativeTo.height();
							var relativePosition = relativeTo.offset();

							if( ( options.spacing + elemSize ) > ( relativePosition.top + relativeHeight - bodyScroll ) ){
								_makeFixed( -( ( elemSize ) - ( relativePosition.top + relativeHeight - bodyScroll ) ) );
							} else if( status == 'normal' ){
								_makeFixed();
							}

						} else if( status == 'normal' ) {
							_makeFixed();
						}
					} else if( bodyScroll <= ( originalOffsetTop - options.spacing ) ){
						if( status == 'fixed' ){
							_makeNormal();	
						}					
					}
				}
			},

			/**
			 * Puts the element into 'fixed' mode at the top
			 *
			 * @returns {void}
			 */
			_makeFixed = function (offset) {

				if( locked ){
					return;
				}

				var width;

				if( !dummyElem && !relativeTo ){
					_makeDummyElem();
				}

				// If we're already fixed, we might just be changing the offset - short circuit if so
				if( status == 'fixed' && !_.isUndefined( offset ) ){
					$( elem ).css( {
						top: ( offset ) + 'px'
					});

					$('#ipsStickySpacer').remove();
					return;
				}

				var bottomSpacing = $( document ).height() - $( window ).height() - $( document ).scrollTop() - 10;

				// Do we need to add bottom spacing too?
				// THis is needed for edge cases. If the sticky header is, say, 100px high, but when we reach it
				// there's only 80px of scroll left on the document, the header will constantly pop in and out of fixed
				// positioning. To get around this, we can add a spacer to the end of the document, allowing sufficient scrolling
				// space for the document.
				if( options.stickTo == 'top' && bottomSpacing < $( elem ).outerHeight() ){
					_makeBottomSpacer( bottomSpacing );
				}
				
				// Figure out what width we should set the element to
				if( options.width && ( options.width.indexOf('#') === 0 || options.width.indexOf('.') === 0 ) ){
					width = $( options.width ).first().outerWidth();
				} else if( options.width ){
					width = parseInt( options.width );
				} else {
					//width = originalStyles.width;
					width = $( elem ).css('width');
				}

				$( elem )
					.css( {
						position: 'fixed',
						width: width,
						zIndex: ips.ui.zIndex()
					})
					.addClass( options.stickyClass );

				// Fix the element in position, to the correct browser side
				if( options.stickTo == 'bottom' ){
					$( elem )
						.css( { bottom: options.spacing + 'px' } )
						.addClass( options.stickyClass + '_bottom');
				} else {
					$( elem )
						.css( { top: options.spacing + 'px' } )
						.addClass( options.stickyClass + '_top');
				}

				if( !relativeTo ){
					dummyElem
						.css( {
							width: $( elem ).width(),
							height: $( elem ).outerHeight()
						})
						.show();	
				}			

				status = 'fixed';

				$( elem ).trigger( 'stickyStatusChange.sticky', {
					status: 'fixed'
				});
			},

			/**
			 * Returns the element to 'normal' mode
			 *
			 * @returns {void}
			 */
			_makeNormal = function () {
				$( elem )
					.css( {
						position: originalStyles.position,
						width: originalStyles.width
					})
					.removeClass( options.stickyClass )
					.removeClass( options.stickyClass + '_top' )
					
				// Reset the value we set earlier
				if( options.stickTo == 'bottom' ){
					$( elem )
						.css( { bottom: originalStyles.bottom } )
						.removeClass( options.stickyClass + '_bottom' );
				} else {
					$( elem )
						.css( { top: originalStyles.bottom } )
						.removeClass( options.stickyClass + '_top' );
				}	

				if( dummyElem ){
					dummyElem.hide();
				}

				_makeBottomSpacer( 0 );

				status = 'normal';

				$( elem ).trigger( 'stickyStatusChange.sticky', {
					status: 'normal'
				});
			},

			/**
			 * Builds a dummy element which will take up the space of the main element, when
			 * the main element is in 'fixed' mode
			 *
			 * @returns {void}
			 */
			_makeDummyElem = function () {
				dummyElem = $('<div/>')
					.insertBefore( elem )
					.hide();
			},

			/**
			 * Adds an element to the bottom of the document which acts as a spacer allowing proper scrolling
			 *
			 * @param 	{number} 	size 	Size the spacer should be
			 * @returns {void}
			 */
			_makeBottomSpacer = function (size) {
				if( !$('#ipsStickySpacer').length ){
					$('<div/>').attr('id', 'ipsStickySpacer').insertAfter( elem );
				}

				$('#ipsStickySpacer').css({
					height: ( size + 10 ) + 'px'
				});
			};

			_init();

			return {
				destruct: destruct
			};
		};

		return {
			respond: respond,
			destruct: destruct
		};
	});
}(jQuery, _));