/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.wizard.js - Wizard widget
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.wizard', function(){
		
		var respond = function (elem, options, e) {
			elem.on( 'click', '[data-action="wizardLink"]', _.bind( refresh, e, elem ) );
			elem.on( 'submit', 'form', _.bind( refresh, e, elem ) );
		};
		
		/**
		 * Reloads a page of the wizard
		 *
		 * @param 		{element} 	elem 	The wizard element
		 * @param		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		var refresh = function(elem, e) {
			var target = $( e.currentTarget );
			
			_showLoading( elem );
						
			if( target.is('form') ){
				if( target.attr('data-bypassAjax') ){
					return true;
				}
				e.preventDefault();
				
				ips.getAjax()( target.attr('action'), {
					data: target.serialize(),
					type: 'post'
				}).done( function (response) {
					// If a json object is returned with a redirect key, send the user there
					if( _.isObject( response ) && response.redirect ){
						window.location = response.redirect;
						return;
					}
					
					var responseWizard = $( '<div>' + response + '</div>' ).find('[data-ipsWizard]').html();
					if ( !responseWizard ) {
						responseWizard = response;
					}
					elem.html( responseWizard );
					$( document ).trigger( 'contentChange', [ elem ] );

					elem.trigger( 'wizardStepChanged' );
				})
				.fail(function(response, textStatus, errorThrown){
					target.attr( 'data-bypassAjax', true );
					target.submit();
				})
			} else {
				e.preventDefault();
				
				ips.getAjax()( target.attr('href') ).done( function (response) {
					// If a json object is returned with a redirect key, send the user there
					if( _.isObject( response ) && response.redirect ){
						window.location = response.redirect;
						return;
					}
										
					var responseWizard = $( '<div>' + response + '</div>' ).find('[data-ipsWizard]').html();
					if ( !responseWizard ) {
						responseWizard = response;
					}
					elem.html( responseWizard );
					$( document ).trigger( 'contentChange', [ elem ] );

					elem.trigger( 'wizardStepChanged' );
				});
			}
			
		},

		/**
		 * Shows the loading thingy by working out the size of the form its replacing
		 *
		 * @param 		{element} 	elem 	The wizard element
		 * @returns 	{void}
		 */
		_showLoading = function (elem) {
			var loading = elem.find('[data-role="loading"]');
			var formContainer = elem.find('[data-role="wizardContent"]');

			if( !loading.length ){
				loading = $('<div/>').attr('data-role', 'loading').addClass('ipsLoading').hide();
				elem.append( loading );
			}

			var dims = {
				width: formContainer.outerWidth(),
				height: formContainer.outerHeight()
			};

			loading
				.css({
					width: dims.width + 'px',
					height: dims.height + 'px'
				})
				.show();

			formContainer
				.hide()
				.after( loading.show() );
		},

		/**
		 * Hides the loading thingy
		 *
		 * @returns 	{void}
		 */
		_hideLoading = function () {
			var loading = elem.find('[data-role="loading"]');
			var formContainer = elem.find('[data-role="registerForm"]');

			loading.remove();
			formContainer.show();
		};

		// Register this module as a widget to enable the data API and
		// jQuery plugin functionality
		ips.ui.registerWidget( 'wizard', ips.ui.wizard );

		return {
			respond: respond
		};
	});
}(jQuery, _));