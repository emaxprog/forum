/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.cms.builder.block.js - Front-end mixin for CMS sidebar 
 *
 * Author: Matt Mecham
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.mixin('builder.block', 'core.front.widgets.block', true, function () {
		
		/**
		 * When the menu is opened, we need to load the form into it
		 *
		 * @returns {void}
		 */
		this.menuOpened = function (e, data) {
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
					url: ips.getSetting('baseURL') + 'index.php?app=cms&module=pages&controller=builder&do=getConfiguration&block=' + block + '&pageID=' + $('#elCmsPageWrap').attr('data-pageid') + '&pageArea=' + area,
					forceReload: true,
					remoteSubmit: true
				});
					
				dialogRef.show();
				Debug.log( dialogRef );
				$('#' + dialogRef.dialogID ).css( "height", "1000px");
				this._modalOpen = block;
			}
			else
			{
				data.menu.html( $('<div/>').addClass('ipsLoading').css({ height: '100px' }) );
				
				setTimeout( function () {
					ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=cms&module=pages&controller=builder&do=getConfiguration', {
						data: {
							block: block,
							pageID: $('#elCmsPageWrap').attr('data-pageid'),
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
		};
		
		/**
		 * Event handler/method that reloads the entire contents of this widget
		 *
		 * @returns {void}
		 */
		this.reloadContent = function () {
			var self = this;

			this._setLoading( true );

			// Get content
			if( this._ajaxObj && this._ajaxObj.abort ){
				this._ajaxObj.abort();
			}
			
			var body = $('body');
			var url = ips.getSetting('baseURL') + 'index.php?app=cms&module=pages&controller=builder&do=getBlock&blockID=' + this._blockID + '&pageID=' + $('#elCmsPageWrap').attr('data-pageid') + '&orientation=' + this._orientation;

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
		};
			
	});
}(jQuery, _));