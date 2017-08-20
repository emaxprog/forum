/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.tagEditorForm.js - Controller for the tag editing form within a content item
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.tagEditorForm', {
		_placeholder: null,
		_formLoaded: false,
		_menuID: '',
		_tagEditID: '',

		initialize: function () {
			this.on( document, 'menuOpened', this.menuOpened );
			this.on( 'submit', 'form', this.submitForm );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._menuID = this.scope.closest('.ipsMenu').attr('id').replace('_menu', '');
			this._tagEditID = this._menuID.replace('elTagEditor_', '');
		},

		/**
		 * Event handler for 'menuOpened' event. We'll check this is the menu we care about and 
		 * then load the tag editor form if so.
		 *
		 * @param	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		menuOpened: function (e, data) {
			if( data.elemID != this._menuID ){
				return;
			}

			if( this._formLoaded ){
				this._setLoading( true );
			}

			this._formLoaded = true;

			var self = this;
			var url = $( data.originalEvent.currentTarget ).attr('href');

			ips.getAjax()( url )
				.done( function (response) {
					self._setLoading( false );
					self.scope.html( response );
					$( document ).trigger('contentChange', [ self.scope ] );
				})
				.fail( function () {
					window.location = url;
				});
		},

		/**
		 * Event handler for submitting the tag edit form.
		 * On success trigger an event to which the tagEditor controller will respond
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		submitForm: function (e) {
			e.preventDefault();

			// Submit the form
			var self = this;
			var form = $( e.currentTarget );
			var autoComplete = this.scope.find('[data-ipsAutocomplete]');

			// Trigger blur on the autocomplete box
			autoComplete.trigger('blur');

			// This isn't ideal, but to prevent a race condition with the autocomplete where
			// it doesn't tokenify a typed tag in time before this form submits, we need to add
			// a delay.
			setTimeout( function () {
				if( ips.ui.autocomplete.getObj( autoComplete ).hasErrors() ){
					e.preventDefault();
					return;
				}

				self._setLoading( true );

				ips.getAjax()( form.attr('action'), {
					type: 'post',
					data: form.serialize(),
					dataType: 'json'
				})
					.done( function (response) {
						self.scope.trigger('tagsUpdated', {
							tagEditID: self._tagEditID,
							tags: response.tags,
							prefix: response.prefix
						});
						self.scope.trigger('closeMenu');
						setTimeout( function () {
							self._setLoading( false );
						}, 200);
					})
					.fail( function (jqXHR, textStatus, errorThrown) {
						// Error will indicate what happened, e.g. minimum number of tags required
						if( jqXHR.responseJSON ){
							ips.ui.alert.show( {
								type: 'alert',
								icon: 'warn',
								message: jqXHR.responseJSON,
								callbacks: {}
							});
						}
					});
				}, 500);			
		},

		/**
		 * Set the menu into loading state (i.e. show a spinner)
		 *
		 * @param	{boolean} 	loading 		Are we loading?
		 * @returns {void}
		 */
		_setLoading: function (loading) {
			if( loading ){
				if( !this._placeholder ){
					this._buildPlaceholder();
				}	

				// Measure size of form
				var width = this.scope.outerWidth();
				var height = this.scope.outerHeight();

				this.scope.hide();

				this._placeholder
					.show()
					.css({
						width: width + 'px',
						height: height + 'px'
					});
			} else {
				if( this._placeholder ){
					this._placeholder.hide();
					this.scope.show();	
				}				
			}
		},

		/**
		 * Builds an element that will cover the menu contents to show the loading state
		 *
		 * @returns {void}
		 */
		_buildPlaceholder: function () {
			this._placeholder = $('<div/>').addClass('ipsLoading').hide();
			this.scope.after( this._placeholder );
		}
	});
}(jQuery, _));