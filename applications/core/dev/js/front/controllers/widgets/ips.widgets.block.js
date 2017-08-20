/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.widgets.block.js - Widget block controller for handling individual widgets
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.widgets.block', {

		_orientation: '',
		_blockID: '',
		_modalOpen: false,
		
		initialize: function () {
			this.setup();

			this.on( 'startManaging.widgets', this.startManaging );
			this.on( 'stopManaging.widgets', this.stopManaging );
			this.on( 'reloadContents.sidebar', this.reloadContent );
			this.on( 'click', '[data-action="removeBlock"]', this.removeBlock );
			this.on( 'menuOpened', this.menuOpened );
			
			$( document ).on( 'submitDialog', _.bind( this.submitDialog, this ) );
			$( document ).on( 'markAllRead', _.bind( this.markAllRead, this ) );
		},

		setup: function () {
			this._blockID = this.scope.attr('data-blockID');
			this._orientation = this.scope.closest('[data-role="widgetReceiver"]').attr('data-orientation');
		},
		
		/**
		 * Triggered by the parent controller, we need to set this block to 'managing' status
		 *
		 * @returns {void}
		 */
		startManaging: function (e, data) {
			if( this.scope.hasClass('ipsWidgetHide') ){
				this.scope.removeClass( 'ipsHide' );
			}
			
			if ( ! this.scope.html() ){
				this.scope.html( ips.templates.render('core.sidebar.blockIsEmpty', {
					text: this.scope.attr('data-blockerrormessage'),
				}) );
			}
			
			if( this.scope.find('.ipsWidgetBlank').length ){
				this.scope.show();
			}
						
			if ( this.scope.attr('data-blockconfig') ) {
				this.scope.append( ips.templates.render('core.sidebar.blockManage', {
					id: this.scope.attr('data-blockID'),
					title: this.scope.attr('data-blockTitle')
				}) );
			} else {
				this.scope.append( ips.templates.render('core.sidebar.blockManageNoConfig', {
					id: this.scope.attr('data-blockID'),
					title: this.scope.attr('data-blockTitle')
				}) );
			}

			$( document ).trigger( 'contentChange', [ this.scope ] );
		},

		/**
		 * Triggered by the parent controller, we need to stop 'managing' this block
		 *
		 * @returns {void}
		 */
		stopManaging: function (e, data) {
			if( this.scope.hasClass('ipsWidgetHide') )
			{
				this.scope.addClass( 'ipsHide' );
			}
			
			if( this.scope.find('.ipsWidgetBlank').length )
			{
				this.scope.hide();
			}

			this.scope.find('.cSidebarBlock_managing').animationComplete( function () {
				this.remove();
			});

			ips.utils.anim.go('fadeOut fast', this.scope.find('.cSidebarBlock_managing') );
		},

		/**
		 * Event handler for removing this block
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		removeBlock: function (e) {
			e.preventDefault();

			this.scope.animationComplete( function () {
				this.remove();
			});
			
			ips.utils.anim.go( 'zoomOut fast', this.scope );
			
			this.trigger('removeWidget.widgets', {
				blockID: this._blockID
			});
		},

		/**
		 * Event handler/method that reloads the entire contents of this widget
		 *
		 * @returns {void}
		 */
		reloadContent: function () {
			var self = this;

			this._setLoading( true );

			// Get content
			if( this._ajaxObj && this._ajaxObj.abort ){
				this._ajaxObj.abort();
			}
			
			var body = $('body');
			var area = this.scope.closest('[data-widgetArea]').attr('data-widgetArea');
			var url  = ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=widgets&do=getBlock&blockID=' + this._blockID + '&pageApp=' + body.attr('data-pageApp') + '&pageModule=' + body.attr('data-pageModule') + '&pageController=' + body.attr('data-pageController') + '&pageArea=' + area + '&orientation=' + this._orientation;

			this._ajaxObj = ips.getAjax()( url )
				.done( function (response) {
					self.scope.hide().html( response );

					ips.utils.anim.go('fadeIn', self.scope);

					self.trigger('loadedWidget.widgets', {
						blockID: self._blockID
					});
				})
				.fail( function () {
					self.scope.html('Error');
				})
				.always( function () {
					self._setLoading( false );
				});
		},

		/**
		 * When the menu is opened, we need to load the form into it
		 *
		 * @returns {void}
		 */
		 menuOpened: function (e, data) {
		 	/* Don't override menus inside the block */
			if ( ! this.scope.closest('[data-widgetArea]').hasClass('cWidgetContainer_managing') )
			{
				return;
			}
			var body = $('body');
			var area = this.scope.closest('[data-widgetArea]').attr('data-widgetArea');
			var block = this._blockID;
			var self = this;
			var managerBlock = $('[data-role="availableBlocks"] [data-blockID="' + this._getBlockIDWithoutUniqueKey( this._blockID ) + '"]');
			var menuStyle = managerBlock.attr('data-menuStyle');
		
			if ( menuStyle == 'modal' )
			{
				var dialogRef = ips.ui.dialog.create({
					title: managerBlock.find('h4').html(),
					url: ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=widgets&do=getConfiguration&block=' + block + '&pageApp=' + body.attr('data-pageApp') + '&pageModule=' + body.attr('data-pageModule') + '&pageController=' + body.attr('data-pageController') + '&pageArea=' + area,
					forceReload: true,
					remoteSubmit: true
				});
					
				dialogRef.show();
				
				this._modalOpen = block;
			}
			else
			{
				data.menu.html( $('<div/>').addClass('ipsLoading').css({ height: '100px' }) );
				
				setTimeout( function () {
					ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=widgets&do=getConfiguration', {
						data: {
							block: block,
							pageApp: body.attr('data-pageApp'),
							pageModule: body.attr('data-pageModule'),
							pageController: body.attr('data-pageController'),
							pageArea: area
						}
					} )
					.done( function (response) {
						data.menu
							.html( response )
							.find('form')
							.on( 'submit', _.bind( self._configurationForm, self, data.menu ) );

						$( document ).trigger('contentChange', [ data.menu ] );
					});
				}, 1000);
			}
		},
		
		/**
		 * Triggered by a modal form save
		 *
		 */
		submitDialog: function( e, data )
		{
			/* Dialog event triggers in all blocks, is this the one we have open? */
			if ( this._modalOpen == this._blockID )
			{
				this._modalOpen = false;
				this.reloadContent();
			}
		},
		
		/**
		 * Marks lists within this block as read
		 *
		 * @returns {void}
		 */
		markAllRead: function () {
			// Update row
			this.scope
				.find('.ipsDataItem, .ipsDataItem_subList')
					.removeClass('ipsDataItem_unread')
					.find('.ipsItemStatus')
						.addClass('ipsItemStatus_read');
		},
		
		/**
		 * Submit handler for the configuration form
		 *
		 * @returns {void}
		 */
		_configurationForm: function (menu, e) {
			var self = this;
			e.preventDefault();

			ips.getAjax()( $( e.currentTarget ).attr('action'), {
				data: $( e.currentTarget ).serialize(),
				type: 'post'
			})
				.done( function (response) {
					if( response === 'OK' ){
						self.reloadContent();
						menu.trigger('closeMenu');
						menu.remove();
					} else {
						menu.html( response );
					}
				})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('sidebarConfigError'),
						callbacks: {}
					});
				});
		},

		/**
		 * Sets the loading status of this widget
		 *
		 * @returns {void}
		 */
		_setLoading: function (status) {
			if( status ){
				this.scope.html('').addClass('ipsLoading cSidebarBlock_loading');
			} else {
				this.scope.removeClass('ipsLoading cSidebarBlock_loading');
			}
		},

		/**
		 * Removes the unique key from the block ID
		 *
		 * @param	{string} 	block 			Block ID with unique key (app_core_whosOnline_4vbvzbw)
		 * @returns {string}
		 */
		_getBlockIDWithoutUniqueKey: function (block) {
			var bits = block.split('_');
			return bits[0] + '_' + bits[1] + '_'  + bits[2];
		}
	});
}(jQuery, _));