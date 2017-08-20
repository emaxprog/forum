/* global ips, _ */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.flashMsg.js - Flash message widget
 * Creates a flash message - a box used for communicating quick messages to the user such as 'success' text.
 *
 * Although this widget can be initialized on an element with the data api, it will primarily be
 * called programatically:
 *
 * ips.ui.flashMsg.show('text');
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.flashMsg', function(){

		var _queue = [],
			_doneInit = false,
			_box,
			_content,
			_isShowing = false,
			_currentDismissHandler = null;

		var defaults = {
			timeout: 2,
			extraClasses: '',
			location: 'top',
			sticky: false
		};

		/**
		 * Responder for flash card widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object passed through
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			if( options.text ){
				show( options.text, options );
			}
		},

		/**
		 * Check the URL and cookie for any flash card we might need to show
		 *
		 * @returns {void}
		 */
		init = function () {
			$( document ).ready( function () {
				if( $('body').attr('data-message') ){
					show( _.escape( $('body').attr('data-message') ) );
				}
								
				if( ips.utils.url.getParam('flmsg') ){
					show( _.escape( decodeURIComponent( ips.utils.url.getParam('flmsg') ) ) );
				}

				if( ips.utils.cookie.get('flmsg') ){
					show( _.escape( ips.utils.cookie.get('flmsg') ) );
					ips.utils.cookie.unset('flmsg');
				}
			});

			$( document ).on( 'closeFlashMsg.flashMsg', hide );
		},

		/**
		 * Shows the flash message
		 *
		 * @param	{string} 	message 	The flash message
		 * @param	{object} 	options 	Options for showing this flash message
		 * @returns {void}
		 */
		show = function (message, options, update) {
			if( !_doneInit ){
				_initElement();
			}

			options = _.defaults( options || {}, defaults );

			// If there's already a message showing, add to the queue
			if( _isShowing && !update ){
				_queue.push( [ message, options ] );
				return;
			}

			// If we're updating the current flash message and already showing...
			if( update && _isShowing ){
				_content.html( message );
				ips.utils.anim.go( 'pulseOnce', _box );

				if( !options.sticky ){
					setTimeout( hide, options.timeout * 1000 );
				}

				return;
			}

			_currentDismissHandler = null;
			_isShowing = true;
			_content.html( message );

			_box
				.css({ zIndex: ips.ui.zIndex() })
				.attr( 'class', '' ) // Reset classes
				.addClass( options.extraClasses )
				.addClass( options.dismissable ? 'ipsFlashMsg_dismissable' : '' )
				.addClass( options.position == 'bottom' ? 'ipsFlashMsg_bottom' : 'ipsFlashMsg_top' )
				.on( 'click', 'a:not( [data-action="dismissFlashMessage"] )', function () {
					hide();
				})
				.animationComplete( function () {
					if ( !options.sticky ) {
						setTimeout( hide, options.timeout * 1000 );
					}
				});

			// Any close handlers?
			if( _.isFunction( options.dismissable ) ){
				_currentDismissHandler = options.dismissable;
			}

			ips.utils.anim.go( 'fadeInDown', _box );
		},

		/**
		 * Hides the flash message
		 *
		 * @param	{string} 	message 	The flash message
		 * @param	{object} 	options 	Options for showing this flash message
		 * @returns {void}
		 */
		hide = function () {
			if( _queue.length ){
				var next = _queue.shift();
				show( next[0], next[1], true );
			} else {
				_box
					.animationComplete( function () {
						_isShowing = false;
						_box.hide();

						if( _queue.length ){
							var next = _queue.shift();
							show( next[0], next[1] );
						}
					});

				ips.utils.anim.go('fadeOutDown', _box);
			}
		},

		dismiss = function (e) {
			e.preventDefault();
			hide();

			if( _.isFunction( _currentDismissHandler ) ){
				_currentDismissHandler();
				_currentDismissHandler = null;
			}
		},

		/**
		 * Initialize the element used for the flash message
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object passed through
		 * @returns {void}
		 */
		_initElement = function () {
			// Create element
			$('body').append( ips.templates.render("core.general.flashMsg") );

			// Find the box, then find the content element (which might be the same one)
			_box = $('#elFlashMessage').hide();
			_content = ( _box.is('[data-role="flashMessage"]') ) ? _box : _box.find('[data-role="flashMessage"]');

			// Dismiss event
			_box.on( 'click', 'a[data-action="dismissFlashMessage"]', dismiss );

			_doneInit = true;
		};

		// Register this widget with ips.ui
		ips.ui.registerWidget('flashMsg', ips.ui.flashMsg,
			['text', 'extraClasses', 'timeout', 'position', 'sticky', 'dismissable' ]
		);

		init();

		return {
			respond: respond,
			show: show
		};
	});
}(jQuery, _));