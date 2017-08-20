/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.position.js - Positioning utilities
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.position', function () {

		var theWindow = $( window );

		/**
		 * Returns positioning information for the element
		 *
		 * @param 		{element} 	elem 	The element we're working on
		 * @returns 	{object}
		 */
		var getElemPosition = function (elem) {

			if( !elem ){
				return false;
			}

			var elem = $( elem );
			var props = {};
			var hidden = !elem.is(':visible');
			var opacity = elem.css('opacity');

			// We can only fetch the values we need if the element is visible
			// If it's hidden, make it ever so slightly visible - we'll hide it again later
			if( hidden ){
				elem.css({ opacity: 0.0001 }).show();
			}
			
			var offset = elem.offset();
			var position = elem.position();
			var dims = getElemDims( elem );

			// Absolute position
			props.absPos = {
				left: offset.left,
				top: offset.top,
				right: ( offset.left + dims.outerWidth ),
				bottom: ( offset.top + dims.outerHeight ),
			};

			// Offset position
			props.offsetPos = {
				left: position.left,
				top: position.top,
				right: ( position.left + dims.outerWidth ),
				bottom: ( position.top + dims.outerHeight )
			};

			// Viewport offsets
			// These will be overwritten for fixed elements
			props.viewportOffset = {
				left: offset.left - theWindow.scrollLeft(),
				top: offset.top - theWindow.scrollTop()
			};

			props.offsetParent = elem.offsetParent();

			// Special values if the element is in a fixed container
			props.fixed = ( hasFixedParents( elem, true ) );

			// Re-hide it if necessary
			if( hidden ){
				elem.hide().css({ opacity: opacity });
			}

			return props;
		},

		/**
		 * Figures out the coords to position a popup element appropriately
		 * Abandon hope all ye who enter here
		 *
		 * @param	{object} 	options	 	Options for positioning
		 * @param 	{element}	options.trigger 	The trigger element for this popup
		 * @param	{element}	options.target 		The target element, i.e. the popup itself
		 * @param	{element}	options.targetContainer 	Container element of target, if not body
		 * @param	{boolean}	options.center 		Should the target be centered?
		 * @returns {void}
		 */
		positionElem = function (options) {
			var trigger = $( options.trigger );
			var triggerPos = getElemPosition( trigger );
			var triggerDims = getElemDims( trigger );
			var targetDims = getElemDims( options.target );
			var toReturn = {};
			var stemOffset = options.stemOffset || { top: 0, left: 0 };
			var offsetParent;
			var positioned = false;

			if( options.targetContainer ){
				// If we have any fixed parents, we switch to using the viewport offsets, since that's how
				// fixed elements are measured. For normal absolute/relative positioned parents, use the
				// values from position() instead.
				if( hasFixedParents( trigger ) ){
					offsetParent = triggerPos.viewportOffset;
				} else {
					var containerPos = getElemPosition( options.targetContainer );
					var containerOffset;

					// If the container we're adding to is static, then we'll also need to add its own offset positioning
					// If the container is positioned, we can skip this because the target will be positioned relative to it anyway.
					if( $( options.targetContainer ).css('position') == 'static' ){
						containerOffset = $( options.targetContainer ).position();
					} else {
						containerOffset = { left: 0, top: 0 };
					}

					// Here we work out the difference between the left positions of the trigger and the container to find out
					// how much we need to adjust the position of the target. We add in the offset to account for positioning, as above.
					offsetParent = {
						left: ( triggerPos.absPos.left - containerPos.absPos.left ) + containerOffset.left,
						top: ( triggerPos.absPos.top - containerPos.absPos.top ) + containerOffset.top
					};
				}

				positioned = true;
			} else {
				// Use the body
				offsetParent = triggerPos.viewportOffset;
			}

			// Work out the best fit for the target, trying to keep it from going off-screen
			var bestFit = _getBestFit( triggerPos.viewportOffset, triggerDims,	targetDims, stemOffset, { 
					horizontal: ( options.center ) ? 'center' : 'left',
					vertical: ( options.above === true ) ? 'top' : 'bottom'
				}, !options.above
			);

			// Start to build the return object
			switch( bestFit.horizontal ){
				case 'center':
					toReturn.left = offsetParent.left + ( triggerDims.outerWidth / 2 ) - 
							( targetDims.outerWidth / 2 );
				break;
				case 'left':
					toReturn.left = offsetParent.left - stemOffset.left + ( triggerDims.outerWidth / 2 );
				break;
				case 'right':
					toReturn.left = offsetParent.left - targetDims.outerWidth +
							 ( triggerDims.outerWidth / 2 ) + stemOffset.left;
				break;
			}

			switch( bestFit.vertical ){
				case 'top':
					toReturn.top = offsetParent.top - targetDims.outerHeight + 
										stemOffset.top;
				break;
				case 'bottom':
					toReturn.top = offsetParent.top + triggerDims.outerHeight -
										stemOffset.top;
				break;
			}

			if( !positioned && !triggerPos.fixed ) {
				toReturn.top += theWindow.scrollTop();
			}

			toReturn.fixed = triggerPos.fixed;
			toReturn.location = bestFit;

			return toReturn;
		},

		/**
		 * Returns true if the provided element has any fixed-position ancestors (including tables)
		 *
		 * @param	{element} 	elem	 	Element to test
		 * @returns {boolean}
		 */
		hasFixedParents = function (elem, andSelf) {
			elem = $( elem );
			var fixed = false;
			var parents = elem.parents();

			if( andSelf ){
				parents = parents.addBack();
			}

			parents.each( function () {
				if( this.style.position == 'fixed' ) {//|| $( this ).css('display').startsWith('table') ){
					fixed = true;
				}
			});

			return fixed;
		},

		/**
		 * Works out the best location for an element such that it tries to avoid going off-screen
		 *
		 * @param	{object} 	viewportOffset	 	viewport offset values for the element
		 * @param	{object}	dims 				Dimensions of the element
		 * @returns {object}
		 */
		_getBestFit = function (viewportOffset, triggerDims, targetDims, offset, posDefaults, preferBottom) {
			var	position = _.defaults( posDefaults || {}, { vertical: 'bottom', horizontal: 'left' } );

			// Left pos
			if( position.horizontal == 'center' ){
				var targetLeft = viewportOffset.left + ( triggerDims.outerWidth / 2 ) - ( targetDims.outerWidth / 2 );
				var targetRight = targetLeft + targetDims.outerWidth;

				if( targetLeft < 0 || targetRight > theWindow.width() ){
					position.horizontal = 'left';
				}
			}

			if( position.horizontal == 'left' ){
				if( ( viewportOffset.left + targetDims.outerWidth - offset.left ) > theWindow.width() ){
					position.horizontal = 'right';
				}
			} else if ( position.horizontal == 'right' ) {
				if( ( viewportOffset.right - targetDims.outerWidth + offset.left ) < 0 ){
					position.horizontal = 'left';
				}
			}

			// Top pos
			if( position.vertical == 'top' || preferBottom ){
				if( ( viewportOffset.top - targetDims.outerHeight - offset.top ) < 0 ){
					position.vertical = 'bottom';
				}
			} else {
				if( ( viewportOffset.top + triggerDims.outerHeight + targetDims.outerHeight + offset.top ) > theWindow.height() ){
					position.vertical = 'top';
				}
			}
			
			return position;
		},

		/**
		 * Returns dimensions for the given element
		 *
		 * @param	{element} 	elem	 	Element to test
		 * @returns {object}
		 */
		getElemDims = function (elem) {
			elem = $( elem );

			return {
				width: elem.width(),
				height: elem.height(),
				outerWidth: elem.outerWidth(),
				outerHeight: elem.outerHeight()
			};
		},

		/**
		 * Returns the natural width for an image element
		 *
		 * @param	{element} 	elem	 	Image element to use
		 * @returns {number}
		 */
		naturalWidth = function (elem) {
			return _getNatural( elem, 'Width' );
		},

		/**
		 * Returns the natural height for an image element
		 *
		 * @param	{element} 	elem	 	Image element to use
		 * @returns {number}
		 */
		naturalHeight = function (elem) {
			return _getNatural( elem, 'Height' );
		},

		/**
		 * Attempts to get the line-height of the provided element. Note; there's cases where this won't be reliable.
		 * For example, if CSS styles <span> differently, it may give a value different to the parent. Test your case
		 * before relying on this.
		 *
		 * @param	{element} 	parent	 	Element to fetch the line-height for
		 * @returns {number}
		 */
		lineHeight = function (parent) {
			// Create a little dummy element we can use to sniff the line height
			var newElem = $('<span/>').html('abc').css({
				opacity: 0.1
			});
			parent.append( newElem );

			// Get it then remove the dummy element
			var height = newElem.height();
			newElem.remove();

			return height;
		},

		/**
		 * Returns the given natural dimension of an image, using the built in naturalWidth/Height property if available
		 *
		 * @param	{element} 	elem	 	Element to test
		 * @param 	{string} 	type 		Width or Height; dimension to return
		 * @returns {number}
		 */
		_getNatural = function (elem, type) {
			if( ( 'natural' + type ) in new Image() ){
				return elem[0][ 'natural' + type ];
			} else {
				var img = new Image();
				img.src = elem[0].src;
				return img[ 'natural' + type ];
			}
		};

		return {
			getElemPosition: getElemPosition,
			getElemDims: getElemDims,
			positionElem: positionElem,
			hasFixedParents: hasFixedParents,
			naturalWidth: naturalWidth,
			naturalHeight: naturalHeight,
			lineHeight: lineHeight
		};
	});
}(jQuery, _));
