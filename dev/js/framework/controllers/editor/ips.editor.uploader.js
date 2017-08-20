/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.uploader.js - Editor uploader controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.uploader', {

		initialize: function () {
			this.on( 'addUploaderFile', this.addUploaderFile );
			this.on( 'removeAllFiles', this.removeAllFiles );
			this.on( 'fileDeleted', this.fileDeleted );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns	{void}
		 */
		setup: function () {
			this.scope.find('[data-role="fileContainer"]').each( function(){
				if( $( this ).children().length > 0 ){
					$( this ).parent().removeClass('ipsHide');
				}
			});
		},

		/**
		 * Intercepts the addUploaderFile event from ips.ui.uploader, so that we can show
		 * the attachment differently depending on whether it's a file or image.
		 *
		 * @param	{event}		e		Event Object
		 * @param	{event}		data	Event data object
		 * @returns	{void}
		 */
		removeAllFiles: function (e, data) {
			this.scope.find('[data-role="files"], [data-role="images"]').hide();
			this.scope.find('[data-role="fileList"]').hide();
		},

		/**
		 * Intercepts the addUploaderFile event from ips.ui.uploader, so that we can show
		 * the attachment differently depending on whether it's a file or image.
		 *
		 * @param	{event}		e		Event Object
		 * @param	{event}		data	Event data object
		 * @returns	{void}
		 */
		addUploaderFile: function (e, data) {
			e.stopPropagation();

			var container = null;
			var template = 'core.attachments.';

			this.scope.find('[data-role="fileList"]').show();

			// Show the appropriate container for this kind of file
			if( data.isImage ){
				container = this.scope.find('[data-role="images"]');
				template += 'imageItem';
			} else {
				container = this.scope.find('[data-role="files"]');
				template += 'fileItem';
			}

			container
				.show()
				.find('[data-role="fileContainer"]')
					.append( ips.templates.render( template, data ) );
		},

		/**
		 * Event handler for the fileDeleted event from ips.ui.uploader. Hides our
		 * attachment container if no more files exist.
		 *
		 * @param	{event}		e		Event Object
		 * @param	{event}		data	Event data object
		 * @returns	{void}
		 */
		fileDeleted: function (e, data) {
			var count = 0;

			// See if we need to hide either of the containers
			this.scope.find('[data-role="fileContainer"]').each( function () {
				if( !$( this ).find('.ipsAttach').length ){
					$( this ).closest('[data-role="files"], [data-role="images"]').hide();
					count++;
				}
			});

			if( count == 2 ){
				this.scope.find('[data-role="fileList"]').hide();
			}
		}
	});
}(jQuery, _));