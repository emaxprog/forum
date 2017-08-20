/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.promote.js - Promotion controller
 *
 * Author: Matt Mecham
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.system.promote', {

		_twitterContent: '',
		_storedContent: {},
		
		initialize: function () {
			this.on( window, 'resize', this.resizeContentArea );
			this.on( 'click', '[data-action="selectImage"]', this.selectImage );
			this.on( 'click', '[data-action="cancelShare"]', this.cancelShare );
			this.on( 'click', '[data-action="enableShare"]', this.enableShare );
			this.on( 'focus', '[name="promote_custom_date"], [name="promote_custom_date_time"]', this.toggleFutureSchedule );
			this.on( 'change', '[name="promote_schedule"]', this.changeSchedule );
			this.on( 'keyup', '[name="promote_social_content_twitter"]', this.twitterContentChange );

			var self = this;
			this.scope.find('[data-action="counter"]').each( function () {
				// Initialise
				self.updateCounter( self.scope.find('[name="' + $(this).attr('data-count-field') + '"]') );
				
				// Watch
				self.on( 'keyup', '[name="' + $(this).attr('data-count-field') + '"]', self.changeCounter );
			} );

			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this.resizeContentArea();
			this.changeSchedule();
			this._saveTwitterContent();
		},

		/**
		 * Store the initial twitter content so we know if it's changed
		 *
		 * @returns {void}
		 */
		_saveTwitterContent: function () {
			if( this.scope.find('[name="promote_social_content_twitter"]').length ){
				this._twitterContent = this.scope.find('[name="promote_social_content_twitter"]').val();
			}
		},

		/**
		 * Called on keyup; if it's the same, show the warning message
		 *
		 * @returns {void}
		 */
		twitterContentChange: function () {
			var val = this.scope.find('#elTextarea_promote_social_content_twitter').val();

			if( val == this._twitterContent ){
				this.scope.find('[data-role="twitterDupe"]').slideDown();
			} else if( this.scope.find('[data-role="twitterDupe"]').is(':visible') ){
				this.scope.find('[data-role="twitterDupe"]').slideUp();
			}
		},

		/**
		 * Hide a share type
		 * Empties the textbox, since this is how the backend handles not sending to a particular service
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		cancelShare: function (e) {
			e.preventDefault();

			var closeButton = $( e.currentTarget );
			var row = closeButton.closest('.ipsFieldRow');
			var textarea = row.find('.ipsFieldRow_content').find('textarea');
			this._storedContent[ textarea.attr('name') ] = textarea.val();
			
			row
				.addClass('cPromoteRow_minimized')
				.find('.ipsFieldRow_content')
					.fadeOut('fast')
				.end()
				.find('textarea')
					.val('')
					.slideUp( function () {				
						closeButton.hide();
					})
				.end();

			if( row.find('[data-action="enableShare"]').length ){
				row.find('[data-action="enableShare"]').fadeIn();
			} else {
				row.append( $('<div/>').addClass('ipsButton ipsButton_veryLight ipsButton_small cPromoteEnable').attr('data-action', 'enableShare').text( ips.getString('enablePromote') ) );
			}
		},

		/**
		 * Re-enables a share type
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		enableShare: function (e) {
			e.preventDefault();

			var enableButton = $( e.currentTarget );
			var row = enableButton.closest('.ipsFieldRow');
			var closeButton = row.find('[data-action="cancelShare"]');
			var textarea = row.find('.ipsFieldRow_content').find('textarea');
			var restoreVal = ! _.isUndefined( this._storedContent[ textarea.attr('name') ] ) ? this._storedContent[ textarea.attr('name') ] : '';
			
			row
				.find('.ipsFieldRow_content')
					.fadeIn('fast')
				.end()
				.find('textarea')
					.val( restoreVal )
					.slideDown( function () {
						closeButton.show();
					})
				.end()
				.find('[data-action="enableShare"]')
					.hide();
		},

		/**
		 * Check an image in the attachment panel
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		selectImage: function (e) {
			e.preventDefault();

			var image = $( e.currentTarget );
			var check = image.find('input[type="checkbox"]');
			var select = image.find('.ipsAttach_selection');
			var wrap = image.closest('.cPromote_attachImage');

			select.toggleClass('ipsAttach_selectionOn', !check.is(':checked') );
			wrap.toggleClass('cPromote_attachImageSelected', !check.is(':checked') );

			check.prop('checked', !check.is(':checked') ).trigger('change');
		},

		/**
		 * Auto-check the 'custom' radio when user focuses in to date/time field
		 *
		 * @returns {void}
		 */
		toggleFutureSchedule: function () {
			this.scope.find('[name="promote_schedule"][value="custom"]').prop('checked', true).trigger('change');
		},

		/**
		 * Dynamically update schedule button text based on selected schedule
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		changeSchedule: function () {
			var val = this.scope.find('[name="promote_schedule"]:checked').val();
			var newString = '';

			switch (val) {
				case 'now':
					newString = ips.getString('promoteImmediate');
				break;
				case 'auto':
					newString = ips.getString('promoteAuto');
				break;
				case 'custom':
					newString = ips.getString('promoteCustom');
				break;
			}

			this.scope.find('[data-role="promoteSchedule"]').text( newString );
		},

		/**
		 * Resizes the mymedia content area to be the correct height for the dialog
		 *
		 * @returns	{void}
		 */
		resizeContentArea: function () {
			// Get size of dialog content
			var dialogHeight = this.scope.closest('.ipsDialog_content').outerHeight();
			var controlsHeight = this.scope.find('.cPromoteSubmit').outerHeight();

			// Set the content area to that height
			if( !ips.utils.responsive.currentIs('phone') ){
				if ( dialogHeight ) {
					this.scope.closest('#elPromoteDialog').css({
						height: ( dialogHeight - controlsHeight - 10 ) + 'px'
					});
				} else {
					this.scope.find('.cPromoteSubmit').css({
						position: 'relative',
						marginTop: '10px'
					});
				}
			} else {
				this.scope.closest('#elPromoteDialog').css({
					paddingBottom: controlsHeight + 'px'
				});
			}
		},
		
		/**
		 * Event to update counter
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeCounter: function (e) {
			this.updateCounter( $(e.currentTarget) );
		},
		
		/**
		 * Change the characters remaining box
		 *	
		 * @param 		{object} 	object 		Object
		 * @returns 	{void}
		 */
		updateCounter: function (object) {
			var counter = this.scope.find('[data-count-field="' + object.attr('name') + '"]' );
			var count = parseInt( counter.attr('data-limit') ) - parseInt( object.val().length );
			
			/* Twitter auto links and counts each autolink as 23 characters */
			if ( object.attr('name').match( /twitter/ ) ) {
				var links = linkify.find( object.val() );
				if ( links.length ) {
					$( links ).each( function( k, link ) {
						if ( link.type == 'url' ) {
							count += link.value.length;
							count -= 23;
						}
					} );
				}
			}
			
			// Update
			counter.text( count ).removeClass('ipsType_negative ipsType_issue');

			if( count <= 0 ){
				counter.addClass('ipsType_negative');
			} else if( count < 15 ){
				counter.addClass('ipsType_issue');
			}
		}

	});
}(jQuery, _));