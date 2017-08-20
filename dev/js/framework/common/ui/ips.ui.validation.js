/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.validation.js - A form validation UI component
 * A wrapper for our main form validation that enables us to show
 * pretty messages to the user, and expose a data api
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.validation', function(){

		var defaults = {
			live: true,
			submit: true,
			characterLimit: 3,
			displayAs: 'list'
		};

		/**
 		 * Respond to a dialog trigger
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			if( !$( elem ).data('_validation') ){
				$( elem ).data('_validation', validateObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		/**
		 * Validation instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var validateObj = function (elem, options) {

			/**
			 * Sets up this instance
			 * Adds necessary events using delegates to fields in this form
			 *
			 * @returns 	{void}
			 */
			var init = function () {
				
				// Set up events
				if( options.live ){
					// Text-like inputs
					$( elem ).on( 'keyup blur', 'input:not( [type="button"] ):not( [type="checkbox"] ):not( [type="hidden"] )' + 
						':not( [type="radio"] ):not( [data-validate-bypass] ), textarea:not( [data-validate-bypass] )', _textEvent );	

					// Selects
					$( elem ).on( 'change', 'select', _selectEvent );
				}

				if( options.submit ){
					$( elem ).closest('form').on( 'submit', _submitEvent );
				}				
			},

			/**
			 * Handles the form submit event
			 *
			 * @param	{event} 	e 		Event object
			 * @returns {void}
			 */
			_submitEvent = function (e) {
				var errors = 0;

				// Find all relevant fields
				var elements = $( elem ).find('input:not( [type="submit"] ):not( [type="checkbox"] )' + 
						':not( [type="radio"] ):not( [type="hidden"] ), select, textarea');

				// Validate each field in turn
				elements.each( function () {
					if( !_validate( $( this ) ) ){
						errors++;
					}
				});

				if( errors > 0 ){
					e.preventDefault();
					$( e.currentTarget ).trigger( 'error.validation', { count: errors } );
				} else {
					$( e.currentTarget ).trigger( 'success.validation' );
				}
			},

			_selectEvent = function (e) {

			},

			/**
			 * Handles events on text-like fields
			 *
			 * @param	{element} 	elem 		The element this widget is being created on
			 * @param	{object} 	options 	The options passed into this instance
			 * @returns {void}
			 */
			_textEvent = function (e) {
				var field = $( e.currentTarget );

				// If this is the blur event, only validate if we're above the character limit or this is a numerical field
				// If this is the keyup event, only validate if we're currently displaying some errors
				if( e.type == 'blur' || e.type == 'focusout' ){
					if( field.val().length >= options.characterLimit || field.is('[type="number"], [type="range"]') ){
						_validate( field );	
					}			
				} else {
					if( field.attr('data-hasErrors') ){
						_validate( field );
					} 
				}
			},

			/**
			 * Validates an individual field, displaying or clearing errors as needed
			 *
			 * @param	{element} 	target 		The element being validated
			 * @returns {boolean}	Whether the field is valid
			 */
			_validate = function (target) {
				var result = ips.utils.validate.validate( target );

				if( result !== true && !result.result ){
					_displayErrors( target, result );
				} else {
					_clearErrors( target );
				}

				return result.result;
			},

			/**
			 * Displays errors for a field
			 *
			 * @param	{element} 	target 		The element being validated
			 * @param	{object} 	results 	Results object returned from ips.utils.validate.validate
			 * @returns {void}
			 */
			_displayErrors = function (target, results) {
				var id = target.identify().attr('id');
				var errorList = $( '#' + id + '_errors' );

				// Build error list if necessary
				if( !errorList.length ) {
					var wrapper = ips.templates.render( 'core.forms.validationWrapper', {
						id: id + '_errors'
					} );

					target.after( wrapper );
					errorList = $('#' + id + '_errors');
				}

				// Reset contents of list
				errorList.html('');

				// Loop through each message
				for( var i = 0; i < results.messages.length; i++ ){
					errorList.append( ips.templates.render( 'core.forms.validationItem', {
						message: results.messages[ i ].message
					}));
				}

				// Add error class and attribute to the input
				target
					.addClass('ipsField_error')
					.attr( 'data-hasErrors', true );
			},

			/**
			 * Clears errors for a field
			 *
			 * @param	{element} 	target 		The form element being cleared
			 * @returns {void}
			 */
			_clearErrors = function (target) {
				var id = target.identify().attr('id');

				if( $( '#' + id + '_errors').length ){
					$( '#' + id + '_errors' ).remove();
				}

				// Remove classname and attribute
				target
					.removeClass('ipsField_error')
					.removeAttr('data-hasErrors');
			}

			init();

			return { };
		};

		ips.ui.registerWidget('validation', ips.ui.validation);

		return {
			respond: respond
		};
	});
}(jQuery, _));