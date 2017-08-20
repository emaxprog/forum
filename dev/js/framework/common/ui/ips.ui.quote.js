/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.quote.js - Quote widget, builds the citations for quotes in content
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.quote', function(){

		var defaults = {
			timestamp: '',
			userid: 0,
			username: '',
			contenttype: '',
			contentclass: '',
			contentid: 0
		};

		/**
		 * Respond method for quotes.
		 * Builds the quote HTML using the options passed into the widget and inserts it into the content post
		 *
		 * @param 	{element}	elem 		The quote element
		 * @param	{object} 	options	 	Options for this quote
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			
			/* Don't rebuild if we've already done this */			
			if( elem.data('quoteBuilt') || elem.parents( '.cke_wysiwyg_div' ).length ){
				return;
			}
			
			/* Do we have an existing citation block? (quotes from older versions won't, newer will) */
			var existingCitation = elem.children('.ipsQuote_citation');
			
			/* What should the citation say? */
			var citation = ips.utils.getCitation( options, true, existingCitation.length ? existingCitation.text() : ips.getString('editorQuote') );
			
			/* Build the citation block */
			var data = {
				citation: citation,
				contenturl: options.contentid && options.contentcommentid ? ips.getSetting('baseURL') + "?app=core&module=system&controller=content&do=find&content_class=" + options.contentclass + "&content_id=" + options.contentid + "&content_commentid=" + options.contentcommentid : ''
			};
			var citation = ips.templates.render( 'core.editor.citation', data );
			
			/* Add or replace it */
			if ( existingCitation.length ) {
				existingCitation.replaceWith( citation );
			} else {
				elem.prepend( citation );
			}
			
			/* Set the event handler for opening/closing */
			elem.find('> .ipsQuote_citation').on( 'click', _toggleQuote );
			elem.find('.ipsQuote_contents').addClass('ipsClearfix');
			
			/* Hide embedded quotes */
			if( elem.is('blockquote.ipsQuote > blockquote.ipsQuote') ){
				elem
					.find('> *:not( .ipsQuote_citation )')
						.hide()
					.end()
					.find('> .ipsQuote_citation')
						.removeClass('ipsQuote_open')
						.addClass('ipsQuote_closed');					
			}
			
			/* And save that we've done this */
			elem.trigger('quoteBuilt.quote');
			elem.data( 'quoteBuilt', true );
		},
		
		/**
		 * Event handler for toggling the quote visibility
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_toggleQuote = function (e) {
			var cite = $( e.currentTarget );
			var target = $( e.target );

			if( target.is('a:not( [data-action="toggleQuote"] )') || ( target.closest('a').length && !target.closest('a').is('[data-action="toggleQuote"]') ) ){
				return;
			}

			e.preventDefault();

			if( cite.hasClass('ipsQuote_closed') ){
				ips.utils.anim.go( 'fadeIn', cite.siblings() );
				cite.removeClass('ipsQuote_closed').addClass('ipsQuote_open');
			} else {
				cite.siblings().hide();
				cite.removeClass('ipsQuote_open').addClass('ipsQuote_closed');
			}

			e.stopPropagation();
		};

		ips.ui.registerWidget('quote', ips.ui.quote, 
			[ 'timestamp', 'userid', 'username', 'contentapp', 'contenttype', 'contentclass', 'contentid', 'contentcommentid' ]
		);

		return {
			respond: respond
		};
	});
}(jQuery, _));
