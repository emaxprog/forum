/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.uploader.js - Uploading component, serving as a wrapper to plupload
 *
 * Author: Rikki Tissier 
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.uploader', function(){

		var defaults = {
			multiple: false,
			allowedFileTypes: null,
			maxFileSize: null, // in megabytes
			maxTotalSize: null, // in megabytes
			maxChunkSize: null,
			action: null,
			name: 'upload',
			button: '.ipsButton_primary',
			key: null,
			autoStart: true,
			insertable: false,
			template: 'core.attachments.fileItem',
			postkey: ''
		};

		var respond = function (elem, options, e) {				
			if( !$( elem ).data('_uploader') ){
				$( elem ).show();
				$( elem ).data('_uploader', uploadObj(elem, _.defaults( options, defaults ) ) );
			} else {
				try {
					var obj = $( elem ).data('_uploader');
					obj.refresh();
				} catch (err) {
					Debug.log("Couldn't refresh uploader " + $( elem ).identify().attr('id') );
				}
			}
		},

		/**
		 * Retrieve the uploader instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The uploader instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_uploader') ){
				return $( elem ).data('_uploader');
			}

			return undefined;
		};

		ips.ui.registerWidget('uploader', ips.ui.uploader, [ 
			'multiple', 'allowedFileTypes', 'maxFileSize', 'maxTotalSize', 'maxChunkSize', 'action', 'name', 'button', 'key', 
			'maxFiles', 'dropTarget', 'listContainer', 'autoStart', 'insertable', 'template', 'existingFiles', 'postkey'
		] );

		return {
			respond: respond,
			getObj: getObj
		};
	});

	/**
	 * Upload instance
	 * Interfaces with plupload to provide consistent uploading behavior
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var uploadObj = function (elem, options, e) {

		var pluploadObj,
			listContainer,
			uploadCount = 0,
			injectIds = {},
			uploaderID = '';

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			
			uploaderID = $( elem ).identify().attr('id');

			if( options.listContainer ){
				listContainer = $( options.listContainer );
			} else if( $( elem ).find('[data-role="fileList"]').length ) {
				listContainer = $( elem ).find('[data-role="fileList"]');
			} else {
				listContainer = $( elem );
			}

			// Do we need to insert a wrapper though?
			if( ips.templates.get( options.template + 'Wrapper' ) ){
				listContainer.prepend( ips.templates.render( options.template + 'Wrapper' ) );
				// Move any existing items
				var firstItem = listContainer.children().first();
				firstItem.append( listContainer.children().not( firstItem ) );

				// Set listContainer to the wrapper
				listContainer = firstItem;

				// And initialize any widgets we might have
				$( document ).trigger( 'contentChange', [ listContainer.parent() ] );
			}

			// Add document events
			$( document ).on( 'addUploaderFile', _addUploaderFile );
			$( document ).on( 'removeAllFiles', _removeAllFiles );

			// Any files to start with?
			if( options.existingFiles ){
				try {
					var files = $.parseJSON( options.existingFiles );

					if( files.length ){
						_buildExistingFiles( files );
					}
				} catch (err) {
					Debug.error("Couldn't build existing files: " + err );
				}
			}

			if( _supportsDraggable() ){
				$( elem ).find('.ipsAttachment_supportDrag')
					.show()
				.end()
				.find('.ipsAttachment_nonDrag')
					.hide();
			}

			// Load the appropriate files
			var load = ['core/interface/plupload/plupload.full.min.js'];

			if( !ips.getSetting('useCompiledFiles') ){
				load = ['core/interface/plupload/moxie.js', 'core/interface/plupload/plupload.dev.js'];
			}

			ips.loader.get( load ).then( function () {
				_setUpUploader();
				_initUploader();
				_postInitEvents();
				_setUpFormEvents();
			});
		},

		/**
		 * Refreshes the pluploader, if available
		 *
		 * @returns   {void}
		 */
		refresh = function () {
			if( pluploadObj ){
				Debug.log("Refreshing");
				pluploadObj.refresh();
			}
		},

		/**
		 * Sets up form handling, allowing us to stop a form submit if an upload is in progress
		 *
		 * @returns   {void}
		 */
		_setUpFormEvents = function () {
			if( !elem.closest('form').length ){
				return;
			}

			// plupload.STOPPED indicates either nothing has been uploaded or all files
			// have finished uploading. For any other state, we'll stop the form submitting.
			elem.closest('form').on( 'submit', function (e) {
				if( pluploadObj.state != plupload.STOPPED ){
					e.preventDefault();
					e.stopPropagation();

					ips.ui.alert.show({
						type: 'alert',
						message: ips.getString('filesStillUploading'),
						subText: ips.getString('filesStillUploadingDesc'),
						icon: 'warn'
					});
				}
			});
		},

		/**
		 * Responds to event and adds an uploaded file to the uploader container
		 *
		 * @param 	  {event} 	e 		Event object
		 * @param 	  {object} 	data	Event data object
		 * @returns   {void}
		 */
		_addUploaderFile = function (e, data) {
			if( data.uploaderID == uploaderID ){
				listContainer.append( ips.templates.render( options.template, data ) );	
			}			
		},

		/**
		 * Responds to event and removes all the files in the uploader
		 *
		 * @param 	  {event} 	e 		Event object
		 * @param 	  {object} 	data	Event data object
		 * @returns   {void}
		 */
		_removeAllFiles = function (e, data) {
			listContainer.find('[data-role="file"]').remove();
		},

		/**
		 * Builds existing file items using the parsed JSON from the widget settings
		 *
		 * @param 	  {object} 	files 	Object containing file data
		 * @returns   {void}
		 */
		_buildExistingFiles = function (files) {
			if( !files.length ){
				return;
			}

			for( var i = 0; i < files.length; i++ ){
				var data = {
					id: files[i].id,
					imagesrc: files[i].imagesrc,
					thumbnail: files[i].thumbnail ? files[i].thumbnail : '',
					thumbnail_for_css: files[i].thumbnail ? files[i].thumbnail.replace( '(', '\\(' ).replace( ')', '\\)' ) : '',
					title: files[i].originalFileName,
					size: files[i].size,
					field_name: elem.attr('data-ipsUploader-name'),
					newUpload: false,
					insertable: !options.insertable,
					done: true,
					'default': files[i].default ? files[i].default : null
				};

				if( files[i].id == elem.attr('data-ipsUploader-default') ){
					data['checked'] = "checked";
				}
				if( files[i]['hasThumb'] ){
					data['thumb'] = "<img src='" + ( files[i]['thumbnail'] ? files[i]['thumbnail'] : files[i]['imagesrc'] ) + "' class='ipsImage'>";
				}

				listContainer.append( ips.templates.render( options.template, data ) );

				$('#' + files[i].id)
					.trigger( 'newItem', [ $('#' + files[i].id) ] );
			};

			elem.trigger('fileAdded', {
				count: files.length,
				uploader: options.name
			});
		},
		
		/**
		 * Passes a settings object through to plupload, but does not initialize it yet
		 *
		 * @returns   {void}
		 */
		 _setUpUploader = function () {
			pluploadObj = new plupload.Uploader( _getUploaderSettings() );
			pluploadObj.bind('Init', events.init );
			listContainer.find( '[data-role="file"]' ).each( function () {
				var fileElem = $( this );
				fileElem.on( 'click', '[data-role="deleteFile"]', _.bind( _deleteFile, fileElem, fileElem ) );
				uploadCount++;
			});
		},
		
		/**
		 * Builds the settings object which will be passed to plupload
		 *
		 * @returns   {object}
		 */
		_getUploaderSettings = function () {
			
			// If there is no action, find one
			var form = elem.parentsUntil( '', 'form' );
			if ( options.action === null ) {
				options.action = form.attr('action');
			}
			if ( options.key === null ) {
				options.key = form.children("[name='plupload']").val();
			}

			// Init Plupload Options
			var pluploadOptions = {
				runtimes : 'html5,flash,silverlight,html4',
				multi_selection: options.multiple,
				url: encodeURI( _decodeUrl( options.action ) ),
				file_data_name: options.name,
				flash_swf_url: 'applications/core/interface/plupload/Movie.swf',
				silverlight_xap_url: 'applications/core/interface/plupload/Movie.xap',
				browse_button: elem.find( options.button ).identify().attr('id'),
				headers: { 'x-plupload': options.key },
				chunk_size: options.maxChunkSize + 'mb'
			};

			/*if( options.maxFileSize ) {
				pluploadOptions.filters = {
					'max_file_size': ( options.maxFileSize > 1 ) ? options.maxFileSize + 'mb' : ( options.maxFileSize * 1024 ) + 'kb'
				};
			}*/
			/*if ( options.maxFileSize ) {
				pluploadOptions.max_file_size = ( options.maxFileSize > 1 ) ? options.maxFileSize + 'mb' : ( options.maxFileSize * 1024 ) + 'kb';
			}*/

			// Dragdrop target
			if( options.dropTarget ){
				pluploadOptions.drop_element = $( options.dropTarget ).attr('id');
			} else if( $( elem ).hasClass('ipsAttachment_dropZone') ){
				pluploadOptions.drop_element = $( elem ).attr('id');
			} else if( $( elem ).find('.ipsAttachment_dropZone').length ){
				pluploadOptions.drop_element = $( elem ).find('.ipsAttachment_dropZone').identify().attr('id');
			}
					
			return pluploadOptions;
		},
		
		/**
		 * Tests to see if the URL is encoded or not
		 *
		 * @returns   boolean
		 */
		_isEncoded = function( url ) {
			url = url || '';
			
			return url !== decodeURI( url );
		},
		
		/**
		 * Decode an encoded URL
		 *
		 * @returns   boolean
		 */
		_decodeUrl = function( url ) {
			while( _isEncoded( url ) ) {
				url = decodeURI( url );
			}
			return url;
		},
		
		/**
		 * Inits pluploader
		 *
		 * @returns   {void}
		 */
		_initUploader = function () {
			pluploadObj.init();
		},
		
		/**
		 * Binds all of the post-init events for pluploader
		 *
		 * @returns   {void}
		 */
		_postInitEvents = function () {
			pluploadObj.bind('Error', events.error );						// An error occured
			pluploadObj.bind('FilesAdded', events.filesAdded );				// Files added to the queue
			pluploadObj.bind('FilesRemoved', events.filesRemoved );			// Files are removed from the queue
			pluploadObj.bind('UploadFile', events.uploadFile );				// A file is starting
			pluploadObj.bind('UploadProgress', events.uploadProgress );		// There's progress on a file
			pluploadObj.bind('FileUploaded', events.fileUploaded );			// A file finished
			pluploadObj.bind('UploadComplete', events.uploadComplete );		// All files in the queue finished
			
			$( elem )
				.on( 'injectFile', function( e, data ){
					var pluploadFile = new plupload.File( new moxie.file.File( null, data.file ) );					
					injectIds[pluploadFile.id] = data.data;
					pluploadObj.addFile( pluploadFile );
				} )
				.on( 'resetUploader', function ( data ){
					_resetUploader( e, data );
				} )
		},

		/**
		 * Resets this uploader instance, clearing it of files
		 *
		 * @returns 	{void}
		 */
		_resetUploader = function (data) {
			// Update upload count
			uploadCount = 0;
			_updateCount();

			$( elem ).trigger( 'removeAllFiles', { uploaderID: uploaderID } );
		},

		/**
		 * Begins the upload process (called automatically when files are added)
		 *
		 * @returns 	{void}
		 */
		_startUpload = function () {
			Debug.log('Starting upload process...');
			pluploadObj.start();
		},

		/**
		 * Returns a human-readable, translated status string
		 *
		 * @param 	{number}	status 		Status code
		 * @returns {string}
		 */
		_getStatus = function (status) {
			switch( status ) {
				case plupload.QUEUED:
					return ips.getString('attachQueued');
				break;
				case plupload.UPLOADING:
					return ips.getString('attachUploading');
				break;
				case plupload.FAILED:
					return ips.getString('attachFailed');
				break;
				case plupload.DONE:
					return ips.getString('attachDone');
				break;
			}
		},

		/**
		 * Updates a file element with the current status
		 *
		 * @param 	{object} 	file 	File information object from plupload
		 * @returns {element} 	The file element
		 */
		_updateFileElement = function (file) {
			var fileElem = _findFileElem( file );
		
			_updateStatus( fileElem, file.status );
			_removeStatusClasses( fileElem );
			_updateCount();

			return fileElem;
		},

		/**
		 * Returns the file element for a given file object
		 *
		 * @param 	{object}	file 	 	File object from plupload
		 * @returns {element}
		 */
		_findFileElem = function (file) {
			return $( elem ).find('#' + file.id);
		},

		/**
		 * Updates the relevant elements within a file element with the current file status
		 *
		 * @param 	{element}	fileElem 	The element that represents this file
		 * @param	{number} 	status 	 	Current status code
		 * @returns {void}
		 */
		_updateStatus = function (fileElem, status) {
			fileElem.find('[data-role="status"]').html( _getStatus(status) );
		},

		/**
		 * Removes the 4 status classes from the provided file element
		 *
		 * @param 	{element}	fileElem 	The element that represents this file
		 * @returns {void}
		 */
		_removeStatusClasses = function (fileElem) {
			_.each( ['uploading', 'done', 'error', 'queued'], function (type) {
				fileElem.removeClass( 'ipsAttach_' + type );
			});
		},

		/**
		 * Updates relevant elements with the uploaded count, and fires an event to let everyone know
		 *
		 * @returns 	{void}
		 */
		_updateCount = function () {			
			$( elem ).find('[data-role="count"]').text( uploadCount );
			
			elem.trigger('uploadedCountChanged', { 
				count: uploadCount,
				percent: pluploadObj.total.percent,
				uploader: options.name
			});
		},

		/**
		 * Updates relevant element within a file element with the percentage completed
		 *
		 * @param 	{element}	fileElem 	The element that represents this file
		 * @param	{number} 	percent 	Percentage complete
		 * @returns {void}
		 */
		_setPercent = function (fileElem, percent) {
			fileElem.find('[data-role="progressbar"]').css( { width: percent + '%' } );

			if( percent === 100 ){
				ips.utils.anim.go( 'fadeOut fast', fileElem.find('.ipsAttachment_progress') );
			}
		},

		/**
		 * Builds a thumbnail element
		 *
		 * @param 	{element}	fileElem 	The element that represents this file
		 * @param	{object} 	file 	 	File information object
		 * @param	{object} 	info 	 	Info object from events.uploadDone
		 * @returns {void}
		 */
		_buildThumb = function (fileElem, file, info) {
			var toInsert = '';
												
			if( info.imagesrc ){

				Debug.log( fileElem.find('[data-role="preview"]') );

				toInsert = $('<img/>').attr( { src: info.thumbnail ? info.thumbnail : info.imagesrc } ).addClass('ipsImage');
				fileElem
					.attr( 'data-fullsizeurl', info.imagesrc )
					.attr( 'data-thumbnailurl', info.thumbnail ? info.thumbnail : info.imagesrc )
					.find('[data-role="preview"]')
						.html( toInsert )
						.css( 'background-image', 'url( "' + ( info.thumbnail ? info.thumbnail : info.imagesrc ) + '")' );
			}
			
			fileElem.attr( 'data-fileid', info.id );			
		},
		
		/**
		 * Deletes a pre-existing file
		 *
		 * @param 	{element}	fileElem 	The element that represents this file
		 * @param	{event} 	e 	 		Info object from events.uploadDone
		 * @returns {void}
		 */
		_deleteFile = function (fileElem, e) {
			e.preventDefault();
			e.stopPropagation();

			var baseUrl = options.action;

			if( baseUrl.match(/\?/) ) {
				if( baseUrl.slice(-1) != '?' ){
					baseUrl += '&';	
				}	
			} else {
				baseUrl += '?';
			}

			// Delete via ajax
			ips.getAjax()( baseUrl + 'postKey=' + options.postkey + '&deleteFile=' + encodeURIComponent( fileElem.attr('data-fileid') ) );
			
			// Update upload count
			uploadCount--;
			_updateCount();

			// Remove element
			fileElem.animationComplete( function () {
				fileElem.remove();

				// Let the document know
				elem.trigger( 'fileDeleted', { fileElem: fileElem, uploader: options.name, count: uploadCount } );
			});

			ips.utils.anim.go( 'fadeOutDown', fileElem );
		},

		/**
		 * Returns boolean indicating if dragging is supported
		 *
		 * @returns {boolean}	Supports draggable?
		 */
		_supportsDraggable = function () {
			if('draggable' in document.createElement('span') && typeof FileReader != 'undefined' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ){
				return true;
			}

			return false;
		},

		// Events object
		events = {
			/**
			 * Init
			 */
			init: function(up, err) {
				if( _supportsDraggable() ) {
					var dropElement = $( up.settings.drop_element );

					// Handles adding the dragging class to the upload element.
					// dragleave is a pain and works like mouseout instead of mouseleave in that it fires as soon as we leave the parent,
					// even if we're actually in a child now. So we have to get creative about detecting it correctly by listening for
					// dragenters on the whole document, and seeing whether they're children of our upload element.
					var _drag = function () {
						var currentElem = null;

						$( document )
							.on('dragenter', function (e) {
								if( currentElem && !$( e.target ).is( dropElement) && !$.contains( dropElement.get(0), currentElem ) ){
									dropElement.removeClass('ipsDragging');	
									currentElem = null;
								}
							});

						dropElement
							.on('dragleave', function (e) {
								if( !$( currentElem ).is( dropElement) && !$.contains( dropElement.get(0), currentElem ) ){
									dropElement.removeClass('ipsDragging');	
									currentElem = null;
								}
							})
							.on('dragenter', function (e) {
								var target = $( e.target );

								if( target.is( dropElement ) || $.contains( dropElement.get(0), e.target ) ){
									dropElement.addClass('ipsDragging');	
									currentElem = e.target;
								}						
							})
							.on('drop', function (e) {
								dropElement.removeClass('ipsDragging');	
								currentElem = null;
							});
					}();
				}
			},

			/**
			 * Files Added
			 */
			filesAdded: function(up, files) {
												
				if( !options.multiple ) {
					listContainer.find( '[data-role="deleteFile"]' ).click();
					if ( files.length > 1 ) {
						alert( ips.getString( 'uploadSingleErr' ) );
						return false;
					}
				} else if( options.maxFiles ) {
					if( up.files.length > options.maxFiles || ( uploadCount + files.length ) > options.maxFiles ){
						ips.ui.alert.show( {
							type: 'alert',
							icon: 'warn',
							message: ips.pluralize( ips.getString( 'uploadMaxFilesErr' ), options.maxFiles ),
							callbacks: {}
						});
						_.each(files, function (file, idx) {
							up.removeFile( file );
						});
						return false;						
					}
				} else if( options.maxTotalSize && up.total.size > ( options.maxTotalSize * 1048576 ) ) {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString( 'uploadTotalErr', { size: ( options.maxTotalSize > 1 ) ? options.maxTotalSize : ( options.maxTotalSize * 1024 ), size_suffix: ( options.maxTotalSize > 1 ) ? ips.getString('size_mb') : ips.getString('size_kb') } ),
						callbacks: {}
					});
					_.each(files, function (file, idx) {
						up.removeFile( file );
					});
					return false;
				}
					
				var tooLarge = 0;
				var badType = 0;
				var allowedFileTypes = ( options.allowedFileTypes !== null ) ? $.parseJSON( options.allowedFileTypes ).join(',').toLowerCase().split(',') : '';

				_.each(files, function (file, idx) {
					
					// Check the size of this file
					if( options.maxFileSize !== null && ( ( file.size / 1024 ) > ( options.maxFileSize * 1024 ) ) ){
						// The file is too big, so remove it
						tooLarge++;
						up.removeFile( file );
						return;
					}
					
					// And the extension
					if ( allowedFileTypes && allowedFileTypes.indexOf( file.name.substr( ( ~-file.name.lastIndexOf(".") >>> 0 ) + 2 ).toLowerCase() ) === -1 ) {
						badType++;
						up.removeFile( file );
						return;
					}

					var size = plupload.formatSize( file.size ),
						status = _getStatus( file.status ),
						isImage = false;

					// Figure out if this is an image based on extension
					if( [ 'jpg', 'jpeg', 'jpe', 'gif', 'png' ].indexOf( file.name.substr( ( ~-file.name.lastIndexOf(".") >>> 0 ) + 2 ).toLowerCase() ) !== -1 ){
						isImage = true;
					}
					
					var data = {
						uploaderID: uploaderID,
						id: file.id,
						title: file.name,
						size: size,
						status: status,
						statusCode: file.status,
						statusText: ips.getString('attachStatus', { size: size, status: status } ),
						field_name: elem.attr('data-ipsUploader-name'),
						newUpload: true,
						insertable: true,
						isImage: isImage
					};

					// Trigger event for adding the file element, to allow controllers to intercept
					$( elem ).trigger( 'addUploaderFile', data );

					$('#' + file.id)
						.addClass( 'ipsAttach_queued' )
						.trigger( 'newItem', [ $('#' + file.id) ] );
				});
	
				// Do we need to warn the user?
				if( tooLarge ){
					var errorString = ips.getString( 'uploadSizeErr', {
						max_file_size: ( options.maxFileSize > 1 ) ? options.maxFileSize : ( options.maxFileSize * 1024 ),
						size_suffix: ( options.maxFileSize > 1 ) ? ips.getString('size_mb') : ips.getString('size_kb')
					});

					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.pluralize( errorString, [ tooLarge, tooLarge ] ),
						callbacks: {}
					});
				}
				if( badType ){
					var errorString = ips.getString( 'pluploaderr_-601', {
						allowed_extensions: allowedFileTypes.join(', ')
					});

					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.pluralize( errorString, [ tooLarge, tooLarge ] ),
						callbacks: {}
					});
				}

				// If we still have some files, we can start them
				if( up.files.length ){
					elem.trigger('fileAdded', {
						count: up.files.length,
						uploader: options.name
					});

					if( options.autoStart ){
						_startUpload();
					}	
				}				
			},

			filesRemoved: function () {
				Debug.log('removed');
			},
			
			/**
			 * Upload File
			 */
			uploadFile: function(up, file) {
				var fileElem = _updateFileElement( file );
				fileElem.addClass('ipsAttach_uploading');
			},
			
			/**
			 * Upload Progress
			 */
			uploadProgress: function(up, file) {
				var fileElem = _updateFileElement( file );
				fileElem.addClass('ipsAttach_uploading');

				// Set the progress percent
				_setPercent( fileElem, file.percent );

				elem.trigger('uploadProgress', { 
					count: uploadCount,
					percent: pluploadObj.total.percent,
					uploader: options.name
				});
			},

			/**
			 * All files have finished uploading
			 * We'll show a notification & sound if supported
			 */
			uploadComplete: function (up, files) {	
				
				var success = 0;
				var error = 0;

				// Figure out how many files were successful/errors, ignore other statuses
				_.each( files, function (file) {
					if( file.status === 5 ){
						success++;
					} else if ( file.status === 4 ){
						error++;
					}
				});

				var total = success + error;
				
				elem.trigger('uploadComplete', { 
					success: success,
					error: error,
					total: total,
					uploader: options.name
				});

				// Only if we aren't active on the page
				if( _.isUndefined( ips.utils.events.getVisibilityProp() ) || !document[ ips.utils.events.getVisibilityProp() ] ){
					return;
				}

				var text = [];

				if( !total ){
					return;
				}

				if( success ){
					text.push( ips.pluralize( ips.getString('notifyUploadSuccess'), [ success ] ) );
				}

				if( error ){
					text.push( ips.pluralize( ips.getString('notifyUploadError'), [ error ] ) );
				}

				if( ips.utils.notification.supported ){
					ips.utils.notification.create({
						title: ips.pluralize( ips.getString('yourUploadsFinished'), [ total ] ),
						body: text.join(' '),
						icon: ips.getSetting('imgURL') + '/notifyIcons/upload.png',
						onClick: function () {
							try {
								window.focus();
							} catch (err) {}
						}
					}).show();
				}

				ips.loader.get( ['core/interface/buzz/buzz.min.js'] ).then( function () {
					var sound = new buzz.sound( ips.getSetting('baseURL') + 'applications/core/interface/sounds/success', {
						webAudioApi: true,
					    formats: [ "mp3" ]
					});
					sound.play();
				});
			},
			
			/**
			 * File Uploaded
			 */
			fileUploaded: function(up, file, info) {													
				// Update count of completed files
				uploadCount++;

				var fileElem = _updateFileElement( file );
								
				fileElem.addClass('ipsAttach_done');

				if( options.insertable ){
					ips.utils.anim.go('fadeIn', fileElem.find('[data-role="insert"]') );
				}

				ips.utils.anim.go('fadeIn', fileElem.find('[data-role="deleteFileWrapper"]') );

				// Set the progress percent
				_setPercent( fileElem, 100 );
																				
				// Do we have an image to process?
				try {
					var jsonInfo = $.parseJSON( info.response );
										
					elem.before( $('<input type="hidden">').attr( 'name', elem.attr('data-ipsUploader-name') + '_existing[' + file.id + ']' ).attr( 'value', jsonInfo.id ) );
															
					if( jsonInfo['error'] ){
						fileElem.on( 'click', '[data-role="deleteFile"]', _.bind( _deleteFile, fileElem, fileElem ) );
						file.status	= plupload.FAILED;

						up.trigger('error', { 
							code: jsonInfo['error'],
							extra: jsonInfo['extra'],
							file: file,
							uploader: options.name
						});

						return;
					}

					if( jsonInfo ){
						_buildThumb( fileElem, file, jsonInfo );
						fileElem.on( 'click', '[data-role="deleteFile"]', _.bind( _deleteFile, fileElem, fileElem ) );
					}
				} catch (err) {

					fileElem.on( 'click', '[data-role="deleteFile"]', _.bind( _deleteFile, fileElem, fileElem ) );
					file.status	= plupload.FAILED;

					up.trigger('error', { 
						code: 'upload_error',
						extra: err.message,
						file: file,
						uploader: options.name
					});

					Debug.warn( err );
				}
				
				// Are we handling this immediately?
				if ( file.id && injectIds[ file.id ] ) {
					$( elem ).trigger( 'fileInjected', { 'fileElem': fileElem, 'data': injectIds[ file.id ] } );
					delete injectIds[ file.id ];
				}
			},
						
			/**
			 * Error
			 */
			error: function(up, err) {			
				if( err.file ){
					_updateFileElement( err.file );
				}	

				// If this is a 'too large' error, we won't
				if( err.code == -600 || err.code == -601 ){
					errorCounts[ ( err.code == -600 ) ? 'size' : 'ext' ]++;
					return;
				}
				
				var errorMessage = ips.getString( 'pluploaderr_' + err.code, {
					max_file_size: ( options.maxFileSize > 1 ) ? options.maxFileSize : ( options.maxFileSize * 1024 ),
					size_suffix: ( options.maxFileSize > 1 ) ? ips.getString('size_mb') : ips.getString('size_kb'),
					allowed_extensions: ( options.allowedFileTypes !== null ) ? $.parseJSON( options.allowedFileTypes ).join(',') : '',
					server_error_code: ( err.extra !== null ) ? err.extra : 0
				});
				
				if ( !errorMessage ) {
					errorMessage = ips.getString( 'pluploaderr_SERVER_CONFIGURATION', {
						server_error_code: err.code
					} );
				}

				ips.ui.alert.show( {
					type: 'alert',
					icon: 'warn',
					message: errorMessage,
					callbacks: {}
				});
			}
		};
	
		init();
	
		return {
			init: init,
			refresh: refresh
		};

	}
}(jQuery, _));