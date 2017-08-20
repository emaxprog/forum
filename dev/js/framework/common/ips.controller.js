/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.controller.js - Base controller handling
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.controller', function(){

		var _controllers = {},
			_autoMixins = {},
			_manualMixins = {},
			_mixins = {},
			_beingLoaded = [],
			_queue = {},
			_prototypes = {},
			instanceID = 1,
			_controllerCaseMap = {
				'core.front.core.autosizeiframe': 'core.front.core.autoSizeIframe'
			};

		/**
		 * Registers a controller
		 *
		 * @param	{string} 	id 			ID of this controller; used to auto-init on dom nodes
		 * @param	{object} 	definition 	Object containing the methods for the controller
		 * @returns {void}
		 */
		var register = function (id, definition) {
			_controllers[ id ] = definition;
			_checkQueue( id );
		},

		/**
		 * Returns boolean denoting whether a controller has been registered
		 *
		 * @param	{string} 	id 		ID of controller to check
		 * @returns 	{boolean}
		 */
		isRegistered = function (id) {
			return !_.isUndefined( _controllers[ id ] );
		},

		/**
		 * Initializes controllers by looking at the dom tree for data-controller attributess
		 *
		 * @param	{element} 	node 		Root node to search in (defaults to document)
		 * @returns {void}
		 */
		init = function () {
			// And also listen for the contentChange event
			$( document ).on('contentChange', function(e, newNode){
				initializeControllers( newNode );
			});

			// Do our initial search
			initializeControllers();
		},

		/**
		 * Registers a controller mixin
		 *
		 * @param 		{string} 	Controller ID this mixin works with
		 * @param 		{boolean} 	Automatically apply mixin to all instances of controller?
		 * @param 		{function} 	Function definition to apply
		 * @returns 	{void}
		 */
		mixin = function (mixinName, controller, auto, mixinFunc) {
			if( _.isFunction( auto ) ){
				mixinFunc = auto;
				auto = false;
			}

			var obj = ( auto ) ? _autoMixins : _manualMixins;
			
			if( _.isUndefined( obj[ controller ] ) ){
				obj[ controller ] = {};
			}

			obj[ controller ][ mixinName ] = mixinFunc;
		},

		/**
		 * Given a node, will find all controllers on the node, initialize the ones that are
		 * available, and instruct the others to be loaded remotely
		 *
		 * @param 		{element} 	Optional node to initialize on
		 * @returns 	{void}
		 */
		initializeControllers = function (node) {
			var controllers = _findControllers( node );
			var needsLoading = {};

			for( var controller in controllers ){

				// If the controller is already registered, we'll init it immediately
				if( isRegistered( controller ) ){
					for( var i = 0; i < controllers[ controller ].length; i++ ){
						
						var elem = controllers[ controller ][i]['elem'];
						var mixins = controllers[ controller ][i]['mixins'];

						initControllerOnElem( elem, controller, mixins );
					}
				// If not, we'll load it then init
				} else {
					needsLoading[ controller ] = controllers[ controller ];
				}
			}
			
			if( _.size( needsLoading ) ){
				_loadControllers( needsLoading )
					.done( function () {
						// No need to initialize here - the register call in the controller itself will trigger a queue check
					});
			}
		},

		/**
		 * Checks queued controllers to see if the given controller ID is needed
		 *
		 * @param 		{string} 	id 		Controller ID being checked
		 * @returns 	{void}
		 */
		_checkQueue = function (id) {

			if( _queue[ id ] && _queue[ id ].length ){
				for( var i = 0; i < _queue[ id ].length; i++ ){
					initControllerOnElem( _queue[ id ][ i ]['elem'], id, _queue[ id ][ i ]['mixins'] );
				} 

				delete _queue[ id ];
			}

			if( _.indexOf( _beingLoaded, id ) ){
				delete _beingLoaded[ _.indexOf( _beingLoaded, id ) ];
			}
		},

		/**
		 * Loads the specified controllers, providing they aren't already being loaded
		 *
		 * @param 		{object} 	needsLoading 	Object of key/value pairs of controllers to load 
		 * @returns 	{void}
		 */
		_loadControllers = function (needsLoading) {
			// Build include paths
			var filePaths = [];
			var deferred = $.Deferred();

			// CHeck whether our controllers are already being loaded
			for( var controller in needsLoading ){
				if( _.indexOf( _beingLoaded, controller ) !== -1 ){
					delete needsLoading[ controller ];
					continue;
				}

				_beingLoaded.push( controller );
				filePaths.push( _buildFilePath( controller ) );
			}

			if( !_.size( needsLoading ) ){
				// All are being loaded, so we're done here
				deferred.resolve();
				return deferred.promise();
			}

			// Add to the queue
			_.extend( _queue, needsLoading );

			ips.loader.get( filePaths ).then( function () {
				deferred.resolve();
			});

			return deferred.promise();
		},

		/**
		 * Builds a controller file path from the provided controller ID
		 *
		 * @param 		{string} 	controllerName 	 Controller ID
		 * @returns 	{string}	File path
		 */
		_buildFilePath = function (controllerName) {
			var bits = controllerName.split('.');

			// Get the URL for this controller
			// The URL will vary depending on whether we're in_dev or not.
			if( ips.getSetting('useCompiledFiles') === false ){
				// If we're in_dev, we can build the URL simply by appending the pieces of the controller ID
				return bits[0] + '/' + bits[1] + '/controllers/' + bits[2] +
						'/ips.' + bits[2] + '.' + bits[3] + '.js';
			} else {
				// If we're not indev, we need to locate the bundle the controller exists in
				try {
					return ipsJavascriptMap[ bits[0] ][ bits[1] + '_' + bits[2] ];
				} catch (err) {
					return '';
				}
			}
		},

		/**
		 * Searches the provided node for any controllers specified on elements
		 *
		 * @param 		{element} 	node 	Optional node to search on. Defaults to document.
		 * @returns 	{object}	Found controllers, with the key being controller ID, value being array of elements
		 */
		_findControllers = function (node) {
			// 02/03/16 - Allow either dom nodes or jquery objects here.
			// Previously only dom elements were allowed, which meant in most cases
			// we reverted to checking the whole document again, causing some odd behavior.
			if( !_.isElement( node ) && !( node instanceof jQuery ) ){
				node = document;
			}

			var controllersToLoad = {};
				
			$( node ).find('[data-controller]').addBack().each( function (idx, elem){

				if( !$( elem ).data('_controllers') ){
					$( elem ).data('_controllers', []);
				}

				var controllerString = $( elem ).data('controller'),
					controllerList = $( elem ).data('_controllers');

				if( controllerString )
				{
					_getControllersAndMixins( controllerString );

					var controllers = _getControllersAndMixins( controllerString );

					// Loop through each controller on this element
					if( _.size( controllers ) ){
						_.each( controllers, function (val, key) {

							if( controllerList.length && _.indexOf( controllerList, key ) !== -1 ){
								// Already initialized on this element
								return;
							}

							if( controllersToLoad[ key ] ){
								controllersToLoad[ key ].push( { elem: elem, mixins: val } );
							} else {
								controllersToLoad[ key ] = [ { elem: elem, mixins: val } ];
							}
						});
					}
				}
			});
			
			return controllersToLoad;
		},

		/**
		 * Returns controllers and mixins found in the string
		 * Given <pre>controllerOne( mixin1; mixin2 ), controllerTwo, controllerThree</pre>, returns:
		 * <pre>
		 * {
		 * 	controllerOne: [ mixin1, mixin2 ],
		 *	controllerTwo: [],
		 * 	controllerThree: []
		 * }
		 * </pre>
		 *
		 * @returns 	{string}
		 */
		_getControllersAndMixins = function (controllerString) {
			var controllers = {};
			var pieces = controllerString.split(',');

			for( var i = 0; i < pieces.length; i++ ){
				
				pieces[i] = $.trim( pieces[i] );

				// Fix case issues on user-submitted content
				if( !_.isUndefined( _controllerCaseMap[ pieces[i] ] ) ){
					pieces[i] = _controllerCaseMap[ pieces[i] ];
				}

				if( pieces[i].indexOf('(') === -1 ){
					controllers[ pieces[i] ] = [];
					continue;
				}

				var p = pieces[i].match( /([a-zA-Z0-9.]+)\((.+?)\)/i );
				var mixinPieces = [];

				_.each( p[2].split(';'), function (val) {
					mixinPieces.push( $.trim( val ) );
				});

				controllers[ p[1] ] = mixinPieces;
			}

			return controllers;
		},

		/**
		 * Returns an incremental controller ID
		 * Controller IDs are used to enable controllers to identify events that they
		 * emitted themselves.
		 *
		 * @returns 	{string}
		 */
		getInstanceID = function () {
			return 'ipscontroller' + (++instanceID);
		},

		/**
		 * Allows an element to be cleaned externally. If the element passed is not a controller scope,
		 * it'll search down one level of the DOM to find controllers.
		 *
		 * @param 		{element} 	elem 	The element to clean
		 * @returns 	{string}
		 */
		cleanContentsOf = function (elem) {
			$( elem ).find('[data-controller]')
				.each( function () {
					var loopController = $( this );
					var controllers = loopController.data( '_controllerObjs' ) || [];

					if( controllers.length ){
						loopController.trigger('destroy');

						for( var i = 0; i < controllers.length; i++ ){
							delete controllers[i];
						}
					}
				});

			// Remove any widgets that exist in this elem
			ips.ui.destructAllWidgets( $( elem ) );
		},

		/**
		 * Initializes a controller instance by creating a new function, extending it with
		 * the controller methods then initializing it on the relevant dom node
		 *
		 * @param	{element} 	elem 			The element that will form the scope of this controller
		 * @param	{string} 	controllerID 	ID of this controller
		 * @returns {void}
		 */
		initControllerOnElem = function (elem, controllerID, mixins) {

			if( !_controllers[ controllerID ] ){
				Debug.error("Controller '" + controllerID + "' has not been registered");
				return;
			}

			if( _.isUndefined( $( elem ).data('_controllers') )){
				$( elem ).data('_controllers', []);
			}

			$( elem ).data('_controllers').push( controllerID );

			if( _.isUndefined( _prototypes[ controllerID ] ) ){
				// Fetch our controller prototype
				_prototypes[ controllerID ] = getBaseController();
				// Extend with our specific controller methods
				$.extend( true, _prototypes[ controllerID ].prototype, _controllers[ controllerID ] );	
			}
			
			// And init
			if( _.isUndefined( $( elem ).data( '_controllerObjs' ) ) ){
				$( elem ).data( '_controllerObjs', [] );
			}

			var controllers = $( elem ).data( '_controllerObjs' );
			var obj = new _prototypes[ controllerID ](elem, controllerID);
			controllers.push( obj );

			// Any mixins?
			// Auto mixins first
			if( !_.isUndefined( _autoMixins[ controllerID ] ) && _.size( _autoMixins[ controllerID ] ) ){	
				_.each( _autoMixins[ controllerID ], function (val, key) {
					_autoMixins[ controllerID ][ key ].call( obj );
				});
			}

			// Then the manually-specified ones
			if( mixins.length ){
				for( var i = 0; i < mixins.length; i++ ){
					if( !_.isUndefined( _manualMixins[ controllerID ] ) && !_.isUndefined( _manualMixins[ controllerID ][ mixins[i] ] ) ){
						_manualMixins[ controllerID ][ mixins[i] ].call( obj );
					}
				}
			}

			if( _.isFunction( obj.initialize ) ){
				obj.initialize.call( obj );
			}

			$( elem ).removeData( '_controller' + controllerID );
			
			$( document ).trigger( 'controllerReady', {
				controllerID: obj.controllerID,
				controllerType: obj.controllerType,
				controllerElem: elem
			});
		},

		/**
		 * Finds controllers within a node that have an ID matching the provided name
		 * Wildcard character * supported at the front or end of the controller parameter
		 *
		 * @param 		{string} 		controller 		Controller name to find
		 * @param 		{element} 		node 			Optional node to search in (document by default)
		 * @returns 	{function}
		 */
		_findSubControllers = function (controller, node) {
			var results = [];

			node = ( node && ( _.isElement( node ) || node.jquery ) ) ? node : document;

			if( controller.indexOf('*') === -1 ){
				results = $( node ).find('[data-controller*="' + controller + '"]');
			} else {
				var pieces = controller.split('.');

				if( pieces[0] == '*' ){
					pieces.shift();
					results = $( node ).find('[data-controller$="' + pieces.join('.') + '"]');
				} else if( pieces[ pieces.length - 1 ] == '*' ){
					pieces.pop();
					results = $( node ).find('[data-controller^="' + pieces.join('.') + '"]');
				}
			}

			return results;
		},

		/**
		 * Returns a new function that will form our controller prototype
		 *
		 * @returns 	{function}
		 */
		getBaseController = function () {

			/** Base controller definition */
			var baseController = function (scope, type) {
				this.controllerType = type;
				this.controllerID = getInstanceID();
				this.scope = $( scope );
				this._eventListeners = [];

				var self = this;

				// Advice methods - inspired by http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
				// and Twitter Flight
				var adviceFuncs = {
					before: function (baseFn, newFn) {
						return function () {
							newFn.apply( this, arguments );
							return baseFn.apply( this, arguments );
						};
					},
					after: function (baseFn, newFn) {
						return function () {
							var toReturn = baseFn.apply( this, arguments );
							newFn.apply( this, arguments );
							return toReturn;
						}
					},
					around: function (baseFn, newFn) {
						return function () {
							var args = ips.utils.argsToArray( arguments );
							args.unshift( baseFn.bind( this ) );
							return newFn.apply( this, args );
						}
					}
				}

				_.each( ['before', 'after', 'around'], _.bind( function (type) {
					this[ type ] = function (base, fn) {
						if( _.isUndefined( this[ base ] ) || !_.isFunction( this[ base ] ) ){
							Debug.log( "Method '" + base + '" is not present in controller ' + this.controllerID );
							return;
						}

						// Replace our base method with a wrapped version
						this[ base ] = adviceFuncs[ type ]( this[ base ], fn );
					};		

				}, this ) );

				// Add a destroy event handler
				this.on( 'destroy', function (e) {
					// Important - we don't want this event to bubble
					e.stopPropagation();

					// Remove each event listener that was created in this controller
					if( self._eventListeners.length ){
						for( var i = 0; i < self._eventListeners.length; i++ ){
							var data = self._eventListeners[i];

							if( data['delegate'] ){
								data['elem'].off( data['ev'], data['delegate'], data['fn'] );
							} else {
								data['elem'].off( data['ev'], data['fn'] );	
							}
						}
					}

					if( _.isFunction( self.destroy ) ){
						self.destroy.call( self );
					}

					// Remove reference to scope so that GC can do its thing
					self.scope = null;
				});

				//Debug.info("Initialized " + this.controllerID + " of type " + this.controllerType);
			};

			// Searches for controllers within the current, triggers a destroy event and deletes the controller objs
			baseController.method('cleanContents', function () {
				Debug.log('Cleaning contents of controller');
				
				this.scope.find('[data-controller]')
					.each( function () {
						var loopController = $( this );
						var controllers = loopController.data( '_controllerObjs' ) || [];

						if( controllers.length ){
							loopController.trigger('destroy');
							
							for( var i = 0; i < controllers.length; i++ ){
								delete controllers[i];
							}
						}
					});

				// Remove any widgets that exist in this elem
				ips.ui.destructAllWidgets( this.scope );
			});

			baseController.method('trigger', function (elem, ev, data) {

				// Convert silly arguments object to an array
				var args = ips.utils.argsToArray( arguments );

				elem = ( !_.isElement( elem ) && !elem.jquery ) ? this.scope : $( args.shift() );
				ev = args[0];
				data = args[1] || {};

				// Add our origin to the event
				if( !data.stack ){
					data.stack = [];
				} 

				data.stack.push( 'controllers.' + this.controllerType + '.' + this.controllerID );

				elem.trigger( ev, data );

			});

			baseController.method('on', function (elem, ev, delegate, fn) {
				
				// Convert silly arguments object to an array
				var args = ips.utils.argsToArray( arguments );

				// Reconfigure our args as necessary
				elem = ( !_.isElement( elem ) && elem != document && elem != window ) ? this.scope : $( args.shift() );
				ev = args[0];
				fn = ( args.length == 3 ) ? args[2] : args[1];				
				delegate = ( args.length == 3 ) ? args[1] : undefined;

				if( !_.isFunction( fn ) ){
					Debug.warn("Callback function for " + ev + " doesn't exist in " + this.controllerType 
						+ " (" + this.controllerID + ")");
					return;
				}

				// Bind our callback to the controller
				fn = _.bind( fn, this );

				// Set up the event
				if( delegate ){
					elem.on( ev, delegate, fn );
					this._eventListeners.push({
						elem: elem,
						event: ev,
						delegate: delegate,
						fn: fn
					});
				} else {
					elem.on( ev, fn );
					this._eventListeners.push({
						elem: elem,
						event: ev,
						fn: fn
					});
				}
			});

			baseController.method('triggerOn', function (controller, ev, data) {
				var toTrigger = _findSubControllers( controller, this.scope );

				if( !toTrigger.length ){
					return;
				}

				data = data || {};

				// Add our origin to the event
				if( !data.stack ){
					data.stack = [];
				} 

				data.stack.push( 'controllers.' + this.controllerType + '.' + this.controllerID );

				toTrigger.trigger( ev, data );
			});			

			return baseController;
		};

		return {
			initControllerOnElem: initControllerOnElem,
			register: register,
			mixin: mixin,
			isRegistered: isRegistered,
			init: init,
			cleanContentsOf: cleanContentsOf
		};
	});

}( jQuery, _ ));