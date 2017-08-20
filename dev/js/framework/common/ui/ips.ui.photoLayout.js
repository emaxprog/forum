/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.photoLayout.js - Photo layout widget for photo galleries
 * Based on the algorithm detailed at http://www.wackylabs.net/2012/03/flickr-justified-layout-in-jquery/
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.photoLayout', function(){
		
		var defaults = {
			minHeight: 250,
			maxItems: 5,
			gap: 4,
			itemTemplate: 'core.patchwork.imageList'
		};

		var respond = function (elem, options, e) {
			options = _.defaults( options, defaults );

			if( !$( elem ).data('_photoLayout') ){
				$( elem ).data('_photoLayout', photoLayoutObj(elem, _.defaults( options, defaults ) ) );
			}
		},

		/**
		 * Retrieve the photoLayout instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The photoLayout instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_photoLayout') ){
				return $( elem ).data('_photoLayout');
			}

			return undefined;
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			var obj = getObj( elem );

			if( !_.isUndefined( obj ) ){
				obj.destruct();
			}
		};

		ips.ui.registerWidget('photoLayout', ips.ui.photoLayout, [ 
			'minHeight', 'maxItems', 'maxRows', 'gap', 'data', 'itemTemplate'
		] );

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj
		};
	});

	/**
	 * Photo layout instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var photoLayoutObj = function (elem, options) {

		var currentWidth = 0;
		var imageData;
		var noOfPhotos = 0;
		var dataStore = $('<div/>');
		var windowWidth = 0;
		var checkboxes = [];

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			windowWidth = $( window ).width();
			currentWidth = Math.floor( elem.width() );
			imageData = _getData();
			noOfPhotos = imageData.length;

			elem.empty();
			run( imageData );

			setInterval( function () {
				_checkCurrentWidth();
			}, 300 );

			// Set up events
			$( window ).on( 'resize', _resizeWindow );
			$( document ).trigger( 'contentChange', [ elem ] );
		},

		/**
		 * Checks the width of the parent element on an interval,
		 * and if it's changed, will rebuild the layout
		 *
		 * @returns {void}
		 */
		_checkCurrentWidth = function () {
			var newWidth = Math.floor( elem.width() );
			
			if( currentWidth !== newWidth ){
				Debug.log("Width has changed; rebuilding");
				_resizeWindow(true);
			}
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @returns {void}
		 */
		destruct = function () {
			$( window ).off( 'resize', _resizeWindow );
		},

		/**
		 * Refresh the layout
		 *
		 * @returns {void}
		 */
		refresh = function () {
			imageData = _getData();
			noOfPhotos = imageData.length;

			elem.empty();

			run( imageData );
		},

		/**
		 * Run the resizing process
		 *
		 * @returns 	{void}
		 */
		run = function (data) {
			var initialHeight = Math.max( options.minHeight, Math.floor( currentWidth / options.maxItems ) );

			// Get relative sizes
			var relativeSizes = [];

			_.each( data, function (image) {
				var w = 0;
				var h = 0;

				if( !_.isString( image.filenames.small[0] ) ){
					w = options.minHeight;
					h = options.minHeight;
				} else {
					//alert(image.filenames.small[1]);
					w = parseInt( image.filenames.small[1], 10 );
	            	h = parseInt( image.filenames.small[2], 10 );	
				}			
	            
	            if ( ! w )  {
		            w = options.minWidth;
	            }
	            
	            if ( ! h ) {
		            w = options.minHeight;
	            }
	            	
	            if( h != initialHeight ){
	            	w = Math.floor( w * ( initialHeight / h ) );
	            }

	            relativeSizes.push( w );
			});

			var imagesSoFar = 0;
			var rowNum = 0;

			// Start positioning images
			while ( imagesSoFar < noOfPhotos ) {
				rowNum++;

				if( options.maxRows && rowNum > options.maxRows ){
					break;
				}

				var imagesInRow = 0;
				var widthOfRow = 0;

				// Figure out how many images to show in this row and how wide it will be
				while ( ( widthOfRow * 1.1 < currentWidth ) && ( imagesSoFar + imagesInRow < noOfPhotos ) ) {
					var gap = options.gap * 2;

					if( imagesInRow === 0 ){
						gap = options.gap;
					}

					widthOfRow += relativeSizes[ imagesSoFar + imagesInRow++ ] + gap;
				}

				// Subtract one measure of gap for the right-hand side
				widthOfRow -= options.gap;

				var row = _getRow();
				var ratio = currentWidth / widthOfRow;
				var lastRowNotFit = false;
				var i = 0;

				widthOfRow = 0;

				var rowHeight = Math.floor( initialHeight * ratio );
				row.height( rowHeight + ( options.gap * 2 ) );

				// Now loop through each image and insert it
				while ( i < imagesInRow ) {
					var thisImage = data[ imagesSoFar + i ];
					var newWidth = Math.floor( relativeSizes[ imagesSoFar + i ] * ratio );
					var thisWidth = ( !_.isNull( thisImage.filenames.small[1] ) && thisImage.filenames.small[1] > 0 ) ? thisImage.filenames.small[1] : options.minWidth;
					var thisHeight = ( !_.isNull( thisImage.filenames.small[2] ) && thisImage.filenames.small[2] > 0  ) ? thisImage.filenames.small[2] : options.minHeight;

					// If this is the last row, we might not have enough images to fill it
					// If the height is bigger than our starting height, we'll reset it, and scale this image to match
					if( imagesSoFar + imagesInRow >= noOfPhotos && rowHeight >= initialHeight ){
						rowHeight = initialHeight; // Reset height
						row.height( rowHeight + ( options.gap * 2 ) ); // Resize row
						newWidth = Math.floor( thisWidth * ( initialHeight / thisHeight ) ); // Scale width
						lastRowNotFit = true;
					}

					widthOfRow += newWidth + ( options.gap * 2 );

					// Build the item using a template
					var item = _buildItem( thisImage, {
						width: newWidth,
						height: rowHeight,
						margin: options.gap,
						marginLeft: ( i === 0 ) ? 0 : options.gap,
						marginRight: ( i + 1 === imagesInRow ) ? 0 : options.gap
					});

					row.append( item );

					i++;
				}

				// Subtract two counts of margin, for the left and right sides of the row
				widthOfRow -= ( options.gap * 2 );

				imagesSoFar += imagesInRow;

				// We can now tweak image widths to make sure it fills the full row
				// If this is the last row, and we don't have enough images to perfectly fill the row, we don't
				// want to tweak the sizes or it'll stretch them strangely. We can skip this bit.
				if( !lastRowNotFit ){
					var smWidth = 0;

					while ( widthOfRow < currentWidth ) {
						var item = row.find('.cGalleryPatchwork_item:nth-child(' + ( smWidth + 1 ) + ")");

						item.css({ width: ( item.width() + 1 ) + 'px' });

						smWidth = ( smWidth + 1 ) % imagesInRow;
						widthOfRow++;
					}

					var bigWidth = 0;

					while ( widthOfRow > currentWidth ) {
						var item = row.find('.cGalleryPatchwork_item:nth-child(' + ( bigWidth + 1 ) + ")");

						item.css({ width: ( item.width() - 1 ) + 'px' });

						bigWidth = ( bigWidth + 1 ) % imagesInRow;
						widthOfRow--;
					}
				}
			}

			// Check any that should be checked
			if( checkboxes.length ){
				_.each( checkboxes, function (val) {
					elem.find('input[type="checkbox"][name="' + val + '"]').prop('checked', true);
				});

				checkboxes = [];
			}

			elem.find('.cGalleryPatchwork_row').css({
				width: '100%'
			});
		},

		/**
		 * Builds an item using the specified data
		 *
		 * @param 		{object} 	imageData 	The image data (that came from JSON on the page)
		 * @param 		{pbject} 	extra 		The processed extra data for the image, such as dims
		 * @returns 	{string}	The rendered HTML
		 */
		_buildItem = function (imageData, extra) {
				
			// Calculate retina sizes
			var multipliedWidth = extra.width * window.devicePixelRatio;
			var multipliedHeight = extra.height * window.devicePixelRatio;
			var showThumb = true;

			if( !_.isString( imageData.filenames.small[0] ) ){
				showThumb = false
			} else {
				// If the width/height we'll show at is bigger than the small image size, use the medium size instead
				if( multipliedWidth <= imageData.filenames.small[1] && multipliedHeight <= imageData.filenames.small[2] ){
					imageData.src = imageData.filenames.small[0];
				} else {
					imageData.src = imageData.filenames.medium[0];
				}
			}
			
			if ( ! _.isUndefined( imageData.container ) ) {
				// To make json safe, we convert ' to &apos;
				imageData.container = imageData.container.replace( /&apos;/ig, "'" );
			}
			
			return ips.templates.render( options.itemTemplate, {
				showThumb: showThumb,
				image: imageData,
				dims: extra
			} );
		},

		/**
		 * Returns a new row element
		 *
		 * @returns 	{element}
		 */
		_getRow = function () {
			var row = $('<div/>').addClass('cGalleryPatchwork_row ipsClearfix');
			elem.append( row );

			return row;
		},

		/**
		 * Gets the data for the patchwork widget to use, either from the data option or from
		 * elements inside the widget
		 *
		 * @returns 	{object}
		 */
		_getData = function () {
			// If data has been specified on the widget, just use that
			if( options.data ){
				return $.parseJSON( options.data );
			}	

			var data = [];

			// Find all the images and extract data from it
			elem.find('[data-role="patchworkImage"][data-json]').each( function () {
				try {
					var _data = $.parseJSON( $( this ).attr('data-json') );
				} catch (err) {
					return;
				}

				data.push( _data );
			});

			return data;
		},

		/**
		 * Event handler for resizing the window
		 *
		 * @returns {void}
		 */
		_resizeWindow = function (force) {
			checkboxes = _getCheckedImages();

			// Only check the width here - we don't care if the height changes
			// Necessary because mobile browsers change the height to show the address bar when scrolling
			if( force || $( window ).width() !== windowWidth ){
				elem.empty();
				currentWidth = Math.floor( elem.width() );
				noOfPhotos = imageData.length;
				run( imageData );	
			}

			windowWidth = $( window ).width();
		},

		/**
		 * Returns the names of any checked checkboxes.
		 *
		 * @returns {array}
		 */
		_getCheckedImages = function () {
			var names = [];
			var checks = elem.find('input[type="checkbox"]:checked');

			if( checks.length ){
				checks.each( function () {
					names.push( $( this ).attr('name') );
				});
			}

			return names;
		};

		init();

		return {
			init: init,
			destruct: destruct,
			refresh: refresh
		};
	};
}(jQuery, _));