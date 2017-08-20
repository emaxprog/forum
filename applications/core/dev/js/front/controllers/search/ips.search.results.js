/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.search.results.js - Search results controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.search.results', {

		_resultLength: 300,
		_terms: [],

		initialize: function () {
			this.setup();
			this.on( document, 'contentChange', _.bind( this.contentChange, this ) );
		},

		/**
		 * Setup methods. Adds case-insensitive jQuery expression.
		 *
		 * @param 		{string} 	term 	The word(s) to highlight
		 * @returns 	{void}
		 */
		setup: function () {
			// Add case-insensitive contains expression to jquery
			jQuery.expr[':'].icontains = function(a, i, m) {
			  return jQuery(a).text().toUpperCase()
			      .indexOf(m[3].toUpperCase()) >= 0;
			};

			var self = this;

			try {
				this._terms = JSON.parse( this.scope.attr('data-term') );
			} catch(err) {
				Debug.log("Error parsing search terms");
				return;
			}

			// Process each result
			this.scope.find('[data-role="activityItem"]').each( function () {
				self._processResult( $( this ) );
			});
		},

		/**
		 * Event handler for document content change
		 *
		 * @returns 	{void}
		 */
		contentChange: function () {
			var self = this;

			this.scope.find('[data-role="activityItem"]').each( function () {
				self._processResult( $( this ) );
			});
		},

		/**
		 * Processes the given element as a search result
		 *
		 * @param 		{element} 	result 		The search result element
		 * @returns 	{void}
		 */
		_processResult: function (result) {
			// Don't process it twice
			if( result.attr('data-processed') ){
				return;
			}

			// Start by locating the first hit
			var findWords = result.find('[data-findTerm]');

			if( findWords.length ){
				this._findWords( findWords );
			}

			// Now highlight the terms
			this._highlight( result );

			result.attr('data-processed', true);
		},


		/**
		 * Takes a search result, and finds the match within it and then reduces the text
		 * to just the characters surrounding the match
		 *
		 * @param 		{element} 	result 		The element containing the text to work on
		 * @returns 	{void}
		 */
		_findWords: function (result) {
			var text = $.trim( result.text() );
			var firstMatch = text.length;
			var startPoint = 0;
			var foundMatches = false;

			//-----------
			// Step 1: Find the first occurrence of each term
			for( var i = 0; i < this._terms.length; i++){

				// Note: regexp used here because simple indexOf isn't case insensitive
				// and toLowercase doesn't work well with some languages
				var indexOf = text.search( new RegExp( ips.utils.escapeRegexp( this._terms[i] ), 'i' ) );

				if( indexOf !== -1 ){
					foundMatches = true;

					if( indexOf < firstMatch ){
						firstMatch = indexOf;
					}
				}
			}

			//-----------
			// Step 2: Search backwards to find the closest puncutation mark, which is where we'll start our result snippet
			// We'll go back up to half of our result length, but stop if we hit the beginning
			var punctuationMarks = ['.', ',', '?', '!'];
			var searchBack = ( firstMatch - ( this._resultLength / 2 ) < 0 ) ? 0 : firstMatch - ( this._resultLength / 2 ); 

			// if there were no matches, then we'll just set manual values
			if( !foundMatches ){
				startPoint = 0;
			} else {
				for( var j = firstMatch; j > searchBack; j-- ){
					if( punctuationMarks.indexOf( text[j] ) !== -1 ){
						startPoint = j + 1;
						break;
					}
				}
			}

			//-----------
			// Step 3: Count forward from the starting point to get our snippet
			var finalSnippet = $.trim( text.substring( startPoint, startPoint + 300 ) );

			if( startPoint > 0 && foundMatches ){
				finalSnippet = '...' + finalSnippet;
			}

			if( startPoint + this._resultLength < text.length || ( !foundMatches && text.length > this._resultLength ) ){
				finalSnippet = finalSnippet + '...';
			}

			result.text( finalSnippet );
		},

		/**
		 * Highlight search results
		 *
		 * @param 		{string} 	term 	The word(s) to highlight
		 * @returns 	{void}
		 */
		_highlight: function (result) {
			// Find the elements we're searching in
			var self = this;
			var elements = result.find('[data-searchable]');

			_.each( this._terms, function (term, index) {
				elements.each( function () {
					if( !$( this ).is(':icontains("' + term + '")' ) ){
						return;
					}
					
					$( this ).contents().filter(
						function() { return this.nodeType === 3 }
					).each( function(){
						$( this ).replaceWith( _.escape( XRegExp.replace( $( this ).text(), new RegExp( "(\\b|\\s|^)(" + term + ")(\\b|\\s|$)", "ig" ), '<mark class="ipsMatch' + ( index + 1 ) + '">' + "$2 " + '</mark>' ) ).replace( new RegExp("&lt;mark class=&quot;ipsMatch" + ( index + 1 ) + "&quot;&gt;", 'ig'), "<mark class='ipsMatch" + ( index + 1 ) + "'>" ).replace( new RegExp("&lt;/mark&gt;", 'ig'), "</mark>" ) );
					} );
				});
			});
		}
	});
}(jQuery, _));