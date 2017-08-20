/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.image.js - Controller for image properties in editor
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.image', {
		
		_typingTimer: null,
		_textTypingTimer: null,
		_ajaxObj: null,
		_imageWidth: null,
		_ratioWidth: 1,
		_ratioHeight: 1,
		
		initialize: function () {
			this.on( 'submit', 'form', this.formSubmit );
			this.on( 'change', '[data-role="imageHeight"]', this.changeHeight );
			this.on( 'change', '[data-role="imageWidth"]', this.changeWidth );
			this.on( 'click', 'label[for^="image_align"]', this.toggleAlign );
			this.on( 'change', 'input[name="image_aspect_ratio"]', this.toggleRatio );
			this.setup();
		},

		/**
		 * Setup
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			this._ratioWidth = this.scope.attr('data-imageWidthRatio');
			this._ratioHeight = this.scope.attr('data-imageHeightRatio');

			if( this.scope.find('input[name="image_aspect_ratio"]').is(':checked') ){
				this.scope.find('[data-role="imageHeight"]').prop('disabled', true);
			}
		},

		/**
		 * Toggles between the alighment options, highlighting the one the user clicked
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleAlign: function (e) {
			var thisLabel = $( e.currentTarget );
			this.scope.find('label[for^="image_align"]').removeClass('ipsButton_primary').addClass('ipsButton_light');
			thisLabel.removeClass('ipsButton_light').addClass('ipsButton_primary');
		},

		/**
		 * Event handler for toggling the 'preserve aspect ratio' option
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleRatio: function (e) {
			var sameRatio = $( e.currentTarget ).is(':checked');

			if( sameRatio ){
				this.changeWidth();
			}

			this.scope.find('[data-role="imageHeight"]').prop('disabled', sameRatio);
		},

		/**
		 * Event handler for changing the height
		 * Keeps the width in ratio if enabled
		 *
		 * @returns 	{void}
		 */
		changeHeight: function () {
			var sameRatio = this.scope.find('input[name="image_aspect_ratio"]').is(':checked');
			var thisVal = parseInt( this.scope.find('[data-role="imageHeight"]').val() );
			var width = this.scope.find('[data-role="imageWidth"]');
			var widthVal = parseInt( width.val() );

			if( sameRatio ){
				width.val( Math.ceil( thisVal * this._ratioWidth ) );
			}
		},

		/**
		 * Event handler for changing the width
		 * Keeps the height in ratio if enabled
		 *
		 * @returns 	{void}
		 */
		changeWidth: function () {
			var sameRatio = this.scope.find('input[name="image_aspect_ratio"]').is(':checked');
			var thisVal = parseInt( this.scope.find('[data-role="imageWidth"]').val() );
			var height = this.scope.find('[data-role="imageHeight"]');
			var heightVal = parseInt( height.val() );

			if( sameRatio ){
				height.val( Math.ceil( thisVal * this._ratioHeight ) );
			}
		},

		/**
		 * Event handler for submitting the form
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		formSubmit: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this._updateImage(e);
		},

		/**
		 * Event handler for 'insert' url button
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		_updateImage: function (e) {
			
			var widthInput = this.scope.find('[data-role="imageWidth"]');
			var heightInput = this.scope.find('[data-role="imageHeight"]');
			var sameRatio = this.scope.find('input[name="image_aspect_ratio"]').is(':checked');
			var error = false;

			if ( parseInt( widthInput.val() ) > parseInt( widthInput.attr('max') ) ) {
				error = true;
				widthInput.closest('.ipsFieldRow').addClass('ipsFieldRow_error');
				this.scope.find('[data-role="imageSizeWarning"]').text( ips.getString( 'editorImageMaxWidth', { 'maxwidth': widthInput.attr('max') } ) );
			}
			if ( parseInt( heightInput.val() ) > parseInt( heightInput.attr('max') ) ) {
				error = true;
				widthInput.closest('.ipsFieldRow').addClass('ipsFieldRow_error');
				this.scope.find('[data-role="imageSizeWarning"]').text( ips.getString( 'editorImageMaxHeight', { 'maxheight': heightInput.attr('max') } ) );
			}
			
			if ( !error ) {								
				var editor = $( 'textarea[name="' + $( this.scope ).data('editorid') + '"]' ).closest('[data-ipsEditor]').data('_editor');				
				editor.updateImage( widthInput.val(), ( sameRatio ? 'auto' : heightInput.val() ), this.scope.find('[data-role="imageAlign"]:checked').val(), this.scope.find('[data-role="imageLink"]').val(), this.scope.find('[data-role="imageAlt"]').val() );
								
				this.trigger('closeDialog');
			}
		}
	});
}(jQuery, _));