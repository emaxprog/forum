/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.customization.emoticons.js - Emoticons controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.customization.emoticons', {

		initialize: function () {
			this.on( 'blur', '[data-role="emoticonTyped"]', this.checkTypedValue );
			this.setup();
		},

		/**
		 * Setup method
		 * Makes the emoticon list sortable and sets an event handler for saving the order
		 *
		 * @returns {void}
		 */
		setup: function () {
			this.scope.find('[data-role="setList"]').sortable({
				update: _.bind( this._saveSetOrder, this )
			});
			this.scope.find('[data-role="emoticonsList"]').sortable({
				connectWith: this.scope.find('[data-role="emoticonsList"]'),
				handle: '[data-role="dragHandle"]',
				update: _.bind( this._saveOrder, this )
			});
		},
		
		/**
		 * Checks typed entry to ensure it is valid (no spaces)
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		checkTypedValue: function (e) {
			var elem = $( e.currentTarget );
			var val = elem.val();
			
			elem.val( val.replace( /\s/g, '' ) );
			
			if ( val.match( /\s/ ) ) {
				ips.ui.alert.show({
					type: 'alert',
					message: ips.getString('emoticon_no_spaces'),
					icon: 'warn'
				});
			}
		},
		
		/**
		 * Saves the new emoticon order
		 *
		 * @returns {void}
		 */
		_saveSetOrder: function () {
			var setOrder = [];

			this.scope.find('[data-emoticonSet]').each( function () {
				setOrder.push( $( this ).attr('data-emoticonSet') );
			});

			ips.getAjax()( this.scope.attr('action'), {
				type: 'post',
				data: { setOrder: setOrder }
			});
		},
		
		/**
		 * Saves the new emoticon order
		 *
		 * @returns {void}
		 */
		_saveOrder: function (e, ui) {
			var output = {};
			var item = ui.item;

			// Update the group key for this item after it has been moved
			var group = ui.item.closest('[data-emoticonSet]').attr('data-emoticonSet');
			ui.item.find('.cEmoticons_input > input[type="hidden"]').val( group );

			// Build the array of ordering
			this.scope.find('[data-emoticonGroup]').each( function () {
				var itemOrder = [];

				$( this ).find('[data-emoticonID]').each( function () {
					itemOrder.push( parseInt( $( this ).attr('data-emoticonID') ) );
				});

				output[ $( this ).attr('data-emoticonGroup') ] = itemOrder;
			});

			ips.getAjax()( this.scope.attr('action'), {
				type: 'post',
				data: output
			});
		}
	});
}(jQuery, _));
