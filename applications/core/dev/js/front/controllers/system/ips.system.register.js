/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.register.js - Registration controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.register', {

		usernameField: null,
		timers: { 'username': null, 'email': null },
		ajax: { 'username': ips.getAjax(), 'email': ips.getAjax() },
		popup: null,
		passwordBlurred: true,
		dirty: false,

		initialize: function () {
			this.on( 'keyup', '#elInput_username', this.changeUsername );
			this.on( 'keyup', '#elInput_email_address', this.changeEmail );
			this.on( 'blur', '#elInput_username', this.changeUsername );
			this.on( 'blur', '#elInput_email_address', this.changeEmail );
			this.on( 'keyup', '#elInput_password_confirm', this.confirmPassword );
			this.on( 'blur', '#elInput_password_confirm', this.confirmPassword );
			this.setup();
		},

		/**
		 * Setup method
		 * Loads the template file for registration, and adds an empty element after the username field
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		setup: function () {
			this.usernameField = this.scope.find('#elInput_username');
			this.emailField = this.scope.find('#elInput_email_address');
			this.passwordField = this.scope.find('#elInput_password');
			this.confirmPasswordField = this.scope.find('#elInput_password_confirm');

			// Load the templates we'll need
			ips.loader.get( ['core/front/templates/ips.templates.register.js'] );

			// Build extra element after username
			this.usernameField.after( $('<span/>').attr( 'data-role', 'validationCheck' ) );
			this.emailField.after( $('<span/>').attr( 'data-role', 'validationCheck' ) );
			this.confirmPasswordField.after( $('<span/>').attr( 'data-role', 'validationCheck' ) );
		},

		/**
		 * Event handler for a change on the username field
		 * Waits 700ms, then calls this._doCheck
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		changeUsername: function (e) {
			if( this.timers['username'] ){
				clearTimeout( this.timers['username'] );
			}

			if( this.usernameField.val().length > 4 || e.type != "keyup" ){
				this.timers['username'] = setTimeout( _.bind( this._doCheck, this, 'username', this.usernameField ), 700 );
			} else {
				this._clearResult( this.usernameField );
			}
		},

		/**
		 * Event handler for a change on the email field
		 * Waits 700ms, then calls this._doCheck
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		changeEmail: function (e) {
			if( this.timers['email'] ){
				clearTimeout( this.timers['email'] );
			}
			
			if( ( this.emailField.val().length > 5 && ips.utils.validate.isEmail(this.emailField.val()) ) || e.type != "keyup" ){
				this.timers['email'] = setTimeout( _.bind( this._doCheck, this, 'email', this.emailField ), 700 );
			} else {
				this._clearResult( this.emailField );
			}
		},

		/**
		 * Event handler for a change on the password field
		 * Waits 700ms, then calls this._doCheck
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		changePassword: function (e) {
			if( this.timers['password'] ){
				clearTimeout( this.timers['password'] );
			}

			if( this.passwordField.val().length > 2 || e.type != "keyup" ){
				this.timers['password'] = setTimeout( _.bind( this._doPasswordCheck, this, this.passwordField ), 200 );
			} else {
				this._clearResult( this.passwordField );
			}

			this.confirmPassword();
		},

		/**
		 * Event handler for a change on the confirm password field
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		confirmPassword: function (e) {
			var resultElem = this.confirmPasswordField.next('[data-role="validationCheck"]');

			if( this.passwordField.val() && this.passwordField.val() === this.confirmPasswordField.val() ){
				resultElem.show().html( ips.templates.render('core.forms.validateOk') );
				this.confirmPasswordField.removeClass('ipsField_error').addClass('ipsField_success');
			} else {
				this._clearResult( this.confirmPasswordField );
			}
		},

		/**
		 * Clears a previous validation result
		 *
		 * @returns 	{void}
		 */
		_clearResult: function (field) {
			field
				.removeClass('ipsField_error')
				.removeClass('ipsField_success')
				.next('[data-role="validationCheck"]')
					.html('');
		},

		/**
		 * Fires an ajax request to check whether the username is already in use
		 * Updates the result element depending on the result
		 *
		 * @returns 	{void}
		 */
		_doCheck: function (type, field) {
			var value = field.val();
			var resultElem = field.next('[data-role="validationCheck"]');
			var self = this;

			if( this.ajax[ type ] && this.ajax[ type ].abort ){
				this.ajax[ type ].abort();
			}

			// Set loading
			field.addClass('ipsField_loading');

			// Do ajax
			this.ajax[ type ]( ips.getSetting('baseURL') + '?app=core&module=system&controller=ajax&do=' + type + 'Exists', {
				dataType: 'json',
				data: {
					input: encodeURIComponent( value )
				}
			})
				.done( function (response) {
					if( response.result == 'ok' ){
						resultElem.show().html( ips.templates.render('core.forms.validateOk') );
						field.removeClass('ipsField_error').addClass('ipsField_success');
					} else {
						resultElem.show().html( ips.templates.render( 'core.forms.validateFail', { message: response.message } ) );
						field.removeClass('ipsField_success').addClass('ipsField_error');
					}
				})
				.fail( function () {} )
				.always( function () {
					field.removeClass('ipsField_loading');
				});
		}
	});
}(jQuery, _));