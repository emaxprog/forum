/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.forms.ftp.js
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.ftp', {
		
		/**
		 * Init
		 */
		initialize: function () {
			var scope = $(this.scope);
			scope.find('[data-role="portToggle"]').change(function(){
				scope.find('[data-role="portInput"]').val( $(this).attr('data-port') );
			});
			
			scope.find('[data-role="serverInput"]').keyup(function(){				
				var matches = $(this).val().match( /^((.+?):\/\/)?((.+?)(:(.+?)?)@)?(.+?\..+?)(:(\d+)?)?(\/.*)?$/ );
				if ( matches && ( matches[1] || matches[3] || matches[8] || matches[10] ) ) {
					if ( matches[2] ) {
						console.log(scope.find('[data-role="portToggle"][value="' + matches[2] + '"]'));
						scope.find('[data-role="portToggle"][value="' + matches[2] + '"]').prop( 'checked', true );
					}
					if ( matches[3] ) {
						if ( matches[4] ) {
							scope.find('[data-role="usernameInput"]').val( matches[4] );
							scope.find('[data-role="usernameInput"]').focus();
						}
						if ( matches[6] ) {
							scope.find('[data-role="passwordInput"]').val( matches[6] );
							scope.find('[data-role="passwordInput"]').focus();
						}
					}
					if ( matches[8] ) {
						scope.find('[data-role="portInput"]').val( matches[9] );
						scope.find('[data-role="portInput"]').focus();
					}
					if ( matches[10] ) {
						scope.find('[data-role="pathInput"]').val( matches[10] );
						scope.find('[data-role="pathInput"]').focus();
					}
					$(this).val( matches[7] );
				}
				
			});
		},
				
	});
}(jQuery, _));