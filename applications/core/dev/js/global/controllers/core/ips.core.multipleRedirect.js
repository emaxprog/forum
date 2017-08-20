/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.multipleRedirect.js - Facilitates multiple redirects
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.core.multipleRedirect', {
		_iterator: 0,
		
		initialize: function () {
			var self = this;
			this.setup();
		},

		setup: function () {
			this.scope.find('.ipsRedirect').removeClass('ipsHide');
			$('.ipsRedirect_manualButton').hide();
			this.step( this.scope.attr('data-url') + '&mr=0&_mrReset=1' );
		},
		
		step: function (url) {		
			this._iterator++;	
			var elem = this.scope;
			var self = this;
			ips.getAjax()( url )
				.done(function( response ) {
																									
					if( _.isObject( response ) && response.custom ){
						var originalContent = $( elem.html() ).removeClass('ipsHide');
						var newContent = elem.html(response.custom);
						newContent.find( '[data-action="redirectContinue"]' ).click(function(e){
							e.preventDefault();
							elem.html( originalContent );
							self.step( $(this).attr('href') );
						});
						return;
					}

					// If a json object is returned with a redirect key, send the user there
					if( _.isObject( response ) && response.redirect ){
						window.location = response.redirect;
						return;
					}
																						
					elem.find('[data-role="message"]').html( response[1] );
					
					if ( response[2] ) {
						elem.find('[data-role="progressBarContainer"]').removeClass('ipsHide');
						elem.find('[data-role="loadingIcon"]').addClass('ipsHide');
						elem.find('[data-role="progressBar"]').css({ width: ( response[2] + '%' ) });
					} else {
						elem.find('[data-role="progressBarContainer"]').addClass('ipsHide');
						elem.find('[data-role="loadingIcon"]').removeClass('ipsHide');
					}
					
					var newurl = elem.attr('data-url') + '&mr=' + self._iterator;

					if ( response.done && response.done == true ) {
						window.location = newurl;	
					} else if ( response.close && response.close == true ) {
						self.trigger( 'closeDialog' );
					} else {
						self.step( newurl );
					}
				})
				.fail(function(err){
					window.location = url;
				});
		}		
	});
}(jQuery, _));