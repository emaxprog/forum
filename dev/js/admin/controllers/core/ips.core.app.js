/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.app.js - AdminCP base app controller
 * This controller is used only for items that are global event handlers. Where functionality is specific to
 * a feature or section, a new controller should be created.
 *
 * Author: Rikki Tissier
 */ 
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.core.app', {

		initialize: function () {
			this.on( 'click', 'a.noscript_fallback, a.ipsJS_preventEvent', this.noScriptFallback );
			this.on( 'click', '[data-clickshow]', this.clickShow );
			this.on( 'click', '[data-clickhide]', this.clickHide );
			this.on( 'click', '[data-clickempty]', this.clickEmpty );
			this.on( 'click', '[data-delete]', this.deleteSomething );
			this.on( 'click', 'a[data-confirm]', this.confirmSomething );
			this.on( 'click', '[data-doajax]', this.doAjaxAction );
			this.on( document, 'contentChange', this._checkAndClearAutosave );
			this.setup();
		},

		/**
		 * General app setup. Creates flashMsgs if needed, shows/hides JS elements
		 *
		 * @returns {void}
		 */
		setup: function () {
			// Add a classname to the document for js purposes
			this.scope.addClass('ipsJS_has').removeClass('ipsJS_none');
			
			// Clear any autosave stuff
			this._checkAndClearAutosave();
			if ( !ips.getSetting('memberID') && ips.utils.url.getParam('_fromLogout') ) {
				ips.utils.db.removeByType('editorSave');
			}

			// Set up prettyprint
			prettyPrint();

			// Set our JS cookie for future use - we'll set it for a day
			if( _.isUndefined( ips.utils.cookie.get( 'hasJS') ) ){
				var expires = new Date();
				expires.setDate( expires.getDate() + 1 );
				ips.utils.cookie.set( 'hasJS', true, expires.toUTCString() );
			}
		},

		/**
		 * Check and clear autosave
		 *
		 * @returns {void}
		 */
		 _checkAndClearAutosave: function() {
		 	if( ips.utils.cookie.get('clearAutosave') ) {
				var autoSaveKeysToClear = ips.utils.cookie.get('clearAutosave').split(',');
				for ( var i = 0; i < autoSaveKeysToClear.length; i++ ) {
					ips.utils.db.remove( 'editorSave', autoSaveKeysToClear[i] );
				}
				ips.utils.cookie.unset('clearAutosave');
			}
		 },

		/**
		 * Sends an ajax request with the link's href, and shows a flash message on success
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		doAjaxAction: function (e) {
			e.preventDefault();

			ips.getAjax()( $( e.currentTarget ).attr('href'), { dataType: 'json' } )
				.done( function (response) {
					ips.ui.flashMsg.show( response );
				})
				.fail( function (jqXHR) {
					if( Debug.isEnabled() ){
						Debug.error( jqXHR.responseText );
					} else {
						window.location = $( e.currentTarget ).attr('href');
					}
				});
		},

		/**
		 * Prompts the user to confirm a deleting action, sends ajax request to do the delete,
		 * and removes a row if necessary
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		deleteSomething: function (e) {
			e.preventDefault();

			var elem = $( e.currentTarget );
			var deleteTitle = elem.attr('data-delete-message');
			var extraWarning = elem.attr('data-delete-warning');

			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'warn',
				message: deleteTitle || ips.getString('delete_confirm'),
				subText: extraWarning || '',
				focus: 'cancel',
				callbacks: {
					ok: function () {
						// Do we not want to execute via AJAX?
						if( elem.attr('data-noajax') !== undefined ){
							window.location = elem.attr('href') + '&wasConfirmed=1';
							return;
						}

						var row = null;

						// Check if there's any rows to delete
						if( elem.attr('data-deleterow') ){
							row = $( elem.attr('data-deleterow') );
						} else {
							row = elem.closest('tr, .row, [data-role=node]');
						}

						// Trigger ajax request to actually delete
						ips.getAjax()( elem.attr('href'), {
							showLoading: true,
							bypassRedirect: true,
							data: {
								form_submitted: 1,
								wasConfirmed: 1
							}
						} )
							.done( function (response) {
								if( row.hasClass('parent') ){
									row.next().remove();
								}

								ips.utils.anim.go( 'fadeOut', row );
							})
							.fail( function () {
								window.location = elem.attr('href') + '&wasConfirmed=1';
							});
					}
				}
			});
		},
		
		/**
		 * Prompts the user to confirm an action
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		confirmSomething: function (e) {
			e.preventDefault();
			var elem = $( e.currentTarget );
			var customMessage = $( e.currentTarget ).attr('data-confirmMessage');
			var customSubMessage = $( e.currentTarget ).attr('data-confirmSubMessage');
			var type = $( e.currentTarget ).attr('data-confirmType');
			var icon = $( e.currentTarget ).attr('data-confirmIcon');
			
			var alert = {
				type: ( type ) ? type : 'confirm',
				icon: ( icon ) ? icon : 'warn',
				message: ( customMessage ) ? customMessage : ips.getString('generic_confirm'),
				subText: ( customSubMessage ) ? customSubMessage : '',
				callbacks: {
					ok: function () {
						window.location = elem.attr('href') + '&wasConfirmed=1';
					},
					yes: function () {
						window.location = elem.attr('href') + '&prompt=1';
					},
					no: function () {
						window.location = elem.attr('href') + '&prompt=0';
					}
				}
			};
			
			if ( $( e.currentTarget ).attr('data-confirmButtons') ) {
				alert.buttons = $.parseJSON( $( e.currentTarget ).attr('data-confirmButtons') );
			}
			
			ips.ui.alert.show( alert );
		},

		/**
		 * Shows elements when clicked
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		clickShow: function ( e ) {
			e.preventDefault();
			
			var elems = ips.utils.getIDsFromList( $( e.currentTarget ).attr('data-clickshow') );
			this.scope.find( elems ).show().removeClass('ipsHide');
		},

		/**
		 * Hides elements when clicked
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		clickHide: function ( e ) {
			e.preventDefault();
			
			var elems = ips.utils.getIDsFromList( $( e.currentTarget ).attr('data-clickhide') );
			this.scope.find( elems ).hide().addClass('ipsHide');
		},

		/**
		 * Empties given form elements when clicked
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		clickEmpty: function ( e ) {
			e.preventDefault();
			
			var elems = ips.utils.getIDsFromList( $( e.currentTarget ).attr('data-clickempty') );
			this.scope.find( elems ).val('');
		},

		/**
		 * Prevents default event handler from executing 
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		noScriptFallback: function (e) {
			e.preventDefault();
		}
	});
}(jQuery, _));