/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.messages.folder.js - Message folders model
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.model.register('messages.folder', {

		initialize: function () {
			this.on( 'loadFolder.messages', this.loadFolder );
			this.on( 'addFolder.messages', this.addFolder );
			this.on( 'renameFolder.messages', this.renameFolder );
			this.on( 'markFolder.messages', this.markFolder );
			this.on( 'emptyFolder.messages', this.emptyFolder );
			this.on( 'searchFolder.messages', this.searchFolder );
			/*this.on( 'markFolderRead.messages', this.markFolderRead );
			this.on( 'emptyFolder.messages', this.emptyFolder );*/
			this.on( 'deleteFolder.messages', this.deleteFolder );
			this.on( 'deleteMessages.messages', this.deleteMessages );
		},

		searchFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger',
				dataType: 'html',
				data: data,
				events: 'searchFolder',
				namespace: 'messages'
			}, data);
		},

		loadFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger',
				dataType: 'json',
				data: {
					folder: data.folder,
					sortBy: data.sortBy,
					filter: data.filter,
					overview: 1
				},
				events: 'loadFolder',
				namespace: 'messages'
			}, data);
		},

		addFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=addFolder',
				dataType: 'json',
				data: {
					messenger_add_folder_name: data.name,
					form_submitted: 1
				},
				events: 'addFolder',
				namespace: 'messages'
			}, data);
		},

		renameFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=renameFolder',
				dataType: 'json',
				data: {
					folder: data.folder,
					messenger_add_folder_name: data.name,
					form_submitted: 1
				},
				events: 'renameFolder',
				namespace: 'messages'
			}, data);
		},

		markFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=readFolder',
				dataType: 'html',
				data: {
					folder: data.folder,
					form_submitted: 1
				},
				events: 'markFolder',
				namespace: 'messages'
			}, data);
		},

		emptyFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=emptyFolder',
				dataType: 'json',
				data: {
					folder: data.folder,
					form_submitted: 1
				},
				events: 'emptyFolder',
				namespace: 'messages'
			}, data);
		},

		deleteFolder: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=deleteFolder',
				dataType: 'json',
				data: {
					folder: data.folder,
					form_submitted: 1,
					wasConfirmed: 1
				},
				events: 'deleteFolder',
				namespace: 'messages'
			}, data);
		},

		deleteMessages: function (e, data) {
			this.getData({
				url: 'app=core&module=messaging&controller=messenger&do=leaveConversation',
				dataType: 'json',
				data: {
					id: data.id
				},
				events: 'deleteMessages',
				namespace: 'messages'
			}, data);
		}
	});
}(jQuery, _));