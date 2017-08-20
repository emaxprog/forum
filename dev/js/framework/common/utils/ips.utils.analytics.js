/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.analytics.js - Analytics helper methods
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.analytics', function () {

		/**
		 * Initialize analytics module
		 *
		 * @returns 	{void}
		 */
		var init = function () {

		},

		trackPageView = function (url) {
			try {
				if( ips.getSetting('analyticsProvider') == 'ga' ){
					if( !_.isUndefined( window.ga ) ){
						var urlObj = ips.utils.url.getURIObject( url || document.location );
						Debug.log("Manual page view tracked with Google Analytics: " + urlObj.relative);
						ga('send', 'pageview', urlObj.relative);
					}
				} else if( ips.getSetting('analyticsProvider') == 'piwik' ){
					if( !_isUndefined( window._paq ) ){
						Debug.log("Manual page view tracked with Piwik");
						_paq.push(['trackPageView']);
					}
				} else if( ips.getSetting('analyticsProvider') == 'custom' && _.isFunction( ips.getSetting('paginateCode') ) ){
					ips.getSetting('paginateCode').call(url);
				}
			} catch (err) {
				Debug.log("Error tracking page view: " + err);
			}
		};

		return {
			init: init,
			trackPageView: trackPageView
		};
	});

}(jQuery, _));