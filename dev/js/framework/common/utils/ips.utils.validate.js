/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.validate.js - A library for validating values
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.validate', function (options) {

		/**
		 * Format object - checks data in a field matches a particular regex format
		 */
		var formats = {
			email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))){2,6}$/i,
			url: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/,
			alphanum: /^\w+$/,
			integer: /^\d+$/,
			number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/,
			creditcard: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
			hex: /^[0-9a-f]+$/i
		};

		/**
		 * Validators object - methods run to check a field meets conditions
		 */
		var validators = {
			maxlength: function (val, max) {
				return val.length <= max;
			},

			minlength: function (val, min) {
				return val.length >= min;
			},

			rangelength: function (val, min, max) {
				return validators.maxlength( val, max ) && validators.minlength( val, min );
			},

			min: function (val, min) {
				return Number( val ) >= min;
			},

			max: function (val, max) {
				return Number( val ) <= max;
			},

			range: function (val, min, max) {
				return validators.min( val, min ) && validators.max( val, max );
			},

			required: function (val) {
				return val.length > 0
			},

			regex: function (val, regex) {
				return new RegExp( regex ).test( val );
			},

			format: function (val, format) {
				return new RegExp( formats[ format ] ).test( val );
			},

			remote: function (val, url) {
				var deferred = $.Deferred();

				ips.getAjax()( url, {
					dataType: 'json',
					data: {
						input: encodeURI( val )
					}
				})
					.done( function (response) {
						if( response.result == 'ok' ){
							deferred.resolve();
						} else {
							deferred.reject( response.message || null );
						}
					})
					.fail( function (jqHXR, textStatus) {
						deferred.reject( textStatus );
					});

				return deferred.promise();
			}
		};

		// Setters
		/**
		 * Adds a custom format
		 *
		 * @param	{string} 	name 		Identifying name for this format
		 * @param	{regexp} 	format 		The format, as a regexp literal
		 * @returns {void}
		 */
		var addFormat = function (name, format) {
			formats[ name ] = format;
		},

		/**
		 * Adds a custom validator
		 *
		 * @param	{string} 	name 		Identifying name for this validator
		 * @param	{function} 	fn 			Function called when this validator is used
		 * @returns {void}
		 */
		addValidator = function (name, fn) {
			validators[ name ] = fn;
		};

		// Shortcut methods for individual validators/formats
		/**
		 * Checks whether the value is a valid URL
		 *
		 * @param	{string} 	url 		The URL to validate
		 * @returns {boolean}
		 */
		var isUrl = function (url) {
			return validators.regex( url, formats.url );
		},

		/**
		 * Checks whether the value is an allowed URL
		 *
		 * @param	{string} 	url 		The URL to validate
		 * @returns {boolean}
		 */
		isAllowedUrl = function (url) {
			var returnValue;
			returnValue	= true;

			if( ips.getSetting('blacklist') )
			{
				for( var i in ips.getSetting('blacklist') )
				{
					var blacklistUrl = ips.getSetting('blacklist')[i];
					blacklistUrl	= escapeRegExp( blacklistUrl );
					blacklistUrl	= blacklistUrl.replace( /\\\*/g, '(.+?)' );

					var index		= url.search( new RegExp( blacklistUrl, 'ig' ) );

					if( index >= 0 )
					{
						returnValue	= false;
						break;
					}
				}
			}

			if( ips.getSetting('whitelist') )
			{
				returnValue	= false;

				for( var i in ips.getSetting('whitelist') )
				{
					var whitelistUrl = ips.getSetting('whitelist')[i];
					whitelistUrl	= escapeRegExp( whitelistUrl );
					whitelistUrl	= whitelistUrl.replace( /\\\*/g, '(.+?)' );

					var index		= url.search( new RegExp( whitelistUrl, 'ig' ) );

					if( index >= 0 )
					{
						returnValue	= true;
						break;
					}
				}
			}

			return returnValue;
		},

		/**
		 * Checks whether the value is a valid email address
		 *
		 * @param	{string} 	email 		The email address to validate
		 * @returns {boolean}
		 */
		isEmail = function (email) {
			return validators.regex( email, formats.email );
		};

		/**
		 * Main validation method
		 * Combines provided conditions with HTML5 conditions gleaned from the element. Checks each condition
		 * by executing the relevant validators.
		 *
		 * @param	{element} 	field 			The element being validated
		 * @param	{object} 	conditions 		Object of conditions/values to use when validating
		 * @param 	{boolean} 	ignoreHTML5		Ignore the HTML5 validation properties?
		 * @returns {object}	
		 */
		var validate = function (field, conditions, ignoreHTML5) {
			if( !ignoreHTML5 ){
				conditions = _.extend( _getAutomaticConditions( field ), conditions || {} );
			}

			if( !_.size( conditions ) ){
				return true;
			}

			// Now work through each condition
			var validated = true;
			var messages = [];

			for( var i in conditions ) {
				if( !_.isFunction( validators[ i ] ) ){
					continue;
				}

				var value = field.val();
				var args = [];

				if( _.isObject( conditions[ i ] ) ){
					args = _.values( conditions[ i ] )
					args.splice( 0, 1 );
				} else {
					args = [ conditions[ i ] ];
				}

				args.unshift( value );

				if( validators[ i ].apply( this, args ) !== true ) {
					validated = false;
					messages.push( {
						condition: i,
						message: _getMessage( i, args )
					});
				}
			}

			return {
				result: validated,
				messages: messages
			}
		},

		/**
		 * Returns the parsed error message for the given validator type
		 *
		 * @param	{string} 	type 		The validator type
		 * @param	{object} 	args 		The values originally passed into the validator
		 * @returns {string}
		 */
		_getMessage = function (type, args) {
			return ips.pluralize( ips.getString( 'validation_' + type, { data: args } ), [ ( ( type == 'rangelength' ) ? args[2] : args[1] ) ] );
		},

		/**
		 * Builds an object of conditions for an element based on HTML5 attributes (e.g. required)
		 *
		 * @param	{element} 	field 		The element being validated
		 * @returns {object}
		 */
		_getAutomaticConditions = function (field) {
			var conditions = {};

			if( field.is('[required]') ){
				conditions.required = true;
			}

			if( field.is('input[type="number"], input[type="range"], input[type="email"], input[type="url"]') ){
				conditions.format = field.attr('type');
			}

			if( field.is('[max]') ){
				conditions.max = field.attr('max');
			}

			if( field.is('[min]') ){
				conditions.min = field.attr('min');
			}

			if( field.is('[pattern]') ){
				conditions.regex = field.attr('pattern');
			}

			return conditions;
		};

		// Expose public methods
		return {
			isUrl: isUrl,
			isEmail: isEmail,
			addFormat: addFormat,
			addValidator: addValidator,
			validate: validate,
			isAllowedUrl: isAllowedUrl
		}
	});

}(jQuery, _));

// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
var escapeRegExp;

(function () {
  // Referring to the table here:
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/regexp
  // these characters should be escaped
  // \ ^ $ * + ? . ( ) | { } [ ]
  // These characters only have special meaning inside of brackets
  // they do not need to be escaped, but they MAY be escaped
  // without any adverse effects (to the best of my knowledge and casual testing)
  // : ! , = 
  // my test "~!@#$%^&*(){}[]`/=?+\|-_;:'\",<.>".match(/[\#]/g)

  var specials = [
        // order matters for these
          "-"
        , "["
        , "]"
        // order doesn't matter for any of these
        , "/"
        , "{"
        , "}"
        , "("
        , ")"
        , "*"
        , "+"
        , "?"
        , "."
        , "\\"
        , "^"
        , "$"
        , "|"
      ]

      // I choose to escape every character with '\'
      // even though only some strictly require it when inside of []
    , regex = RegExp('[' + specials.join('\\') + ']', 'g')
    ;

  escapeRegExp = function (str) {
    return str.replace(regex, "\\$&");
  };

  // test escapeRegExp("/path/to/res?search=this.that")
}());