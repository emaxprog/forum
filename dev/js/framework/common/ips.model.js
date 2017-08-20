/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.model.js - Base model handling
 *
 * Author: Rikki Tissier
 */

;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.model', function(){

		var _models = {};

		/**
		 * Registers a model. Models are initialized immediately.
		 *
		 * @param	{string} 	id 			ID of this model
		 * @param	{object} 	definition 	Object containing the methods for the model
		 * @returns {void}
		 */
		var register = function (id, definition) {
			//_models[ id ] = definition;

			var Base = getBaseModel();

			// Extend with our specific controller methods
			$.extend( Base.prototype, definition );

			// And init
			var obj = new Base(id);

			if( _.isFunction( obj.initialize ) ){
				obj.initialize.call( obj );
			}
		},

		/**
		 * Returns a new function that will form our model prototype
		 *
		 * @returns 	{function}
		 */
		getBaseModel = function () {

			/*
			 * Base model definition
			 */
			var baseModel = function (id) {
				this.modelID = id;
				//Debug.info("Initialized model " + this.modelID);
			};

			baseModel.method('trigger', function (elem, ev, data) {

				// Convert silly arguments object to an array
				var args = ips.utils.argsToArray( arguments );

				elem = ( !_.isElement( elem ) ) ? $(document) : $( args.shift() );
				ev = args[0];
				data = args[1] || {};

				// Add our origin to the event
				if( !data.stack ){
					data.stack = [];
				} 

				data.stack.push( 'models.' + this.modelID );

				elem.trigger( ev, data );
			});

			baseModel.method('on', function (elem, ev, delegate, fn) {

				// Convert silly arguments object to an array
				var args = ips.utils.argsToArray( arguments );

				// Reconfigure our args as necessary
				elem = ( !_.isElement( elem ) && elem != document ) ? $(document) : $( args.shift() );
				ev = args[0];
				fn = ( args.length == 3 ) ? args[2] : args[1];
				delegate = ( args.length == 3 ) ? args[1] : undefined;

				if( !_.isFunction( fn ) ){
					Debug.warn("Callback function for " + ev + " doesn't exist in " + this.modelID);
					return;
				}

				// Bind our callback to the model
				fn = _.bind( fn, this );

				// Set up the event
				if( delegate ){
					elem.on( ev, delegate, fn );
				} else {
					elem.on( ev, fn );
				}
			});

			baseModel.method('getData', function (data, eventData) {
				var self = this;
				var ajaxObj = ips.getAjax();

				// If this appears to be a local URL, prefix with the baseURL
				if( !data.url.startsWith('http') ){
					data.url = ips.getSetting('baseURL') + 'index.php?' + data.url;
				}

				// See if we're specifying events manually
				// If not, build some event names to use
				if( data.events && _.isString( data.events ) ){
					data.events = {
						loading: data.events + 'Loading',
						done: data.events + 'Done',
						fail: data.events + 'Error',
						always: data.events + 'Finished'
					};
				}

				// Check if namespace exists, add a period if neessary
				if( data.namespace && !data.namespace.startsWith('.') ){
					data.namespace = '.' + data.namespace;
				}

				// Do the loading
				if( data.events.loading ){
					this.trigger( data.events.loading + ( data.namespace || '' ), eventData || {} );
				}

				ajaxObj( data.url, {
					data: data.data || {},
					dataType: data.dataType || 'html',
					type: data.type || 'get'
				})
					.done( function (response) {
						if( data.events.done ){
							if( data.dataType == 'json' ){
								var doneData = _.extend( eventData || {}, response );
							} else {
								var doneData = _.extend( eventData || {}, { response: response } );
							}

							self.trigger( data.events.done + ( data.namespace || '' ), doneData );
						}
					})
					.fail( function (jqXHR) {
						if( data.events.fail ){
							try {
								if( data.dataType == 'json' ){
									var doneData = _.extend( eventData || {}, $.parseJSON( jqXHR.responseText ) );
								} else {
									var doneData = _.extend( eventData || {}, { response: jqXHR.responseText } );
								}
							} catch (err) {}

							self.trigger( data.events.fail + ( data.namespace || '' ), doneData )
						}
					})
					.always( function () {
						if( data.events.always ){
							self.trigger( data.events.always + ( data.namespace || '' ) );
						}
					});
			});

			return baseModel;
		};

		return {
			register: register
		};
	});

}( jQuery, _ ));