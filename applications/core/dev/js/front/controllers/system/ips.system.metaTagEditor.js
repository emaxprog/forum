/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.metaTagEditor.js - Live meta tag editor functionality
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.metaTagEditor', {

		_changed: false,

		initialize: function () {
			this.on( 'click', '[data-action="addMeta"]', this.addMetaBlock );
			this.on( 'change', 'input, select', this.changed );
			this.on( 'submit', 'form', this.formSubmit );
			this.on( window, 'beforeunload', this.beforeUnload );
			this.setup();
		},

		setup: function () {
			this.scope.css({
				zIndex: 10000
			});
		},

		/**
		 * Event handler for submitting the meta tags form
		 *
		 * @returns 	{void}
		 */
		formSubmit: function (e) {
			var form = $( e.currentTarget );
			
			if ( form.attr('data-noAjax') ) {
				return;
			}

			e.preventDefault();

			var self = this;

			form.find('.ipsButton').prop( 'disabled', true ).addClass('ipsButton_disabled');

			// Send ajax request to save
			ips.getAjax()( form.attr('action'), {
				data: form.serialize(),
				type: 'post'
			})
				.done( function () {
					ips.ui.flashMsg.show( ips.getString('metaTagsSaved') );
					form.find('.ipsButton').prop( 'disabled', false ).removeClass('ipsButton_disabled');
					self._changed = false;
				})
				.fail( function () {
					form.attr('data-noAjax', 'true');
					form.submit();
				});
		},

		/**
		 * Warns the user if they've got unsaved changes
		 *
		 * @returns 	{string|null}
		 */
		beforeUnload: function () {
			if( this._changed ){
				return ips.getString('metaTagsUnsaved');
			}
		},

		/**
		 * Clones a new set of meta tag elements
		 *
		 * @returns 	{void}
		 */
		addMetaBlock: function () {
			// Duplicate the metaTemplate block and append it to the list
			var copy = this.scope.find('[data-role="metaTemplate"]').clone().removeAttr('data-role').hide();

			$('#elMetaTagEditor_tags').append( copy );

			ips.utils.anim.go( 'fadeIn', copy );
		},

		/**
		 * Called when an input changes, so we can later warn the use rif they leave the page
		 *
		 * @returns 	{void}
		 */
		changed: function (e) {
			this._changed = true;
		}
	});
}(jQuery, _));