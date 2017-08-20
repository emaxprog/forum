/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.customtags.js - Controller for inserting custom tags into a text/editor element
 *
 * Author: Rikki Tissier & Brandon Farber
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.customtags', {

		editorWrap: null,
		editorSidebar: null,
		editorSidebarHeader: null,
		editorSidebarList: null,

		initialize: function () {
			this.on( 'click', '[data-tagKey]', this.insertTag );
			this.on( 'click', '[data-action="tagsToggle"]', this.toggleSidebar );
			this.setup();
		},

		/**
		 * Setup method. Sets an interval that checks the height of the editor and sets the sidebar
		 * to the same height
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		setup: function () {
			var self = this;

			this.editorWrap = this.scope.find('[data-role="editor"]');
			this.editorSidebar = this.scope.find('.ipsComposeArea_sidebar');
			this.editorSidebarList = this.editorSidebar.find('[data-role="tagsList"]');
			this.editorSidebarHeader = this.editorSidebar.find('[data-role="tagsHeader"]');

			setInterval( function () {
				var editorHeight = self.editorWrap.outerHeight();
				var headerHeight = self.editorSidebarHeader.outerHeight();

				self.editorSidebarList.css({
					height: ( editorHeight - headerHeight ) + 'px'
				});
			}, 300);
		},

		/**
		 * Event handler for toggling the sidebar on and off
		 * Also set a cookie so that the choice is remembered
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleSidebar: function (e) {
			e.preventDefault();

			if( this.editorSidebar.hasClass('ipsComposeArea_sidebarOpen') ) {
				this.editorSidebar
					.removeClass('ipsComposeArea_sidebarOpen')
					.addClass('ipsComposeArea_sidebarClosed');

				ips.utils.cookie.unset('tagSidebar');
			} else {
				this.editorSidebar
					.removeClass('ipsComposeArea_sidebarClosed')
					.addClass('ipsComposeArea_sidebarOpen');

				ips.utils.cookie.set('tagSidebar', true, true);
			}
		},

		/**
		 * Event handler for inserting custom tags defined on the page
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		insertTag: function (e) {
			var content = $( e.currentTarget ).attr('data-tagKey');

			if( this.scope.attr('data-tagFieldType') == 'editor' ){
				$( 'textarea[name="' + this.scope.attr('data-tagFieldID') + '"]' ).closest('[data-ipsEditor]').data('_editor').insertHtml( content );
			} else if( this.scope.attr('data-tagFieldType') == 'codemirror' ) {
				this.scope.trigger('codeMirrorInsert', { elemID: $( e.currentTarget ).closest('[data-codemirrorid]').attr('data-codemirrorid'), tag: content } );
			} else {
				var textField = $('#' + this.scope.attr('data-tagFieldID') );

				textField
					.focus()
					.insertText( content, textField.getSelection().start, 'collapseToEnd' );
			}
		}
	});
}(jQuery, _));