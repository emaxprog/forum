/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.url.js - A module for getting query params from the URL
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.url', function () {

		var _skipped = ['s'],
			_store = {},
			_origin;

		var init = function (queryString) {

		},

		/**
		 * Returns the requested parameter from the URL
		 *
		 * @param 	{string} 	name 	Parameter to return
		 * @param 	{string} 	[url] 	Url to parse (uses current url if none specified)
		 * @returns {string}
		 */
		getParam = function (name, url) {
			/*Debug.log( 'getParam:' + parseUri( url || window.location.href ).queryKey[ name ] );
			Debug.log( 'getParam params: ');
			Debug.log( parseUri( url || window.location.href ) );
			Debug.log( 'href: ' + window.location.href );*/
			return parseUri( url || window.location.href ).queryKey[ name ];
		},

		/**
		 * Returns the parsed URL object from parseUri
		 *
		 * @param 	{string} 	[url] 	Url to parse (uses current url if none specified)
		 * @returns {string}
		 */
		getURIObject = function (url) {
			return parseUri( url || window.location.href );
		},

		/**
		 * Returns an origin for use in window.postMessage
		 *
		 * @returns {string}
		 */
		getOrigin = function () {
			if( !_origin ){
				var url = getURIObject();
				_origin = url.protocol + '://' + url.host + ( ( url.port !== '' ) ? ':' + url.port : '' );	
			}
			
			return _origin;
		};

		// parseUri 1.2.2
		// (c) Steven Levithan <stevenlevithan.com>
		// MIT License

		function parseUri (str) {
			var	o   = parseUri.options,
				m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
				uri = {},
				i   = 14;

			while (i--) uri[o.key[i]] = m[i] || "";

			uri[o.q.name] = {};
			uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
				if ($1) uri[o.q.name][$1] = $2;
			});

			return uri;
		};

		parseUri.options = {
			strictMode: false,
			key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
			q:   {
				name:   "queryKey",
				parser: /(?:^|&)([^&=]*)=?([^&]*)/g
			},
			parser: {
				strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
				loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
			}
		};
	
		return {
			getParam: getParam,
			getURIObject: getURIObject,
			getOrigin: getOrigin
		};
	});
}(jQuery, _));