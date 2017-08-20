/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * Debug.js - A simple logging module. Allows adapters to be passed in to enable
 * alternatives to simple window.console logging.
 *
 * Author: Rikki Tissier
 */

var Debug = Debug || {};

;( function($, _, undefined){
	"use strict";

	Debug = function () {

		var options = {
			enabled: false,
			level: 1,
			adapters: [ ]
		};

		var LEVEL = {
			DEBUG: 1,
			INFO: 2,
			WARN: 3,
			ERROR: 4
		};

		/**
		 * Logs a Debug message
		 *
		 * @param 	{string}	msg 	Message to log
		 * @returns {object} 	Returns Debug
		 */
		var debug = function (msg) {
			logMessage( LEVEL.DEBUG, msg);
			return Debug;
		},

		/**
		 * Logs an Info message
		 *
		 * @param 	{string}	msg 	Message to log
		 * @returns {object} 	Returns Debug
		 */
		info = function (msg) {
			logMessage( LEVEL.INFO, msg );
			return Debug;
		},

		/**
		 * Logs a Warn message
		 *
		 * @param 	{string}	msg 	Message to log
		 * @returns {object} 	Returns Debug
		 */
		warn = function (msg) {
			logMessage( LEVEL.WARN, msg );
			return Debug;
		},

		/**
		 * Logs an Error message
		 *
		 * @param 	{string}	msg 	Message to log
		 * @returns {object} 	Returns Debug
		 */
		error = function (msg) {
			logMessage( LEVEL.ERROR, msg );
			return Debug;
		},

		/**
		 * Checks our debugging level is met, and passes the message off to the
		 * adapter being used
		 *
		 * @param 	{string}	msg 	Message to log
		 * @returns {object} 	Returns Debug
		 */
		logMessage = function (level, message) {

			if( options.enabled && level >= options.level && options.adapters.length ){
				for( var i = 0; i < options.adapters.length; i++ ){
					options.adapters[ i ].write( level, message );
				}
			}

			return Debug;
		},

		/**
		 * Sets the enabled/disabled status of logging
		 *
		 * @param	{boolean}	enabled 	Whether logging should be enabled
		 * @returns {object} 	Returns Debug
		 */
		setEnabled = function (enabled) {
			options.enabled = ( enabled === false ) ? false : true;
			return Debug;
		},

		/**
		 * See whether debugging is enabled
		 *
		 * @returns 	{boolean}
		 */
		isEnabled = function () {
			return options.enabled;
		},

		/**
		 * Sets the debugging severity threshold
		 *
		 * @param 	{number} 	level 	Level to set as minimum threshold
		 * @returns {object} 	Returns Debug
		 */
		setLevel = function (level) {
			if( LEVEL[ level ] ){
				options.level = LEVEL[ level ];
			}

			return Debug;
		},

		/**
		 * Adds an adapter to use for logging
		 *
		 * @param 	{number} 	level 	Level to set as minimum threshold
		 * @returns {object} 	Returns Debug
		 */
		addAdapter = function (adapter) {

			if( _.isObject( adapter ) ){
				options.adapters.push( adapter );
			}

			return Debug;
		},

		/**
		 * Clears all adapters
		 *
		 * @returns 	{object} 	Returns Debug
		 */
		clearAdapters = function () {
			options.adapters = [];
			return Debug;
		};

		return {
			// logging methods
			debug: debug,
			log: debug, // Alias for matt
			info: info,
			warn: warn,
			error: error,

			// other methods
			setEnabled: setEnabled,
			setLevel: setLevel,
			addAdapter: addAdapter,
			clearAdapters: clearAdapters,
			isEnabled: isEnabled
		};
	}();

	/** Default Console adapter	 */
	var Console = function() {};

	Console.prototype.write = function ( level, msg ){
		
		if( window.console ){
			switch( level ){
				case 1:
					if( _.isObject( msg ) ){
						console.dir( msg );
					} else {
						console.log( msg );
					}
					break;
				case 2:
					console.info( msg );
					break;
				case 3:
					console.warn( msg );
					break;
				case 4:
					console.error( msg );
					break;
			}
		}
	};

	Debug.addAdapter( new Console );

	if ( ipsDebug || ( !_.isUndefined( window.localStorage ) && window.localStorage.getItem('DEBUG') ) ) {
		Debug.setEnabled( true ).setLevel( 'DEBUG' ).info("Enabled logging");
	}
	
}(jQuery, _));