/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.cookie.js - Cookie management module
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.cookie', function () {

		var _store = {},
			_init = false;

		/**
		 * Initialize cookie module
		 *
		 * @returns 	{void}
		 */
		var init = function () {

			var cookies = _parseCookies( document.cookie.replace(" ", '') ),
				cookieID = ips.getSetting('cookie_prefix') || false;

			$.each( cookies, function (key, cookie) {
				
				if( cookieID ){
					if( key.startsWith( cookieID ) ){
						key = key.replace( cookieID, '' );
						_store[ key ] = unescape( cookie || '' );
					}
				}				
			});

			_init = true;
		},

		/**
		 * Return a cookie value
		 *
		 * @param	{string} 	cookieKey 	Cookie value to get, passed without the prefix
		 * @returns {mixed}		Cookie value or undefined
		 */
		get = function (cookieKey) {
			if( !_init ){
				init();
			}

			if( _store[ cookieKey ] ){
				return _store[ cookieKey ];
			}

			return undefined;
		},

		/**
		 * Set a cookie value
		 *
		 * @param	{string} 	cookieKey 	Key to set
		 * @param 	{mixed} 	value 		Value to set in this cookie
		 * @param 	{boolean} 	sticky 		Whether to make this a long-lasting cookie
		 * @returns {void}
		 */
		set = function( cookieKey, value, sticky ) {

			var expires = '',
				path = '/',
				domain = '',
				ssl = '',
				prefix = '';
			
			if( !cookieKey ){
				return;
			}

			if( !_.isUndefined( sticky ) ){	
				if( sticky === true ){
					expires = "; expires=Wed, 1 Jan 2020 00:00:00 GMT";
				} else if( sticky === -1 ){
					expires = "; expires=Thu, 01-Jan-1970 00:00:01 GMT";
				} else if( sticky.length > 10 ){
					expires = "; expires=" + sticky;
				}
			}

			if( !_.isUndefined( ips.getSetting('cookie_domain') ) && ips.getSetting('cookie_domain') != '' ){
				domain = "; domain=" + ips.getSetting('cookie_domain');
			}

			if( !_.isUndefined( ips.getSetting('cookie_path') ) && ips.getSetting('cookie_path') != '' ){
				path = ips.getSetting('cookie_path');
			}

			if( !_.isUndefined( ips.getSetting('cookie_prefix') ) && ips.getSetting('cookie_prefix') != '' ){
				prefix = ips.getSetting('cookie_prefix');
			}

			if( !_.isUndefined( ips.getSetting('cookie_ssl') ) && ips.getSetting('cookie_ssl') != '' ){
				ssl = '; secure';
			}
			
			document.cookie = prefix + cookieKey + "=" + escape( value ) + "; path=" + path + expires + domain + ssl + ';';

			_store[ cookieKey ] = value;
		},

		/**
		 * Deletes a cookie
		 *
		 * @param	{string} 	cookieKey 	Key to delete
		 * @returns {void}
		 */
		unset = function (cookieKey) {
			if( _store[ cookieKey ] ){
				set( cookieKey, '', -1 );
			}
		},

		/**
		 * Parses the provided string as a query string and returns an object representation
		 *
		 * @param	{string} 	cookieString 	Query string to parse
		 * @returns {object}
		 */
		_parseCookies = function (cookieString) {
			var pairs = cookieString.split(";"),
				cookies = {};
			
			for ( var i=0; i<pairs.length; i++ ){
				var pair = pairs[i].split("=");
				cookies[ $.trim( pair[0] ) ] = $.trim( unescape( pair[1] ) );
			}

			return cookies;
		};

		return {
			init: init,
			get: get,
			set: set,
			unset: unset
		};
	});

}(jQuery, _));