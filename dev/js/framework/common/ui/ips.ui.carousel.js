/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.carousel.js - Carousel widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.carousel', function(){

		var defaults = {
			item: ".ipsCarousel_item",
			shadows: true
		};

		/**
		 * Responder for carousel widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			if( !$( elem ).data('_carousel') ){
				$( elem ).data('_carousel', carouselObj(elem, _.defaults( options, defaults ) ) );
			}
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
		},

		/**
		 * Retrieve the carousel instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The carousel instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_carousel') ){
				return $( elem ).data('_carousel');
			}

			return undefined;
		};

		/**
		 * Carousel instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var carouselObj = function (elem, options) {

			var rtlMode = ( $('html').attr('dir') == 'rtl' );
			var currentItemCount = 0;
			var currentLeftPos = 0;
			var currentFirstItem = null;
			var ui = {};
			var slideshowTimer = null;
			var slideshowTimeout = 4000;

			/**
			 * Sets up this instance
			 *
			 * @returns 	{void}
			 */
			var init = function () {
				currentItemCount = elem.find( options.item );

				ui = {
					itemList: elem.find('[data-role="carouselItems"]'),
					next: elem.find('[data-action="next"]'),
					prev: elem.find('[data-action="prev"]'),
					nextShadow: elem.find('.ipsCarousel_shadowRight'),
					prevShadow: elem.find('.ipsCarousel_shadowLeft')
				};

				if( !options.shadows ){
					ui.nextShadow.hide();
					ui.prevShadow.hide();
				}

				var leftPos = parseInt( ui.itemList.css('left') );

				if( !_.isNaN( leftPos ) ){
					currentLeftPos = leftPos;
				}
				
				_build();
				_checkNav();
				
				/* Rebuild after all the images have been loaded in case we need to adjust the height */
				var images = $(elem).find('img').length;
				$(elem).find('img').load( function(){
					images--;
					if ( !images ) {
						_build();
					}
				} );

				elem.on( 'click', "[data-action='next']", _navNext );
				elem.on( 'click', "[data-action='prev']", _navPrev );
				elem.on( 'contentTruncated', _updateHeight );

				if( options.slideshow ){
					// Start the timer for the slideshow
					slideshowTimer = setTimeout( _slideshowNext, slideshowTimeout );
					
					elem
						.on( 'mouseenter', function () {
							clearTimeout( slideshowTimer );
						})
						.on( 'mouseleave', function () {
							clearTimeout( slideshowTimer );
							slideshowTimer = setTimeout( _slideshowNext, slideshowTimeout );
						});
				}

				$( window ).on( 'resize', _resize );
			},

			/**
			 * Destruct this instance, unregistering event handlers
			 *
			 * @returns 	{void}
			 */
			destruct = function () {
				$( window ).off( 'resize', _resize );
			},

			/**
			 * Build the carousel ui
			 *
			 * @returns 	{void}
			 */
			_build = function () {
				var maxHeight = _getMaxHeight();
				var elemWidth = 0;

				// Set the height of the carousel to be as high as the highest item
				elem.css({
					height: maxHeight + ( parseInt( elem.css('padding-top') ) + parseInt( elem.css('padding-bottom') ) ) + 'px'
				});

				// Are we making the items full width?
				if( options.fullSizeItems ){
					elemWidth = $( elem ).outerWidth( true );
				}

				// Now align all the other items vertically
				elem.find( options.item ).each( function (item) {
					var height = $( this ).outerHeight();
					var diff = maxHeight - height;

					if( options.fullSizeItems ){
						$( this ).css({
							width: elemWidth + 'px'
						});
					}
				});

				currentFirstItem = elem.find( options.item ).first();

				_buildNav();
			},

			/**
			 * When content is truncated, the max height of the items may change, so that
			 * event triggers this method to recalculate the height.
			 *
			 * @returns 	{void}
			 */
			_updateHeight = function () {
				var maxHeight = _getMaxHeight();

				// Set the height of the carousel to be as high as the highest item
				elem.css({
					height: maxHeight + 'px'
				});
			},

			/**
			 * Moves to the next item automatically as part of the slideshow
			 *
			 * @returns 	{void}
			 */
			_slideshowNext = function () {
				// If there's a next or prev button, we know we can call navNext or navPrev. They return a promise
				// so that we can re-set our timer after the animation is finished.
				if( ui.next.not('[data-disabled]').length ){
					_navNext().done( function () {
						slideshowTimer = setTimeout( _slideshowNext, slideshowTimeout );
					});
				} else if( ui.prev.not('[data-disabled]').length ){
					_navPrev( null, true ).done( function () {
						slideshowTimer = setTimeout( _slideshowNext, slideshowTimeout );
					});
				}
			},

			/**
			 * Event handler for the Next button
			 *
			 * @returns 	{object}	Returns promise, resolved after animation finishes
			 */
			_navNext = function (e) {
				if( e ){
					e.preventDefault();
				}

				// Get the first item which isn't completely shown; that will be our next first item
				var items = elem.find( options.item );
				var wrapperWidth = elem.outerWidth();
				var listWidth = _getCurrentWidth();
				var stayOnScreen = currentLeftPos + wrapperWidth;
				var forceNext = false;
				var deferred = $.Deferred();

				var nextFirst = _.find( items, function (item, idx) {
					var edge = $( item ).position().left; // left edge
					var width = $( item ).outerWidth();
					var margin = ( rtlMode ) ? parseInt( $( item ).css('marginLeft') ) : parseInt( $( item ).css('marginRight') );

					if( rtlMode ){
						edge = ui.itemList.outerWidth() - ( edge + width ) - margin; // right edge
					}

					// If we set forceNext = true on the last loop, return the item now.
					if( forceNext ){
						return true;
					}

					// If this is off to the left of the screen, just cancel
					if( edge < currentLeftPos ){
						return false;
					}

					var otherEdge = edge + width;

					// If left + width of this item perfectly equals the width of the wrapper, then the next item
					// to be shown is actually the first one that's offscreen. This also applies if the fullSizeItems
					// option is applied. Set forceNext to true so that on the next iteration we can return the item.
					if( rtlMode ){
						if( stayOnScreen <= ( otherEdge + margin ) ){
							forceNext = true;
							return false;
						}
					} else if( stayOnScreen >= otherEdge && stayOnScreen <= ( otherEdge + margin ) ){
						forceNext = true;
						return false;
					}

					// If the left of this item is on screen and the right isn't, this is our next item to show.
					if( rtlMode ){
						if( edge > stayOnScreen && otherEdge < stayOnScreen ){
							return true;
						}
					} else if( edge < stayOnScreen && otherEdge > stayOnScreen ){
						return true;
					}

					return false;
				});
				
				var nextFirst = $( nextFirst );

				if( !nextFirst.length ){
					Debug.error("nextFirst didn't exist");
					deferred.resolve();
					return deferred.promise();
				}

				var nextFirstPos = nextFirst.position().left;
				var nextFirstMargin = ( rtlMode ) ? parseInt( $( nextFirst ).css('marginLeft') ) : parseInt( $( nextFirst ).css('marginRight') );

				// For RTL we need the right-hand edge
				if( rtlMode ){
					nextFirstPos = ui.itemList.outerWidth() - ( nextFirstPos + nextFirst.outerWidth() ) - nextFirstMargin;
				}

				// If this would leave space at the end of the list, then we'll simply scroll to the end of the list
				// ( listWidth - nextFirstPos ) = What's left of the list to show
				if( ( listWidth - nextFirstPos ) < wrapperWidth ){
					nextFirstPos = listWidth - wrapperWidth;
				}

				currentLeftPos = nextFirstPos;

				// Now animate the list to the new position
				ui.itemList.animate(
					( rtlMode ) ? { right: ( nextFirstPos * -1 ) + 'px' } : { left: ( nextFirstPos * -1 ) + 'px' }
					, 'slow', function () {
					_checkNav();
					deferred.resolve();
				});

				return deferred.promise();
			},

			/**
			 * Event handler for the Prev button
			 *
			 * @returns 	{object} 	Returns promise, resolved after animation finishes
			 */
			_navPrev = function (e, backToBeginning) {
				if( e ){
					e.preventDefault();
				}

				// Get the first item which isn't completely shown; that will be our next first item
				var items = elem.find( options.item ).toArray();
				var wrapperWidth = elem.outerWidth();
				var listWidth = _getCurrentWidth();
				var stayOnScreen = currentLeftPos + wrapperWidth;
				var forcePrev = false;
				var deferred = $.Deferred();

				// We ideal want to scroll back the width of the widget, but not so much that
				// our current left item goes off screen
				var idealLeft = ( currentLeftPos * -1 ) + wrapperWidth;

				// If we need to go back to the bottom, we can shortcut
				if( idealLeft >= 0 || backToBeginning ){
					currentLeftPos = 0;

					ui.itemList.animate(
						( rtlMode ) ? { right: '0px' } : { left: '0px' }
						, 'slow', function () {
						_checkNav();
					});

					deferred.resolve();
					return deferred.promise();
				}

				// We'll go through them from last to first, since we're scrolling backwards
				items.reverse();

				idealLeft = ( idealLeft * -1 ) + wrapperWidth;

				// Now we can find the first item that's fully on screen
				var prevFirst = _.find( items, function (item) {
					var edge = $( item ).position().left;
					var width = $( item ).outerWidth();
					var otherEdge = edge + width;
					var margin = ( rtlMode ) ? parseInt( $( item ).css('marginLeft') ) : parseInt( $( item ).css('marginRight') );

					if( rtlMode ){
						edge = ui.itemList.outerWidth() - ( otherEdge ); // right edge
					}

					// If we set forcePrev = true on the last loop, return the item now.
					if( forcePrev ){
						return true;
					}

					if( edge > idealLeft ){
						return false;
					}

					// If left + width of this item perfectly equals the width of the wrapper, then the next item
					// to be shown is actually the first one that's offscreen. This also applies if the fullSizeItems
					// option is applied. Set forceNext to true so that on the next iteration we can return the item.
					if( stayOnScreen >= otherEdge && stayOnScreen <= ( otherEdge + margin ) ){
						forcePrev = true;
						return false;
					}

					if( otherEdge > idealLeft && edge <= idealLeft ){
						return true;
					}

					return false;
				});

				Debug.log('prev');

				// The method above has given us the first that is *partially* on screen
				// We actually want the next one though so we know it's fully on screen,
				// except on mobile
				prevFirst = $( prevFirst );

				Debug.log( prevFirst );

				if( !ips.utils.responsive.currentIs('phone') && !options.fullSizeItems ){
					prevFirst = $( prevFirst ).next( options.item );	
				}

				currentFirstItem = prevFirst;

				// Set the left position so that prevFirst is still on-screen as the last item
				// E.g.
				// 
				//	Before									After
				//	|5  ][  6  ][  7  ][  8  ][  9  ]|		|[  1  ][  2  ][  3  ][  4  ][  5  ]|
				//
                if( prevFirst.position() != null ) {
                    currentLeftPos = prevFirst.position().left + prevFirst.outerWidth() - wrapperWidth;

                    if( rtlMode ){
                    	var prevFirstMargin = ( rtlMode ) ? parseInt( $( prevFirst ).css('marginLeft') ) : parseInt( $( prevFirst ).css('marginRight') );
						currentLeftPos = ui.itemList.outerWidth() - ( prevFirst.position().left + prevFirst.outerWidth() ) - prevFirstMargin - wrapperWidth; // right edge
					}
                } else {
                    currentLeftPos = prevFirst.outerWidth() + wrapperWidth;
                }
				
				ui.itemList.animate(
					( rtlMode ) ? { right: ( currentLeftPos * -1 ) + 'px' } : { left: ( currentLeftPos * -1 ) + 'px' }
				, 'slow', function () {
					_checkNav();
					deferred.resolve();
				});

				return deferred.promise();
			},

			/**
			 * Returns the height of the tallest item in the carousel currently
			 *
			 * @returns 	{number}
			 */
			_getMaxHeight = function () {
				var items = elem.find( options.item );

				if( !items.length ){
					return 0;
				}

				var max = _.max( items, function (item) {
					var item = $( item );
					return item.outerHeight();
				});

				return $( max ).outerHeight();
			},

			/**
			 * Sshows or hides the navigation elements, depending on current position of the carousel
			 *
			 * @returns 	{void}
			 */
			_checkNav = function () {
				var currentWidth = _getCurrentWidth();

				if( ( currentWidth - currentLeftPos ) <= elem.outerWidth() ){
					ui.next.hide().attr('data-disabled', true);
					if( ui.nextShadow.is(':visible') && options.shadows ){
						ips.utils.anim.go('fadeOut fast', ui.nextShadow );
					}
				} else {
					ui.next.show().removeAttr('data-disabled');
					if( !ui.nextShadow.is(':visible') && options.shadows ){
						ips.utils.anim.go('fadeIn fast', ui.nextShadow );
					}
				}

				if( currentLeftPos <= 0 ){
					ui.prev.hide().attr('data-disabled', true);
					if( ui.prevShadow.is(':visible') && options.shadows ){
						ips.utils.anim.go('fadeOut fast', ui.prevShadow );
					}
				} else {
					ui.prev.show().removeAttr('data-disabled');
					if( !ui.prevShadow.is(':visible') && options.shadows ){
						ips.utils.anim.go('fadeIn fast', ui.prevShadow );
					}
				}
			},

			/**
			 * Returns the current width of all items, including margins
			 *
			 * @returns 	{number}
			 */
			_getCurrentWidth = function () {
				var items = elem.find( options.item );
				var width = 0;

				items.each( function (item) {
					width += $( this ).outerWidth();
					width += parseInt( $( this ).css('margin-left') );
					width += parseInt( $( this ).css('margin-right') );
				});

				return width;
			},

			/** 
			 * Shows the nav items
			 *
			 * @returns {void}
			 */
			_buildNav = function () {
				elem.find('.ipsCarousel_nav').removeClass('ipsHide');
			},

			/** 
			 * EVent handler for window resizing
			 *
			 * @returns {void}
			 */
			_resize = function () {
				// Are we making the items full width?
				if( options.fullSizeItems ){
					var elemWidth = $( elem ).outerWidth( true );

					elem.find( options.item ).each( function (item) {
						$( this ).css({
							width: elemWidth + 'px'
						});
					});
				}
			};

			init();

			return {
				destruct: destruct
			};
		};

		ips.ui.registerWidget( 'carousel', ips.ui.carousel, [ 'showDots', 'fullSizeItems', 'slideshow', 'shadows' ] );

		return {
			respond: respond,
			destruct: destruct
		};
	});
}(jQuery, _));