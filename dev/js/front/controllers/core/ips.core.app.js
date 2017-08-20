/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.app.js - Front end app controller 
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.app', {
		
		initialize: function () {
			this.on( 'click', 'a[data-confirm],button[data-confirm]', this.confirmSomething );
			this.on( document, 'contentChange', this._checkAndClearAutosave );
			this.setup();
		},

		/**
		 * Setup method for the front app
		 *
		 * @returns {void}
		 */
		setup: function () {
			// Add a classname to the document for js purposes
			this.scope.addClass('ipsJS_has').removeClass('ipsJS_none');
			if ( !ips.utils.events.isTouchDevice() ) {
				this.scope.addClass('ipsApp_noTouch');
			}

			// Timezone detection
			if( typeof jstz !== 'undefined' ) {
				ips.utils.cookie.set( 'ipsTimezone', jstz.determine().name() );
			}
			
			// Clear any autosave stuff
			this._checkAndClearAutosave();
			if ( !ips.getSetting('memberID') && ips.utils.url.getParam('_fromLogout') ) {
				ips.utils.db.removeByType('editorSave');
			}

			// Inline message popup
			// Create a dialog if it exists
			if( $('#elInlineMessage').length ){
				var dialogRef = ips.ui.dialog.create({
					showFrom: '#inbox',
					content: '#elInlineMessage',
					title: $('#elInlineMessage').attr('title')
				});

				// Leave a little time
				setTimeout( function () {
					dialogRef.show();
				}, 800);				
			}

			// Open external links in a new window
			if( ips.getSetting('links_external') ) {
				this.scope.find('a[rel*="external"]').each( function( index, elem ){
					elem.target = "_blank";
					elem.rel = elem.rel + " noopener";
				})
			}

			// Apply embed controllers on old content
			var oldEmbeds = this.scope.find('[data-embedcontent]:not([data-controller])');
			var toRefresh = [];

			if( oldEmbeds.length ){
				oldEmbeds.each( function () {
					$( this ).attr('data-controller', 'core.front.core.autoSizeIframe');
					toRefresh.push( this );
				});
				$( document ).trigger( 'contentChange', [ jQuery([]).pushStack( toRefresh ) ] );
			}

			// Set up prettyprint
			prettyPrint();

			// Set up notifications
			if( ips.getSetting('memberID') && ips.utils.notification.supported && ips.utils.notification.needsPermission() ){
				ips.utils.notification.requestPermission();	
			}

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
		 * Prompts the user to confirm an action
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		confirmSomething: function (e) {
			e.preventDefault();
			var elem = $( e.currentTarget );
			var customMessage = $( e.currentTarget ).attr('data-confirmMessage');
			var subMessage = $( e.currentTarget ).attr('data-confirmSubMessage');

			ips.ui.alert.show( {
				type: 'confirm',
				icon: 'warn',
				message: ( customMessage ) ? customMessage : ips.getString('generic_confirm'),
				subText: ( subMessage ) ? subMessage : '',
				callbacks: {
					ok: function () {
						window.location = elem.attr('href') + '&wasConfirmed=1';
					}
				}
			});
		}
	});
}(jQuery, _));
