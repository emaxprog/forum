/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.captcha.js - Recaptcha widget. Allows for dynamic loading of recpatcha, so it works in popups
 *
 * Author: Rikki Tissier
 */

/* A global function breaks our coding standards, but it's the only way Google will allow it */
function recaptcha2Callback(){
	jQuery( window ).trigger( 'recaptcha2Loaded' );
};

;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.captcha', function(){

		var defaults = {
			lang: 'en-US',
			theme: 'white'
		};

		var recaptchaLoaded = false;

		var respond = function (elem, options) {
			options = _.defaults( options, defaults );
			
			if( options.service == 'recaptcha' ){
				_recaptcha( elem, options );
			} else if( options.service == 'recaptcha2' ){
				_recaptcha2( elem, options );
			} else if ( options.service == 'keycaptcha' ) {
				_keycaptcha( elem );
			}
		},

		/**
		 * Recaptcha
		 * Handles a recaptcha captcha, loading the JS file from google.com before setup
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		_recaptcha = function (elem, options) {
			ips.loader.get( [ document.location.protocol + '//www.google.com/recaptcha/api/js/recaptcha_ajax.js'] ).done( function () {
				var container = $('<div/>');
				var id = container.identify().attr('id');

				elem.append( container );

				Recaptcha.create( options.key, id, {
					theme: options.theme,
					lang: options.lang,
					callback: function () { Debug.log('done') }
				});
			});
		},

		/**
		 * Recaptcha2
		 * Handles a new recaptcha captcha, loading the JS file from google.com before setup
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		_recaptcha2 = function (elem, options) {
			ips.loader.get( [ 'https://www.google.com/recaptcha/api.js?hl=' + $(elem).attr('data-ipsCaptcha-lang') + '&onload=recaptcha2Callback&render=explicit' ] );

			var initRecaptcha2 = function () {
				elem.children('[data-captchaContainer]').remove();
				
				var container = $('<div data-captchaContainer/>');
				var id = container.identify().attr('id');

				elem.append( container );
				
				grecaptcha.render( id, {
					sitekey: $(elem).attr('data-ipsCaptcha-key'),
					theme: $(elem).attr('data-ipsCaptcha-theme')
				} );
			};

			if( recaptchaLoaded ){
				initRecaptcha2();
			} else {
				$( window ).on( 'recaptcha2Loaded', function() {
					recaptchaLoaded = true;
					initRecaptcha2();
				});	
			}
		},

		/**
		 * Keycaptcha captcha
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @returns {void}
		 */
		_keycaptcha = function (elem) {
			ips.loader.get( [ document.location.protocol + '//backs.keycaptcha.com/swfs/cap.js' ] );
		};

		ips.ui.registerWidget( 'captcha', ips.ui.captcha, [
			'service', 'key', 'lang', 'theme'
		]);

		return {
			respond: respond
		};
	});
}(jQuery, _));