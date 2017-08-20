/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.nav.js - AdminCP Nav
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.nav', {

		_reordering: false,
		_orderChanged: false,
		_currentMenu: null,
		_menuTimer: null,

		initialize: function () {
			this.setup();

			this.on( document, 'click', '#acpMainArea', this.clickMainArea );
			this.on( 'click', '[data-action="reorder"]', this.startReorder );
			this.on( 'click', '[data-action="saveOrder"]', this.saveOrder );
			this.on( 'click', '#elHideMenu', this.toggleMenu );
		},

		setup: function () {
			var self = this;
			var activating;

			this._currentMenu = this.scope.find('.acpAppList_active');

			if( ips.utils.responsive.enabled() && ips.utils.events.isTouchDevice() && ips.utils.responsive.currentIs('tablet') ){
				this.on('click', '> li > a', this.handleTouchMenu);
			} else {
				$('#acpAppMenu').menuAim({
					rowSelector: "> #acpAppList > li:not( #elLogo )",
					enter: function (row) {
						if( $( row ).attr('id') == 'elReorderAppMenu' || $( row ).attr('id') == 'elHideMenu' ){
							activating = self.scope.find('.acpAppList_active');
						}

						if( self._menuTimer ){
							clearTimeout( self._menuTimer );
						}
					},
					activate: function (row) {
						if( $( row ).attr('id') == 'elReorderAppMenu' || $( row ).attr('id') == 'elHideMenu' ){
							activating.addClass('acpAppList_active');
						} else {
							$( row ).addClass('acpAppList_active');
						}
					},
					deactivate: function (row) {
						$( row ).removeClass('acpAppList_active');
					},
					exitMenu: function () {
						self._menuTimer = setTimeout( function () {
							self.scope.find('.acpAppList_active').removeClass('acpAppList_active');
							self._currentMenu.addClass('acpAppList_active');
						}, 2000 );

						return false;
					}
				});
			}
		},

		toggleMenu: function (e) {
			e.preventDefault();
			
			if( $('body').hasClass('cAdminHideMenu') ){
				$('body').removeClass('cAdminHideMenu');
				ips.utils.cookie.unset('hideAdminMenu');
			} else {
				$('body').addClass('cAdminHideMenu');
				ips.utils.cookie.set('hideAdminMenu', true, true);
			}

			this.trigger( 'menuToggle.acpNav' );
		},

		/**
		 * Event handler for touch devices; shows the sub menu on first tap
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		handleTouchMenu: function (e) {
			// If we've already activated it, just go to the link
			if( $( e.currentTarget ).hasClass('acpAppList_active') && $( e.currentTarget ).find('> ul:visible').length ){
				return;
			}

			e.preventDefault();

			// Otherwise, deactivate other menus, show this one
			this.scope.find('.acpAppList_active').removeClass('acpAppList_active').find('> ul').hide();
			$( e.currentTarget )
				.closest('li')
					.addClass('acpAppList_active')
					.find('> ul').show();
		},

		/**
		 * Hides the submenu when the main body is clicked on
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		clickMainArea: function (e) {
			if( ips.utils.responsive.enabled() && ips.utils.events.isTouchDevice() && ips.utils.responsive.currentIs('tablet') ){
				this.scope.find('.acpAppList_active > ul').hide();
			} else {
				if( !this._reordering ){
					$('#acpAppList')
					.removeClass('acpAppList_childHovering')
					.find('> li')
						.trigger('mouseleave');
				}
			}
		},

		/**
		 * Starts the tab reordering interface by building drag handles for each tab
		 * and setting up sortable
		 *
		 * @returns 	{void}
		 */
		startReorder: function () {
			var self = this;

			this.scope.find('> li:not( #elReorderAppMenu ):not( #elHideMenu ) > a').each( function () {
				$( this ).append( ips.templates.render('core.appMenu.reorder') );
			});

			this.scope.find('> li > ul > li h3').each( function () {
				$( this ).prepend( ips.templates.render('core.appMenu.reorder') );
			});

			ips.utils.anim.go( 'zoomIn', this.scope.find('[data-role="reorder"]') );

			this.scope
				.addClass('acpAppList_reordering')
				.sortable({
					start: function (e, ui) {
						ui.item.addClass('acpAppList_dragging');
					},
					stop: function (e, ui) {
						ui.item.removeClass('acpAppList_dragging');
					},
					update: function () {
						self._orderChanged = true;
					}
				})
				.find('#elReorderAppMenu')
					.find('[data-action="reorder"]')
						.addClass('ipsHide')
					.end()
					.find('[data-action="saveOrder"]')
						.removeClass('ipsHide');

			this.scope
				.find('> li > ul')
				.sortable({
					start: function (e, ui) {
						ui.item.addClass('acpAppList_dragging');
					},
					stop: function (e, ui) {
						ui.item.removeClass('acpAppList_dragging');
					},
					update: function () {
						self._orderChanged = true;
					}
				});

			this._reordering = true;
			this._orderChanged = false;
		},

		/**
		 * Saves the new order of tabs, sending an ajax request with the new order
		 *
		 * @returns 	{void}
		 */
		saveOrder: function () {
			// Remove drag handles
			this.scope.find('[data-role="reorder"]').remove();

			// Get serialized list
			var tabOrder = this.scope.sortable( 'toArray', { attribute: 'data-tab'} );
			var subMenus = {};
			var self = this;

			// Get each submenu
			_.each( tabOrder, function (val) {
				if( val ){
					subMenus[ val ] = self.scope.find('> li[data-tab="' + val + '"] > ul').sortable( 'toArray', { attribute: 'data-menuKey' } );
				}
			});

			// Switch tbe buttons around
			this.scope
				.removeClass('acpAppList_reordering')
				.find('#elReorderAppMenu')
					.find('[data-action="reorder"]')
						.removeClass('ipsHide')
					.end()
					.find('[data-action="saveOrder"]')
						.addClass('ipsHide');

			if( this._orderChanged ){
				ips.getAjax()('?app=core&module=system&controller=ajax&do=saveTabs', {
					data: {
						tabOrder: tabOrder,
						menuOrder: subMenus
					},
					dataType: 'json',
					type: 'post'
				} )
				.done( function (response) {
					ips.ui.flashMsg.show( ips.getString('tab_order_saved') );
				})
				.fail( function ( ) {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warning',
						message: ips.getString('tab_order_not_saved'),
						callbacks: {
							ok: function () {}
						}
					});
				});
			}
			this.scope.sortable( 'destroy' );
			this._reordering = false;
		}
	});
}(jQuery, _));