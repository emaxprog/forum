/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.messages.message.js - Messages model for messenger
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.model.register('messages.message', {

		initialize: function () {
			this.on( 'fetchMessage.messages', this.fetchMessage );
			this.on( 'deleteMessage.messages', this.deleteMessage );
			this.on( 'moveMessage.messages', this.moveMessage );
			this.on( 'blockUser.messages', this.blockUser );
			this.on( 'addUser.messages', this.addUser );
		},

		fetchMessage: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger',
				dataType: 'html',
				data: {
					id: data.id,
					page: data.page || 1
				},
				events: 'loadMessage',
				namespace: 'messages'
			}, data );
		},

		deleteMessage: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=leaveConversation',
				dataType: 'json',
				data: {
					id: data.id
				},
				events: 'deleteMessage',
				namespace: 'messages'
			}, data );
		},

		moveMessage: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=move',
				dataType: 'json',
				data: {
					id: data.id,
					to: data.folder
				},
				events: 'moveMessage',
				namespace: 'messages'
			}, data );
		},

		blockUser: function (e, data) {
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=blockParticipant',
				dataType: 'html',
				data: {
					id: data.id,
					member: data.member
				},
				events: 'blockUser',
				namespace: 'messages'
			}, data );
		},

		addUser: function (e, data) {
			var sendData = {
				id: data.id
			};

			if( data.names ){
				_.extend( sendData, {
					member_names: data.names
				});
			}

			if( data.member ){
				_.extend( sendData, {
					member: data.member
				});
			}
			
			if( data.unblock ){
				_.extend( sendData, {
					unblock: true
				});
			}
			
			this.getData( {
				url: 'app=core&module=messaging&controller=messenger&do=addParticipant',
				dataType: 'json',
				data: sendData,
				events: 'addUser',
				namespace: 'messages'
			}, data );
		}
	});
}(jQuery, _));