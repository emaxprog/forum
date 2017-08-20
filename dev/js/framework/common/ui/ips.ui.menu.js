/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.menu.js - Menu component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){

	ips.createModule('ips.ui.menu', function(){

		var defaults = {
			className: 'ipsMenu',
			activeClass: '',
			closeOnClick: true,
			closeOnBlur: true,
			selectable: false,
			withStem: true,
			stemOffset: 25, // half the stem width
			stopLinks: false,
			above: 'auto'
		};

		var stems = ['topLeft', 'topRight', 'topCenter', 'bottomLeft', 'bottomRight', 'bottomCenter'];

		if( !defaults.withStem ){
			defaults.stemOffset = 0;
		}

		var _menuRegistry = {};

		/**
		 * Respond to a menu trigger being clicked
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			e.preventDefault();

			var elemID = $( elem ).identify().attr('id'),
				options = _.defaults( options, defaults );

			if( $( elem ).attr('data-disabled') || $( elem ).is(':disabled') ){
				return;
			}

			if( !$( elem ).data('_menuBody') ){
				var menu = _getMenu(elem, elemID, options);
				$( elem ).data('_menuBody', menu);
			} else {
				var menu = $( elem ).data('_menuBody');
			}

			if( !menu.length ){
				Debug.warn( "Couldn't find or build a menu for " + elemID );
				return;
			}

			$( window ).on( 'resize', function (e) {
				if( menu.is(':visible') ){
					menu.hide();
					_positionMenu( elem, elemID, options, menu, true );
					menu.show();
				} 				
			});

			// Show or hide the menu depending on visibility
			if( !menu.is(':visible') ){
				_showMenu( elem, elemID, options, menu, e );
			} else {
				_hideMenu( elem, elemID, options, menu, false );
			}
		},

		/**
		 * Shows the menu, and sets necessary events
		 *
		 * @param	{element} 	elem 		The element this widget belongs to
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{element} 	menu 		The menu itself
		 * @param	{event} 	e 			The original event
		 * @returns {void}
		 */
		_showMenu = function ( elem, elemID, options, menu, e ) {
			Debug.log(options);
			if( options.closeOnBlur ){
				$( document ).on('click.' + elemID, _.partial( _closeOnBlur, elem, menu ) );
			}

			$( menu )
				.on( 'closeMenu', _.partial( _hideMenu, elem, elemID, options, menu, false ) )
				.on( 'mouseenter', '.ipsMenu_subItems', _.bind( _showSubMenu, this, elem, elemID, options, menu ) );
				

			$( elem ).on( 'closeMenu', _.partial( _hideMenu, elem, elemID, options, menu, false ) ); 

			// Move it into place
			_positionMenu( elem, elemID, options, menu );

			// Show menu
			menu.show();

			// Add active class to trigger
			$( elem ).addClass( options.activeClass );
			$( elem ).trigger('menuOpened', { 
				elemID: elemID,
				originalEvent: e,
				menu: menu
			});
		},

		/**
		 * Shows a submenu
		 *
		 * @param	{element} 	elem 		The element this widget belongs to
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{element} 	menu 		The menu itself
		 * @param	{event} 	e 			The original event
		 * @returns {void}
		 */
		_showSubMenu = function ( elem, elemID, options, menu, e ) {
			var menuItem = $( e.currentTarget ).find('> a');
			var subMenu = menuItem.next('.ipsMenu');

			// Set the mouseleave event on this item
			$( e.currentTarget ).on( 'mouseleave', _.bind( _hideSubMenu, this, elem, elemID, options, menu ) );

			// Try and position the menu
			var itemPosition = ips.utils.position.getElemPosition( menuItem );
			var itemSize = ips.utils.position.getElemDims( menuItem );
			var subMenuSize = ips.utils.position.getElemDims( subMenu );
			
			// If we're in RTL, we should open to the left #attentionToDetail
			if( $('html').attr('dir') == 'rtl' ) {
				
				var right = ( itemSize.outerWidth - 5 );
	
				// If the submenu won't fit to the left of the item, and will fit to the right, then we'll position it there
				if( ( itemPosition.viewportOffset.right + itemSize.outerWidth + subMenuSize.outerWidth - 5 ) > $( window ).width() ){
					if( ( itemPosition.viewportOffset.right + 5 - subMenuSize.outerWidth ) >= 0 ){
						right = ( ( subMenuSize.outerWidth * -1 ) + 5 );
					}
				}
	
				subMenu
					.css({
						right: right + 'px',
						top: ( menuItem.position()['top'] - 5 ) + 'px'
					})
					.show();
				
			} else {
							
				var left = ( itemSize.outerWidth - 5 );
	
				// If the submenu won't fit to the right of the item, and will fit to the left, then we'll position it there
				if( ( itemPosition.viewportOffset.left + itemSize.outerWidth + subMenuSize.outerWidth - 5 ) > $( window ).width() ){
					if( ( itemPosition.viewportOffset.left + 5 - subMenuSize.outerWidth ) >= 0 ){
						left = ( ( subMenuSize.outerWidth * -1 ) + 5 );
					}
				}
	
				subMenu
					.css({
						left: left + 'px',
						top: ( menuItem.position()['top'] - 5 ) + 'px'
					})
					.show();
			
			}
		},

		/**
		 * Hides submenus within the item identified by e.currentTarget
		 *
		 * @param	{element} 	elem 		The element this widget belongs to
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{element} 	menu 		The menu itself
		 * @param	{event} 	e 			The original event
		 * @returns {void}
		 */
		_hideSubMenu = function ( elem, elemID, options, menu, e ) {
			var subMenus = $( e.currentTarget ).closest('.ipsMenu_item').find('.ipsMenu');
			subMenus.hide();
		},

		/**
		 * Hides the menu, and unsets necessary events
		 *
		 * @param	{element} 	elem 		The element this widget belongs to
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{element} 	menu 		The menu itself
		 * @param	{boolean} 	immediate 	Whether to hide this immediately, or animate
		 * @returns {void}
		 */
		_hideMenu = function ( elem, elemID, options, menu, immediate) {
			if( options.closeOnBlur ){
				$( document ).off('click.' + elemID );
			}

			$( elem ).off( 'closeMenu' );
			$( menu ).off( 'closeMenu' );

			// Remove active class on trigger element
			$( elem ).removeClass( options.activeClass );

			// ...then hide it
			if( !immediate ){
				ips.utils.anim.go('fadeOut fast', menu);
			} else {
				menu.hide();
			}

			$( elem ).trigger('menuClosed', { elemID: elemID });
		},

		/**
		 * Positions the menu correctly
		 *
		 * @param	{element} 	elem 		The element this widget belongs to
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options		Options object
		 * @param	{element} 	menu 	 	The menu element
		 * @returns {void}
		 */
		_positionMenu = function (elem, elemID, options, menu, repositioning) {

			var above = options.above;
			if ( above == 'auto' ) {
				above = false;
				if ( ( $(elem).offset().top + menu.height() ) > $(window).height() ) {
					above = true;
				}
			}
			
			var positionInfo = {
				trigger: elem,
				target: menu,
				center: true,
				above: above,
				stemOffset: { left: options.stemOffset, top: 0 }
			};

			// Reset menu positioning
			menu.css({
				left: 'auto',
				top: 'auto',
				position: 'static'
			});

			if( menu.attr('data-originalWidth') ){
				menu.css({
					width: menu.attr('data-originalWidth') + 'px'
				});
			}

			if( options.appendTo ){
				var appendTo = _getAppendContainer( elem, options.appendTo );

				if( appendTo.length ){
					_.extend( positionInfo, {
						targetContainer: appendTo
					});	
				}				
			}

			var menuPosition = ips.utils.position.positionElem( positionInfo );
			var menuDims = ips.utils.position.getElemDims( menu );
			var triggerPosition = ips.utils.position.getElemPosition( $( elem ) );

			// Position the menu with the resulting styles
			menu.css({
				left: menuPosition.left + 'px',
				top: menuPosition.top + 'px',
				position: ( menuPosition.fixed ) ? 'fixed' : 'absolute',
			});

			// Only update zindex if we're showing afresh, rather than simply repositioning
			if( !repositioning ){
				menu.css({
					zIndex: ips.ui.zIndex()
				});
			}

			var newMenuPosition = ips.utils.position.getElemPosition( menu );

			// If the menu is wider than the window, reset some styles
			if( ( menuDims.width > $( document ).width() ) || newMenuPosition.viewportOffset.left < 0 ){
				options.noStem = true;
				
				menu
					.attr( 'data-originalWidth', menuDims.width )
					.css({
						left: '10px',
						width: ( $( document ).width() - 20 ) + 'px'
					});
			}

			// Remove existing stems
			_removeExistingStems( menu, options );

			// Add a stem if needed
			if( !menu.hasClass( options.className + '_noStem') && !options.noStem ){
				var stemClass = '';
					stemClass += menuPosition.location.vertical;
					stemClass += menuPosition.location.horizontal.charAt(0).toUpperCase();
					stemClass += menuPosition.location.horizontal.slice(1);

				menu.addClass( options.className + '_' + stemClass );
			}
		},

		/**
		 * Removes any existing stem classes
		 *
		 * @param	{element} 	menu 	 	The menu element
		 * @param	{object} 	options		Options object
		 * @returns {void}
		 */
		_removeExistingStems = function (menu, options) {
			var stemClasses = [];

			$.each( stems, function (idx, value) {
				stemClasses[ idx ] = options.className + '_' + value;
			});

			menu.removeClass( stemClasses.join(' ') );
		},


		/**
		 * Returns the menu dom node, after setting appropriate events 
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{string} 	elemID 		ID of the trigger element
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {mixed} 	Returns the menu node, or false if it can't be found 	
		 */
		_getMenu = function (elem, elemID, options) {

			// We can find a menu either by ID, or by an option param
			// We can also build it from a provided JSON object
			if( $( '#'+options.menuID ).length ){
				var menu = $( '#'+options.menuID );
			} else if( $( '#'+elemID+'_menu' ).length ){
				var menu = $( '#'+elemID + '_menu' );
			} else if( options.menuContent ) {
				var menu = buildMenuFromJSON( elem, elemID, options.menuContent );
			} else {
				return false;
			}

			// Move menu to appropriate place
			if( options.appendTo ){
				var appendTo = _getAppendContainer( elem, options.appendTo );

				if( appendTo.length ){
					appendTo.append( menu );	
				}				
			} else {
				ips.getContainer().append( menu );
			}

			// Event handler for clicking within the menu
			$( menu ).on('click.' + elemID, _.partial( _menuClicked, elem, elemID, options, menu ) );

			// Add a reference to our trigger
			$( menu ).data('_owner', elem);

			// Add to registry
			_menuRegistry[ elemID ] = { elem: elem, options: options, menu: menu };

			return $(menu);
		},

		/**
		 * Event handler for clicking on the document, outside of the menu or trigger
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{element} 	menu 		The menu element
		 * @param	{event} 	e 			The event object
		 * @returns {void} 	
		 */
		_closeOnBlur = function (elem, menu, e) {

			// This function returns the trigger element that was clicked on, if any
			var clickedOnTrigger = function () {
				if( $( e.target ).is('[data-ipsMenu]') ){
					Debug.log( e.target );
					return e.target;
				} else if ( $( e.target ).parent('[data-ipsMenu]') ){
					return $( e.target ).parent('[data-ipsMenu]').get(0);
				}
			}();

			// Here we loop through each menu we have registered in order to close them
			// Don't hide the menu if:
			// 		- We clicked inside this menu, or
			// 		- We clicked the trigger element for this menu
			// If we have clicked on a trigger, we tell _hideMenu to do an immediate hide
			// so that it feels snappy to the user.
			$.each( _menuRegistry, function (key, value){
				var clickInMenu = _clickIsChildOfMenu( e.target, value.elem, value.menu.get(0) );

				if( value.elem ){
					if( clickInMenu || value.elem == clickedOnTrigger || $.contains( value.elem, e.target ) ){
						return;
					}
				}

				if( value.menu.is(':visible') ){
					_hideMenu( value.elem, key, value.options, value.menu, !!clickedOnTrigger );
				}
			});
		},

		/**
		 * Determines whether the clicked element is within a menu element
		 *
		 * @param	{element} 	clickTarget		The element directly clicked on
		 * @param	{element} 	triggerElem 	An element that triggers a menu
		 * @param	{element} 	menuElem 		The menu element opened by triggerElem
		 * @returns {boolean} 	Whether the click occurred within this menu 	
		 */
		_clickIsChildOfMenu = function (clickTarget, triggerElem, menuElem) {

			// Also check if this is within a jQuery date picker
			// Some jQUI elements are detatched from the dom by the time we get here, so we can't easily check its ancestors to 
			// figure out if it's in a datepicker. Instead, we'll check the classname applied to the clickTarget.
			if( $( clickTarget ).get(0).className.startsWith('ui-datepicker') || $( clickTarget ).closest('#ui-datepicker-div').length ){
				return true;
			}

			if( clickTarget == menuElem || $.contains( menuElem, clickTarget ) ){
				return true;
			}			

			return false;
		},

		/**
		 * Main event handler for the menu itself
		 *
		 * @param	{event} 	e 		The event object
		 * @returns {void}
		 */
		_menuClicked = function (elem, elemID, options, menu, e) {


			if( $( e.target ).hasClass( options.className + '_item' ) ){
				var itemClicked = $( e.target );
			} else {
				var itemClicked = $( e.target ).parents( '.' + options.className + '_item' );
			}

			if( itemClicked.length === 0 ){
				return;
			}

			if( options.stopLinks ){
				e.preventDefault();
			}

			if( itemClicked.hasClass( options.className + '_itemDisabled') || itemClicked.is(':disabled') ){
				return;
			}
			
			if( options.closeOnClick ){
				if( itemClicked.find('[data-action="ipsMenu_ping"]').length ){
					e.preventDefault();
					itemClicked.find('[data-action="ipsMenu_ping"]').each( function () {
						ips.getAjax()( $( this ).attr('href') ).done( function () {
							$( elem ).trigger( 'menuPingSuccessful', {} );
						});
					});
				}
				
				// Cause the selected item to blink briefly, then add
				// a short delay before hiding the menu				
				var addItemClicked = function () {
					itemClicked.addClass( options.className + '_itemClicked');
				};

				var removeItemClicked = function () {
					itemClicked.removeClass( options.className + '_itemClicked');
				};

				if( e.button !== 1 ){
					_.delay( addItemClicked, 100 );
					_.delay( removeItemClicked, 200 );
					_.delay( _hideMenu, 300, elem, elemID, options, menu, false );
				}
			}
			
			if( itemClicked.find('[data-role="ipsMenu_selectedText"]').length ){
				$( elem ).find('[data-role="ipsMenu_selectedText"]').html( itemClicked.find('[data-role="ipsMenu_selectedText"]').html() );
			}

			if( itemClicked.find('[data-role="ipsMenu_selectedIcon"]').length ){
				$( elem ).find('[data-role="ipsMenu_selectedIcon"]').replaceWith( itemClicked.find('[data-role="ipsMenu_selectedIcon"]').clone() );
			}

			var data = {
				triggerElem: elem,
				triggerID: elemID,
				menuElem: $( menu[0] ),
				originalEvent: e
			};

			if( options.selectable ){
				_.extend( data, _handleSelectableClick( elem, elemID, options, menu, e ) );
			}
			
			if( !_.isUndefined( itemClicked.attr('data-ipsmenuvalue') ) ){
				_.extend( data, { selectedItemID: itemClicked.attr('data-ipsmenuvalue') } );
			}
						
			$( elem ).trigger('menuItemSelected', data);
		},

		/**
		 * Handles toggling settings if this is a selectable menu
		 *
		 * @param	{event} 	e 		The event object
		 * @returns {void}
		 */
		_handleSelectableClick = function (elem, elemID, options, menu, e) {

			var thisItem = $( e.target ).parent( '.' + options.className + '_item' );
			
			if( !thisItem.length ){
				return;
			}
			if( thisItem.attr('data-noselect') ){
				return;
			}

			if( options.selectable == 'radio' ){
				menu
					.find( '.' + options.className + '_itemChecked' )
					.removeClass( options.className + '_itemChecked' );
					
				thisItem
					.addClass( options.className + '_itemChecked' )
					.find('input[type="radio"]').prop( 'checked', true )
						.change();
			} else {
				if( thisItem.hasClass( options.className + '_itemChecked' ) ){
					thisItem
						.removeClass( options.className + '_itemChecked' )
						.find('input[type="checkbox"]').prop( 'checked', false )
							.change();
				} else {
					thisItem
						.addClass( options.className + '_itemChecked' )
						.find('input[type="checkbox"]').prop( 'checked', true )
							.change();
				}					
			}			

			// Get selected items
			var selectedItems = menu.find( '.' + options.className + '_itemChecked' ),
				selected = {};

			$.each( selectedItems, function (idx, item) {
				selected[ $( item ).identify().attr( 'id' ) ] = item;
			});

			return {
				selectedItems: selected
			};
		},

		/**
		 * Gets the element into which the menu will be inserted.
		 * We support a comma-delimited list of selectors, and will choose the first that exists.
		 * If an ID is provided, match it explicitly. Other selectors are based on a match with .closest().
		 *
		 * @param 	{element} 	elem 		The trigger element
		 * @param	{string} 	appendTo 	The value from options.appendTo
		 * @returns {element}
		 */
		_getAppendContainer = function (elem, appendTo) {
			var appends = appendTo.split(',');
			var elem = $( elem );

			for( var i = 0; i < appends.length; i++ ){
				var selector = $.trim( appends[i] );

				if( selector.startsWith('#') ){
					if( $( selector ).length ){
						return $( selector );
					}
				} else {
					if( elem.closest( selector ).length ){
						return elem.closest( selector );
					}
				}
			};
		};

		// Register menu as a widget
		ips.ui.registerWidget('menu', ips.ui.menu, 
			[ 'className', 'menuID', 'closeOnClick', 'closeOnBlur', 'menuContent', 'appendTo',
				'activeClass', 'selectable', 'withStem', 'stemOffset', 'stopLinks', 'above' ],
			{ lazyLoad: true, lazyEvents: 'click' } 
		);

		return {
			respond: respond
		};
	});

}(jQuery, _));