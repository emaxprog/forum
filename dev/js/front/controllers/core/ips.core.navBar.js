/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.navBar.js - Controller for managing the nav bar
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.navBar', {
		
		_defaultItem: null,
		_usingSubBars: true,

		initialize: function () {
			var debounce = _.debounce( this.resizeWindow, 300 );

			this.on( window, 'resize', debounce );
			this.on( 'mouseleave', this.mouseOutScope );
			this.on( 'mouseenter', this.mouseEnterScope );
			
			if( !$('body').attr('data-controller') || $('body').attr('data-controller').indexOf('core.global.customization.visualLang') == -1 ){
				this.setup();
			} else {
				var self = this;
				$('body').on( 'vleDone', function(){
					self.setup();
				});
			}
		},

		/**
		 * Setup method
		 *	
		 * @returns 	{void}
		 */
		setup: function () {			
			this.scope.identify();

			if( this.scope.find('[data-role="secondaryNavBar"]').length < 2 ){
				this._usingSubBars = false;
			}

			// If we have two items active, remove one if it belongs to a drop down list (affects stream items duplicated outside of the menu)
			if( this._usingSubBars && this.scope.find('.ipsNavBar_secondary > li.ipsNavBar_active').length > 1 ){
				$.each( this.scope.find('.ipsNavBar_secondary > li.ipsNavBar_active'), function( i, elem ) {
					if ( $(elem).find('a[data-ipsmenu]').length ) {
						$(elem).removeClass('ipsNavBar_active');
					}
				} );
			}

			// Add a caret to the More menu and move the dropdown if we're not using sub menus
			if( !this._usingSubBars ){
				this.scope.find('#elNavigationMore_dropdown')
					.append(" <i class='fa fa-caret-down'></i>")
					.after( 
						this.scope.find('#elNavigationMore_more_dropdown_menu')
							.attr('id', 'elNavigationMore_dropdown_menu')
					);
			}
			
			// If we have secondary menus, we'll do the normal tab-style navigation. Otherwise,
			// don't bother with the hover functionality
			if( this._usingSubBars ){
				if( ips.utils.events.isTouchDevice() ){
					this.on( 'click', '[data-role="primaryNavBar"] > li > a', this.intentOver );
				} else {
					this.scope.hoverIntent( _.bind( this.intentOver, this ), $.noop, '[data-role="primaryNavBar"] > li' );
				}
			}			

			this._defaultItem = this.scope.find('[data-role="primaryNavBar"] > li > [data-navDefault]').attr('data-navitem-id');

			this._mushAllMenus();
		},

		/**
		 * When the user mouses out of the scope completely, then we remove the active class
		 * on any tabs and hide the submenu within it. Then we immediately show the default
		 * item and its menu. The effect is 'resetting' the menu after mousing out.
		 *	
		 * @returns 	{void}
		 */
		mouseOutScope: function () {
			var self = this;

			if( ips.utils.events.isTouchDevice() ){
				return;
			}

			this._mouseOutTimer = setTimeout( function () {
				self._makeDefaultActive();
				self.scope.find('[data-ipsMenu]').trigger('closeMenu');
			}, 500 );
		},

		/**
		 * When the user mouses over our scope, we'll cancel any timer that's about to reset the menu
		 *	
		 * @returns 	{void}
		 */
		mouseEnterScope: function () {
			clearTimeout( this._mouseOutTimer );
		},

		/**
		 * HoverIntent event handler. Here we fade out all submenus and then fade in the requested menu,
		 * except if the requested is already currently shown.
		 *	
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		intentOver: function (e) {
			var li = $( e.currentTarget );
			var link = li.find('> a');
			var allItems = this.scope.find('[data-role="primaryNavBar"] > li');

			// On touch devices our event handler is on the a instead, so we need to switch
			// out our references here so the following code makes sense.
			if( li.is('a') ){
				li = li.closest('li');
				link = li.find('> a');
			}

			// If this is a touch device, and it's already highlighted, then navigate to the li instead
			if( ips.utils.events.isTouchDevice() && li.hasClass('ipsNavBar_active') ){
				window.location = link.attr('href');
				return;
			}
			
			if( ips.utils.events.isTouchDevice() ){
				e.preventDefault();
			}
			
			this.scope.find('[data-ipsMenu]').trigger('closeMenu');

			allItems.removeClass('ipsNavBar_active').find('> a').removeAttr('data-active');
			li.addClass('ipsNavBar_active');
			link.attr('data-active', true);
		},

		/**
		 * Event handler for resizing the window
		 *	
		 * @returns 	{void}
		 */
		resizeWindow: function () {
			this._mushAllMenus();
		},

		_makeDefaultActive: function () {
			// Switch to the default item when we mouse out of the menu completely
			var link = this.scope.find('[data-navitem-id="' + this._defaultItem + '"]');
			var list = link.closest('li');
			var allItems = this.scope.find('[data-role="primaryNavBar"] > li');

			allItems.removeClass('ipsNavBar_active').find('> a').removeAttr('data-active');
			list.addClass('ipsNavBar_active').find('> a').attr('data-active', true);

			// The active item may now be in the more menu
			if( link.closest('[data-role="secondaryNavBar"]').length ){
				link.closest('[data-role="secondaryNavBar"]').closest('li').addClass('ipsNavBar_active').find('> a').attr('data-active', true);
			}
		},

		/**
		 * Mushes the given menu bar
		 *	
		 * @param 		{element} 	bar 				the menu bar being mushed
		 * @param 		{number} 	widthAdjustment		A value to subtract from the available space in the bar
		 * @returns 	{void}
		 */
		_mushMenu: function (bar, widthAdjustment) {
			var self = this;
			var padding = parseInt( this.scope.css('padding-left') ) + parseInt( this.scope.css('padding-right') );
			var availableSpace = this._getNavElement().width() - widthAdjustment - padding;
			var moreItem = bar.find('> [data-role="navMore"]');
			var moreMenuSize = moreItem.outerWidth();
			var menuItems = bar.find('> li[data-role="navBarItem"]');
			var sizeIncrement = 0;
			var dropdown = bar.find('[data-role="moreDropdown"]');

			if( !moreItem.is(':visible') ){
				moreMenuSize = moreItem.removeClass('ipsHide').outerWidth();
				moreItem.addClass('ipsHide');
			}

			menuItems.each( function () {
				var item = $( this );
				var itemSize = 0;

				// We set the original width on an item so that we can easily
				// sum the width of the menu. Even if we don't mush now, we'll set it
				// for easy use later
				if( item.attr('data-originalWidth' ) ){
					itemSize = parseInt( item.attr('data-originalWidth') );
				} else {
					var o = item.outerWidth() + parseInt( item.css('margin-right') ) + parseInt( item.css('margin-left') );
					item.attr( 'data-originalWidth', o );
					itemSize = o;
				}

				Debug.log('available space: ' + availableSpace );
				
				// If this item will push us over our available size, then mush it
				// We add the more menu manually because we *have* to show that one of course
				if( ( sizeIncrement + itemSize + moreMenuSize ) > availableSpace ){
					
					// Have we been mushed already?
					if( !item.attr('data-mushed') ){

						// Build a new list item containing the contents of our menu item
						var newLI = $('<li/>')
										.attr('data-originalItem', item.identify().attr('id') )
										.append( item.contents() );
						
						if( self._usingSubBars ){
							// If this is the primary nav, then we put it in the sub menu; otherwise,
							// build a dropdown
							if( bar.is('[data-role="primaryNavBar"]') ){
								bar.find('> [data-role="navMore"] > [data-role="secondaryNavBar"]').prepend( newLI );

								//--------------
								// If this item has a submenu, we need to move those into a dropdown
								if( newLI.find('> [data-role="secondaryNavBar"] > li').length ){
									var newA = newLI.find('> a');
									var newDropdown = $('<ul/>')
											.addClass('ipsMenu ipsMenu_auto ipsHide')
											.attr( 'id', newA.identify().attr('id') + '_menu' )
											.attr('data-mushedDropdown', item.identify().attr('id') );
									
									// Move items from the submenu to the new dropdown
									newLI.find('> [data-role="secondaryNavBar"] > li').each( function () {
										if( $( this ).is('[data-role="navMore"]') ){
											return;
										}

										var newMenuItem = $('<li/>').addClass('ipsMenu_item');

										// If this item itself has a submenu, then add the class to make it work
										if( $( this ).find('.ipsMenu').length ){
											newMenuItem.addClass('ipsMenu_subItems');
										}

										newDropdown.append( newMenuItem.append( $( this ).contents() ).attr('data-originalItem', $( this ).identify().attr('id') ) );
									});

									// Now 
									newA
										.attr('data-ipsMenu', '')
										.attr('data-ipsMenu-appendTo', '#' + self.scope.identify().attr('id') )
										.append("<i class='fa fa-caret-down' data-role='mushedCaret'></i>");

									newLI.append( newDropdown );
								}
								//--------------

							} else {
								newLI.addClass('ipsMenu_item');

								// If we have a dropdown inside of this one, add the sub items class to show the >
								if( newLI.find('.ipsMenu').length ){
									newLI.addClass('ipsMenu_subItems');
								}

								dropdown.append( newLI );
							}
						} else {
							// Not using sub bars, so put it in the More dropdown
							self.scope.find('#elNavigationMore_dropdown_menu').append( newLI.addClass('ipsMenu_item') );

							if( newLI.find('.ipsMenu').length ){
								newLI.addClass('ipsMenu_subItems');
							}
						}

						// If the menu item is itself a dropdown menu, we need to adjust the appendTo
						// option for it, otherwise it will try and append it to the now-hidden menu tab.
						var linkInList = newLI.children('a');
						if( linkInList.is('[data-ipsMenu]') ){
							linkInList.attr('data-ipsMenu-appendTo', '#' + newLI.identify().attr('id') );
						}
						
						item.addClass('ipsHide').attr('data-mushed', true);
					}

				} else if( item.attr('data-mushed') ) {

					var mushedParent = null;
					var mushedItem = null;

					// If we're in the primary nav bar, our item will be in the secondayr nav bar; otherwise,
					// the item will be in a dropdown
					if( !self._usingSubBars ){
						mushedParent = self.scope.find('#elNavigationMore_dropdown_menu');
					} else if( bar.is('[data-role="primaryNavBar"]') ){
						mushedParent = bar.find('> [data-role="navMore"] > [data-role="secondaryNavBar"]');
					} else {
						mushedParent = dropdown;
					}

					// If this item has previously been mushed, we can unmush it by moving the contents
					// back to its original location
					var mushedItem = mushedParent.find('[data-originalItem="' + item.identify().attr('id') + '"]');

					// If the menu item itself is a dropdown, we previously adjusted the appendTo option.
					// We now need to set that back to the correct ID
					if( mushedItem.children('a').is('[data-ipsMenu]') ){
						mushedItem.children('a').attr('data-ipsMenu-appendTo', '#' + item.identify().attr('id') );
					}

					// If we found the mushed item, move the contents back to the original place
					if( mushedItem.length ){
						item.append( mushedItem.contents() ).removeClass('ipsHide');
					}

					// If we've moved secondary nav items into a dropdown, we need to move them back
					if( self._usingSubBars && bar.is('[data-role="primaryNavBar"]') ){
						var mushedDropdown = self.scope.find('[data-mushedDropdown="' + item.attr('id') + '"]');
						var secondaryMenu = item.find('> [data-role="secondaryNavBar"]');

						if( mushedDropdown.length ){

							// Move each item in the dropdown back to its correct place
							mushedDropdown.find('> .ipsMenu_item').each( function () {
								var originalItem = self.scope.find( '#' + $( this ).attr('data-originalItem') );
								originalItem.append( $( this ).contents() );
							});

							// Now remove the dropdown
							mushedDropdown.remove();
						}

						item.find('[data-role="mushedCaret"]').remove();
					}

					mushedItem.remove();
					item.removeAttr('data-mushed');
				}

				sizeIncrement += itemSize;
			});
			
			// Show/hide the "More" item as needed
			if( bar.is('[data-role="primaryNavBar"]') ){
				if( this._usingSubBars ){
					moreItem.toggleClass('ipsHide', bar.find('> [data-role="navMore"] > [data-role="secondaryNavBar"] > li').length <= 1 );	
				} else {
					moreItem.toggleClass('ipsHide', !this.scope.find('#elNavigationMore_dropdown_menu > li').length );
				}				
			} else {
				moreItem.toggleClass('ipsHide', dropdown.find('> li').length < 1 );
			}

			this._makeDefaultActive();
		},

		/**
		 * Handles mushing the primary menu and the currently-visible secondary menu
		 *	
		 * @returns 	{void}
		 */
		_mushAllMenus: function () {
			this._mushMenu( this.scope.find('[data-role="primaryNavBar"]'), this.scope.find('#elSearch').outerWidth() );
			this._mushMenu( this.scope.find('[data-role="secondaryNavBar"]:visible'), 0 );
		},
		
		/**
		 * Returns the correct element used for determining nav width
		 *	
		 * @returns 	{element}
		 */
		_getNavElement: function () {
			if( this.scope.hasClass('ipsNavBar_primary') ){
				return this.scope;
			} else {
				return this.scope.find('.ipsNavBar_primary');
			}			
		}
	});
}(jQuery, _));