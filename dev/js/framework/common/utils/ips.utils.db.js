/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.db.js - A module for writing to per-user storage
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.db', function () {

		var enabled = null;
		var sessionStorageSupported = null;

		var init = function (queryString) {
			enabled = isEnabled();
		},		

		/**
		 * Sets a record in storage
		 *
		 * @param	{string} 	type 	 	Category to store in
		 * @param 	{string} 	key 		Key for this value
		 * @param 	{mixed} 	value 		Value to store
		 * @param	{bool}		isPrivate	If TRUE, and the member has not used the "Remember Me" setting to log in, the value will be stored in session storage rather than persistant storage
		 * @returns {void}
		 */
		set = function (type, key, value, isPrivate) {
			if( enabled ){
				var storageEngine = localStorage;
				
				if ( isPrivate && ( !_.isUndefined( ips.getSetting('adsess') ) || ( _.isUndefined( ips.utils.cookie.get('login_key') ) && _.isUndefined( ips.getSetting('cookie_prefix') + ips.utils.cookie.get('login_key') ) ) ) && sessionStorageIsSupported() ) {
					storageEngine = sessionStorage;
				}
				
				if( value ){
					try {
						storageEngine.setItem( type + '.' + key, JSON.stringify( value ) );
					} catch (err) {}
				} else {
					storageEngine.removeItem( type + '.' + key );
				}
			}
		},

		/**
		 * Sets a record in storage
		 * If no key is specified, all items in the category are returned
		 *
		 * @param	{string} 	type 	 	Category to get
		 * @param 	{string} 	[key] 		Key of value to get
		 * @returns {mixed} 	If key is omitted, returns object containing all values, otherwise returns original value
		 */
		get = function (type, key) {
			if( _.isUndefined( key ) ){
				return getByType( type );
			}

			var val = localStorage.getItem( type + '.' + key );
			if ( _.isNull( val ) && sessionStorageIsSupported() ) {
				val = sessionStorage.getItem( type + '.' + key );
			}

			try {
				return JSON.parse( val );
			} catch(err) {
				return val;
			}
		},

		/**
		 * Removes values from storage
		 * If no key is specified, all items in the category are removed
		 *
		 * @param	{string} 	type 	 	Category to remove
		 * @param 	{string} 	[key] 		Key of value to remove
		 * @returns {void, number} 	If key is omitted, returns count of removed items, otherwise returns void
		 */
		remove = function (type, key) {
			if( _.isUndefined( key ) ){
				removeByType( type );
				return;
			}

			localStorage.removeItem( type + '.' + key );
			if ( sessionStorageIsSupported() ) {
				sessionStorage.removeItem( type + '.' + key );
			}
		},

		/**
		 * Returns all values for the given category
		 *
		 * @param	{string} 	type 	 	Category to return
		 * @returns {object} 	Key/value pairs of each value in the category
		 */
		getByType = function (type) {
			try {
				var results = {};
				
				if ( sessionStorageIsSupported() && sessionStorage.length ) {
					for( var key in sessionStorage ){
						if( key.startsWith( type + '.' ) ){
							var actualKey = key.replace( type + '.', '' );
							results[ actualKey ] = get( type, actualKey );
						}
					}
				}
				
				if ( localStorage.length ) {
					for( var key in localStorage ){
						if( key.startsWith( type + '.' ) ){
							var actualKey = key.replace( type + '.', '' );
							results[ actualKey ] = get( type, actualKey );
						}
					}
				}
	
				return results;
			} catch(e) {
				return {};
			}
		},

		/**
		 * Removes all values in the given category
		 *
		 * @param	{string} 	type 	 	Category to return
		 * @returns {number} 	Number of values removed
		 */
		removeByType = function (type) {
			var count = 0;
						
			for( var key in getByType(type) ){
				remove( type, key );
				count++;
			}

			return count;
		},

		/**
		 * Returns boolean indicating if localStorage is available
		 *
		 * @returns {boolean}
		 */
		isEnabled = function () {
			if( !_.isBoolean( enabled ) ){
				try {
					if( 'localStorage' in window && window['localStorage'] !== null && window.JSON ){
						return _testEnabled();
					} else {
						return false;
					}
				} catch (e) {
					return false;
				}
			} else {
				return enabled;
			}
		},

		/**
		 * Tests whether using localstorage will trigger a QuotaExceeded error
		 *
		 * @returns {boolean}
		 */
		_testEnabled = function () {
			try {
				localStorage.setItem('test', 1);
				localStorage.removeItem('test');
			} catch (err) {
				Debug.log("Writing to localstorage failed");
				return false;
			}

			return true;
		},
		
		/**
		 * Returns boolean indicating if sessionStorage is available
		 *
		 * @returns {boolean}
		 */
		sessionStorageIsSupported = function () {
			if( !_.isBoolean( sessionStorageSupported ) ){
				try {
					if( 'sessionStorage' in window && window['sessionStorage'] !== null && window.JSON ){
						sessionStorageSupported = true;
					} else {
						sessionStorageSupported = false;
					}
				} catch (e) {
					sessionStorageSupported = false;
				}
			}
			return sessionStorageSupported;
		};

		init();

		return {
			set: set,
			get: get,
			getByType: getByType,
			remove: remove,
			removeByType: removeByType,
			enabled: enabled,
			isEnabled: isEnabled
		};
	});
}(jQuery, _));