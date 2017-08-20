/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.stack.js - Stack widget for use in ACP
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.stack', function(){

		var defaults = {
			sortable: true,
			itemTemplate: 'core.forms.stack'
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_stack') ){
				$( elem ).data('_stack', stackObj( elem, _.defaults( options, defaults ) ) );
			}
		};

		ips.ui.registerWidget( 'stack', ips.ui.stack, [
			'sortable', 'maxItems', 'itemTemplate'
		]);

		return {
			respond: respond
		};
	});

	/**
	 * Stack instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var stackObj = function (elem, options) {

		var stack = null;

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
								
			if ( !elem.attr('data-initiated') ) {
				stack = elem.find('[data-role="stack"]');
	
				// Events
				elem.on( 'click', '[data-action="stackAdd"]', _addItem );
				elem.on( 'click', '[data-action="stackDelete"]', _deleteItem );
				elem.on( 'keydown', '[data-role="stackItem"] input[type="text"]', _keyDown );
	
				if( options.sortable ){
					ips.loader.get( ['core/interface/jquery/jquery-ui.js'] ).then( function () {
						stack.sortable( {
							handle: '[data-action="stackDrag"]'
						});
					});
				}
				
				elem.attr( 'data-initiated', 'true' );

				$( elem ).trigger( 'stackInitialized', {
					count: _getItemCount()
				});
			}
		},

		/**
		 * Event handler for keydown event in a stack textbox
		 * Creates a new stack row if Enter is pressed
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_keyDown = function (e) {
			if( e.keyCode == ips.ui.key.ENTER ){
				e.preventDefault();
				_addItem(null, $( e.currentTarget ).closest('[data-role="stackItem"]') );
			}
		},

		/**
		 * Event handler for the Add Item link
		 * Adds a new stack row, either at the end of the stack or after a provided element
		 *
		 * @param 	{event} 	e 			Event object
		 * @param 	{element} 	[after] 	Optional element after which the new row should be inserted
		 * @returns {void}
		 */
		_addItem = function (e, after) {
						
			if( e ){
				e.preventDefault();
			}

			if( options.maxItems && _getItemCount() >= options.maxItems ){
				return;
			}
			
			var field = stack.find('[data-ipsStack-wrapper]')
				.first()
				.html()
				.replace( /(name=['"][a-zA-Z0-9\-_]+?)\[([^\]]+?)?\]/g, '$1[' + _getItemCount() + ']' )
				.replace( /id=['"](.+?)['"]/g, 'id="$1_' + _getItemCount() + '"' )
				.replace( /data-toggles=['"](.+?)['"]/g, function (match, p1) {
					var pieces = p1.split(',');
					var newPieces = [];

					_.each( pieces, function (val) {
						if( val.match( /_[0-9]+$/g) ){
							newPieces.push( val + '_' + _getItemCount() );
						} else {
							newPieces.push( val );
						}
					});

					return 'data-toggles="' + newPieces.join(',') + '"';
				});

			field = field.replace( /\<input(.+?)value=['"](.*?)['"](.*?)\>/g, '<input$1value=""$3>' );

			if( stack.find('select').length ) {
				field = field.replace( /\<option(.+?)selected(?:=['"]selected["'])?(.*?)\>/g, '<option$1$2>' );
			}

			var html = ips.templates.render( options.itemTemplate, {
				field: field
			});

			// Insert the new row either at the end of the stack or after the current item
			if( after ){
				after
					.after( html )
					.next('[data-role="stackItem"]')
						.find('input,textarea')
							.focus();
			} else {
				stack
					.append( html )
					.find('[data-role="stackItem"] input,[data-role="stackItem"] textarea')
						.last()
						.focus();
			}

			if( options.maxItems && _getItemCount() >= options.maxItems ){
				elem.find('[data-action="stackAdd"]').hide();
			}

			$( document ).trigger( 'contentChange', [ elem ] );

			$( elem ).trigger( 'stackRowAdded', {
				count: _getItemCount()
			});
		},

		/**
		 * Event handler for the Delete Item link
		 * Removes the row from the stack
		 *
		 * @param 	{event} 	e 			Event object
		 * @returns {void}
		 */
		_deleteItem = function (e) {
			e.preventDefault();
			var row = $( e.currentTarget ).closest('[data-role="stackItem"]');

			if( _getItemCount() === 1 ){
				// Only one item left, so just empty it
				row.find('input,textarea').val('');
				row.find("option:selected").removeAttr("selected");
				return;
			}

			ips.utils.anim.go( 'fadeOutDown', row )
				.done( function () {
					row.hide();
					// Add a little timeout before removing, so that any widgets
					// which rely on clicks work properly, e.g. menus
					setTimeout( function () {
						row.remove();
					}, 100);
				});

			if( options.maxItems && _getItemCount() < options.maxItems ){
				elem.find('[data-action="stackAdd"]').show();
			}
		},

		/**
		 * Returns a count of the number of items in the stack
		 *
		 * @returns {number}
		 */
		_getItemCount = function () {
			return stack.find('[data-role="stackItem"]').length;
		};

		init();
	};
}(jQuery, _));