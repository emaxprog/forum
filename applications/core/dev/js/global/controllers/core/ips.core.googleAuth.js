/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.googleAuth.js - Google Authenticator controller
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.googleAuth', {
		initialize: function () {
			this.on( 'click', '[data-action="showManual"]', this.showManual );
			this.on( 'click', '[data-action="showBarcode"]', this.showBarcode );
			
			var waitUntil = $(this.scope).attr('data-waitUntil');
			if ( waitUntil > Math.floor( Date.now() / 1000 ) ) {
				this.showWait();
			}
		},

		/**
		 * Show the manual instructions for Google Auth
		 *
		 * @returns {void}
		 */
		showManual: function () {
			this.scope.find('[data-role="barcode"]').hide();
			this.scope.find('[data-role="manual"]').show();
		},
		
		/**
		 * Show the barcode for for Google Auth
		 *
		 * @returns {void}
		 */
		showBarcode: function () {
			this.scope.find('[data-role="barcode"]').show();
			this.scope.find('[data-role="manual"]').hide();
		},
		
		/**
		 * Show the waiting bar
		 *
		 * @returns {void}
		 */
		showWait: function () {
			this.scope.find('[data-role="codeWaiting"]').show();
			this.scope.find('[data-role="codeInput"]').hide();
			
			var waitUntil = $(this.scope).attr('data-waitUntil') * 1000;
			var start = Date.now();
			
			var progressBar = $(this.scope).find('[data-role="codeWaitingProgress"]');
			var interval = setInterval( function(){
				if ( Date.now() >= waitUntil ) {
					clearInterval(interval);
					this.showInput();
				}
				
				progressBar.css( 'width', ( ( 100 - ( 100 / ( waitUntil - start ) * ( waitUntil - Date.now() ) ) ) ) + '%' );
			}.bind(this), 100 );
		},
		
		/**
		 * Show the input box
		 *
		 * @returns {void}
		 */
		showInput: function () {
			this.scope.find('[data-role="codeWaiting"]').hide();
			this.scope.find('[data-role="codeInput"]').show();
			this.scope.find('input').focus();
		}
	});
}(jQuery, _));