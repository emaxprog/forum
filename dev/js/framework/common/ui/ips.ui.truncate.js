/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.truncate.js - Text truncating widget
 * Either removes text to make it fit (with dotdotdot.js), or hides the overflow with a 'show more' link
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.truncate', function(){

		var defaults = {
			type: 'remove', // Type of truncating: 'remove' cuts off text, 'hide' hides it
			size: 100, // Size the box should be, in px, lines or a selector for an element to fix inside
			expandText: ips.getString('show_more'),
			watch: true
		};

		var respond = function (elem, options) {
			if( options.type == 'remove' ){
				_removeTruncate( elem, _.defaults( options, defaults ) );
			} else {
				_hideTruncate( elem, _.defaults( options, defaults ) );
			}
		},

		/**
		 * Truncates content by removing text
		 *
		 * @param	{elem} 		elem 		The element containing text being truncated
		 * @param	{object} 	options 	The options passed into this widget
		 * @returns {void}
		 */
		_removeTruncate = function (elem, options) {		
			//First reduce to first paragraph only if this is post content
			if(elem.children().first().prop('tagName') == 'P') {
				elem.html( elem.children().first().html() );
			}
			
			// Use dotdotdot
			var size = _getSizeValue( options.size, elem );			
			var clampTo = ( size.lines ) ? size.lines : size.pixels + 'px';

			elem.dotdotdot({
				height: size.pixels,
				watch: options.watch
			});

			elem.trigger( 'contentTruncated', {
				type: 'remove'
			});
		},

		/**
		 * Truncates content by hiding text
		 *
		 * @param	{elem} 		elem 		The element containing text being truncated
		 * @param	{object} 	options 	The options passed into this widget
		 * @returns {void}
		 */
		_hideTruncate = function (elem, options) {
			var size = _getSizeValue( options.size, elem );
			var originalSize = elem.outerHeight();
			var originalPos = $( elem ).css('position');

			// If we're smaller than the specified size anyway, just return
			if( originalSize <= size.pixels ){
				Debug.log('Smaller than the specified size, finishing...');
				return;
			}

			// If the elem isn't positioned, set it to relative
			if( originalPos == 'static' ){
				$( elem ).css( 'position', 'relative' );
			}

			// Set the size of the element
			$( elem )
				.css( {
					height: size.pixels + 'px'
				})
				.addClass('ipsTruncate');

			// Build the template
			var showMore = ips.templates.render( 'core.truncate.expand', {
				text: options.expandText
			});

			$( elem ).after( showMore );

			var expander = elem.next("[data-action='expandTruncate']");

			elem.trigger( 'contentTruncated', {
				type: 'hide'
			});

			// Hook up event
			expander.on('click', function (e) {
				// We need to recalculate the height here, because the content height may have
				// changeed since iniialization (e.g. for spoilers).
				elem.css({ height: 'auto' });
				var newOriginalSize = elem.outerHeight();
				elem.css({ height: size.pixels + 'px' });

				ips.utils.anim.go( 'fadeOutDown fast', expander )
					.done( function () {
						expander.remove();
					});

				if( newOriginalSize > size.pixels ){
					$( elem ).animate( { height: newOriginalSize + 'px' }, function () {
						$( this ).css( {
							'position': originalPos,
							'height': 'auto'
						} );

						$( elem ).trigger( 'truncateExpanded' );
					});
				}				
			});
		},

		/**
		 * Works out the size that we're going to truncate to in the relevant format
		 *
		 * @param	{mixed} 	value 		The value, as a selector, lines or pixel
		 * @param	{element} 	elem 		The element being truncated
		 * @returns {object}	Object of sizes, with 'lines' and/or 'pixels' keys
		 */
		_getSizeValue = function (value, elem) {
			// See if it's a selector to start with
			try {
				if( $( value ).length ){
					return { pixels: $( value ).first().outerHeight() };
				}
			} catch( err ) {}
			
			if( String(value).indexOf('lines') !== -1 ){
				// Still here? OK, see if it's lines
				var lines = parseInt( value.replace('lines', '') );
				var number = lines * _getLineHeight( elem );

				return { lines: lines, pixels: number };
			} else {
				// Assume it's pixels if all else fails
				return { pixels: parseInt( value ) };
			}
		},

		/**
		 * Returns the line-height of the element
		 *
		 * @param	{elem} 		elem 		The element
		 * @returns {number}
		 */
		_getLineHeight = function (elem) {
			var lH = $( elem ).css('line-height');
			return parseInt( lH );
		};

		ips.ui.registerWidget( 'truncate', ips.ui.truncate,
			['type', 'size', 'expandText', 'watch']
		);

		return {
			respond: respond
		};
	});
}(jQuery, _));