/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.messages.folderDialog.js - Folder naming dialog controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.messages.folderDialog', {

		_events: {
			add: 'addFolder',
			rename: 'renameFolder'
		},

		initialize: function () {
			this.on( 'submit', 'form', this.submitName );
		},

		/**
		 * Responds to the model event indicating the folder has been marked as read
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitName: function (e) {
			e.preventDefault();
			e.stopPropagation();

			var type = this.scope.attr('data-type');
			var field = this.scope.find('[data-role="folderName"]');
			var val = field.val();
			var folderID = field.attr('data-folderID');

			this.trigger( this._events[ type ] + '.messages', {
				folder: folderID,
				name: val
			});

			this.trigger('closeDialog');
		}
	});
}(jQuery, _));