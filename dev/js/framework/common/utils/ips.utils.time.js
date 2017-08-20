/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.time.js - A module for working with time/date
 *
 * Author: Mark Wade
 */

;( function($, _, undefined){
	"use strict";
	
	ips.createModule('ips.utils.time', function () {

		var _supportsLocale = null;

		/**
		 * Convert Unix Timestamp to human-readable (relative where appropriate) string
		 *
		 * @param		{number} 		timestamp 	Unix Timestamp
		 * @returns		{string}
		 */
		var readable = function (timestamp) {
			var date = new Date();
			var time = date.getTime() / 1000; // Timestamp in seconds
			var dst = 0;
			var now = time + dst;
			var elapsed = now - timestamp;

			if ( elapsed < 60 ) {
				 return ips.getString('time_just_now');   
			} else if ( elapsed < 3600 ) {
				return ips.pluralize( ips.getString( 'time_minutes_ago' ), Math.floor( elapsed / 60 ) );  
			} else if ( elapsed < 5400 ) {
				return ips.getString( 'time_1_hour_ago' );
			} else if ( elapsed < 86400 ) {
				return ips.pluralize( ips.getString( 'time_hours_ago' ), Math.floor( elapsed / 3600 ) );   
			} else {

				// Get an appropriate format
				var dateObj = new Date( timestamp * 1000 );
				var format = localeTimeFormat( $('html').attr('lang') );
				var time = formatTime( dateObj, format );

				// Format the datetime string
				var timeParts = ips.getString('time_at')
					? [ localeDateString( dateObj ), ips.getString('time_at') ]
					: [ localeDateString( dateObj ) ];
				timeParts.push(time);

				return ips.getString( 'time_other', { time: timeParts.join(' ') } );
			}
		},

		/**
		 * Get date object from input field - abstracted to handle polyfills
		 *
		 * @param 		{object} 	input 	Input element
		 * @returns 	{object}	Date object
		 */
		getDateFromInput = function(input) {
			// jQuery UI Polyfill needs to be changed into the correct format
			if( !ips.utils.time.supportsHTMLDate() ) {
				// If it has been initiated, we can use the getDate method
				try {
					var thisDate = null;

					if( input.hasClass('hasDatepicker') ){
						thisDate = input.datepicker('getDate');
						Debug.log( 'hasDatePicker: ' + thisDate.toString() + '(' + thisDate.getTime() + ')' );
						//thisDate = new Date( thisDate.getUTCFullYear(), thisDate.getUTCMonth(), thisDate.getUTCDate() );
					} else {
						thisDate = new Date( input.attr('value') );
						Debug.log( 'no datepicker yet: ' + thisDate.toString()  + '(' + thisDate.getTime() + ')' );
					}

					return thisDate;
				}
				// If it hasn't we can pull the 'value' attribute which can't have been changed yet. Not .val() as that will be in the wrong format
				catch(err) {
					return new Date( input.attr('value') );
				}
			}
			// Actual HTML5 input always returns .val() in the correct YYYY-MM-DD format
			else {
				return new Date( input.val() );
			}
		},

		/**
		 * Removes the timezone from a date object, e.g. 1st Feb 00:00 EST will be turned into 1st Feb 00:00 GMT
		 *
		 * @param 		{object} 	input 	Input element
		 * @returns 	{Date}
		 */
		removeTimezone = function (date) {
			if( ips.utils.time.supportsHTMLDate() ){
				date.setTime( new Date( date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0 ).getTime() );	
			}

			var offset = date.getTimezoneOffset();
			var adjustedOffset = offset * 60000;

			if( offset > 0 ){
				date.setTime( date.getTime() + adjustedOffset );	
			} else {
				date.setTime( date.getTime() - adjustedOffset );
			}

			return date;
		},

		/**
		 * Returns a boolean indicating whether the user is in DST
		 *
		 * @param		{object} 		d 	Date object to test
		 * @returns		{boolean}
		 */
		isDST = function () {
			var today = new Date();		    
			var jan = new Date( today.getFullYear(), 0, 1);
			var jul = new Date( today.getFullYear(), 6, 1);
			var stdOffset = Math.max( jan.getTimezoneOffset(), jul.getTimezoneOffset() );

			return today.getTimezoneOffset() < stdOffset;
		},

		/**
		 * Returns true is the provided object is a valid Date object (containing a valid date)
		 *
		 * @param		{object} 		d 	Date object to test
		 * @returns		{boolean}
		 */
		isValidDateObj = function (d) {
			if( Object.prototype.toString.call( d ) !== "[object Date]" ){
				return false;
			}

			return !isNaN( d.getTime() );
		},

		/**
		 * Returns a current unix timestamp
		 *
		 * @returns		{number}
		 */
		timestamp = function () {
			return Date.now();
		},

		/**
		 * Returns javascript's toLocaleDateString, passing the options object
		 * if the browser supports the parameter
		 *
		 * @param		{date} 		date 		Date object
		 * @param 		{object} 	options		Options object (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString)
		 * @returns		{string}
		 */
		localeDateString = function (date, options) {
			if( !_.isBoolean( _supportsLocale ) ){
				_supportsLocale = _checkLocaleSupport();
			}

			if( _supportsLocale && _.isObject( options ) && window.navigator.language ){
				return date.toLocaleDateString( window.navigator.language, options );
			}
			else if( _supportsLocale && window.navigator.language ){
				return date.toLocaleDateString( window.navigator.language );
			} else {
				// UAs that don't support the options object will show the date in the system timezone, which means a midnight time will
				// show on the wrong day if you aren't UTC. To get around that, we'll work out the number of hours offset in the current
				// timezone, and adjust our date based on that to normalize it.
				//----
				// This caused all sorts of pain, so it has been commented out. Instead, methods should call ips.utils.time.removeTimezone
				// on date objects and then this method.
				/*var currentTimeZoneOffsetInHours = new Date().getTimezoneOffset() / 60;
				if ( currentTimeZoneOffsetInHours ) {
					date.setUTCHours( currentTimeZoneOffsetInHours );
				}*/
				//----
				return date.toLocaleDateString();
			}
		},

		/**
		 * Tests whether the browser supports native date pickers
		 *
		 * @returns		{boolean}
		 */
		supportsHTMLDate = function () {
			var i = document.createElement('input');
			i.setAttribute( 'type', 'date' );

			return i.type !== 'text';
		},

		/**
		 * Formats the given date object's time using the given locale format
		 *
		 * @param 		{object} 	Date object to format
		 * @param 		{object} 	Formatting object for a locale returned from localeTimeFormat()
		 * @returns		{string}	Locale-formatted time string
		 */
		formatTime = function (dateObj, localeFormat) {
			if( !_.isDate( dateObj ) ){
				dateObj = timestamp();
			}

			var formatters = {
				/* Day */
				"a": function(d) { // An abbreviated textual representation of the day
					return ips.getString( 'day_' + d.getMonth() + '_short' );
				},
				"A": function(d) { // A full textual representation of the day
					return ips.getString( 'day_' + d.getMonth() );
				},
				"d": function (d) { // Two-digit day of the month (with leading zeros)
					var day = d.getDate().toString();
					return ( ( day.length === 1 ) ? '0' : '' ) + day;
				},
				"e": function (d) { // Day of the month, with a space preceding single digits
					var day = d.getDate().toString();
					return ( ( day.length === 1 ) ? ' ' : '' ) + day;
				},
				"j": function (d) { // Day of the year, 3 digits with leading zeros
					var day = d.getDate();
					var month = d.getMonth();
					if ( month > 0 ) { // Jan
						day += 31;
					}
					if ( month > 1 ) { // Feb
						day += 28;
						if ( d.getFullYear() % 4 == 0 ) {
							day += 1;
						}
					}
					if ( month > 2 ) { // Mar
						day += 31;
					}
					if ( month > 3 ) { // Apr
						day += 30;
					}
					if ( month > 4 ) { // May
						day += 31;
					}
					if ( month > 5 ) { // Jun
						day += 30;
					}
					if ( month > 6 ) { // Jul
						day += 31;
					}
					if ( month > 7 ) { // Aug
						day += 31;
					}
					if ( month > 8 ) { // Sep
						day += 30;
					}
					if ( month > 9 ) { // Oct
						day += 31;
					}
					if ( month > 10 ) { // Nov
						day += 30;
					}
					if ( month > 11 ) { // Dec
						day += 31;
					}
					return day.toString().padStart( 3, '0' );
				},
				"u": function (d) { // ISO-8601 numeric representation of the day of the week
					return d.getDay() + 1;
				},
				"w": function (d) { // Numeric representation of the day of the week
					return d.getDay();
				},
				
				/* Week */
				"U": function (d) { // Week number of the given year, starting with the first Sunday as the first week
					var firstSundayDate = 1;
					var firstSunday = new Date( d.getFullYear(), 0, firstSundayDate, 0, 0, 0, 0 );
				    
					while ( firstSunday.getDay() != 0 ) {
				        firstSundayDate += 1;
				        firstSunday = new Date( d.getFullYear(), 0, firstSundayDate, 0, 0, 0, 0 );
					}
					
					var now = d.getTime() / 1000;
					var weekNumber = 0;
					var timestamp = firstSunday.getTime() / 1000;
					
					while ( timestamp < now ) {
						weekNumber++;
						timestamp += 604800;
					}
					
					weekNumber = weekNumber.toString();
					return ( ( weekNumber.length === 1 ) ? '0' : '' ) + weekNumber;
				},
				"V": function (d) { // ISO-8601:1988 week number of the given year, starting with the first week of the year with at least 4 weekdays, with Monday being the start of the week
					var firstApplicableDate = 1;
					var firstApplicable = new Date( d.getFullYear(), 0, firstApplicableDate, 0, 0, 0, 0 );
					
					while( [ 2, 3, 4, 5 ].indexOf( firstApplicable.getDay() ) == -1 ) {
						firstApplicableDate += 1;
						firstApplicable = new Date( d.getFullYear(), 0, firstApplicableDate, 0, 0, 0, 0 );
					}
					
					var now = d.getTime() / 1000;
					var weekNumber = 0;
					var timestamp = firstApplicable.getTime() / 1000;
					
					while ( timestamp < now ) {
						weekNumber++;
						timestamp += 604800;
					}
					
					weekNumber = weekNumber.toString();
					return ( ( weekNumber.length === 1 ) ? '0' : '' ) + weekNumber;
				},
				"W": function (d) { // A numeric representation of the week of the year, starting with the first Monday as the first week
					var firstMondayDate = 1;
					var firstMonday = new Date( d.getFullYear(), 0, firstMondayDate, 0, 0, 0, 0 );
				    
					while ( firstMonday.getDay() != 1 ) {
				        firstMondayDate += 1;
				        firstMonday = new Date( d.getFullYear(), 0, firstMondayDate, 0, 0, 0, 0 );
					}
					
					var now = d.getTime() / 1000;
					var weekNumber = 0;
					var timestamp = firstMonday.getTime() / 1000;
					
					while ( timestamp < now ) {
						weekNumber++;
						timestamp += 604800;
					}
					
					return weekNumber;
				},
				
				/* Month */
				"b": function(d) { // Abbreviated month name, based on the locale
					return ips.getString( 'month_' + d.getMonth() + '_short' );
				},
				"B": function(d) { // Full month name, based on the locale
					return ips.getString( 'month_' + d.getMonth() );
				},
				"h": function(d) { // Abbreviated month name, based on the locale (an alias of %b)
					return ips.getString( 'month_' + d.getMonth() + '_short' );
				},
				"m": function(d) { // Two digit representation of the month
					var month = d.getMonth().toString();
					return ( ( month.length === 1 ) ? '0' : '' ) + month;
				},
				
				/* Year */
				"C": function(d) { // Two digit representation of the century (year divided by 100, truncated to an integer)
					return parseInt( ( d.getFullYear() / 100 ).toString().substr( 0, 2 ) );
				},
				"g": function(d) { // Two digit representation of the year going by ISO-8601:1988 standards (see %V)
					var year = d.getFullYear();
					if ( d.getMonth() == 0 && d.getDate() < 3 && d.getDay() < 2 ) {
						year--;
					}
					return parseInt( year.toString().substr( 0, 2 ) );
				},
				"G": function(d) { // The full four-digit version of %g
					var year = d.getFullYear();
					if ( d.getMonth() == 0 && d.getDate() < 3 && d.getDay() < 2 ) {
						year--;
					}
					return year;
				},
				"y": function(d) { // Two digit representation of the year
					return parseInt( d.getFullYear().toString().substr( 0, 2 ) );
				},
				"Y": function(d) { // Four digit representation for the year
					return d.getFullYear();
				},
				
				/* Time */
				"H": function (d) { // Two digit representation of the hour in 24-hour format
					var hrs = d.getHours().toString();
					return ( ( hrs.length === 1 ) ? '0' : '' ) + hrs;
				},
				"k": function (d) { // Hour in 24-hour format, with a space preceding single digits
					var hrs = d.getHours();
					return ( ( hrs.length === 1 ) ? ' ' : '' ) + hrs;
				},
				"I": function (d) { // Two digit representation of the hour in 12-hour format
					var hrs = d.getHours();
					hrs = ( hrs >= 12 ) ? hrs - 12 : hrs;
					return ( ( hrs.length === 1 ) ? '0' : '' ) + hrs;
				},
				"l": function (d) { // Hour in 12-hour format, with a space preceding single digits
					var hrs = d.getHours();
					hrs = ( hrs >= 12 ) ? hrs - 12 : hrs;
					return ( ( hrs.length === 1 ) ? ' ' : '' ) + hrs;
				},
				"M": function (d) { // Two digit representation of the min
					var mins = d.getMinutes().toString();
					return ( ( mins.length === 1 ) ? '0' : '' ) + mins;
				},
				"N": function (d) { // Single digit representation of the min
					return d.getMinutes();
				},
				"p": function (d) { // UPPER-CASE 'AM' or 'PM' based on the given time
					var hrs = d.getHours();
					if( !_.isFunction( localeFormat.meridiem ) ){
						return '';
					}

					return localeFormat.meridiem( hrs, false );
				},
				"P": function (d) { // lower-case 'am' or 'pm' based on the given time
					var hrs = d.getHours();
					if( !_.isFunction( localeFormat.meridiem ) ){
						return '';
					}

					return localeFormat.meridiem( hrs, true );
				},
				"r": function(d) { // Same as "%I:%M:%S %p"
					var hrs = d.getHours();
					hrs = ( hrs >= 12 ) ? hrs - 12 : hrs;
					var mins = d.getMinutes().toString();
					var seconds = d.getSeconds().toString();
					
					return ( ( hrs.length === 1 ) ? '0' : '' ) + hrs + ':' + ( ( mins.length === 1 ) ? '0' : '' ) + mins + ':' + ( ( seconds.length === 1 ) ? '0' : '' ) + seconds;
				},
				"R": function(d) { // Same as "%H:%M"
					var hrs = d.getHours().toString();
					var mins = d.getMinutes().toString();
					return ( ( hrs.length === 1 ) ? '0' : '' ) + hrs + ':' + ( ( mins.length === 1 ) ? '0' : '' ) + mins;
				},
				"S": function(d) { // Two digit representation of the second
					var seconds = d.getSeconds().toString();
					return ( ( seconds.length === 1 ) ? '0' : '' ) + seconds;
				},
				"T": function(d) { // Same as "%H:%M:S"
					var hrs = d.getHours().toString();
					var mins = d.getMinutes().toString();
					var seconds = d.getSeconds().toString();
					return ( ( hrs.length === 1 ) ? '0' : '' ) + hrs + ':' + ( ( mins.length === 1 ) ? '0' : '' ) + mins + ':' + ( ( seconds.length === 1 ) ? '0' : '' ) + seconds;
				},
				"X": function(d) { // Preferred time representation based on locale, without the date
					return d.toLocaleTimeString();
				},
				"z": function(d) { // The time zone offset
					var matches = d.toString().match( /GMT([+\-]\d{4}) \((.+)\)$/ );
					return matches[1];
				},
				"Z": function(d) { // The time zone abbreviation
					var matches = d.toString().match( /GMT([+\-]\d{4}) \((.+)\)$/ );
					return matches[2];
				},

				/* Time and Date Stamps */
				"c": function(d) { // Preferred date and time stamp based on locale
					var hrs = d.getHours().toString();
					var mins = d.getMinutes().toString();
					var seconds = d.getSeconds().toString();
					return ips.getString( 'day_' + d.getMonth() + '_short' ) + ' ' + ips.getString( 'month_' + d.getMonth() + '_short' ) + ' ' + d.getDate().toString() + ' ' + ( ( hrs.length === 1 ) ? '0' : '' ) + hrs + ':' + ( ( mins.length === 1 ) ? '0' : '' ) + mins + ':' + ( ( seconds.length === 1 ) ? '0' : '' ) + seconds + ' ' + d.getFullYear().toString();
				},
				"D": function(d) { // Same as "%m/%d/%y"
					var month = d.getMonth().toString();
					var day = d.getDate().toString();
					return ( ( month.length === 1 ) ? '0' : '' ) + month + '/' + ( ( day.length === 1 ) ? '0' : '' ) + day + '/' + parseInt( d.getFullYear().toString().substr( 0, 2 ) ).toString();
				},
				"F": function(d) { // Same as "%Y-%m-%d" (commonly used in database datestamps)
					var month = d.getMonth().toString();
					var day = d.getDate().toString();
					return d.getFullYear().toString() + '-' + ( ( month.length === 1 ) ? '0' : '' ) + month + '-' + ( ( day.length === 1 ) ? '0' : '' ) + day;
				},
				"s": function(d) { // Unix Epoch Time timestamp
					return parseInt( d.getTime() / 1000 );
				},
				"x": function(d) { // Preferred date representation based on locale, without the time
					return d.toLocaleDateString(0);
				},
				
				/* Miscellaneous */
				"n": function (d) { // A newline character ("\n")
					return "\n";
				},
				"t": function (d) { // A Tab character ("\t")
					return "\t";
				},
				"%": function (d) { // A literal percentage character ("%")
					return '%';
				}
			};
			
			return localeFormat.format.replace(/%([aAdejuwUVWbBhmCgGyYHkIlMNPprRSTXzZcDFsxnt%])/g, function (match0, match1) {
				if( formatters[ match1 ] ){
					return formatters[ match1 ]( dateObj );
				}
			});
		},

		/**
		 * Returns the formatting information for the given locale (defaults to English)
		 *
		 * @param 		{string} 	ISO 639‑1 code (e.g. en-gb)
		 * @returns		{object}	Formatting object containing 'format' and sometimes 'meridiem' keys
		 */
		localeTimeFormat = function (locale) {
			var locales = _getLocaleTimeFormat();
			var language = locale.split('-');

			if( !_.isUndefined( locales[ locale.toLowerCase() ] ) ){
				// Check the full locale first (e.g. en-US and en-GB dialects are different )
				return locales[ locale.toLowerCase() ];
			} else if( !_.isUndefined( locales[ language[0].toLowerCase() ] ) ){
				// Try the main language next
				return locales[ language[0].toLowerCase() ];
			} else {
				// Default to English
				return locales['en'];
			}
		},

		/**
		 * Tests if the browser supports the options parameter of toLocaleDateString
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
		 * @returns		{boolean}
		 */
		_checkLocaleSupport = function () {
			try {
				new Date().toLocaleDateString("i");
			} catch (e) {
				return e.name === "RangeError";
			}

			return false;
		},

		/**
		 * Returns time formats for each locale
		 * Data pieced together from what moment.js provides
		 *
		 * @returns		{object}
		 */
		_getLocaleTimeFormat = function () {

			var defaultMeridiem = function (hour, lower) {
				if( hour < 12 ){
					return ( lower ? 'am' : 'AM' );
				} else {
					return ( lower ? 'pm' : 'PM' );
				}
			};

			// %H - Two digit hour in 24hr format (01, 23)
			// %k - Two digit hour in 24hr format (1, 23)
			// %l - Hour in 12hr format (1, 12)
			// %M - Two digit minute (01, 56)
			// %N - Single didget minite (1, 56)
			// %p - Uppercase AM/PM
			// %P - Lowercase am/pm
			return {
				'af': { format: '%H:%M' },
				'ar-ma': { format: '%H:%M' },
				'ar-sa': { format: '%H:%M' },
				'ar-tn': { format: '%H:%M' },
				'ar': { format: '%H:%M' },
				'az': { format: '%H:%M' },
				'be': { format: '%H:%M' },
				'bg': { format: '%k:%M' },
				'bn': { format: '%p %l:%M সময়', meridiem: function (hour) {
					if (hour < 4) {
						return 'রাত';
					} else if (hour < 10) {
						return 'সকাল';
					} else if (hour < 17) {
						return 'দুপুর';
					} else if (hour < 20) {
						return 'বিকেল';
					} else {
						return 'রাত';
					}
				} },
				'bo': { format: '%p %l:%M', meridiem: function (hour) {
					if (hour < 4) {
						return 'མཚན་མོ';
					} else if (hour < 10) {
						return 'ཞོགས་ཀས';
					} else if (hour < 17) {
						return 'ཉིན་གུང';
					} else if (hour < 20) {
						return 'དགོང་དག';
					} else {
						return 'མཚན་མོ';
					}
				} },
				'br': { format: '%le%M %p', meridiem: defaultMeridiem },
				'bs': { format: '%k:%M' },
				'ca': { format: '%k:%M' },
				'cs': { format: '%k:%M' },
				'cv': { format: '%H:%M' },
				'cy': { format: '%H:%M' },
				'da': { format: '%H:%M' },
				'de-at': { format: '%H:%M' },
				'de': { format: '%H:%M' },
				'el': { format: '%l:%M %p', meridiem: function (hour, lower) {
					if (hour > 11) {
						return lower ? 'μμ' : 'ΜΜ';
					} else {
						return lower ? 'πμ' : 'ΠΜ';
					}
				} },
				'en-au': { format: '%l:%M %p', meridiem: defaultMeridiem },
				'en-ca': { format: '%l:%M %p', meridiem: defaultMeridiem },
				'en-gb': { format: '%H:%M' },
				'en': { format: '%l:%M %p', meridiem: defaultMeridiem },
				'eo': { format: '%H:%M' },
				'es': { format: '%k:%M' },
				'et': { format: '%k:%M' },
				'eu': { format: '%H:%M' },
				'fa': { format: '%H:%M' },
				'fi': { format: '%H.%M' },
				'fo': { format: '%H:%M' },
				'fr-ca': { format: '%H:%M' },
				'fr': { format: '%H:%M' },
				'fy': { format: '%H:%M' },
				'gl': { format: '%k:%M' },
				'he': { format: '%H:%M' },
				'hi': { format: '%p %l:%M बजे', meridiem: function (hour) {
					if (hour < 4) {
						return 'रात';
					} else if (hour < 10) {
						return 'सुबह';
					} else if (hour < 17) {
						return 'दोपहर';
					} else if (hour < 20) {
						return 'शाम';
					} else {
						return 'रात';
					}
				} },
				'hr': { format: '%k:%M' },
				'hu': { format: '%k:%M' },
				'hy-am': { format: '%H:%M' },
				'id': { format: '%H.%M' },
				'is': { format: '%k:%M' },
				'it': { format: '%H:%M' },
				'ja': { format: '%p%l時%N分', meridiem: function (hour) {
					if (hour < 12) {
						return '午前';
					} else {
						return '午後';
					}
				} },
				'jv': { format: '%H.%M' },
				'ka': { format: '%l:%M %p', meridiem: defaultMeridiem },
				'km': { format: '%H:%M' },
				'ko': { format: '%p %l시 %N분', meridiem: function (hour) {
					return hour < 12 ? '오전' : '오후';
				} },
				'lb': { format: '%k:%M Auer' },
				'lt': { format: '%H:%M' },
				'lv': { format: '%H:%M' },
				'me': { format: '%k:%M' },
				'mk': { format: '%k:%M' },
				'ml': { format: '%p %l:%M -നു', meridiem: function (hour) {
					if (hour < 4) {
						return 'രാത്രി';
					} else if (hour < 12) {
						return 'രാവിലെ';
					} else if (hour < 17) {
						return 'ഉച്ച കഴിഞ്ഞ്';
					} else if (hour < 20) {
						return 'വൈകുന്നേരം';
					} else {
						return 'രാത്രി';
					}
				} },
				'mr': { format: '%p %l:%M वाजता', meridiem: function (hour) {
					if (hour < 4) {
						return 'रात्री';
					} else if (hour < 10) {
						return 'सकाळी';
					} else if (hour < 17) {
						return 'दुपारी';
					} else if (hour < 20) {
						return 'सायंकाळी';
					} else {
						return 'रात्री';
					}
				} },
				'ms-my': { format: '%H.%M' },
				'ms': { format: '%H.%M' },
				'my': { format: '%H:%M' },
				'nb': { format: '%k.%M' },
				'ne': { format: '%pको %l:%M बजे', meridiem: function (hour) {
					if (hour < 3) {
						return 'राती';
					} else if (hour < 10) {
						return 'बिहान';
					} else if (hour < 15) {
						return 'दिउँसो';
					} else if (hour < 18) {
						return 'बेलुका';
					} else if (hour < 20) {
						return 'साँझ';
					} else {
						return 'राती';
					}
				} },
				'nl': { format: '%H:%M' },
				'nn': { format: '%H:%M' },
				'pl': { format: '%H:%M' },
				'pt-br': { format: '%H:%M' },
				'pt': { format: '%H:%M' },
				'ro': { format: '%k:%M' },
				'ru': { format: '%H:%M' },
				'si': { format: '%P %l:%M', meridiem: function (hours, lower) {
					if (hours > 11) {
						return lower ? 'ප.ව.' : 'පස් වරු';
					} else {
						return lower ? 'පෙ.ව.' : 'පෙර වරු';
					}
				} },
				'sk': { format: '%k:%M' },
				'sl': { format: '%k:%M' },
				'sq': { format: '%H:%M' },
				'sr-cyrl': { format: '%k:%M' },
				'sr': { format: '%k:%M' },
				'sv': { format: '%H:%M' },
				'ta': { format: '%H:%M' },
				'th': { format: '%k นาฬิกา %N นาที' },
				'tl-ph': { format: '%H:%M' },
				'tr': { format: '%H:%M' },
				'tzl': { format: '%H.%M' },
				'tzm-latn': { format: '%H:%M' },
				'tzm': { format: '%H:%M' },
				'uk': { format: '%H:%M' },
				'uz': { format: '%H:%M' },
				'vi': { format: '%H:%M' },
				'zh-cn': { format: '%p%l点%M分', meridiem: defaultMeridiem },
				'zh-tw': { format: '%p%l點%M分', meridiem: defaultMeridiem }
			}
		};
		
		return {
			readable: readable,
			localeDateString: localeDateString,
			isValidDateObj: isValidDateObj,
			timestamp: timestamp,
			supportsHTMLDate: supportsHTMLDate,
			localeTimeFormat: localeTimeFormat,
			formatTime: formatTime,
			getDateFromInput: getDateFromInput,
			removeTimezone: removeTimezone
		};
	});
}(jQuery, _));