/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.panelFont.js - VSE font panel controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.panelFont', {

		_data: {},
		
		initialize: function () {
			this.on( 'change', '[data-role="fontColor"]', this.changeFontColor );
			this.setup();
		},

		/**
		 * Setup: builds the font panel
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._data = this.scope.data('styleData');

			this.scope.append( ips.templates.render('vse.panels.wrapper', {
				content: ips.templates.render('vse.panels.font', {
					fontColor: this._data.color
				}),
				type: 'font'
			}) );

			// Add jscolor to boxes
			this.scope.find('input[type="text"].color').each( function () {
				new jscolor.color( this );
			});
		},

		/**
		 * Event handler for the font color box changing value
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeFontColor: function (e) {
			this._data.color = $( e.currentTarget ).val();
			this.trigger('widgetStyleUpdated');
		}
	});
}(jQuery, _));