/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.loader.js - Loader module
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.loader', function(){

		var _loadedScripts = [],
			_loadingScripts = [];

		/**
		 * Figures out the scripts that have already been inserted into the page
		 *
		 * @returns {void}
		 */
		var init = function () {
			var scripts = $('script[type="text/javascript"][src][data-ips]');

			scripts.each( function () {
				var scriptInfo = ips.utils.url.getURIObject( $( this ).attr('src') );

				if ( scriptInfo.queryKey.src ){
					var paths = _getPathScripts( scriptInfo.queryKey.src );

					_.each( paths, function (value){
						_loadedScripts.push( value );
					});
				} else if( scriptInfo.path.indexOf('interface/') !== -1 ) {
					var interfaces = _getInterfaceScript( scriptInfo.path );

					if( interfaces ){
						_loadedScripts.push( interfaces );
					}	
				} else {
					var other = _getOtherScript( scriptInfo.source );

					if( other ){
						_loadedScripts.push( other );
					}
				}
			});
		},

		/**
		 * Parses a script URL. If the script is local, returns the path from /applications/, otherwise, the whole url.
		 *
		 * @returns {string} 
		 */
		_getOtherScript = function (path) {
			path = path.replace( ips.getSetting('baseURL'), '' );

			if( path.startsWith('/') ){
				path = path.substring(1);
			}

			if( path.startsWith('applications/') ){
				path = path.replace(/^applications\//i, '')
			}

			return path;
		},

		/**
		 * Parses a script URL for the relative path to an interface script
		 *
		 * @returns {mixed} 	Path as a string if an interface file, or false if not
		 */
		_getInterfaceScript = function (path) {
			// Split the path
			var pieces = _.compact( path.split('/').reverse() );
			var path = [];

			for( var i = 0; i < pieces.length; i++ ){
				if( pieces[i] == 'interface' ){
					path.push('interface');
					path.push( pieces[ i+1 ] );
					break;
				}

				path.push( pieces[i] );
			}

			if( _.indexOf( path, 'interface' ) !== -1 ){
				return path.reverse().join('/');
			}

			return false;
		},

		/**
		 * Splits a comma-separated list of paths into individual paths
		 *
		 * @returns {array}
		 */
		_getPathScripts = function (src) {
			return _.compact( src.split(',') );
		},

		/**
		 * Loads a script file. Calls the internal _doLoad method, wrapped in jQuery's when method for deferred
		 *
		 * @param 	{array} 	filePaths 	Array of relative file paths to load
		 * @returns {void}
		 */
		get = function (toLoad) {
			return $.when( _doLoad( _.compact( _.uniq( toLoad ) ) ) );
		},

		/**
		 * Loads a script file remotely
		 *
		 * @param 	{array} 	filePaths 	Array of relative file paths to load
		 * @returns {void}
		 */
		_doLoad = function (filePaths) {
			var deferred = $.Deferred();

			if( !_.isArray( filePaths ) ){
				filePaths = [ filePaths ];
			}

			var done = [];
			var loading = [];
			var toLoad = [];

			// Step 1: Sort each file into done, loading or toLoad
			for( var i = 0; i < filePaths.length; i++ ){
				if( _.indexOf( _loadedScripts, filePaths[ i ] ) !== -1 ){
					done.push( filePaths[ i ] );
					continue;
				}

				if( _.indexOf( _loadingScripts, filePaths[ i ] ) !== -1 ){
					loading.push( filePaths[ i ] );
					continue;
				}

				toLoad.push( filePaths[ i ] );
			}

			// Step 2: If we've already loaded everything, short circuit and resolve the deferred
			if( done.length === filePaths.length ){
				deferred.resolve();
				return deferred.promise();
			}

			// Step 3: If we've got any files to watch (either loading, or toLoad), set an event handler
			if( loading.length || toLoad.length ){
				$( document ).on( 'scriptLoaded', function (e, files) {

					for( var i = 0; i < files.length; i++ ){
						if( _.indexOf( filePaths, files[ i ] ) === -1 ){
							continue;
						}

						done.push( files[ i ] );
					}

					if( done.length === filePaths.length ){
						setTimeout( function () {
							deferred.resolve();	
						}, 100);						
					}
				});
			}

			// Step 4: Load the files that haven't been loaded yet
			// Split them into local and global files and do separate requests for each
			if( toLoad.length ){
				var localFiles = [];
				var remoteFiles = []

				for( var i = 0; i < toLoad.length; i++ ){
					if( toLoad[ i ].match( /^(http|\/\/)/i ) ){
						remoteFiles.push( toLoad[ i ] );
					} else {
						localFiles.push( toLoad[ i ] );
					}
				}

				if( localFiles.length ){
					_insertScript( localFiles );	
				}

				if( remoteFiles.length ){
					for( var i = 0; i < remoteFiles.length; i++ ){
						_insertScript( [ remoteFiles[ i ] ] );
					}
				}				
			}

			return deferred.promise();
		},

		/**
		 * Loads a script file via ajax
		 *
		 * @param 	{array} 	filePaths 	Array of file paths to load
		 * @param 	{boolean} 	[cached]	Whether to allow the browser to use a cached file (default: true)
		 * @returns {void}
		 */
		_insertScript = function (toLoad, cached) {

			// Add URLs to the loading array
			for( var i = 0; i < toLoad.length; i++ ){
				_loadingScripts.push( toLoad[ i ] );
			}

			Debug.log( "Loading: " + toLoad.join(', ') );

			// Figure out the URL
			var url = '';

			if( toLoad[0].match( /^(http|\/\/)/i ) ){
				url = toLoad[0].match( /^http/ ) ? toLoad[0].replace( /^.+?\/\/(.*)$/, '//$1' ) : toLoad[0];
			} else {
				url = ips.getSetting('jsURL') + '?src=' + encodeURIComponent( toLoad.join(',') );
			}

			// Now fetch the script(s) by calling our JS url.
			// On success, we add the script(s) to the _loadedScripts array, and trigger an event so that other methods are aware
			// And we always remove it from the _loadingScripts array when the ajax finishes.
			// In a settimeout so that this happens on the next tick.
			setTimeout( function () {
				$.ajax( {
					dataType: 'script',
					cache: ( _.isUndefined( cached ) ) ? true : cached,
					url: url,
					data: {
						antiCache: ips.getSetting('antiCache')
					}
				})
					.fail( function (jqXHR, textStatus, errorThrown) {
						Debug.error( "Failed to load: " + toLoad.join(', ') );
						Debug.log( textStatus );
					})
					.always( function () {
						for( var i = 0; i < toLoad.length; i++ ){
							var index = _.indexOf( _loadingScripts, toLoad[ i ] );

							if( index !== -1 ){
								_loadingScripts.splice( index, 1 );
							}
						}
					})
					.done( function () {
						
						// Remove from loading, add to loaded
						for( var i = 0; i < toLoad.length; i++ ){
							_loadedScripts.push( toLoad[ i ] );
						}

						// Trigger event to let observers know
						$( document ).trigger( 'scriptLoaded', [ toLoad ] );
						Debug.log( "Loaded: " + toLoad.join(', ') );
					})
			}, 500);
			
		};

		return {
			init: init,
			get: get
		}
	});
}( jQuery, _ )); 