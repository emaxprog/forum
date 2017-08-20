/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.customtags.js - Controller for inserting custom tags into textareas - custom tags are defined by data-textareacustomtag attributes on elements.
 *
 * Author: Rikki Tissier & Brandon Farber
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('textarea.customtags', {

		initialize: function () {
			this.on( 'click', '[data-textareacustomtag]', this.insertTag );
		},

		/**
		 * Event handler for inserting custom tags defined on the page
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		insertTag: function (e) {
			console.log( 'Inserting custom tag: ' + $( e.currentTarget ).attr('data-textareacustomtag') );

			$( '#' + this.scope.data('textareaid') ).focus();
			$( '#' + this.scope.data('textareaid') ).insertText( $( e.currentTarget ).attr('data-textareacustomtag'),
				$( '#' + this.scope.data('textareaid') ).getSelection().start,
				"collapseToEnd" );
		}
	});
}(jQuery, _));