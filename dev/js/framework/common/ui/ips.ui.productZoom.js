/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.productZoom.js - Enables viewing an image in detail
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.productZoom', function(){

		var defaults = {};

		var respond = function (elem, options) {
			if( !$( elem ).data('_productZoom') ){
				$( elem ).data('_productZoom', productZoomObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		ips.ui.registerWidget('productZoom', ips.ui.productZoom, 
			[ 'largeURL' ]
		);

		return {
			respond: respond
		};
	});

	/**
	 * productZoom instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var productZoomObj = function (elem, options) {

		var initialized = false,
			wrapper = null,
			imageElem = null,
			zoomArea = null,
			currentlyOver = false,
			ratio = 0,
			zoomerSize = 0,
			thumbW = 0,
			thumbH = 0,
			wrapperW = 0,
			wrapperH = 0,
			fullW = 0,
			fullH = 0,
			triggerBuffer = 25,
			disabled = false;

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			elem.on( 'mouseenter', _enterElem );
			elem.on( 'mouseleave', _leaveElem );
			elem.on( 'mousemove', _moveElem );
		},

		/**
		 * Event handler for mouse entering the thumb elem
		 * Sets up the zoomer if it isnt already, and shows it
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_enterElem = function (e) {
			if( disabled ){
				return;
			}

			currentlyOver = true;

			if( !initialized ){
				_setUpZoomer();
				return;
			}

			if( _checkAcceptableSize() ){
				disabled = true;
				return;
			}

			_showZoomer();
		},

		/**
		 * Event handler for mouse leaving the thumb elem
		 * Hides the zoomer widget
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_leaveElem = function (e) {
			if( disabled ){
				return;
			}

			currentlyOver = false;

			wrapper.fadeOut('fast');
			zoomArea.hide();
		},

		/**
		 * Event handler for mouse moving over the thumb elem
		 * Moves the two zoomer elements based on the current mouse cursor position
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_moveElem = function (e) {
			if( !initialized || !currentlyOver || disabled ){
				return;
			}

			var cursorPos = _cursorPos(e);
			var halfZoomer = ( zoomerSize / 2 );
			var halfWrapper = wrapper.width() / 2;
			var tLeft = 0; var tTop = 0;
			var fLeft = 0; var fTop = 0;

			// Put zoomer in middle of cursor
			if( cursorPos.left - halfZoomer < 0 ){
				tLeft = 0;
			} else if( cursorPos.left + halfZoomer > thumbW ){
				tLeft = thumbW - zoomerSize;
			} else {
				tLeft = cursorPos.left - halfZoomer;
			}

			if( cursorPos.top - halfZoomer < 0 ){
				tTop = 0;
			} else if( cursorPos.top + halfZoomer > thumbH ){
				tTop = thumbH - zoomerSize;
			} else {
				tTop = cursorPos.top - halfZoomer;
			}

			zoomArea.css({
				left: tLeft + 'px',
				top: tTop + 'px'
			});

			var reciprocal = 1 / ratio;

			// Get ratio of position
			var cursorPosLarge = {
				left: cursorPos.left * reciprocal,
				top: cursorPos.top * reciprocal
			};

			// Now position large image in the same way
			if( cursorPosLarge.left - halfWrapper < 0 ){
				fLeft = 0;
			} else if( cursorPosLarge.left + halfWrapper > fullW ){
				fLeft = fullW - wrapperW;
			} else {
				fLeft = cursorPosLarge.left - halfWrapper;
			}
			
			if( cursorPosLarge.top - halfWrapper < 0 ){
				fTop = 0;
			} else if( cursorPosLarge.top + halfWrapper > fullH ){
				fTop = fullH - wrapperH;
			} else {
				fTop = cursorPosLarge.top - halfWrapper;
			}

			imageElem.css({
				left: ( fLeft * -1 ) + 'px',
				top: ( fTop * -1 ) + 'px',
			});
		},

		/**
		 * Called when the large image has finished loading
		 *
		 * @returns {void}
		 */
		_imageLoaded = function () {
			wrapper.removeClass('ipsLoading');

			if( currentlyOver ){
				_showZoomer();
			}
		},

		/**
		 * Shows the zoomer widget
		 *
		 * @returns {void}
		 */
		_showZoomer = function () {
			wrapper.show();
			zoomArea.show();

			// Get dims of the various elems
			thumbW = elem.width();
			thumbH = elem.height();
			//--
			wrapperW = wrapper.width();
			wrapperH = wrapper.height();
			//--
			fullW = imageElem.width();
			fullH = imageElem.height();
			//--

			if( !_checkAcceptableSize() ){
				disabled = true;
				wrapper.hide();
				zoomArea.hide();
				return;
			}

			ratio = thumbW / fullW;

			wrapper.css({
				opacity: 1
			});

			zoomArea.css({
				width: ( thumbW * ratio ) + 'px',
				height: ( thumbW * ratio ) + 'px',
			});

			zoomerSize = zoomArea.width();
		},

		/**
		 * Sets up the zoomer widget, creating the elements needed
		 *
		 * @returns {void}
		 */
		_setUpZoomer = function () {
			$('#ipsZoomer, #ipsZoomer_area').remove();

			var elemPosition = ips.utils.position.getElemPosition( elem );
			var elemSize = ips.utils.position.getElemDims( elem );
			var imgURL = ( options.largeURL ) ? options.largeURL : elem.find('img').attr('src');

			wrapper = $('<div/>').attr( 'id', 'ipsZoomer' );
			zoomArea = $('<div/>').attr('id', 'ipsZoomer_area').hide();
			imageElem = $('<img/>').attr( 'src', imgURL ).css({ position: 'absolute' });

			$('body').append( wrapper.append( imageElem ) );
			
			elem.append( zoomArea ).css({
				position: 'relative'
			});

			wrapper
				.css({
					opacity: 0.0001,
					width: elemSize.outerHeight + 'px',
					height: elemSize.outerHeight + 'px',
					left: elemPosition.absPos.left + elemSize.outerWidth + 20 + 'px',
					top: elemPosition.absPos.top + 'px',
					zIndex: ips.ui.zIndex()
				})
				.addClass('ipsLoading');

			imageElem.imagesLoaded( _imageLoaded );

			initialized = true;		
		},

		/**
		 * Checks whether we should show the zoomer for this image
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_checkAcceptableSize = function () {
			if( ( fullW - triggerBuffer ) <= wrapper.width() || ( fullH - triggerBuffer ) <= wrapper.height() ){
				return false;
			}

			return true;
		},

		/**
		 * Returns the cursor position relative to the thumbnail
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_cursorPos = function (e) {
			var offset = elem.offset();

			return {
				left: e.pageX - offset.left,
				top: e.pageY - offset.top
			};
		};

		init();

		return {};
	};

}(jQuery, _));