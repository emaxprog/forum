/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.sharelink.js - Controller to launch link in small window
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.sharelink', {

		/**
		 * Initialize the events that this controller will respond to
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			this.on( 'click', '[data-role="shareLink"]', this.launchWindow );
		},
		
		/**
		 * Filter click
		 *	
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		launchWindow: function(e) {
			e.preventDefault();
			var url = $( e.currentTarget ).attr('href');
			if ( !ips.utils.url.getParam( 'url', url ) )
			{
				url += "&url=" + encodeURIComponent( location.href );
			}
			if ( !ips.utils.url.getParam( 'title', url ) )
			{
				url += "&title=" + encodeURIComponent( document.title );
			}
			
			window.open( url, 'delicious','toolbar=no,width=550,height=550' );
		},
	});
}(jQuery, _));