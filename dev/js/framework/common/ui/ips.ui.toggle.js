/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.toggle.js - A toggle UI component that replaces checkboxes
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.toggle', function(){

		// Default widget options
		var defaults = {
			template: 'core.forms.toggle' // The template used to build the toggle
		};

		/**
		 * Responder for toggle widget
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var respond = function (elem, options) {
			if( !$( elem ).data('_toggle') ){
				$( elem ).data('_toggle', toggleObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		// Register this widget with ips.ui
		ips.ui.registerWidget('toggle', ips.ui.toggle, [ 
			'template'
		]);

		return {
			respond: respond
		};
	});


	/**
	 * Toggle instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var toggleObj = function (elem, options, e) {

		var checkID = $( elem ).identify().attr('id'),
			wrapper;

		/**
 		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			
			var status = $( elem ).prop('checked'),
				lang = ( status ) ? ips.getString('toggleOn') : ips.getString('toggleOff'),
				className = ( status ) ? 'ipsToggle_on' : 'ipsToggle_off';

			// Build toggle wrapper
			$( elem )
				.after( 
					ips.templates.render( options.template, {
						id: checkID + '_wrapper',
						status: lang,
						className: className
					})
				)
				.hide();

			// Set events on wrapper
			wrapper = $('#' + checkID + '_wrapper');
			wrapper
				.on( 'click', function (e) {
					if( !$( elem ).is(':disabled') ){
						if( $( elem ).prop('checked') ){
							_doToggle('off');
						} else {
							_doToggle('on');
						}

						$( elem ).change();
					}
					
					e.preventDefault();
				})
				.on( 'keypress', _keyPress );

			// Did checkbox have a tooltip? Put it on the toggle instead
			if( $( elem ).is('[data-ipstooltip]') ){
				wrapper
					.attr('data-ipsTooltip', '')
					.attr('title', $( elem ).attr('title') );

				$( document ).trigger( 'contentChange', [ wrapper ] ); 
			}

			/* Is it disabled? */
			if( $( elem ).is(':disabled') ){
				wrapper.addClass('ipsToggle_disabled');
			}

			// Set events on checkbox
			$( elem )
				.on( 'change', function (e) {
					// The action we take here is the opposite of what's called in the wrapper click
					// event, because by the time the change event is called, the checkbox value has
					// already been changed by the browser.
					if( $( elem ).is(':checked') ){
						_doToggle('on');
					} else {
						_doToggle('off');
					}
				});
		},

		/**
 		 * Change the value of the toggle widget and the checkbox
		 *
		 * @param 		{string} 	type 	'on' or 'off' - the state the widget will be set to
		 * @returns 	{void}
		 */
		_doToggle = function (type) {
			if( type == 'off' ){
				wrapper
					.removeClass('ipsToggle_on')
					.addClass('ipsToggle_off')
					.find('[data-role="status"]')
						.text( ips.getString('toggleOff') );

				elem.get(0).checked = false;
			} else {
				wrapper
					.removeClass('ipsToggle_off')
					.addClass('ipsToggle_on')
					.find('[data-role="status"]')
						.text( ips.getString('toggleOn') );

				elem.get(0).checked = true;
			}

			// Programatically checking a box doesn't fire the change event. Fire it manually so that anything
			// observing the checkbox is told about it.
			//elem.trigger('change');
		},

		/**
 		 * Event handler for keypress when the widget has focus. Enables us to toggle the widget
 		 * with the keyboard
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_keyPress = function (e) {
			if( e.keyCode == ips.ui.key.SPACE || e.keyCode == ips.ui.key.ENTER ){
				e.preventDefault();

				if( $( elem ).prop('checked') ){
					_doToggle('off');
				} else {
					_doToggle('on');
				}

				$( elem ).change();
			}
		};

		init();

		return {
			init: init
		}

	};
}(jQuery, _));