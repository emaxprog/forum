/**
 * IPS Social Suite 4
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.tagEditor.js - Quick tag editing
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.tagEditor', {

		_minTags: null,
		_maxTags: null,
		_count: 0,
		_tagEditID: '',

		initialize: function () {
			this.on( 'click', '[data-action="removeTag"]', this.removeTag );
			this.on( document, 'tagsUpdated', this.tagsUpdated );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			this._tagEditID = this.scope.attr('data-tagEditID');

			// How many tags do we have?
			this._minTags = this.scope.attr('data-minTags') || null;
			this._maxTags = this.scope.attr('data-maxTags') || null;
			this._setCount();
			this._checkMinMax();
		},

		/**
		 * Event handler for tagsUpdated method, triggered by the tagEditorForm controller inside the dropdown menu
		 * Lets us know that tags have changed so that we can update the UI
		 *
		 * @param	{event} 	e 		Event object
		 * @param 	{object} 	data 	Event data object
		 * @returns {void}
		 */
		tagsUpdated: function (e, data) {
			if( data.tagEditID !== this._tagEditID ){
				return;
			}

			// Remove existing tags, and then reapply with new HTML
			this.scope.find('.ipsTag').closest('li').remove();
			this.scope.prepend( data.tags );

			// Is there an editable prefix?
			var editablePrefix = $('body').find('[data-editablePrefix]');

			if( editablePrefix.length ){
				if( data.prefix ){
					editablePrefix.html( data.prefix ).removeClass('ipsHide');
				} else {
					editablePrefix.html('').addClass('ipsHide');
				}
			}

			// Count tags
			this._setCount();
			this._checkMinMax();

			// Show flash message
			ips.ui.flashMsg.show( ips.getString('tagsUpdated') );
		},

		/**
		 * Event handler for clicking the 'x' on a tag to remove it
		 *
		 * @param	{event} 	e 		Event object
		 * @returns {void}
		 */
		removeTag: function (e) {
			e.preventDefault();

			var self = this;
			var remove = $( e.currentTarget );
			var url = remove.attr('href');
			var tagContainer = remove.closest('li');
			var tag = tagContainer.find('.ipsTag');

			// Fade it out since we'll assume we can remove it
			tagContainer.fadeOut('fast');

			// Adjust count
			this._count--;
			this._checkMinMax();

			ips.getAjax()( url, {
				bypassRedirect: true
			})
				.done( function () {
					ips.ui.flashMsg.show( ips.getString('tagRemoved') );

					// Add a small timeout on actually removing it from the dom to allow animation to finish
					setTimeout( function () {
						tagContainer.remove();
					}, 200 );
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					tagContainer
						.stop()
						.show()
						.css({
							opacity: 1
						});

					self._count++;

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
		},

		/**
		 * Hides the 'x' or add tag button appropriately depending on the current status of tags
		 *
		 * @returns {void}
		 */
		_checkMinMax: function () {
			var allowRemove = !( this._minTags && this._count <= this._minTags );

			// Hide the remove links if needed			
			this.scope
				.find('[data-action="removeTag"]')
					.toggle( allowRemove )
				.end()
				.find('.ipsTags_deletable')
					.toggleClass( 'ipsTags_deletable', allowRemove );

			// Hide the add link if needed
			this.scope.find('.ipsTags_edit').toggle( !( this._maxTags && this._count >= this._maxTags ) );
		},

		_setCount: function () {
			var prefix = this._getPrefix();
			var count = this.scope.find('.ipsTag').length;

			if( prefix.length && prefix.is(':visible') ){
				count++;
			}

			this._count = count;
		},

		_getPrefix: function () {
			return $('body').find('[data-editablePrefix]');
		}
	});
}(jQuery, _));