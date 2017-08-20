/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * app.js - Our main app script
 *
 * Author: Rikki Tissier
 */

// Our namespace
var ips = ips || {};

( function($, _, undefined){
	"use strict";

	ips = ( function () {

		var _settings,
			_strings = {},
			uid = 1,
			urand = Math.ceil( Math.random() * 10000 ),
			elemContainer,
			_location = 'front';

		/**
		 * Boot methods - sets up the app
		 *
		 * @returns 	{void}
		 */ 
		var boot = function (config) {
			_settings = config;

			// Set our ajax handler default
			_setAjaxConfig();

			// Add a little jQuery plugin that allows us to add callbacks
			// to CSS animations
			$.fn.animationComplete = function (callback) {
				return $( this ).one('webkitAnimationEnd animationend', function (e) {
					// Important fix: ignore bubbled transition events
					if( e.target == this ){
						callback.apply( this );
					}
				});
			};

			// In case we already have ips_uid elements on the page, start at the highest found

			// jQuery plugin that adds a unique id to an element if an ID doesn't
			// already exist. Based on jQueryUI method.
			$.fn.identify = function () {
				return this.each( function () {
					if( !this.id ) {
						this.id = 'ips_uid_' + urand + '_' + (++uid);
					}
				});
			};

			// Redefine .prop() so that we can observe events when properties are changed
			// See: http://stackoverflow.com/questions/16336473/add-event-handler-when-checkbox-becomes-disabled
			var oldProp = $.fn.prop;
			var newProp = function () {
			    var retFunc = oldProp.apply( this, arguments );
			    this.trigger( 'propChanged', this );
			    return retFunc;
			};

			$.fn.prop = newProp;

			// Add a utility function for easily adding
			// methods to a prototype. 
			// From "Javascript: The Good Parts" by Douglas Crockford
			Function.prototype.method = function (name, func) {
			    this.prototype[name] = func;
			    return this;
			};

			// Set up mustache-style templates for language interpolation in underscore
			_.templateSettings = {
				interpolate: /\{\{(.+?)\}\}/g
			};
											
			// Warn users about pasting stuff into the console
			if( !Debug.isEnabled() && window.console ){
				window.console.log("%cThis is a browser feature intended for developers. Do not paste any code here given to you by someone else. It may compromise your account or have other negative side effects.", "font-weight: bold; font-size: 14px;");
			}

			// Signal that we're ready to begin
			$( document )
				.trigger('doneBooting')
				.ready( function () {
					// Set our location
					_location = $( 'body' ).attr('data-pageLocation') || 'front';
					_preloadLoader();
				});
		},

		/**
		 * Allows us to use mock ajax objects if necessary
		 *
		 * @returns 	{object} 	Ajax object (jQuery's $.ajax by default)
		 */ 
		getAjax = function () {
			return ( getSetting('mock_ajax') ) ? getSetting('mock_ajax') : $.ajax;
		},

		/**
		 * Returns our main wrapper (body by default)
		 * With custom skins, sometimes inserting into the body can cause styling issues.
		 * With the container setting, we can choose to insert them somewhere else.
		 *
		 * @returns 	{element} 	The container
		 */ 
		getContainer = function () {
			var tryThis = $( getSetting('container') );
			return ( tryThis.length ) ? tryThis : $('body');
		},

		/**
		 * Loading spinners are contained in a different font file, so there's a FOUT
		 * when they are first shown. We'll create an invisible element so the browser
		 * loads them.
		 *
		 * @returns 	{void}
		 */ 
		_preloadLoader = function () {
			var elem = $('<span/>').css({
				visibility: 'hidden',
				position: 'absolute',
				top: '-300px',
				width: '1px',
				height: '1px',
				overflow: 'hidden'
			});

			if( $('html').attr('dir') == 'rtl' ){
				elem.css({ right: '-300px' });
			} else {
				elem.css({ left: '-300px' });
			}

			elem.append( $('<span/>').addClass('ipsLoading ipsLoading_noAnim').css({
				display: 'block'
			}) );

			$('body').append( elem );
		},

		/**
		 * Sets up our global ajax handlers
		 *
		 * @returns 	{void}
		 */ 
		_setAjaxConfig = function () {
			// Make sure all ajax requests have our secure key & adsess
			var data = {
				csrfKey: ips.getSetting('csrfKey')
			};

			if( ips.getSetting('adsess') ){
				_.extend( data, {
					adsess: ips.getSetting('adsess')
				});
			}

			$.ajaxSetup({
				data: data,
				cache: true
			});

			// Add global loading indicator ability
			var count = 0;

			$( document )
				.ajaxSend( function (event, request, settings) {

					request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

					if( !_.isUndefined( settings ) && settings.showLoading === true ){
						if( !$('#elAjaxLoading').length ){
							getContainer().append( templates.render('core.general.ajax') );
						}

						count++;
						ips.utils.anim.go( 'fadeIn fast', $('#elAjaxLoading') );
					}
				})
				.ajaxComplete( function (event, request, settings) {
					if( !_.isUndefined( settings ) && settings.showLoading === true ){
						count--;

						if( count === 0 ){
							ips.utils.anim.go( 'fadeOut fast', $('#elAjaxLoading') );
						}
					}

					// Check for redirect response
					if( !_.isUndefined( settings ) && !settings.bypassRedirect ){
						var responseJson = null;

						if( !_.isUndefined( request.responseJSON ) && !_.isUndefined( request.responseJSON.redirect ) )
						{
							responseJson = request.responseJSON;
						}
						else if( !_.isUndefined( request.responseText ) )
						{
							try
							{
								var jsonResponse = $.parseJSON( request.responseText );

								if( jsonResponse && !_.isUndefined( jsonResponse.redirect ) )
								{
									responseJson = jsonResponse;
								}
							}
							catch( err ){}
						}

						if( responseJson ){
							// Do we have a flash message to show?
							if( !_.isUndefined( responseJson.message ) && responseJson.message != '' ){
								ips.utils.cookie.set( 'flmsg', responseJson.message );
							}
							
							if ( responseJson.redirect.match( /#/ ) ) {
								window.location.href = responseJson.redirect;
								window.location.reload();
							} else {
								window.location = responseJson.redirect;
							}
						}
					}

					// Re-parse cookies
					ips.utils.cookie.init();
				});
		},

		/**
		 * Config getter
		 *
		 * @param 	{string} 	key 	Setting key to return
		 * @returns {mixed} 	Config setting, or undefined if it doesn't exist
		 */ 
		getSetting = function (key) {
			return _settings[ key ];
		},

		/**
		 * Return full settings object
		 *
		 * @returns 	{object} 	Settings object
		 */
		getAllSettings = function () {
			return _settings;
		},

		/**
		 * Config setter
		 *
		 * @param 	{string} 	key 	Key to set
		 * @param 	{mixed} 	value	Setting value
		 * @returns {void}
		 */
		setSetting = function (key, value) {
			_settings[ key ] = value;
		},

		/**
		 * Adds strings to our language object
		 *
		 * @param 	{mixed} 	strings 	Either an {object} of key/values, or a {string} as a key
		 * @param 	{string} 	[...]		If strings is a string, this param is the value
		 * @returns {void}
		 */
		setString = function (strings) {

			if( _.isString( strings ) && arguments.length == 2 && _.isString( arguments[1] ) ){
				strings = {};
				strings[ arguments[0] ] = arguments[1];
			} else if( !_.isObject( strings ) ){
				Debug.warn("Invalid strings object passed to addString");
				return;
			}

			$.each( strings, function (key, value ){
				_strings[ key ] = value;
			});
		},

		/**
		 * Retrieves a string from storage, and interpolates values if needed
		 *
		 * @param 	{mixed} 	strings 	Either an {object} of key/values, or a {string} as a key
		 * @param 	{string} 	[...]		If strings is a string, this param is the value
		 * @returns {string}	The interpolated string (empty if the key does not exist)
		 */	
		getString = function (key, values) {

			if( _.isUndefined( _strings[ key ] ) ){
				Debug.warn("The string '" + key + "' doesn't exist");
				return '';
			}

			var thisString = _strings[ key ],
				values = values || {};

			// Do we have special values to parse?
			if( !_.indexOf( thisString, '{{' ) ){
				return thisString;
			}

			// Add some vars into the values
			_.extend( values, {
				imgURL: ips.getSetting('imgURL'),
				baseURL: ips.getSetting('baseURL')
			});

			try {
				return _.template( thisString )( values );
			} catch (err) {
				return ( Debug.isEnabled() ) ? "[Error using language string " + key + "]" : "";
			}
		},

		/**
		 * Returns the location in which we're running
		 *
		 * @returns {string} 	Location key
		 */
		getLocation = function () {
			return _location;
		},

		/**
		 * Create a module, checking that each namespace is ready to accept
		 * modules. If the init method exists on the given module, it is added
		 * to the document.ready queue.
		 *
		 * @param	{string} 	name 	The full module path to create
		 * @param 	{function} 	fn 		The module definition
		 * @returns {void}
		 */
		createModule = function (name, fn) {
			
			var bits = name.split('.'),
				currentPath = window;

			var tmpName = [];

			// Loop through the path pieces and ensure they exist
			if( bits.length ){
				for( var i = 0; i < bits.length; i++ ){

					if( _.isUndefined( currentPath[ bits[i] ] ) ){
						currentPath[ bits[i] ] = {};
					}

					currentPath = currentPath[ bits[i] ];
				}
			} else {
				return false;
			}

			// Assign our module to the path
			currentPath = _.extend( currentPath, fn.call( currentPath ) );

			// Set up init if it exists
			if( _.isFunction( currentPath.init ) ){
				$( document ).ready( function () {
					currentPath.init.call( currentPath );
				});
			}

			$( document ).trigger( 'moduleCreated', [ name ] );
		},

		/**
		 * Provides a pluralized version of a string based on the supplied value
		 *
		 * @param	{string} 	stringKey 	The key of the language string containing the pluralization tag
		 * @param 	{number} 	value 		The value to be pluralized
		 * @returns {void}
		 */
		pluralize = function (stringKey, params) {
			// Get the string we'll work with
			var word = stringKey;

			// Get the pluralization tags from it
			var i = 0;

			if( !_.isArray( params ) ){
				params = [ params ];
			}
			
			word = word.replace( /\{(!|\d+?)?#(.*?)\}/g, function (a,b,c,d) {
				// {# [1:count][?:counts]}
				if( !b || b == '!' ){
					b = i;
					i++;
				}

				var value;
				var fallback;
				var output = '';
				var replacement = params[ b ] + '';

				c.replace( /\[(.+?):(.+?)\]/g, function (w,x,y,z) {
					var xLen = x.length * -1;
					
					if( x == '?' ){
						fallback = y.replace( '#', replacement );
					} 
					else if( x.charAt(0) == '%' && x.substring( 1 ) == replacement.substring( 0, x.substring( 1 ).length ) ){
						value = y.replace( '#', replacement );
					}
					else if( x.charAt(0) == '*' && x.substring( 1 ) == replacement.substr( -x.substring( 1 ).length ) ){
						value = y.replace( '#', replacement );	
					}
					else if( x == replacement ) {
						value = y.replace( '#', replacement );
					}
				});

				output = a.replace( /^\{/, '' ).replace(/\}$/, '' ).replace( '!#', '' );
				output = output.replace( b + '#', replacement ).replace( '#', replacement );
				output = $.trim( output.replace( /\[.+\]/, value == null ? fallback : value ) );

				return output;
			});

			return word;
		},

		testConsole = function () {
			if( window.atob && window.console ){
				console.log( window.atob("ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgd293ICAgICAgICAgICAgICAgICAgICAgICAgICAgI\
CAgIAogICAgICAgICAgICAgICAgICAgICAgICBzdWNoIGZvcnVtICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAga\
G93IGFqYXggICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICB2ZXJ5IGNvbW11bml0eSAgICAgIC\
AgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWNoIG1lbWJlcgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg\
ICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCg==")
				);
			}

			return '';
		};

		var templates = function () {
			var _templateStore = {};

			/**
			 * Sets a mustache template
			 *
			 * @param	{string} 	key 		Key name for this template
			 * @param 	{mixed} 	template 	Template, as string or function which returns a string
			 * @returns {void}
			 */
			var set = function (key, template) {
				_templateStore[ key ] = template;
			},

			/**
			 * Return a mustache template
			 *
			 * @param	{string} 	key 		Key name for the template to retrieve
			 * @returns {string}	Template contents
			 */
			get = function (key) {
				if( _templateStore[ key ] ){
					if( _.isFunction( _templateStore[ key ] ) ){
						return _templateStore[ key ]();
					} else {
						return _templateStore[ key ];
					}
				}

				return '';
			},

			/**
			 * Renders a mustache template
			 *
			 * @param	{string} 	key 		Key name for this template
			 * @param 	{object} 	obj 		Object of values with which to render the template
			 * @returns {string} 	The rendered contents
			 */
			render = function (key, obj) {
				// Add some common vars
				obj = _.extend( obj || {}, {
					imgURL: ips.getSetting('imgURL'),
					baseURL: ips.getSetting('baseURL'),
					lang: _lang
				});

				return Mustache.render( get( key ), obj );
			},

			/**
			 * Returns a compile mustache template ready for us
			 *
			 * @param	{string} 	key 		Key name for this template
			 * @returns {function} 	A compiled template function
			 */
			compile = function (key) {
				if( _templateStore[ key ] ){
					return Mustache.parse( get( key ) );
				}

				return $.noop;
			},

			/**
			 * Returns a function that Mustache can use to swap out language strings
			 * Allows {{#lang}}key{{/lang}} to be used in the templates
			 *
			 * @returns {function} 	A closure
			 */
			_lang = function () {
				return function (text, render) {
					return render( ips.getString( text ) );
				}
			};

			return {
				set: set,
				get: get,
				render: render,
				compile: compile
			};
		}();

		return {
			boot: boot,
			createModule: createModule,
			getSetting: getSetting,
			getAllSettings: getAllSettings,
			setSetting: setSetting,
			getAjax: getAjax,
			getContainer: getContainer,
			setString: setString,
			getString: getString,
			pluralize: pluralize,
			getLocation: getLocation,
			templates: templates,
			testConsole: testConsole
		};

	}());
	
	ips.boot( ipsSettings );
	
	// Extend some core objects with useful methods
	String.prototype.startsWith = function (pattern) {
    	return this.lastIndexOf(pattern, 0) === 0;
  	};

}(jQuery, _));