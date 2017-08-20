/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.dialog.js - Popup dialog UI component
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.dialog', function(){

		var defaults = {
			modal: true,
			draggable: false,
			className: 'ipsDialog',
			close: true,
			fixed: false,
			narrow: false,
			callback: null,
			forceReload: false,
			flashMessage: '',
			flashMessageTimeout: 2,
			remoteVerify: true,
			remoteSubmit: false,
			destructOnClose: false,
			ajax: { type: 'get', data: {} }
		};

		var showStack = [];

		/**
 		 * Respond to a dialog trigger
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			e.preventDefault();

			// If no option URL and no local content is specified, see if we can use
			// the href of the source element
			if( !options.url && !options.content && $( elem ).attr('href') ){
				options.url = $( elem ).attr('href');
			}

			if( !$( elem ).data('_dialog') ){
				$( elem ).data('_dialog', dialogObj(elem, _.defaults( options, defaults ) ) );
			}

			$( elem ).data('_dialog').show();
		},

		/**
		 * Retrieve the dialog instance (if any) on the given element
		 *
		 * @param	{element} 	elem 		The element to check
		 * @returns {mixed} 	The dialog instance or undefined
		 */
		getObj = function (elem) {
			if( $( elem ).data('_dialog') ){
				return $( elem ).data('_dialog');
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
				$( elem ).removeData('_dialog');
			}
		},

		/**
		 * Creates a dialog that is not attached to a specific element
		 *
		 * @param	{object} 	options 		Options passed to the dialog
		 * @returns {object} 	The dialog instance
		 */
		create = function (options) {
			return dialogObj( null, _.defaults( options, defaults ) );
		},

		/**
		 * Init
		 * Sets up events used to manage multiple dialog instances, primarily
		 * the escape key to hide the forefront dialog
		 *
		 * @returns {void}
		 */
		_init = function () {
			// Set up event checking for ESC
			$( document )
				.on( 'keydown', function (e) {
					if( e.keyCode == ips.ui.key.ESCAPE ){
						$( document ).trigger( 'closeDialog', {
							dialogID: showStack[ showStack.length - 1 ]
						});
					}
				})
				.on( 'openDialog', function (e, data) {
					showStack.push( data.dialogID );
				})
				.on( 'hideDialog', function (e, data) {
					showStack = _.without( showStack, data.dialogID );
				});
		};

		ips.ui.registerWidget('dialog', ips.ui.dialog, [ 
			'url', 'modal', 'draggable', 'size', 'title', 'close', 'fixed', 'destructOnClose',
			'callback', 'content', 'forceReload' , 'flashMessage', 'flashMessageTimeout', 'showFrom', 'remoteVerify', 'remoteSubmit'
		], { lazyLoad: true, lazyEvents: 'click' } );

		_init();

		return {
			respond: respond,
			destruct: destruct,
			getObj: getObj,
			create: create
		};
	});

	/**
	 * Dialog instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var dialogObj = function (elem, options) {

		var modal, // The modal background
			dialog, // The dialog element itself
			ajaxObj,
			dialogID = '',
			elemID = '',
			dialogBuilt = false,
			contentLoaded = false,
			modalEvent = { up: false, down: false };

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			
			if( elem === null ){
				elemID = 'elem_' + ( Math.round( Math.random() * 10000000 ) );
			} else {
				elemID = $(elem).identify().attr('id');
			}

			dialogID = elemID + '_dialog';

			// If we're fullscreen, make sure we're fixed too
			if( options.size == 'fullscreen' ){
				options.fixed = true;
			}

			// We watch for this on the document, to give our pages a chance
			// to intercept the event and cancel it (e.g. an unsaved form)
			$( document ).on( 'closeDialog', closeDialog );
		},

		/**
		 * Destruct the dialog for this instance
		 *
		 * @returns 	{void}
		 */
		destruct = function () {
			$( document ).off( 'closeDialog', closeDialog );

			if( modal ){
				modal.remove();
			}

			if( dialog ){
				dialog.remove();
			}
		},

		/**
		 * Event handler for the closeDialog event
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		closeDialog = function (e, data) {
			if( data && data.originalEvent ){
				data.originalEvent.preventDefault();
			}

			if( data && data.dialogID == dialogID ){
				hide();
				modalEvent = { up: false, down: false };
			}
		},

		/**
		 * Hides this dialog
		 *
		 * @returns 	{void}
		 */
		hide = function () {
			var deferred = $.Deferred();

			if( options.fixed ){
				$('body').removeClass('ipsNoScroll');
			}

			dialog.animationComplete( function () {
				if( options.forceReload || options.destructOnClose ){
					ips.controller.cleanContentsOf( dialog );
					dialog.find( '.' + options.className + '_content' ).html('');
				}
				
				$( elem || document ).trigger('hideDialog', {
					elemID: elemID,
					dialogID: dialogID,
					dialog: dialog
				});

				if( options.destructOnClose ){
					ips.ui.dialog.destruct(elem);
				}

				deferred.resolve();
			});

			ips.utils.anim.go( 'fadeOutDown fast', dialog );

			if( options.modal ){
				ips.utils.anim.go( 'fadeOut fast', modal );
			}

			return deferred.promise();
		},

		/**
		 * Public method for showing the dialog
		 * Builds local or remote dialog if necessary, then shows it
		 *
		 * @param		{bool}		initOnly	If TRUE, will create dialog but not show it
		 * @returns 	{void}
		 */
		show = function ( initOnly ) {
			if( options.url && !contentLoaded ){
				_remoteDialog( initOnly );
			} else if( !contentLoaded ) {
				_localDialog( initOnly );
			} else {
				if ( initOnly ) {
					return;
				}
				
				// Dialog already exists, so reset the zIndex and show it
				modal.css( { zIndex: ips.ui.zIndex() } );
				dialog.css( { zIndex: ips.ui.zIndex() } );
				_positionDialog();
				_showDialog();				
			}
		},

		/**
		 * Remove the dialog
		 *
		 * @returns 	{void}
		 */
		remove = function (hideFirst) {

			var doRemove = function () {
				if( ajaxObj && _.isFunction( ajaxObj.abort ) ){
					ajaxObj.abort();
				}

				// Remove the elements
				dialog.remove();
				modal.remove();

				// Not built
				dialog = null;
				modal = null;
				dialogBuilt = false;
				contentLoaded = false;
				ajaxObj = null;
			};

			// If we're hiding first, we'll do it after the animation has finished
			if( hideFirst && dialog.is(':visible') ){
				hide().done( function () {
					doRemove();
				});
			} else {
				doRemove();
			}
		},

		/**
		 * Sets the dialog to 'loading' state.
		 * Hides the content, and adds a loading thingy.
		 *
		 * @returns 	{void}
		 */
		setLoading = function (loading) {
			if( loading ){
				dialog
					.find( '.' + options.className + '_loading')
						.show()
					.end()
					.find( '.' + options.className + '_content' )
						.hide();

				_positionDialog();
			} else {
				dialog
					.find( '.' + options.className + '_loading')
						.hide()
					.end()
					.find( '.' + options.className + '_content' )
						.show();
			}
		},

		/**
		 * Updates the contents of the dialog
		 *
		 * @returns 	{void}
		 */
		updateContent = function (newContent) {
			dialog.find( '.' + options.className + '_content' ).html( newContent );
			
			$( document ).trigger('contentChange', [ dialog ]);
		},

		/**
		 * Internal method to actually show the dialog
		 * Triggers the openDialog event to let the document know
		 *
		 * @returns 	{void}
		 */
		_showDialog = function () {
			if( options.fixed ){
				$('body').addClass('ipsNoScroll');
			}

			if( options.modal ){
				ips.utils.anim.go('fadeIn', modal);
			}

			if( options.showFrom && $( options.showFrom ).is(':visible') ){
				_showFrom( options.showFrom );
			} else {
				ips.utils.anim.go('fadeInDown', dialog);
			}

			$( elem || document ).trigger('openDialog', {
				elemID: elemID,
				dialogID: dialogID,
				dialog: dialog,
				contentLoaded: contentLoaded
			});
		},

		/**
		 * Displays the popup zooming from the provided element
		 *
		 * @param		{element}	showFrom	The element from which the dialog will pop up
		 * @returns 	{void}
		 */
		_showFrom = function (showFrom) {
			// Get the position of the 'from' element
			dialog.show();
			var dialogBit = dialog.find('>div');
			var dialogPosition = ips.utils.position.getElemPosition( dialogBit );
			var dialogHeight = dialogBit.outerHeight();
			var dialogWidth = dialogBit.outerWidth();
			dialog.hide();

			// 'showFrom' position
			var fromPosition = ips.utils.position.getElemPosition( $( options.showFrom ) );

			// Document sizing
			var docSize = $( document ).outerWidth();

			// Figure out the offset from the halfway mark
			var widthOffset = dialogPosition.viewportOffset.left + ( fromPosition.viewportOffset.left - ( dialogWidth / 2 ) );
			var fromHalfpoint = ( fromPosition.absPos.top + ( $( options.showForm ).outerHeight() / 2 ) );
			var heightOffset = ( fromHalfpoint - dialogPosition.absPos.top - ( dialogHeight / 2 ) );

			if( dialogPosition.viewportOffset.left > fromPosition.viewportOffset.left ){
				widthOffset = widthOffset * -1;
			}

			/*if( dialogPosition.viewportOffset.top < fromPosition.viewportOffset.top ){
				heightOffset = heightOffset * -1;
			}*/

			$( dialog )
				.show();

			$( dialogBit )
				.css({
					transform: 'translateY(' + heightOffset + 'px) translateX(' + widthOffset + 'px) scale(0.1)',
					opacity: 1
				})
				.animate( {
					transform: 'translateY(0px) translateX(0px) scale(1)',
					opacity: 1
				}, { easing: 'swing' } );
		},

		/**
		 * Builds a dialog from remote content
		 *
		 * @param		{bool}	initOnly	If TRUE, will create dialog but not show it
		 * @returns 	{void}
		 */
		_remoteDialog = function ( initOnly ) {

			// Build dialog wrapper
			if( !dialogBuilt ){
				if( options.modal ){
					_buildModal();
				}

				_buildDialog();
			}
			
			if ( initOnly ) {
				_fetchContent();
			} else {
				setLoading( true );
				_showDialog();			
				_fetchContent();
			}
			
			if( !options.forceReload ){
				contentLoaded = true;
			}
		},

		/**
		 * Builds a dialog from a local element
		 *
		 * @param		{bool}	initOnly	If TRUE, will create dialog but not show it
		 * @returns 	{void}
		 */
		_localDialog = function ( initOnly ) {

			if( !options.content && !$( options.content ).length ){
				Debug.warn("'content' option not specified for dialog, or element doesn't exist");
				return;
			}

			if( !dialogBuilt ){
				if( options.modal ){
					_buildModal();
				}

				_buildDialog();
			}
			
			if ( initOnly ) {
				return;
			}

			dialog.find( '.' + options.className + '_content').html( $( options.content ).first().show() );

			_showDialog();

			if( !options.forceReload ){
				contentLoaded = true;
			}
		},

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		_fetchContent = function () {

			var deferred = $.Deferred();

			// Set content to loading
			setLoading( true );

			// Get the content
			ajaxObj = ips.getAjax()( options.url, {
				type: options.ajax.type,
				data: options.ajax.data
				} )
				.done( function (response) {

					// Set our content
					setLoading( false );
					updateContent( response );
					deferred.resolve();
					
					// Run callback
					if ( options.callback !== null ) {
						options.callback( dialog );
					}
										
					// Send trigger
					$( elem || document ).trigger('dialogContentLoaded', {
						elemID: elemID,
						dialogID: dialogID,
						dialog: dialog,
						contentLoaded: true
					});
				})
				.fail( function (jqXHR, status, errorThrown) {
					if( jqXHR.responseJSON ){
						ips.ui.alert.show({
							message: jqXHR.responseJSON,
						});
						setLoading(false);
						contentLoaded = false;
						hide();
					} else if( Debug.isEnabled() ){
						Debug.error( "Ajax request failed (" + status + "): " + errorThrown );
					} else if ( elem ) {
						window.location = elem.href;
					} else {
						ips.ui.alert.show({
							message: ips.getString('errorLoadingContent'),
						});
						setLoading(false);
						contentLoaded = false;
						hide();
					}

					deferred.reject();
				})
				.always( function () {
					//_removeLoadingWidget();
				});

			return deferred.promise();
		},

		/**
		 * Builds the dialog frame
		 *
		 * @returns 	{void}
		 */
		_buildDialog = function () {

			if( dialogBuilt ){
				return;
			}

			var offset = 0;

			// Build dialog
			$('body').append(
				 ips.templates.render( 'core.dialog.main', {
					'class': options.className,
					title: options.title || '',
					id: dialogID,
					fixed: options.fixed,
					size: options.size,
					close: options.close
				})
			);

			dialog = $( '#' + dialogID );

			// Add to body
			dialog.css( {
				zIndex: ips.ui.zIndex(),
			});

			_positionDialog();
			
			// Add events
			dialog.on('click', '[data-action="dialogClose"]', function (e) {
				// We trigger on the dialog, but watch on the document
				$( dialog ).trigger('closeDialog', { 
					dialogID: dialogID,
					originalEvent: e
				});
			});

			$( dialog ).on('closeDialog', function (e, data) {
				hide();
			});

			if( options.close ){
				dialog.on( 'mouseup', function (e) {
					// This check is necessary so that if you click in the dialog then drag your mouse out and release over
					// the modal, we don't detect it as a full click on the modal. 
					if( e.target == dialog.get(0) ){
						modalEvent.up = true;
					}					
				});

				dialog.on( 'mousedown', function (e) {
					if( e.target == dialog.get(0) ){
						modalEvent.down = true;
					}					
				});

				dialog.on( 'click', function (e) {
					Debug.log( e.target );

					// If target still exists and isn't a child of the dialog, trigger closeDialog
					if( ( !modalEvent.up || ( dialog.get(0) == e.target && modalEvent.down ) ) && // Mouse up didn't happen on the modal, or it did but we clicked the modal completely
							dialog.find('> div').get(0) != e.target &&
							!$.contains( dialog.find('> div').get(0), e.target ) && 
							$.contains( document, e.target ) 
					){
						$( dialog ).trigger('closeDialog', { 
							dialogID: dialogID,
							originalEvent: e
						});
					}

					modalEvent = { up: false, down: false };
				});
			}

			if( options.remoteVerify || options.remoteSubmit ){
				dialog.find( '.' + options.className + '_content' ).on('submit', 'form', function(e) {
					_ajaxFormSubmit(e, $( this ) );
				});
			}

			dialogBuilt = true;
		},

		/**
		 * Positions the dialog window
		 *
		 * @returns 	{void}
		 */
		_positionDialog = function () {
			// Get the body scroll position
			if( dialog && !options.fixed ){
				var win = $( window );
				var offset = win.scrollTop();

				dialog.css({
					top: offset + 'px'
				});
			}
		},

		/**
		 * Fetches a modal element from ips.ui and sets the zindex on it
		 *
		 * @returns 	{void}
		 */
		_buildModal = function () {
			modal = ips.ui.getModal();
			modal.css( { zIndex: ips.ui.zIndex() } );
		},
		
		/**
		 * Submit a form within the dialog using AJAX
		 *
		 * @param		{event}		e			The submit event
		 * @param		{element} 	elem 		The element this widget is being created on
		 * @returns		{void}
		 */
		_ajaxFormSubmit = function(e, form) {
			if( form.attr('data-bypassValidation') ){
				return false;
			}

			e.preventDefault();
			setLoading( true );
			
			// This is necessary to stop CKEditor fields submitting blank
			try {
				if( !_.isUndefined( CKEDITOR ) && CKEDITOR != null ){
					for( var instance in CKEDITOR.instances ) {
						CKEDITOR.instances[ instance ].updateElement();
					}
				}
			} catch (err) { }
			
			var url = form.attr('action');
			var ajaxUrl = url;

			if( options.remoteVerify ){
				var joinWith = '?';
				
				if ( ajaxUrl.indexOf('?') != -1 ){
					joinWith = '&';
				}
				
				ajaxUrl	= ajaxUrl + joinWith + 'ajaxValidate=1';
			}

			ips.getAjax()( ajaxUrl, {
				data: form.serialize(),
				type: 'post'
			} )
				.done( function (response, status, jqXHR) {

					// If we are verifying remotely, and we haven't already checked everything is fine...
					if( options.remoteVerify && !form.attr('data-bypassValidation') ){
						if( jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormError: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormNoSubmit: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formerror: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formnosubmit: true') !== -1 ){
							Debug.log('Validation failed');
							setLoading( false );
							updateContent( response );
							return;
						}
					}
					
					if( options.remoteSubmit ){

						var doneAfterSubmit = function (submitResponse) {

							// If we're submitting via ajax, then we've already done that; just need to trigger an event and hide the dialog
							$( elem || document ).trigger('submitDialog', {
								elemID: elemID,
								dialogID: dialogID,
								dialog: dialog,
								contentLoaded: contentLoaded,
								response: submitResponse
							});

							setLoading( false );
							contentLoaded = false; // This will cause the dialog to be reloaded again if we open it again, which we want so our previous values aren't still inputted
							hide();
							
							if( options.flashMessage ){
								ips.ui.flashMsg.show( options.flashMessage, { timeout: options.flashMessageTimeout } );
							}
						};

						// If we verified this submission first, we actually need to submit again, without the verification this time
						if( options.remoteVerify ) {
							ips.getAjax()( url, {
								data: form.serialize(),
								type: 'post',
								bypassRedirect: true
							})
								.done( function (response, status, jqXHR) {
									if( jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormError: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormNoSubmit: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formerror: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formnosubmit: true') !== -1 ){
										form.attr( 'data-bypassValidation', true ).submit();
									} else {
										doneAfterSubmit( response );
									}
								})
								.fail( function (jqXHR, status, errorThrown) {
									form.attr( 'data-bypassValidation', true ).submit();
								});
						} else {
							doneAfterSubmit( response );
						}
						
					} else if( jqXHR.getAllResponseHeaders().indexOf('X-IPS-FormNoSubmit: true') !== -1 || jqXHR.getAllResponseHeaders().indexOf('x-ips-formnosubmit: true') !== -1 ) {
						// If the response from the verification told us not to submit the form, we'll update the dialog
						setLoading( false );
						updateContent( response );
					} else {
						// Otherwise, we've passed verification and we can submit the form as normal
						form.attr( 'data-bypassValidation', true ).submit();
					}
				})
				.fail( function () {
					form.attr( 'data-bypassValidation', true ).submit();
				});
		};

		init();

		return {
			init: init,
			show: show,
			hide: hide,
			remove: remove,
			setLoading: setLoading,
			updateContent: updateContent,
			dialogID: dialogID,
			destruct: destruct
		};
	};
}(jQuery, _));