/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.topic.view.js - Topic view controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('forums.front.topic.view', {

		initialize: function () {
			$( document ).on( 'replyToTopic', _.bind( this.replyToTopic, this ) );
		},

		/**
		 * Triggers the initialize event on the editor
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		replyToTopic: function (e) {
			var editorID = this.scope.find('[data-role="replyArea"] [data-role="contentEditor"]').attr('name');

			if( editorID ){
				this.trigger('initializeEditor', { editorID: editorID } );
			}
		}
	});
}(jQuery, _));