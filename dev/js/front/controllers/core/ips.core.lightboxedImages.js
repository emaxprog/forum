/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.lightboxedImages.js - Sets up lightbox on user-posted content
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.lightboxedImages', {

		_random: null,

		initialize: function () {
			this.on( 'initializeImages', this.initializeImages );
			this.setup();
		},

		/**
		 * Setup method
		 *	
		 * @returns 	{void}
		 */
		setup: function () {
			this._random = 'g' + ( Math.round( Math.random() * 100000 ) );
			this._initializeImages();
		},

		/**
		 * Event handler for main event
		 *	
		 * @returns 	{void}
		 */
		initializeImages: function () {
			this._initializeImages();
		},

		/**
		 * Initializes images by checking if their full size is larger than shown, and wrapping them
		 * with the lightbox ui widget if so.
		 *	
		 * @returns 	{void}
		 */
		_initializeImages: function () {
			var self = this;
			var images = this.scope.find('img');

			if( !images.length ){
				return;
			}
			
			this.scope.imagesLoaded( function (imagesLoaded) {
				if( !imagesLoaded.images.length ){
					return;
				}

				_.each( imagesLoaded.images, function (image, i) {
					var image = image.img;

					if( !_.isUndefined( $( image ).attr('data-emoticon') ) || image.width >= image.naturalWidth && !$( image ).hasClass('ipsImage_thumbnailed') ) {
						return;
					}

					image = $( image );
					image.addClass('ipsImage_thumbnailed');

					// If the image is already inside an a, then just add the lightbox params; otherwise, wrap in new <a>
					if( image.closest('a').length && image.closest('a').hasClass('ipsAttachLink') && image.closest('a').hasClass('ipsAttachLink_image') ){
						if ( [ 'gif', 'jpeg', 'jpe', 'jpg', 'png' ].indexOf( image.closest('a').attr('href').substr( image.closest('a').attr('href').lastIndexOf('.') + 1 ).toLowerCase() ) != -1 ) { // Only if the link is to an image
							image.closest('a')
								.attr( 'data-fullURL',image.closest('a').attr('src') )
								.attr( 'data-ipsLightbox', '' )
								.attr( 'data-ipsLightbox-group', self._random );
						}
					} else {
						if( !image.closest('a').length ){
							image.wrap( $( "<a href='" + image.attr('src') + "' title='" + ips.getString('enlargeImage') + "' data-ipsLightbox data-ipsLightbox-group='" + self._random + "'></a>" ) );
						}
					}
				});
			});
		}
	});
}(jQuery, _));