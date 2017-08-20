/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.dashboard.main.js - Admin dashboard controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.dashboard.main', {

		_managing: false,

		initialize: function () {
			this.on( 'click', '.acpWidget_close', this.closeWidget );
			this.on( document, 'menuItemSelected', '#elAddWidgets:not( .ipsButton_disabled )', this.addWidget );
			this.on( 'refreshWidget', '[data-widgetKey]', this.refreshWidget );
			this.setup();
		},

		/**
		 * Setup method
		 * Adds sortable functionality to our two columns
		 *
		 * @returns {void}
		 */
		setup: function () {

			this.mainColumn = this.scope.find('[data-role="mainColumn"]');
			this.sideColumn = this.scope.find('[data-role="sideColumn"]');

			// Set up our sortables
			this.scope.find('[data-role="sideColumn"]').sortable({
				handle: '.acpWidget_reorder',
				forcePlaceholderSize: true,
				placeholder: 'acpWidget_emptyHover',
				connectWith: '[data-role="mainColumn"]',
				tolerance: 'pointer',
				containment: 'window',
				start: this.startDrag,
				stop: _.bind( this.stopDrag, this ),
				update: _.bind( this.update, this )
			});

			this.scope.find('[data-role="mainColumn"]').sortable({
				handle: '.acpWidget_reorder',
				forcePlaceholderSize: true,
				placeholder: 'acpWidget_emptyHover',
				connectWith: '[data-role="sideColumn"]',
				tolerance: 'pointer',
				containment: 'window',
				start: this.startDrag,
				stop: _.bind( this.stopDrag, this ),
				update: _.bind( this.update, this )
			});
		},

		/**
		 * start method for jquery UI
		 * Stops the tooltip from showing while we drag
		 *
		 * @returns {void}
		 */
		startDrag: function () {
			$('body')
				.attr('data-dragging', true)
				.css({
					overflow: 'scroll'
				});
		},

		/**
		 * stop method for jquery UI
		 * Lets the tooltip show agian
		 *
		 * @param 	{event} 	e 		Event object
		 * @param	{object} 	ui 		jQuery UI data object
		 * @returns {void}
		 */
		stopDrag: function (e, ui) {
			
			$('body')
				.removeAttr('data-dragging')
				.css({
					overflow: 'auto'
				});

			// Let the widget know it has been sorted
			$( ui.item ).trigger( 'sorted.dashboard', {
				ui: ui
			});
						
			this._loadWidget( $( ui.item ).attr('data-widgetkey') );

			$('#ipsTooltip').hide();
		},

		/**
		 * update method for jquery UI
		 *
		 * @returns {void}
		 */
		update: function () {
			this._savePositions();
		},

		/**
		 * Handler for the close widget button
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		closeWidget: function (e) {
			e.preventDefault();

			var self = this;
			var widget = $( e.currentTarget ).closest('[data-widgetKey]');

			// Get widget info
			var key = widget.attr('data-widgetKey');
			var name = widget.attr('data-widgetName');

			widget.animationComplete( function () {
				widget.remove();
				self.mainColumn.sortable('refresh');
				self.sideColumn.sortable('refresh');
				self._savePositions();
			});

			widget.animate({ height: 0 });
			ips.utils.anim.go( 'zoomOut fast', widget );

			$('#elAddWidgets_menu').find('[data-ipsMenuValue="' + key + '"]').removeClass('ipsHide');

			this.scope
				.find('#elAddWidgets_button')
					.removeClass('ipsButton_disabled')
					.removeAttr('data-disabled');
		},

		/**
		 * Event handler for clicking an item in the 'add widget' menu
		 * Finds an available gap for the new widget, then inserts it into the page
		 *
		 * @param	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object from the menu widget
		 * @returns {void}
		 */
		addWidget: function (e, data) {
			data.originalEvent.preventDefault();

			// Find menu item
			var item = data.menuElem.find('[data-ipsMenuValue="' + data.selectedItemID + '"]');
			var key = item.attr('data-ipsMenuValue');
			var name = item.attr('data-widgetName');

			// Build widget template
			var newWidget = ips.templates.render('dashboard.widget', {
				key: key,
				name: name
			});

			// Insert it into the main column
			this.mainColumn.prepend( newWidget );
			var newWidgetElem = this.mainColumn.find( '#elWidget_' + key );
			ips.utils.anim.go( 'fadeIn', newWidgetElem );

			// Load it
			this._loadWidget( key );

			// Save it
			this._savePositions();

			// Hide it in the main menu
			setTimeout( function () {
				item.addClass('ipsHide');	
			}, 500);
			

			if( !data.menuElem.find('[data-ipsMenuValue]:not( .ipsHide ):not( [data-ipsMenuValue="' + data.selectedItemID + '"] )').length ){
				this.scope
					.find('#elAddWidgets_button')
						.addClass('ipsButton_disabled')
						.attr( 'data-disabled', true );
			}
		},

		/**
		 * Fetches the contents of a widget from the backend
		 *
		 * @param 	{string} 	key 		Key of widget to load
		 * @returns {void}
		 */
		_loadWidget: function (key) {			
			var widget = this.scope.find( '[data-widgetKey="' + key + '"]' );

			if( !widget.length ){
				return;
			}

			widget.find('[data-role="widgetContent"]')
				.css({
					height: widget.find('[data-role="widgetContent"]').outerHeight() + 'px',
				})
				.html('')
				.addClass('ipsLoading');

			// Start the request
			ips.getAjax()( '?app=core&module=overview&controller=dashboard&do=getBlock', {
				data: {
					appKey: key.substr( 0, key.indexOf( '_' ) ),
					blockKey: key
				}
			})
				.done( function (response) {
					widget.find('[data-role="widgetContent"]')
						.css({
							height: 'auto'
						})
						.html( response )
						.removeClass('ipsLoading');

					// Inform the document
					$( document ).trigger( 'contentChange', [ widget ] );
				});
		},

		/**
		 * Refreshes the contents of a widget
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		refreshWidget: function (e) {
			var key = $( e.currentTarget ).attr('data-widgetKey');
			this._loadWidget( key );
		},

		/**
		 * Saves the widget positions back to the backend
		 *
		 * @returns {void}
		 */
		_savePositions: function () {
			// Get the serialized positions for both columns
			var main = this.mainColumn.sortable( 'toArray', { attribute: 'data-widgetKey' } );
			var side = this.sideColumn.sortable( 'toArray', { attribute: 'data-widgetKey' } );

			/*Debug.log("Current widget list:");
			Debug.log( main );
			Debug.log( side );*/

			ips.getAjax()( '?app=core&module=overview&controller=dashboard&do=update', {
				data: {
					blocks: { 'main': main, 'side': side }
				}
			})
				.done( function () {
					// No need to do anything
				})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('dashboard_cant_save'),
						callbacks: {}
					});
				});
		}

	});
}(jQuery, _));


