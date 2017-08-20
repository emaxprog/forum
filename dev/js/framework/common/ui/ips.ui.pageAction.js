/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.pageAction.js - Page action widget
 * Converts a select box of actions (e.g. moderator actions) into a fancy floating button bar with menus.
 * The select should be formatted like the following example. Optgroups are turned into a menu, while options are
 * turned into buttons. optgroups and options can have a data-icon attribue to specify the icon to use.
 * @example
 * 
 *	<select>
 *		<optgroup label="Pin" data-action='pin' data-icon='thumb-tack'>
 *			<option value='pin'>Pin</option>
 *			<option value='unpin'>Unpin</option>
 *		</optgroup>
 *		<option value='split' data-icon='code-fork'>Split</option>
 *	</select>
 * 
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.pageAction', function(){

		var defaults = {};

		var respond = function (elem, options) {
			if( !$( elem ).data('_pageAction') ){
				$( elem ).data('_pageAction', pageActionObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the pageAction instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The pageAction instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_pageAction') ){
				return $( elem ).data('_pageAction');
			}

			return undefined;
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		};

		/**
		 * Page action instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var pageActionObj = function (elem, options) {

			var wrapper = null,
				initialized = false,
				id = '',
				_checkedItems = {};

			/**
			 * Sets up this instance
			 *
			 * @returns 	{void}
			 */
			var init = function () {
				// Hide the tools select
				elem.find('[data-role="pageActionOptions"]').hide();

				// Add events on the checkboxes
				_setUpEvents();
			},

			/**
			 * Destruct this widget on this element
			 *
			 * @returns {void}
			 */
			destruct = function () {
				if( wrapper ){
					wrapper
						.off( 'click', '[data-role="actionButton"]', _selectItem )
						.off( 'menuItemSelected', '[data-role="actionMenu"]', _selectMenuItem );	
				}				
			},

			/**
			 * Public access for the internal _updateBar method
			 *
			 * @returns 	{void}
			 */
			refresh = function () { 
				_refreshPageAction();
				_updateBar();
			},

			/**
			 * Resets the pageAction bar
			 *
			 * @returns 	{void}
			 */
			reset = function () {
				_checkedItems = {};
				_updateBar();
			},

			/**
			 * Sets up events that this instance will watch for
			 *
			 * @returns 	{void}
			 */
			_setUpEvents = function () {
				elem.on( 'change', 'input[type="checkbox"][data-actions]', _toggleCheckbox );
				elem.on( 'refresh.pageAction', _refreshPageAction );
				elem.on( 'addManualItem.pageAction', _addManualItem );
			},

			/**
			 * Allows controllers to manually add an ID to the page action widget if necessary
			 *
			 * @param 		{event} 	e 		Event object
			 * @param 		{object} 	data 	Event data object, containing keys 'id' and 'actions'
			 * @returns 	{void}
			 */
			_addManualItem = function (e, data) {
				_checkedItems[ data.id ] = data.actions;
				_updateBar( true );
			},

			/**
			 * Called when the contents are refreshed. Loops through our checkedItems list, and checks any
			 * of the matching checkboxes found on the page.
			 *
			 * @returns 	{void}
			 */
			_refreshPageAction = function () {
				_.each( _checkedItems, function (val, key) {
					if( elem.find('input[type="checkbox"][name="' + key + '"]').length ){
						elem.find('input[type="checkbox"][name="' + key + '"]').attr( 'checked', true ).trigger('change');
					}
				});
			},

			/**
			 * Updates the display of the bar, including available actions and the count
			 *
			 * @returns 	{void}
			 */
			_toggleCheckbox = function (e) {
				var checkbox = $( e.currentTarget );

				if( checkbox.is(':checked') ){
					_checkedItems[ checkbox.attr('name') ] = checkbox.attr('data-actions');
				} else {
					delete _checkedItems[ checkbox.attr('name') ];
				}

				_updateBar( true );
			},
			
			/**
			 * Updates the display of the bar, including available actions and the count
			 *
			 * @returns 	{void}
			 */
			_updateBar = function (doImmediate) {

				if( !initialized ){
					// Build the action bar
					_buildActionBar();
					doImmediate = true;
					initialized = true;
				}

				var possibleValues = _getActionValues();
				var size = _.size( _checkedItems );

				// Update the bar to show/hide appropriate buttons
				_showCorrectButtons( possibleValues );

				// Center it
				_positionBar();

				// Update the 'with x selected' text
				wrapper.find('[data-role="count"]').text( ips.pluralize( ips.getString('pageActionText_number'), size ) );

				// Animate the wrapper as needed (fade out if none selected)
				if( !size ){
					if( doImmediate ){
						wrapper.hide();
					} else {
						ips.utils.anim.go( 'fadeOut fast', wrapper );
					}
				} else if( initialized ){
					if( wrapper.is(':visible') ){
						ips.utils.anim.go( 'pulseOnce fast', wrapper );	
					} else {
						if( doImmediate ){
							wrapper.show();
						} else {
							ips.utils.anim.go( 'fadeIn', wrapper );
						}
					}					
				}
			},

			/**
			 * Centers the bar by adjusting the margin-left. The other positioning is handled in the CSS (including responsive)
			 *
			 * @returns {void}
			 */
			_positionBar = function () {
				var width = wrapper.outerWidth();
				var newLeft = width / 2;

				wrapper.css({
					marginLeft: ( newLeft * -1 ) + 'px'
				});
			},

			/**
			 * Shows/hides the buttons on the action bar depending on the actions we need
			 *
			 * @param	{array} 	possibleValues		Array of action keys we want to show
			 * @returns {void}
			 */
			_showCorrectButtons = function (possibleValues) {

				// Hide/show each button as needed
				wrapper.find('[data-role="actionMenu"], [data-role="actionButton"]').each( function () {
					var show = false;
					var action = $( this ).attr('data-action');

					// Check buttons
					if( $( this ).is('[data-role="actionButton"]') ){
						
						if( _.indexOf( possibleValues, action ) !== -1 ){
							show = true;
						}

					// Check menus, by checking each individual sub-menu item
					} else {
						var menuID = id + '_' + action + '_menu';

						$( '#' + menuID ).find('[data-ipsMenuValue]').each( function () {
							var menuAction = $( this ).attr('data-ipsMenuValue');

							if( _.indexOf( possibleValues, menuAction ) !== -1 ){
								show = true;
								// Enable this option if the action is relevant
								$( this ).removeClass('ipsMenu_itemDisabled');
							} else {
								$( this ).addClass('ipsMenu_itemDisabled');
							}
						});
					}

					if( show && !$( this ).is(':visible') ){
						$( this ).removeClass('ipsHide');
					} else if( !show && $( this ).is(':visible') ) {
						$( this ).addClass('ipsHide');
					}
				});
			},

			/**
			 * Event handler for clicking a button in the action bar
			 *
			 * @param	{event} 	e			Event object
			 * @returns {void}
			 */
			_selectItem = function (e) {
				e.preventDefault();
				_triggerAction( $( e.currentTarget ).attr('data-action') );
			},

			/**
			 * Event handler for a menu item being clicked
			 *
			 * @param	{event} 	e			Event object
			 * @param	{object} 	data 		Event data object
			 * @returns {void}
			 */
			_selectMenuItem = function (e, data) {
				e.preventDefault();

				if( !_.isUndefined( data.originalEvent ) ){
					data.originalEvent.preventDefault();
				}

				_triggerAction( data.selectedItemID );
			},

			/**
			 * Triggers an action by setting the original select value and submitting the form
			 *
			 * @param	{string} 	action 		Action to trigger
			 * @returns {void}
			 */	
			_triggerAction = function (action) {
				var tools = elem.find('[data-role="pageActionOptions"]');
				
				// Set the select to the value
				tools.find('select').val( action );

				// Add any missing checkboxes as hidden values in the form
				_.each( _checkedItems, function (val, key) {
					if( !elem.find('input[type="checkbox"][name="' + key + '"]').length && !elem.find('input[type="hidden"][name="' + key + '"]').length ){
						elem.append( $('<input/>').attr( 'type', 'hidden' ).attr( 'name', key ).attr( 'data-role', "moderation" ).val(1) );
					}
				});

				// Add page number
				var page = ips.utils.url.getParam('page');

				if( !_.isUndefined( page ) ){
					var pageNumber = $('<input/>').attr( 'type', 'hidden' ).attr( 'name', 'page' ).attr( 'value', ips.utils.url.getParam('page') );
					tools.find('[type="submit"]').before( pageNumber );
					tools.closest('form').attr( 'action', tools.closest('form').attr( 'action' ) + '&page=' +ips.utils.url.getParam('page') );
				}
				
				// Click submit
				tools.find('[type="submit"]').click();
			},

			/**
			 * Builds the action bar
			 *
			 * @returns {void}
			 */
			_buildActionBar = function () {
				var content = '';
				var select = elem.find('[data-role="pageActionOptions"] select');

				// Get ID of select
				id = select.identify().attr('id');

				select.children().each( function () {
					if( $( this ).is('optgroup') ){
						content += _buildOptGroup( $( this ), id );  
					} else {
						content += _buildOption( $( this ), id );
					}
				});

				var bar = ips.templates.render('core.pageAction.wrapper', {
					content: content,
					id: id,
					selectedLang: ips.getString('pageActionText')
				});

				elem.after( bar );

				wrapper = elem.next();

				wrapper
					.on( 'click', '[data-role="actionButton"]', _selectItem )
					.on( 'menuItemSelected', '[data-role="actionMenu"]', _selectMenuItem );

				$( document ).trigger( 'contentChange', [ wrapper ] );
			},

			/**
			 * Build an option group menu for the action bar
			 *
			 * @param	{element} 	optgroup	The optgroup element
			 * @param	{string} 	id 			The ID of the select control this optgroup belongs to
			 * @returns {string}	The built template
			 */
			_buildOptGroup = function (optgroup, id) {
				var content = '';
				var options = optgroup.find('option');

				options.each( function () {
					content += ips.templates.render('core.menus.menuItem', {
						value: $( this ).attr('value'),
						title: $( this ).html(),
						link: '#',
					});
				});

				return ips.templates.render('core.pageAction.actionMenuItem', {
					icon: optgroup.attr('data-icon'),
					title: optgroup.attr('label'),
					id: id,
					action: optgroup.attr('data-action'),
					menucontent: content
				});
			},

			/**
			 * Build an option menu item for the action bar
			 *
			 * @param	{element} 	option 		The option element
			 * @param	{string} 	id 			The ID of the select control this option belongs to
			 * @returns {string} 	The built template
			 */
			_buildOption = function (option, id) {
				return ips.templates.render('core.pageAction.actionItem', {
					icon: option.attr('data-icon'),
					id: id,
					title: option.html(),
					action: option.attr('value')
				});
			},

			/**
			 * Gets the action values from the provided checkboxes
			 *
			 * @param	{element} 	checkboxes 		The checkboxes to get the action values from
			 * @returns {void}
			 */
			_getActionValues = function () {
				var values = [];

				_.each( _checkedItems, function (val, key) {
					var splitValues = val.split(' ');
					values = _.union( values, splitValues );
				});

				return values;
			},

			/**
			 * Retuens a jQuery object of the checked checkboxes
			 *
			 * @returns {element}	Checkbox elements
			 */
			_getCheckedBoxes = function () {
				return elem.find('input[type="checkbox"][data-actions]:checked');
			};

			init();

			return {
				refresh: refresh,
				destruct: destruct,
				bar: wrapper,
				reset: reset
			};
		};

		ips.ui.registerWidget( 'pageAction', ips.ui.pageAction, [] );

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});
}(jQuery, _));