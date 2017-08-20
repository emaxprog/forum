/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.panel.js - VSE panel controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.panel', {

		initialize: function () {
			this.on( 'widgetStyleUpdated', this.widgetStyleUpdated );
			this.setup();
		},

		/**
		 * Setup method; initiates building our panels
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this.data = this.scope.data('styleData');

			var types = ['background', 'font'];

			for( var i = 0; i < types.length; i++ ){
				if( this.data[ types[ i ] ] ){
					this._build( types[ i ], this.data[ types[ i ] ] );
				}
			}

			$( document ).trigger( 'contentChange', [ this.scope ] );
		},

		/**
		 * Handles a styleUpdated event coming from a widget. Simply adds our selector to the data object
		 * then sends it off again.
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		widgetStyleUpdated: function (e, data) {
			e.stopPropagation();

			this.trigger( 'styleUpdated', {
				selector: this.data.selector
			});
		},

		/**
		 * Builds 'widgets' (e.g. background changer) inside this panel
		 *
		 * @param 		{string} 	type	Type of widget
		 * @param 		{data} 		data	Style data for this widget type
		 * @returns 	{void}
		 */
		_build: function (type, data) {
			this.scope.append( 
				$('<div/>')
					.attr('id', this.scope.attr('id') + '_' + type )
					.attr( 'data-controller', 'core.front.vse.panel' + ips.utils.uppercaseFirst( type ) )
					.data( 'styleData', data )
			);
		}
	});
}(jQuery, _));