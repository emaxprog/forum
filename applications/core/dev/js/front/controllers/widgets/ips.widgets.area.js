/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.widgets.area.js - Widget area controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.widgets.area', {

		_areaID: null,
		_orientation: '',
		_list: null,
		_managing: false,
		_wasUnused: true,
		_readyForDragging: false,

		initialize: function () {
			this.on( 'prepareForDragging.widgets', this.prepareForDragging );
			this.on( 'managingStarted.widgets', this.managingStarted );
			this.on( 'managingFinished.widgets', this.managingFinished );
			this.on( 'loadedWidget.widgets', this.widgetLoaded );
			this.on( 'removeWidget.widgets', this.widgetRemoved );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._areaID = this.scope.attr('data-widgetArea');
			this._orientation = this.scope.attr('data-orientation');
			this._list = this.scope.find('> ul');
			this._registerArea();

			// Determine whether we're showing any blocks to start with
			if( this.scope.find('[data-blockID]').length ){
				this._wasUnused = false;
			}
		},

		/**
		 * Called when we're managing widgets
		 *
		 * @returns {void}
		 */
		managingStarted: function () {
			this._managing = true;
			this.scope.addClass('cWidgetContainer_managing');
			this._setWidgetsToManaging( true );
		},

		/**
		 * Called when we're no longer managing widgets
		 *
		 * @returns {void}
		 */
		managingFinished: function () {
			this._managing = false;
			this.scope.removeClass('cWidgetContainer_managing');
			this._setWidgetsToManaging( false );

			if( this._readyForDragging ){
				this._list.sortable('destroy');	
			}			

			// See whether we have anything to display
			this.scope.toggleClass('ipsHide', !this.scope.find('[data-blockID]').length );
		},

		/**
		 * Prepares the area for drag and drop functionality
		 *
		 * @param 	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		prepareForDragging: function (e, data) {
			var self = this;

			this._list.css({
				zIndex: ips.ui.zIndex(),
			});

			this._list.sortable({
				dragHandle: '.cSidebarBlock_managing',
				receive: _.bind( self.receiveWidget, self ),
				placeholder: 'cSidebarManager_placeholder',
				update: _.bind( self.updateOrdering, self ),
				connectWith: data.selector,
				scroll: true
			});

			this._readyForDragging = true;
		},

		/**
		 * Event handler for the sortable receiving a new widget
		 *
		 * @param 	{event} 	e 	Event object
		 * @param 	{object}	ui 	jQuery UI object
		 * @returns {void}
		 */
		receiveWidget: function (e, ui) {
			var blockID = ui.item.attr('data-blockID');
			var hasConfig = ui.item.attr('data-blockConfig');
			var title	  = ui.item.attr('data-blockTitle');
			var errormsg  = ui.item.attr('data-blockErrorMessage');

			// Create a new widget
			this._buildNewWidget( blockID, this.scope.find('> ul > li').index( ui.item.get(0) ), hasConfig, title, errormsg );

			// Cancel the move because we actually just want to hide it
			ui.sender.sortable('cancel');
			
			if ( ! ui.item.attr('data-allowReuse') )
			{
				ui.item.hide().attr('data-hidden', true);
			}
		},

		/**
		 * Updates the ordering of widgets in this area
		 *
		 * @returns {void}
		 */
		updateOrdering: function (without) {
			if( !this._readyForDragging ){
				Debug.log('trying...');
				setTimeout( _.bind( this.updateOrdering, this ), 500 );
				return;
			}

			var body = $('body');
			var order = this.scope.find('> ul').sortable('toArray', {
				attribute: 'data-blockID'
			});
			
			order = ( without ) ? _.without( _.uniq( order ), without ) : _.uniq( order );

			// Remove hidden blocks as these should not be stored
			var self = this;
			_.each( order, function( value, key )
			{
				if ( self.scope.find('li[data-blockID=' + value + ']').attr('data-hidden') == 'true' )
				{
					order = _.without( order, value );
				}
			} );
			
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=widgets&do=saveOrder', {
				data: {
					order: order,
					pageApp: body.attr('data-pageApp'),
					pageModule: body.attr('data-pageModule'),
					pageController: body.attr('data-pageController'),
					area: this._areaID
				}
			})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('sidebarError'),
						callbacks: {}
					});
				});
		},

		/**
		 * A widget has finished loading itself - if we're in managing state, tell it to set itself so
		 *
		 * @param	{event} 	e 			The event
		 * @param	{object} 	data		Event data object
		 * @returns {void}
		 */
		widgetLoaded: function (e, data) {
			if( this._managing ) {
				$( e.target ).trigger('startManaging.widgets');
			}
		},

		/**
		 * A widget has been removed
		 *
		 * @param	{event} 	e 			The event
		 * @param	{object} 	data		Event data object
		 * @returns {void}
		 */
		widgetRemoved: function (e, data) {
			this.updateOrdering( data.blockID );
		},

		/**
		 * Builds and loads a new widget into the list
		 *
		 * @param	{string} 	blockID		Block ID to load
		 * @param 	{number} 	idx 		Index of the element we'll place the new widget before
		 * @param	{string}	title		Title of the new widget
		 * @param	{string}	errormsg
		 * @returns {void}
		 */
		_buildNewWidget: function (blockID, idx, hasConfig, title, errormsg) {
			
			/* Does this already have a unique ID? */
			var bits       = blockID.split('_');
			var newBlockID = blockID;
			
			if ( _.isUndefined( bits[3] ) )
			{
				newBlockID =  blockID + '_' + Math.random().toString(36).substr(2, 9);
			}
		
			var newWidget = $('<li/>')
				.attr('data-blockID', newBlockID)
				.attr('data-blockTitle', title )
				.addClass('ipsWidget ipsBox')
				.removeClass('ipsWidget_horizontal ipsWidget_vertical')
				.addClass('ipsWidget_' + this._orientation)
				.attr('data-controller', 'core.front.widgets.block')
				.attr('data-blockErrorMessage', errormsg);

			if( hasConfig ){
				newWidget.attr( 'data-blockConfig', "true" );
			}

			var before = $( this.scope.find('> ul > li:not( .cSidebarBlock_placeholder )').get( idx ) );

			if( !_.isUndefined( idx ) && before.length){
				before.before( newWidget );
			} else {
				this.scope.find('> ul').prepend( newWidget );
			}

			// Init new widget
			$( document ).trigger( 'contentChange', [ newWidget ] );

			// Instruct it to load itself
			newWidget.trigger('reloadContents.sidebar');
		},

		/**
		 * Triggers an event on all widgets, to instruct them to set turn on or off 'managing' state
		 *
		 * @param 	{boolean} 	status 	Managing status
		 * @returns {void}
		 */
		_setWidgetsToManaging: function (status) {
			this.triggerOn( 'core.front.widgets.block', ( status ) ? 'startManaging.widgets' : 'stopManaging.widgets' );
		},

		/**
		 * Fires an event that registers this area with the main manager controller
		 *
		 * @returns {void}
		 */
		_registerArea: function () {
			var usedBlocks = this.scope.find('[data-blockID]');
			var blockIDs = [];

			if( usedBlocks.length ){
				usedBlocks.each( function (idx, val) {
					var blockID = $( val ).attr('data-blockID');

					if( blockID ){
						blockIDs.push( blockID );			
					}
				});
			}

			this.trigger( 'registerArea.widgets', {
				areaID: this._areaID,
				areaElem: this.scope,
				ids: blockIDs
			});
		}
	});
}(jQuery, _));