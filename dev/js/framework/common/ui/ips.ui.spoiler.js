/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.spoiler.js - Spoiler widget for use in posts
 * Content is hidden until the user elects to view it
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.spoiler', function(){

		/**
		 * Responder for spoiler widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object passed through
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			
			/* Don't do this in the editor */			
			if( elem.parents( '.cke_wysiwyg_div' ).length ){
				return;
			}
			
			/* Hide the contents */
			elem.contents().hide();
			
			/* Do we have an existing citation block? (quotes from older versions won't, newer will) */
			var existingHeader = elem.children('.ipsSpoiler_header');
						
			/* Build the header block */
			var header = ips.templates.render( 'core.editor.spoilerHeader' );
			
			/* Add or replace it */
			if ( existingHeader.length ) {
				existingHeader.replaceWith( header );
			} else {
				elem.prepend( header );
			}
			
			/* Set the event handler for opening/closing */
			elem.find('> .ipsSpoiler_header').on( 'click', _toggleSpoiler );
			
		},
		
		/**
		 * Event handler for toggling the spoiler visibility
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_toggleSpoiler = function (e) {
			var header = $( e.currentTarget );
			var target = $( e.target );
			var spoiler = $( e.target ).closest('[data-ipsSpoiler]');

			if( target.is('a:not( [data-action="toggleSpoiler"] )') || ( target.closest('a').length && !target.closest('a').is('[data-action="toggleSpoiler"]') ) ){
				return;
			}

			e.preventDefault();

			if( header.hasClass('ipsSpoiler_closed') ){
				ips.utils.anim.go( 'fadeIn', header.siblings() );
				header.removeClass('ipsSpoiler_closed').addClass('ipsSpoiler_open').find('span').text( ips.getString('spoilerClickToHide') );
				$( document ).trigger('contentChange', [ spoiler ] );

				// In firefox, the frame will render because we show it for a split second, but the truncating used inside the frame
				// won't work because it isn't visible. So, to get around that, we'll have to refresh the iframe here.
				var iframes = spoiler.find('iframe[data-embedcontent]');

				if( iframes.length ){
					$.each( iframes, function () {
						this.src = this.src;
					});
				}
			} else {
				header.siblings().hide();
				header.removeClass('ipsSpoiler_open').addClass('ipsSpoiler_closed').find('span').text( ips.getString('spoilerClickToReveal') );
			}

			e.stopPropagation();
		};
		
		// Register this widget with ips.ui
		ips.ui.registerWidget( 'spoiler', ips.ui.spoiler );

		return {
			respond: respond
		}
	});
}(jQuery, _));