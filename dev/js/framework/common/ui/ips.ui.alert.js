/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.alert.js - Alert widget for alerts, prompts, confirms.
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.alert', function(){

		var respond = function (elem, options) {
			alertObj( options, elem );
		},

		show = function (options) {
			alertObj( options );
		};

		ips.ui.registerWidget('alert', ips.ui.alert, 
			[ 'message', 'type', 'icon', 'focus' ]
		);

		return {
			respond: respond,
			show: show
		};
	});

	/**
	 * Alert instance
	 *
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var alertObj = function (options) {

		var alert = null,
			modal = null;

		var _defaults = {
			type: 'alert', // alert, confirm, prompt, verify
			message: ips.getString('generic_confirm'),
			buttons: {
				ok: ips.getString('ok'),
				cancel: ips.getString('cancel'),
				yes: ips.getString('yes'),
				no: ips.getString('no')
			},
			icon: 'info',
			showIcon: true,
			callbacks: {}
		};

		var _icons = {
			warn: 'fa fa-exclamation-triangle',
			success: 'fa fa-check-circle',
			info: 'fa fa-info-circle',
			ok: 'fa fa-check-circle',
			question: 'fa fa-question-circle'
		};

		options = _.defaults( options || {}, _defaults );

		/**
		 * Initialization
		 *
		 * @returns {void}
		 */
		var init = function () {
			// Build alert
			_buildAlert();
			_setUpEvents();
		},

		/**
		 * Set up events for the alert - button clicks, and document events for keyboard accessibility
		 *
		 * @returns {void}
		 */
		_setUpEvents = function () {
			alert.on( 'click', '[data-action]', _clickButton );

			$( document ).on('keydown', function (e) {
				switch( e.keyCode ){
					case ips.ui.key.ESCAPE:
						if( options.type == 'alert' ){
							alert.find('[data-action="ok"]').click();
						} else {
							alert.find('[data-action="cancel"], [data-action="no"]').click();
						}
					break;
					case ips.ui.key.ENTER:
						alert.find('[data-action="ok"], [data-action="yes"]').click();
					break;
				}
			});	
		},

		/**
		 * Event handler for clicking a button in the alert
		 * Looks for a callback to execute, then removes the alert from the dom
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		_clickButton = function (e) {
			var button = $( e.currentTarget );
			var action = button.attr('data-action');
			var value = null;

			if( options.type == 'prompt' ){
				value = alert.find('[data-role="promptValue"]').val();
			}

			if( _.isFunction( options.callbacks[ action ] ) ){
				options.callbacks[ action ]( value );
			}

			_remove();
		},

		/**
		 * Removes the alert from the dom and unsets the events
		 *
		 * @returns {void}
		 */
		_remove = function () {
			modal.remove();

			ips.utils.anim.go( 'fadeOutDown fast', alert ).done( function () {
				alert.remove();
			});
		},

		/**
		 * Builds the alert element based on options
		 *
		 * @returns {void}
		 */
		_buildAlert = function () {

			var parts = {},
				buttons = [];

			// Icon
			if( options.showIcon ){
				parts.icon = ips.templates.render( 'core.alert.icon', {
					icon: _icons[ options.icon ] || options.icon
				});
			}

			parts.id = 'alert_' + ( Math.round( Math.random() * 10000000 ) );
			parts.text = options.message;

			if( options.subText ){
				parts.subtext = ips.templates.render( 'core.alert.subText', {
					text: options.subText
				});
			}

			// Build buttons
			switch( options.type ){
				case 'alert':
					buttons.push( ips.templates.render( 'core.alert.button', {
						action: 'ok',
						title: options.buttons.ok,
						extra: 'ipsButton_primary'
					}));
				break;
				case 'confirm':
				case 'prompt':
					buttons.push( ips.templates.render( 'core.alert.button', {
						action: 'ok',
						title: options.buttons.ok,
						extra: 'ipsButton_primary'
					}));
					buttons.push( ips.templates.render( 'core.alert.button', {
						action: 'cancel',
						title: options.buttons.cancel,
						extra: 'ipsButton_light'
					}));
				break;
				case 'verify':
					buttons.push( ips.templates.render( 'core.alert.button', {
						action: 'yes',
						title: options.buttons.yes,
						extra: 'ipsButton_primary'
					}));
					if( options.buttons.no ){
						buttons.push( ips.templates.render( 'core.alert.button', {
							action: 'no',
							title: options.buttons.no,
							extra: 'ipsButton_light'
						}));
					}
					if( options.buttons.cancel ){
						buttons.push( ips.templates.render( 'core.alert.button', {
							action: 'cancel',
							title: options.buttons.cancel,
							extra: 'ipsButton_light'
						}));
					}
				break;
			}

			parts.buttons = buttons.join('');

			// Prompt?
			if( options.type == 'prompt' ){
				parts.text += ips.templates.render( 'core.alert.prompt');
			}

			// Build box
			var tmpAlert = $.parseHTML( $.trim( ips.templates.render( 'core.alert.box', parts ) ) );
			alert = $( tmpAlert[0] );
			$('body').append( alert );

			// Build modal
			modal = ips.ui.getModal();
			modal.css({ zIndex: ips.ui.zIndex() }).show();

			alert.css( { zIndex: ips.ui.zIndex() } );
			ips.utils.anim.go('zoomIn fast', alert );

			// Focus the appropriate element
			if( options.focus ){
				alert
					.find('[data-action="' + options.focus + '"]')
						.focus();
			} else {
				if( options.type == 'prompt' ){
					alert
						.find('[data-role="promptValue"]')
							.val( options.value || '' )
							.focus();
				} else {
					alert
						.find('[data-action="ok"], [data-action="yes"]')
							.focus();
				}
			}
		};

		init();

	};
}(jQuery, _));