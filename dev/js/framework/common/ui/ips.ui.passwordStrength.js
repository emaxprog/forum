/* global ips, _ */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.passwordStrength.js - Checks password fields for strength
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.passwordStrength', function(){

		var defaults = {};

		var respond = function (elem, options) {
			if( !$( elem ).data('_passwordStrength') ){
				$( elem ).data('__passwordStrength', passwordStrengthObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Destruct the passwordStrength widgets in elem
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		},

		/**
		 * Retrieve the passwordStrength instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The passwordStrength instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_passwordStrength') ){
				return $( elem ).data('_passwordStrength');
			}

			return undefined;
		};

		ips.ui.registerWidget('passwordStrength', ips.ui.passwordStrength, 
			[ 'enforced', 'enforcedStrength' ]
		);

		return {
			respond: respond,
			getObj: getObj,
			destruct: destruct
		};
	});

	/**
	 * passwordStrength instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var passwordStrengthObj = function (elem, options) {

		var _popup = null,
			_passwordBlurred = false,
			_field = null,
			_dirty = false,
			_timer = null,
			_ajax = ips.getAjax();

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			elem.on( 'focus', 'input[type="password"]', _passwordFocus );
			elem.on( 'blur', 'input[type="password"]', _passwordBlur );
			elem.on( 'keyup blur', 'input[type="password"]', _passwordKeyEvent );

			_field = elem.find('input[type="password"]');
			_field.after( $('<span/>').attr( 'data-role', 'validationCheck' ) );

			// If there's a value already in the box, run now
			if( _field.val() !== '' ){
				_changePassword();
			}
		},

		/**
		 * Destruct
		 * Removes event handlers assosciated with this instance
		 *
		 * @returns {void}
		 */
		destruct = function () {
			if( _timer ){
				clearTimeout( _timer );
			}

			if( _ajax && _ajax.abort ){
				_ajax.abort();
			}

			elem.off( 'focus', 'input[type="password"]', _passwordFocus );
			elem.off( 'blur', 'input[type="password"]', _passwordBlur );
			elem.off( 'keyup blur', 'input[type="password"]', _passwordKeyEvent );
		},

		/**
		 * Focus handler for password field
		 *
		 * @returns 	{void}
		 */
		_passwordFocus = function () {
			if( _.isNull( _popup ) ){
				_buildAdvicePopup();
			}

			_popup.show();
			_positionAdvicePopup();
			_passwordBlurred = false;
		},

		/**
		 * Blur handler for password field
		 *
		 * @returns 	{void}
		 */
		_passwordBlur = function () {
			if( _popup ){
				_popup.hide();
			}

			_passwordBlurred = true;
		},

		/**
		 * Clears error/success status from field
		 *
		 * @returns 	{void}
		 */
		_clearResult = function () {
			// Rmmove error/success classes
			_field
				.removeClass('ipsField_error')
				.removeClass('ipsField_success')
					.next('[data-role="validationCheck"]')
						.html('');
		},

		/**
		 * Main event handler for password field. Sets a timeout so that we don't
		 * bombard the ajax handler with requests.
		 *
		 * @returns 	{void}
		 */
		_passwordKeyEvent = function (e) {
			if( _timer ){
				clearTimeout( _timer );
			}

			if( _field.val().length > 2 || e.type != "keyup" ){
				_timer = setTimeout( _changePassword, 200 );
			} else {
				_clearResult();
			}
		},

		/**
		 * Main business happens here. Fire ajax request to check password
		 * strength; show error or status
		 *
		 * @returns 	{void}
		 */
		_changePassword = function () {
			var value = _field.val();
			var resultElem = _field.next('[data-role="validationCheck"]');
			var wrapper = elem.find('[data-role="strengthInfo"]');
			var meter = elem.find('[data-role="strengthMeter"]');
			var text = elem.find('[data-role="strengthText"]');

			if( _ajax && _ajax.abort ){
				_ajax.abort();
			}

			if( value.length ){
				_dirty = true;
			} else {
				if( !_dirty ){
					return;
				}
			}

			// Show meter if needed
			if( !meter.is(':visible') ){
				ips.utils.anim.go('fadeInDown fast', wrapper);
			}

			// Set loading
			_field.addClass('ipsField_loading');

			// Do _ajax
			_ajax( ips.getSetting('baseURL') + '?app=core&module=system&controller=ajax&do=passwordStrength', {
				dataType: 'json',
				data: {
					input: value
				},
				method: 'post'
			})
				.done( function (response) {
					if( response.result == 'ok' ){
						
						meter.val( response.granular );
						meter.attr( 'data-adviceValue', response.score );
						text.html( ips.getString('strength_' + response.score) );

						if( options.enforced ){
							_clearResult();

							if( response.score >= parseInt( options.enforcedStrength ) ){
								// If our score is above the threshold show the success state
								resultElem.show().html( ips.templates.render('core.forms.validateOk') );
								_field.addClass('ipsField_success');

								// If the row has error status (i.e. we arrived at this page with an error)
								// remove it.
								_field.closest('.ipsFieldRow')
									.removeClass('ipsFieldRow_error')
									.find('.ipsType_warning')
										.hide();	
							} else {
								// If our score is below the threshold and we're blurred
								// show the error state
								if( _passwordBlurred ){
									resultElem
										.show()
										.html( ips.templates.render( 'core.forms.validateFail', { 
											message: ips.getString('err_password_strength', { 
												strength: ips.getString('strength_' + options.enforcedStrength ) 
											}) 
										}));
									_field.addClass('ipsField_error');
								}
							}
						}
					} else {
						resultElem.show().html( ips.templates.render( 'core.forms.validateFail', { message: response.message } ) );
						_field.removeClass('ipsField_success').addClass('ipsField_error');
					}
				})
				.fail( function () {} )
				.always( function () {
					_field.removeClass('ipsField_loading');
				});
		},

		/**
		 * Builds the advice popup
		 *
		 * @returns 	{void}
		 */
		_buildAdvicePopup = function () {
			var text = ips.getString('password_advice');
			var min = false;

			if( !_.isNull( _popup ) ){
				return;
			}

			if( options.enforced ){
				min = ips.getString('err_password_strength', { strength: ips.getString('strength_' + options.enforcedStrength) } );
			}

			var tmpPopup = ips.templates.render('core.forms.advicePopup', {
				id: elem.identify().attr('id'),
				min: min,
				text: text
			});

			$('body').append( tmpPopup );

			_popup = $('body').find( '#elPasswordAdvice_' + elem.identify().attr('id') );
		},

		/**
		 * Positions the advice popup
		 *
		 * @returns 	{void}
		 */
		_positionAdvicePopup = function () {
			var isRTL = $('html').attr('dir') == 'rtl';
			var position = _field.offset();
			var fieldWidth = _field.width();
			var fieldHeight = _field.height();
			var adviceWidth = _popup.width();
			var adviceHeight = _popup.height();
			var windowWidth = $( window ).width();
			var stemOffset = 30;

			_popup
				.removeClass('cStem_rtl cStem_ltr cStem_above')
				.css({
					position: 'absolute',
					zIndex: ips.ui.zIndex()
				});

			if( isRTL && ( position.left - adviceWidth - stemOffset ) > 0 ){
				_popup
					.addClass('cStem_rtl')
					.css({
						top: ( position.top - ( stemOffset / 2 ) ) + 'px',
						left: ( position.left - stemOffset - adviceWidth ) + 'px'
					});
			} else if( !isRTL && ( position.left + fieldWidth + adviceWidth + stemOffset ) < windowWidth ) {
				_popup
					.addClass('cStem_ltr')
					.css({
						top: ( position.top - ( stemOffset / 2 ) ) + 'px',
						left: ( position.left + fieldWidth + stemOffset ) + 'px'
					});
			} else {
				_popup
					.addClass('cStem_above')
					.css({
						top: ( position.top - ( stemOffset / 2 ) - adviceHeight ) + 'px',
						left: ( position.left + ( fieldWidth / 2 ) - ( adviceWidth / 2 ) ) + 'px'
					});
			}
		};

		init();

		return {
			destruct: destruct
		};
	};

}(jQuery, _));