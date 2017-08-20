 /* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.hovercard.js - Hovercard UI component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.hovercard', function(){

		var defaults = {
			timeout: 0.75, // Hovercard timeout, in seconds
			showLoading: true, // Show the loading widget for ajax requests?
			width: 450, // Default width of hovercards
			className: 'ipsHovercard',
			onClick: false,
			target: null,
			cache: true
		};

		// Cache object for URLs
		var cache = {};

		var respond = function (elem, options) {

			if( !$( elem ).data('_hover') ){
				$( elem ).data('_hover', hoverCardObj(elem, _.defaults( options, defaults ) ) );
			}

			if( options.onClick ){
				// We have to remove the click event before reapplying, or multiple events
				// will be trying to open the hovercard
				$( elem ).off('.hovercard').on( 'click.hovercard', function (e) {
					e.preventDefault();
					$( elem ).data('_hover').start();
				});
			} else {
				// Don't show hovercards on small touch devices
				if( ips.utils.events.isTouchDevice() && ( ips.utils.responsive.currentIs('phone') || ips.utils.responsive.currentIs('tablet') ) ){
					return;
				}

				$( elem ).data('_hover').start();
			}			
		},

		/**
		 * Retrieve the hovercard instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The hovercard instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_hover') ){
				return $( elem ).data('_hover');
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
		},

		setCache = function (url, content) {
			cache[ url ] = content;
		},

		unCache = function (url) {
			delete cache[ url ];
		},

		getCache = function (url) {
			return cache[ url ];
		};

		ips.ui.registerWidget('hover', ips.ui.hovercard, 
			[ 'timeout', 'attach', 'content', 'width', 'onClick', 'target', 'cache' ],
			{ lazyLoad: true, lazyEvents: 'mouseover' } 
		);

		return {
			respond: respond,
			destruct: destruct,
			setCache: setCache,
			getCache: getCache
		};
	});


	/**
	 * Hovercard instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var hoverCardObj = function (elem, options) {

		var onTimeout = null, // Reference to our show timeout
			offTimeout = null, // Reference to hide timeout
			ajaxObj, // Ajax object reference
			content, // Content of the hovercard
			target, // The actual element the hovercard is attached to (usually elem)
			loading, // Our loading element
			card, // The hovercard itself
			working = false, // Are we in the middle of setup?
			elemID = '';

		/**
 		 * Sets up this instance
		 * This method does not start showing a hovercard. Call 'start' to do that.
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			elemID = $( elem ).identify().attr('id');
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @returns {void}
		 */
		destruct = function () {
			// Clear mouseout timeouts
			clearTimeout( offTimeout );
			// Remove document click event for hiding
			$( document ).off( 'click.' + elemID );
			// Remove loading widget in case it's there
			_removeLoadingWidget();
			// Delete the card element
			if( card ){
				card.remove();
			}
		},

		/**
		 * Starts the process of building and showing a hovercard
		 * Sets up events and starts a timeout to make sure we should really show it
		 *
		 * @returns 	{void}
		 */
		start = function () {

			// Check we aren't already in setup - prevents double-clicks
			if( working !== false && options.onClick ){
				return;
			}

			working = true;

			// Get the target
			target = ( $( options.attach ).length ) ? $( options.attach ) : $( elem );

			// Clear the timeout for our mouse off event
			clearTimeout( offTimeout );

			if( !options.onClick ){
				// We set a timeout before we do anything, which means we can cancel the event
				// if the user moves a mouse off the target
				onTimeout = setTimeout( _startShow, ( options.timeout * 1000 ) );

				// Set the event handler for when the mouse stops hoving
				$( elem ).off('mouseout.hovercard', _mouseOut).on('mouseout.hovercard', _mouseOut);
				$( elem ).off('mousedown.hovercard', _elemClick).on( 'mousedown.hovercard', _elemClick );
			} else {
				$( document ).off( 'click.' + elemID ).on( 'click.' + elemID, _documentClick );
				_startShow();
			}
		},

		/**
		 * The trigger element was clicked, so we cancel the hovercard showing
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_elemClick = function (e) {
			if( onTimeout ){
				clearTimeout( onTimeout );
			}

			if( offTimeout ){
				clearTimeout( offTimeout );
			}

			if( ajaxObj && _.isFunction( ajaxObj.abort ) ){
				ajaxObj.abort();
			}
			
			_removeLoadingWidget();
			_hideCard();
		},

		/**
		 * Reacts to a click on the document (used for an onclick hovercard)
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_documentClick = function (e) {
			if( !$( card ).is(':visible') ){
				return;
			}

			if( e.target != elem && !$.contains( elem, e.target ) && e.target != card.get(0) && !$.contains( card.get(0), e.target ) ){
				_hideCard();
				$( document ).off( 'click.' + elemID );
			}
		},

		/**
		 * Internal call to fetch content, build, position and show a hovercard
		 *
		 * @returns 	{void}
		 */
		_startShow = function () {

			if( card && card.length && _.isElement( card.get(0) ) ){
				_positionCard();
				working = false;
				return;
			}

			// Determine where content is coming from
			if( options.content && $( options.content ).length ) {
				_buildLocalContent();
				_buildCard();
				_positionCard();

				working = false;
			} else {
				_buildRemoteContent()
					.done( function () {
						_buildCard();
						_positionCard( true );
					})
					.fail( function () {})
					.always( function () {
						working = false;
					});
			}
		},

		/**
		 * Hides the hovercard
		 *
		 * @returns 	{void}
		 */
		_hideCard = function () {
			ips.utils.anim.go( 'fadeOut', card );
		},

		/**
		 * Positions a hovercard relative to the target
		 *
		 * @param 	{boolean} 	showImmediate 	If true, no fade-in animation is used
		 * @returns {void}
		 */
		_positionCard = function ( showImmediate ) {

			if( !card.length ){
				Debug.warn("_positionCard called before a card element exists");
				return;
			}

			if( !target.is(':visible') ){
				Debug.info("Can't show hovercard when target isn't visible");
				return;
			}

			// Reset menu positioning
			card.css({
				left: 'auto',
				top: 'auto',
				position: 'static'
			});

			if( card.attr('data-originalWidth') ){
				card.css({
					width: card.attr('data-originalWidth') + 'px'
				});
			}

			// Figure out where we'll place it
			var elemPos = ips.utils.position.getElemPosition( target );
			var tooWide = false;
			var elemHeight = $( target ).height();
			var elemWidth = $( target ).width();
			var actualWidth = $( card ).width();
			var actualHeight = $( card ).height();
			var win = $( window );
			
			// Set up the data we'll use to position it
			var positionInfo = {
				trigger: elem,
				target: card,
				above: true,
				stemOffset: { left: 20, top: 0 }
			};

			var location = ips.utils.position.positionElem( positionInfo );

			// Position the hovercard with the resulting styles
			card.css({
				left: location.left + 'px',
				top: location.top + 'px',
				position: ( location.fixed ) ? 'fixed' : 'absolute',
				zIndex: ips.ui.zIndex()
			});

			var newElemPosition = ips.utils.position.getElemPosition( card );

			// If the menu is wider than the window, reset some styles
			if( ( actualWidth > $( document ).width() ) || newElemPosition.viewportOffset.left < 0 ){
				options.noStem = true;
				
				card
					.attr( 'data-originalWidth', actualWidth )
					.css({
						left: '10px',
						width: ( $( document ).width() - 20 ) + 'px'
					});

				var newLocation = ips.utils.position.positionElem( positionInfo );

				card.css({
					top: newLocation.top + 'px'
				});
			}

			// Remove old stems
			card.find('.ipsHovercard_stem').remove();

			_.each( ['Top', 'Bottom', 'Left', 'Right'], function (type) {
				card.removeClass( 'ipsHovercard_stem' + type );
			});

			// Build stem
			var stem = $('<span/>').addClass('ipsHovercard_stem');
			card
				.append( stem )
				.addClass( options.className + '_stem' + ( location.location.vertical.charAt(0).toUpperCase() + location.location.vertical.slice(1) ) );

			// If the card is a full-width size, we position the stem to the trigger.
			// Otherwise we just apply a classname
			if( tooWide ){
				stem.css({
					left: ( elemPos.viewportOffset.left - 10 ) + 'px'
				});
			} else {
				card.addClass( options.className + '_stem' + ( location.location.horizontal.charAt(0).toUpperCase() + location.location.horizontal.slice(1) ) );
			}		

			// And now animate in
			if( showImmediate ){
				card.show();
			} else {
				ips.utils.anim.go( 'fadeIn', card );
			}
		},

		/**
		 * Builds the hovercard
		 *
		 * @returns 	{void}
		 */
		_buildCard = function () {

			var cardId = $( elem ).identify().attr('id') + '_hovercard',
				actualWidth = options.width || 300;

			// Build the card wrapper
			card = $('<div/>');

			card
				.attr( { id: cardId } )
				.addClass( options.className )
				.css( {
					width: actualWidth + 'px',
					zIndex: ips.ui.zIndex()
				});

			if( _.isString( content ) ){
				card.append( $('<div/>').html( content ) );
			} else {
				card.append( content.show() );
			}

			// Append to container
			ips.getContainer().append( card );	

			// Watch event handlers
			if( !options.onClick ){
				card
					.on('mouseenter', _cardMouseOver)
					.on('mouseleave', _cardMouseOut);	
			}			

			// Let everyone know
			$( document ).trigger('contentChange', [ card ]);		
		},

		/**
		 * If this card is using local content, we build it here
		 *
		 * @returns 	{void}
		 */
		_buildLocalContent = function () {
			content = $( options.content );
		},

		/**
		 * Fetch remote content based on the target href
		 *
		 * @returns 	{promise}
		 */
		_buildRemoteContent = function () {

			var deferred = $.Deferred();

			if( !elem.href ){
				deferred.reject();
				return deferred.promise();
			}

			if( options.cache && ips.ui.hovercard.getCache( elem.href ) ){
				content = ips.ui.hovercard.getCache( elem.href );
				deferred.resolve();
				return deferred.promise();
			}

			// Show temporary loading thingy
			_buildLoadingWidget();

			// Get our ajax handler
			if ( options.target ) {
				var target = options.target;
			} else {
				var target = elem.href;
			}
			ajaxObj = ips.getAjax()( target )
				.done( function (response) {
					// Set our content
					content = response;
					// Let everyone know
					deferred.resolve();
					// Set a cache for this URL
					if( options.cache ){
						ips.ui.hovercard.setCache( target, content );
					}
				})
				.fail( function (jqXHR, status, errorThrown) {

					if( Debug.isEnabled() ){
						if( status != 'abort' ){
							Debug.error( "Ajax request failed (" + status + "): " + errorThrown );
						} else {
							Debug.warn("Ajax request aborted");
						}

						_removeLoadingWidget();
						deferred.reject();
					} else {
						if( status != 'abort' ){
							content = $('<div/>').addClass('ipsPad_half ipsType_light').html( ips.getString('errorLoadingContent') );
							deferred.resolve();
						} else {
							deferred.reject();
						}						
					}					
				})
				.always( function () {
					_removeLoadingWidget();
				});

			return deferred.promise();
		},

		/**
		 * Builds a little loading hovercard, before we replace it with the full card
		 *
		 * @returns 	{void}
		 */
		_buildLoadingWidget = function () {

			if( !options.showLoading ){
				return;
			}

			// Create loading dom node
			loading = $('<div/>').addClass('ipsHovercard_loading').html( ips.templates.render('core.hovercard.loading') );

			// Add it to our main container
			ips.getContainer().append( loading );

			// Get the dimensions of it
			var loadingDims = { width: loading.width(), height: loading.height() };

			// And hide it
			loading.hide();

			// Get the real position of our target
			var elemPos = ips.utils.position.getElemPosition( target ),
				dimsToUse = ( elemPos.fixed ) ? 'fixedPos' : 'absPos';

			loading.css( {
				left: elemPos[ dimsToUse ].left + 'px',
				top: ( elemPos[ dimsToUse ].top - loadingDims.height - 10 ) + 'px',
				position: ( elemPos.fixed ) ? 'fixed' : 'absolute',
				zIndex: 50000
			});

			ips.utils.anim.go( 'fadeIn', loading );
		},

		/**
		 * Removes the loading hovercard
		 *
		 * @returns 	{promise}
		 */
		_removeLoadingWidget = function () {
			if( loading && loading.length ){
				loading.remove();
			}
		},

		/**
		 * Event handler for mouseout of the target
		 *
		 * @param 	{event} 	e 	The event object
		 * @returns {void}
		 */
		_mouseOut = function () {

			// Stop waiting for this
			clearTimeout( onTimeout );

			// Abort the Ajax request if necessary
			if( ajaxObj ){
				ajaxObj.abort();
			}

			// Remove the loading thingy if it exists
			_removeLoadingWidget();

			if( card && card.is(':visible') ){
				offTimeout = setTimeout( _hideCard, options.timeout * 1000 );
			}

			// Remove mouseout event
			$( elem ).off('.hovercard', _mouseOut);
		},

		/**
		 * Event handler for mouseover of the hovercard
		 *
		 * @param 	{event} 	e 	The event object
		 * @returns {void}
		 */
		_cardMouseOver = function () {
			clearTimeout( offTimeout );
		},

		/**
		 * Event handler for mouseout of the hovercard
		 *
		 * @returns 	{event} 	e 	The event object
		 * @returns 	{void}
		 */
		_cardMouseOut = function () {
			clearTimeout( offTimeout );
			offTimeout = setTimeout( _hideCard, options.timeout * 1000 );
		};

		init();

		return {
			init: init,
			destruct: destruct,
			start: start
		};
	};
}(jQuery, _));