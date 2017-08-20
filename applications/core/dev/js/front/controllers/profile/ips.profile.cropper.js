/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.profile.cropper.js - Cropping controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.profile.cropper', {

		_image: null,
		_coords: {},

		initialize: function () {
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;

			this._image = this.scope.find('[data-role="profilePhoto"]');
			this._coords = {
				topLeftX: this.scope.find('[data-role="topLeftX"]'),
				topLeftY: this.scope.find('[data-role="topLeftY"]'),
				bottomRightX: this.scope.find('[data-role="bottomRightX"]'),
				bottomRightY: this.scope.find('[data-role="bottomRightY"]'),
			};

			ips.loader.get( ['core/interface/cropper/cropper.min.js'] ).then( function () {
				self._image.imagesLoaded( _.bind( self._startCropper, self ) );
 			});
		},

		/**
		 * Starts the cropping function, called after the image has loaded
		 *
		 * @returns {void}
		 */
		_startCropper: function () {
			var self = this;

			var width = this._image.width();
			var height = this._image.height();

			// Resize the wrapper
			this._image.closest('[data-role="cropper"]').css({
				width: width + 'px',
				height: height + 'px'
			});

			// Initialize cropper
			this._image.cropper({
				aspectRatio: 1 / 1,
				autoCropArea: 0.9,
				minContainerWidth: width,
				minContainerHeight: height,
				crop: function (data) {					
					self._coords.topLeftX.val( data['x'] );
					self._coords.topLeftY.val( data['y'] );
					self._coords.bottomRightX.val( data['width'] + data['x'] );
					self._coords.bottomRightY.val( data['height'] + data['y'] );
				}
			});
		}
	});
}(jQuery, _));