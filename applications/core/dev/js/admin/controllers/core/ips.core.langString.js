/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.langString.js - Faciliates editing language strings in the ACP translator
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.langString', {

		_url: null,
		_hideTimeout: null,
		_currentValue: '',

		initialize: function () {
			this.on( 'change', 'textarea', this.changeTextarea );
			this.on( 'focus', 'textarea', this.focusTextarea );
			this.on( 'blur', 'textarea', this.blurTextarea );
			this.on( 'click', '[data-action="saveWords"]', this.saveWords );
			this.on( 'click', '[data-action="revertWords"]', this.revertWords );	
			this.setup();
		},
		
		/**
		 * Setup method
		 * Replaces the scope element with a textbox containing the scope's HTML
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._url = this.scope.attr('data-saveURL');

			var contents = this.scope.find('a').html();

			var html = ips.templates.render( 'languages.translateString', {
				value: _.unescape( contents )
			});

			this._currentValue = _.unescape( contents );
			
			this.scope.html( html );

			// Set the height to match the cell size
			this.scope.find('textarea').css({
				height: this.scope.closest('td').innerHeight() + 'px'
			});
		},

		/**
		 * Event handler for changing the textarea value
		 *
		 * @returns {void}
		 */
		changeTextarea: function () {
			//
		},

		/**
		 * Event handler for focusing the textarea
		 *
		 * @returns {void}
		 */
		focusTextarea: function () {
			this.scope
				.addClass('cTranslateTable_field_focus')
				.find('textarea')
					.removeClass('ipsField_success')
				.end()
				.find('[data-action]')
					.show();
		},

		/**
		 * Event handler for blurring the textarea
		 * Sets a timeout which hides the buttons in 300ms
		 *
		 * @returns {void}
		 */
		blurTextarea: function () {
			this._saveWords(true);
		},

		/**
		 * Hides the buttons
		 *
		 * @returns {void}
		 */
		_hideButtons: function (e) {
			this.scope.removeClass('cTranslateTable_field_focus');
		},

		/**
		 * Event handler for clicking the save button
		 *
		 * @returns {void}
		 */
		saveWords: function (e) {
			e.preventDefault();
			this._saveWords(false);			
		},

		_saveWords: function (hideButtonsImmediately) {
			var self = this;
			var url = this._url + '&form_submitted=1&csrfKey=' + ips.getSetting('csrfKey');
			var textarea = this.scope.find('textarea');
			var value = textarea.val();

			// Don't save if the value hasn't changed
			if( this._currentValue == value ){
				this._hideButtons();
				return;
			}

			// Remove timeout for hiding buttons
			if( this._hideTimeout ){
				clearTimeout( this._hideTimeout );
			}

			this.scope.find('[data-action]').addClass('ipsButton_disabled');

			// Send the translated string, and show flash message on success
			// On failure we'll reload the page
			ips.getAjax()( url, { type: 'post', data: { lang_word_custom: encodeURIComponent( value ) } } )
				.done( function() {
					textarea
						.removeClass('ipsField_loading')
						.addClass('ipsField_success');

					ips.ui.flashMsg.show( ips.getString('saved') );

					if( !hideButtonsImmediately ){
						self._hideTimeout = setTimeout( _.bind( self._hideButtons, self ), 300 );	
					} else {
						self._hideButtons();
					}

					self._currentValue = value;	
				})
				.fail( function () {
					window.location = url;
				});
		},

		revertWords: function (e) {

		}
	});
}(jQuery, _));
