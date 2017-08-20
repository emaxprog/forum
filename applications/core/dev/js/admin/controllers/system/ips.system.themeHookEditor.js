/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.system.codeHook.js - Makes the theme hook editor all fancy like
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.system.themeHookEditor', {
				
		initialize: function () {	
			this.on( 'click', 'a[data-action="templateLink"]', this._itemClick );
		},
		
		/**
		 * Event handler for clicking on an item
		 *
		 * @param 	{event} 	e 		Event object
		 * @returns {void}
		 */
		_itemClick: function (e) {
			e.preventDefault();
			
			var themeHookWindow = $(this.scope).find('[data-role="themeHookWindow"]');
			var sidebar = $(this.scope).find('[data-role="themeHookSidebar"]');
			var target = $( e.currentTarget );
			History.replaceState( {}, document.title, target.attr('href') );
			
			themeHookWindow.children('[data-template],[data-role="themeHookWindowPlaceholder"]').hide();
			themeHookWindow.addClass('ipsLoading');
			sidebar.find('.cHookEditor_activeTemplate').removeClass('cHookEditor_activeTemplate');
						
			if ( themeHookWindow.children( '[data-template="' + target.text() + '"]' ).length ) {
				themeHookWindow.children( '[data-template="' + target.text() + '"]' ).show();
			} else {
				ips.getAjax()( target.attr('href') + '&editor=1' )
					.done(function(response){
						themeHookWindow.append( "<div class='cHookEditor_content' data-template='" + target.text() + "'>" + response + '</div>' );
						$( document ).trigger('contentChange', [ themeHookWindow ]);
					})
					.fail(function(){
						window.location = target.attr('href');
					})
			}
			
			target.addClass('cHookEditor_activeTemplate');
			themeHookWindow.removeClass('ipsLoading');
		}
		
	});
}(jQuery, _));
