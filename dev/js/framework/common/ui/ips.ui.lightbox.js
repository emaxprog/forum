/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.lightbox.js - Lightbox component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.lightbox', function(){

		var defaults = {
			className: 'ipsLightbox',
			useEvents: false
		};

		var currentLightbox;

		var respond = function (elem, options, e) {
			options = _.defaults( options, defaults );
			currentLightbox = new lightboxObj( elem, options, e );
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function (elem) {
			if( currentLightbox ){
				currentLightbox.destruct();
			}
		};

		ips.ui.registerWidget('lightbox', ips.ui.lightbox, 
			[ 'group', 'commentsURL', 'className', 'preload', 'useEvents' ],
			{ lazyLoad: true, lazyEvents: 'click' }
		);

		return {
			respond: respond,
			destruct: destruct
		};
	});


	/**
	 * Lightbox instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var lightboxObj = function (elem, options, e) {
		
		if( e ){
			e.preventDefault();
		}

		var imageCollection = [],
			commentsAjax,
			modal, 
			pieces, 
			currentImage,
			phoneBreakpoint = false;

		/**
		 * Kick off showing the lightbox
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			// Blur the trigger
			elem.blur();
			
			_getAllImages();
			_buildModal();
			_buildWrapper();
			_setUpEvents();
			_show();
			_loadFirstImage();
		},

		/**
		 * Destruct this widget on this element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {void}
		 */
		destruct = function () {
			$( window ).off( 'resize', _resize );
			$( document ).off( 'keydown', _keyPress );
			modal.off( 'click', close );
		},

		/**
		 * Sets up the events we'll need to watch for, on the modal, lightbox and doc
		 *
		 * @returns 	{void}
		 */
		_setUpEvents = function () {

			// Lightbox events
			pieces.lightbox
				.on( 'click', '.' + options.className + '_next', nextImage )
				.on( 'click', '.' + options.className + '_prev', prevImage )
				.on( 'click', '.' + options.className + '_close', close )
				.on( 'click', clickedLightbox );

			// Modal events
			modal.on( 'click', close );

			// Handle window resizing
			$( window ).on( 'resize', _resize );

			// Document key events
			$( document ).on( 'keydown', _keyPress );

			// Monitor for content changes that we might need to act on
			$( document ).on( 'imageUpdated', _updateImage );
			$( document ).on( 'imageLoading', _mainImageLoading );

			// If we are using events for managing the lightbox, listen for those events
			if( options.useEvents )
			{
				$( document ).on( 'lightboxDisable_next', function() {
					$('.' + options.className + '_next').hide();
				});

				$( document ).on( 'lightboxDisable_prev', function() {
					$('.' + options.className + '_prev').hide();
				});

				$( document ).on( 'lightboxEnable_next', function() {
					$('.' + options.className + '_next').show();
				});

				$( document ).on( 'lightboxEnable_prev', function() {
					$('.' + options.className + '_prev').show();
				});
			}
		},

		/**
		 * Image needs to be updated event
		 *
		 * @returns 	{void}
		 */
		_mainImageLoading = function( e ) {
			_setLoading( true );

			pieces.imagePanel
				.find('.' + options.className + '_image ')
					.hide();
		},

		/**
		 * Image needs to be updated event
		 *
		 * @returns 	{void}
		 */
		_updateImage = function( e, data ) {
			if( data.closeLightbox === true )
			{
				close(e);
			}
			else if( data.updateImage )
			{
				_showImage( data.updateImage );
			}
		},

		/**
		 * Window resize event
		 *
		 * @returns 	{void}
		 */
		_resize = function (e) {
			if( pieces.lightbox && pieces.imagePanel ){
				if( pieces.imagePanel.find( '.' + options.className + '_image' ).length ){
					_positionCenter( pieces.imagePanel.find( '.' + options.className + '_image:visible' ) );
				}
			}
		},

		/**
		 * Handles a keydown event
		 *
		 * @returns 	{void}
		 */
		_keyPress = function (e) {
			if( !pieces.lightbox.is(':visible') ){
				return;
			}

			switch( e.keyCode ){
				case ips.ui.key.ESCAPE:
					close(e);
				break;
				case ips.ui.key.RIGHT:
					nextImage(e);
				break;
				case ips.ui.key.LEFT:
					prevImage(e);
				break;
			}
		},

		/**
		 * Retrieves the image that was clicked from imageCollection, then passes it to showImage
		 *
		 * @returns 	{void}
		 */
		_loadFirstImage = function () {
			// Find the image that was clicked
			var firstImage = function () {
				for( var i = 0; i < imageCollection.length; i++ ){
					if( imageCollection[ i ].elem == elem ){
						return imageCollection[ i ];		
					}
				}
			}();

			currentImage = firstImage;
			_showImage( firstImage );
		},

		/**
		 * Handles the process of showing a new image, including loading the image and comments,
		 * determining whether next/prev should show, updating meta data
		 *
		 * @param	{object} 	image 		The image data object from imageCollection, for this image
		 * @returns {void}
		 */
		_showImage = function (image) {
			_setLoading( true );

			pieces.imagePanel
				.find('.' + options.className + '_image ')
					.hide();

			if( image.imageElem ){

				// Hide all images
				pieces.imagePanel.find('.' + options.className + '_image ').hide()

				// Show this image, then hand it off to the event handler
				var thisImage = image.imageElem.css( { opacity: 0 } ).show();
				_imageLoaded( thisImage );
			} else {	

				// New image, so build it and set the event handler
				var thisImage = image.imageElem = $('<img/>')
										.attr( 'src', image.largeImage )
										.addClass( options.className + '_image' )
										.css( { opacity: 0 } )
										.imagesLoaded( function (imagesLoaded){
											try {
												_imageLoaded( $( imagesLoaded.images[0].img ) );
											} catch(err) {
												Debug.error("Error loading image");
											}
										});

				// Hide all images, and append this new one
				pieces.imagePanel
					.find('.' + options.className + '_image ')
						.hide()
					.end()
					.append(
						thisImage
					);
			}			

			// Full size link
			pieces.fullSize.attr( 'href', image.largeImage );

			// Handle comments
			if( image.commentsURL ){
				_loadComments( image );
			} else {
				_hideCommentsPanel();
			}

			// Build meta info
			if( image.meta ){
				pieces.metaPanel
					.show()
					.html( ips.templates.render('core.lightbox.meta', { title: image.largeImage } ) );
			} else {
				pieces.metaPanel.hide();
			}

			$( elem ).trigger( 'lightboxImageShown', {
				image: image,
				triggerElem: elem
			});
		},

		/**
		 * Loads remote comments into the lightbox
		 *
		 * @param	{object} 	image 		The image data object from imageCollection, for this image
		 * @returns {void}
		 */
		_loadComments = function (image) {

			// Abort anything running already
			if( commentsAjax ){
				Debug.warn("Aborting comment load");
				commentsAjax.abort();
			}

			// Get new ajax object
			pieces.commentsPanel
				.html('')
				.show()
				.addClass( 'ipsLoading' );

			pieces.imagePanel
				.addClass( options.className + '_withComments' );

			commentsAjax = ips.getAjax()( image.commentsURL )
				.done( function (response){
					pieces.commentsPanel
						.html( response )
						.removeClass( 'ipsLoading' );

					$( document ).trigger('contentChange', [ pieces.commentsPanel ]);

					$( elem ).trigger( 'lightboxCommentsLoaded', {
						image: image,
						triggerElem: elem,
						commentsArea: pieces.commentsPanel
					});
				});
		},

		/**
		 * Hides the comments panel
		 *
		 * @returns 	{void}
		 */
		_hideCommentsPanel = function () {
			pieces.commentsPanel.hide();
			pieces.imagePanel.removeClass( options.className + '_withComments' );
		},

		/**
		 * Shows and hides the loading widget on the lightbox
		 *
		 * @param	{boolean} 	status 		True to show, false to hide
		 * @returns {void}
		 */
		_setLoading = function (status) {
			if( status === true ){
				pieces.imagePanel.addClass( 'ipsLoading ipsLoading_dark' );
			} else {
				pieces.imagePanel.removeClass( 'ipsLoading ipsLoading_dark' );

				$( '.' + options.className + '_imagePanel > img, .' + options.className + '_fullSize' )
					.on( 'mouseover', function(){ $( '.' + options.className + '_fullSize' ).show(); } )
					.on( 'mouseout', function(){ $( '.' + options.className + '_fullSize' ).hide(); } );
			}
		},

		/**
		 * Event handler fired when an image has finished loading
		 *
		 * @param	{array} 	image 		Image that has loaded
		 * @returns {void}
		 */
		_imageLoaded = function (image) {
			image.css( { opacity: 1 } );
			_positionCenter( image );
			_setLoading( false );

			// If we are using events, we can return now and let the events handle the rest
			if( options.useEvents )	{
				return;
			}

			// Toggle the navigation buttons as needed
			if( imageCollection.length < 2 ){
				pieces.next.hide();
				pieces.prev.hide();
			} else {
				var curPos = _.indexOf( imageCollection, currentImage );

				pieces.next.show();
				pieces.prev.show();

				if( curPos == 0 ){
					pieces.prev.hide();	
				}

				if( curPos == ( imageCollection.length - 1 ) ){
					pieces.next.hide();
				}
			}
		},

		/**
		 * Positions the image in the center of the image panel
		 *
		 * @param	{object} 	image 		The image data object from imageCollection
		 * @returns {void}
		 */
		_positionCenter = function (image) {
			// Get image size
			var imageSize = { width: image.width(), height: image.height() },
				panelSize = { width: pieces.imagePanel.width(), height: pieces.imagePanel.height() };

			Debug.log( "Dimensions: " + imageSize.width + " x " + imageSize.height );

			// Center it
			image.css( {
				left: '50%',
				marginLeft: '-' + Math.max( ( imageSize.width / 2 ), 0 ) + 'px',
				top: '50%',
				marginTop: '-' + Math.max( ( imageSize.height / 2 ), 0 ) + 'px'
			});

			if( pieces.fullSize )
			{
				pieces.fullSize.css( {
					left: '50%',
					marginLeft: '-' + Math.max( ( imageSize.width / 2 ), 0 ) + 'px',
					width: ( imageSize.width + 2 ) + 'px',
					top: '50%',
					height: ( imageSize.height + 2 ) + 'px',
					marginTop: '-' + Math.max( ( imageSize.height / 2 ), 0 ) + 'px',
					/* We take half of the height for padding-top, but we need to remove half of that again because of our negative margin-top.
						The added 50px represents half of the element's height (fa icon is 80px and the text is 20px) to provide the best center position */
					paddingTop: Math.max( ( imageSize.height / 2 ) - ( imageSize.height / 2 / 2 ) + 50, 0 ) + 'px'
				});
			}
		},

		/**
		 * A click on the lightbox
		 *
		 * @param	{event} 	e 		The event object
		 * @returns {void}
		 */
		clickedLightbox = function (e) {
			// Don't fire if we're inside an <a>
			if( $( e.target ).closest('a').length ){
				return;
			}

			// Get window width
			var width = $( document ).width();
			var halfPos = width / 2;

			// If we're clicking the right side of the screen, go forwards.
			// If we're clicking the left side of the screen, go backwards.
			// Otherwise, close the lightbox.
			if( e.pageX >= halfPos && pieces.next.is(':visible') ){
				pieces.next.click();
			} else if( e.pageX < halfPos && pieces.prev.is(':visible') ){
				pieces.prev.click();
			} else {
				close();
			}
		},

		/**
		 * Retrieves the next image and shows it
		 *
		 * @param	{event} 	e 		The event object
		 * @returns {void}
		 */
		nextImage = function (e) {
			e.preventDefault();
			e.stopPropagation();

			// If we are using events, we can return now and let the events handle the rest
			if( options.useEvents )
			{
				$( document ).trigger( 'lightboxNextImage' );
				return;
			}

			currentImage = _getNextImage();
			_showImage( currentImage );
		},

		/**
		 * Retrieves the previous image and shows it
		 *
		 * @param	{event} 	e 		The event object
		 * @returns {void}
		 */
		prevImage = function (e) {
			e.preventDefault();
			e.stopPropagation();

			if( options.useEvents )
			{
				$( document ).trigger( 'lightboxPrevImage' );
				return;
			}

			currentImage = _getPrevImage();
			_showImage( currentImage );
		},

		/**
		 * Returns the previous image from imageCollection
		 *
		 * @param	{event} 	e 		The event handler
		 * @returns {object} 	The previous image object
		 */
		_getPrevImage = function (e) {
			var curPos = _.indexOf( imageCollection, currentImage );

			if( curPos === 0 ){
				return imageCollection[ imageCollection.length - 1 ];
			}

			return imageCollection[ curPos - 1 ];
		},

		/**
		 * Returns the next image from imageCollection
		 *
		 * @param	{event} 	e 		The event handler
		 * @returns {object} 	The next image object
		 */
		_getNextImage = function () {
			var curPos = _.indexOf( imageCollection, currentImage );

			if( curPos == ( imageCollection.length - 1 ) ){
				return imageCollection[0];
			}

			return imageCollection[ curPos + 1 ];	
		},

		/**
		 * Closes the lightbox
		 *
		 * @param	{event} 	e 		The event handler
		 * @returns {void}
		 */
		close = function (e) {
			if( e ){
				e.preventDefault();
				e.stopPropagation();	
			}			

			modal.hide();
			pieces.lightbox.hide();
		},

		/**
		 * Displays the lightbox on-screen
		 *
		 * @returns 	{void}
		 */
		_show = function () {
			ips.utils.anim.go( 'fadeIn fast', modal );
			ips.utils.anim.go( 'fadeIn fast', pieces.lightbox );
			//pieces.lightbox.show();
		},

		/**
		 * Builds the lightbox UI
		 *
		 * @returns 	{void}
		 */
		_buildWrapper = function () {

			// Build pieces
			pieces = {
				lightbox: $('<div/>')
					.addClass( options.className )
					.css( { zIndex: ips.ui.zIndex() } ),

				imagePanel: $('<div/>')
					.addClass( options.className + '_imagePanel' ),

				commentsPanel: $('<div/>')
					.addClass( options.className + '_commentsPanel' )
					.html('')
					.hide(),

				next: $('<a/>')
					.addClass( options.className + '_next' )
					.html("<i class='fa fa-angle-right'></i>"),

				prev: $('<a/>')
					.addClass( options.className + '_prev' )
					.html("<i class='fa fa-angle-left'></i>"),

				close: $('<a/>')
					.addClass( options.className + '_close' )
					.html("&times;"),

				fullSize: $('<a/>')
					.attr( 'href', '#' )
					.attr( 'target', '_blank' )
					.addClass( options.className + '_fullSize' ),

				metaPanel: $('<div/>')
					.addClass( options.className + '_meta' )
					.hide()
			};

			// Assemble
			pieces.lightbox
				.append( 
					pieces.imagePanel
						.append( pieces.next )
						.append( pieces.prev )
						.append( pieces.fullSize )
				)
				.append( pieces.metaPanel )
				.append( pieces.commentsPanel )
				.append( pieces.close );

			$('body').append( pieces.lightbox );
		},

		/**
		 * Populates imageCollection with the images grouped with this lightbox
		 *
		 * @returns 	{void}
		 */
		_getAllImages = function () {
			
			if( options.group ){
				var images = $('[data-ipslightbox-group="' + options.group + '"]');
			} else {
				var images = $( elem );
			}

			$.each( images, function (i, thisElem) {
				imageCollection.push( _returnImageData( thisElem ) );
			});
		},

		/**
		 * Returns image data for the provided element
		 *
		 * @param	{element} 	thisElem 		The element being worked with
		 * @returns {object} 	Image data
		 */
		_returnImageData = function (thisElem) {

			var origImage,
				largeImage;

			if( thisElem.tagName != 'IMG' ){
				origImage = $( thisElem ).find('img').attr('src');
			} else {
				origImage = $( thisElem ).attr('src');
			}

			if( $( thisElem ).attr('data-fullURL') ){
				largeImage = $( thisElem ).attr('data-fullURL');
			} else if( thisElem.tagName == 'A' && $( thisElem ).attr('href') ){
				largeImage = $( thisElem ).attr('href');
			}

			return {
				elem: thisElem,
				originalImage: origImage,
				largeImage: largeImage || origImage,
				meta: $( thisElem ).attr('data-ipsLightbox-meta'),
				commentsURL: $( thisElem ).attr('data-ipsLightbox-commentURL')
			};
		},

		/**
		 * Gets the modal element from ips.ui, and sets a new zIndex on it
		 *
		 * @returns 	{void}
		 */
		_buildModal = function () {
			modal = ips.ui.getModal();
			modal.css( { zIndex: ips.ui.zIndex() } );
		};

		init();

		return {
			destruct: destruct
		};
	};
}(jQuery, _));