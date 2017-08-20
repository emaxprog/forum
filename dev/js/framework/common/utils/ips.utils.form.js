/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.form.js - Form utilities
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.form', function () {

		/**
		 * Serialize a jquery object as an object of values
		 *
		 * @returns object
		 */
		var serializeAsObject = function (jQueryObj, customSerializers) {
			var asArray = jQueryObj.serializeArray();
			var output = {};

			_.each( asArray, function (val) {
				var outValue = val.value;

				// Do we have a custom serializer function for this field?
				if( customSerializers && !_.isUndefined( customSerializers[ val.name ] ) && _.isFunction( customSerializers[ val.name ] ) ){
					outValue = customSerializers[ val.name ]( val.name, val.value );
				} 

				var keys = _splitFieldName( val.name );
				_addValueToKey( output, keys, outValue );
			});

			return output;
		};

		/**
		 * Splits a field name into an array of keys
		 * e.e. key[subkey][subsubkey] becomes ['key', 'subkey', 'subsubkey']
		 *
		 * @returns 	{array}
		 */
		var _splitFieldName = function (name) {
			var parts = name.split('[');

			parts = _.map( parts, function (part) {
				return part.replace(/\]/g, '')
			});

			if( parts[0] === '' ){
				parts.shift(); 
			}

			return parts;
		},

		/**
		 * Takes an array of keys (from _splitFieldName) and creates the deep array in 
		 * output with the specified value
		 *
		 * @returns 	{void}
		 */
		_addValueToKey = function (output, keys, value) {
			if( !_.isObject( output ) ){
				output = {};
			}

			var currentPath = output;

			if( _.isArray( keys ) ){
				for( var i = 0; i < keys.length; i++ ){
					if( _.isUndefined( currentPath[ keys[i] ] ) ){
						currentPath[ keys[i] ] = ( i == keys.length - 1 ) ? value : {};
					}
					currentPath = currentPath[ keys[i] ];
				}
			} else {
				output[ keys ] = value;
			}
		};

		return {
			serializeAsObject: serializeAsObject		
		};
	});
}(jQuery, _));