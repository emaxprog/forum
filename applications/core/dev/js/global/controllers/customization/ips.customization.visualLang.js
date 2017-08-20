/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.customization.visualLang.js - Visual language editor controller
 *
 * Author: Mark Wade & Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.customization.visualLang', {

		timeout: null,

		initialize: function () {
			this.on( document, 'mousedown', 'span[data-vle]', this.mouseDownLang );
			this.on( document, 'mouseup mouseleave', 'span[data-vle]', this.mouseUpLang );
			this.on( document, 'keypress', 'input[type="text"][data-role="vle"]', this.keyPressEditBox );
			this.on( document, 'blur', 'input[type="text"][data-role="vle"]', this.blurEditBox );
			this.on( document, 'contentChange', this.contentChange );
			this.setup();
		},

		/**
		 * Set up visual editor
		 * Prepares text nodes for editing, and removes any stragglers
		 *
		 * @returns {void}
		 */
		setup: function () {
			var self = this;

			this._boundHandler = _.bind( this._preventDefaultHandler, this );

			// Remove the VLE tag from the title
			this._removeLangTag('title');

			$( document ).ready( function () {
				self._setUpTextNodes('body');
				self._removeLangTag('body');
				self.scope.trigger('vleDone');
			});
		},

		/**
		 * Inits VLE on a changed dom element
		 *
		 * @returns {void}
		 */
		contentChange: function (e, data) {
			this._setUpTextNodes( data );
			this._removeLangTag( data );
		},

		/**
		 * Event handler for mousedown on document
		 * Sets a timeout so that editing only happens after 1 second
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		mouseDownLang: function (e) {
			this.timeout = setTimeout( _.partial( this._enableLangEditing, e), 1000 );
		},

		/**
		 * Event handler for mouseup on document
		 * Clears timeout
		 *
		 * @returns {void}
		 */
		mouseUpLang: function () {
			clearTimeout( this.timeout );
		},

		/**
		 * Event handler for keypress in an editing input box
		 * Blurs input if enter is pressed
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		keyPressEditBox: function (e) {
			if( e.keyCode == ips.ui.key.ENTER ){
				e.stopPropagation();
				$( e.currentTarget ).blur();
				return false;
			}
		},

		/**
		 * Event handler for blur on editing input box
		 * Sends the new value via ajax, and removes the editing box
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		blurEditBox: function (e) {
			var inputNode = $( e.currentTarget );
			var value = inputNode.val();
			var safeValue = encodeURIComponent( value );
			var elem = inputNode.closest('[data-vle]');
			var url = '?app=core&module=system&controller=vle&do=set';

			if( value == elem.attr('data-original') || value == '' ){
				elem.html( elem.attr('data-original') );				
			} else {
				inputNode
					.val('')
					.addClass('ipsField_loading');
								
				ips.getAjax()( url + '&key=' + elem.attr('data-vle') + '&value=' + safeValue )
					.done( function (response) {
						$(document).find('[data-vle="' + elem.attr('data-vle') + '"]').html( response );
					})
					.fail( function () {
						Debug.log( url + '&key=' + elem.attr('data-vle') + '&value=' + safeValue );
					 	
					 	elem.html( inputNode.attr('data-original') );

						ips.ui.alert.show( {
							type: 'alert',
							icon: 'warn',
							message: ips.getString('js_login_both'),
						});
					});
			}

			var parentLink = elem.closest('a');

			if( parentLink.length ){
				parentLink.off( 'click', this._boundHandler );

				if( parentLink.attr('data-vleHref') ){
					parentLink.attr('href', parentLink.attr('data-vleHref') ).removeAttr('data-vleHref');
				}
			}
		},

		/**
		 * Event handler we can assign to prevent links from navigating
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_preventDefaultHandler: function (e) {
			e.preventDefault();
		},

		/**
		 * Called when mouse has clicked on a string for 1 second
		 * Replaces the elem with a textbox containing the value to allow editing
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_enableLangEditing: function (e) {
			var elem = $( e.currentTarget );
			var parentLink = elem.closest('a');

			if( parentLink.length ){
				parentLink
					.on( 'click', this._boundHandler )
					.attr( 'data-vleHref', parentLink.attr('href') )
					.attr( 'href', '#' );
			}

			var inputNode = $('<input/>')
								.attr( { type: 'text' } )
								.addClass( 'ipsField_loading ipsField_vle' )
								.attr( 'data-role', 'vle' );

			elem.html('').append( inputNode );

			// Fire an ajax request to get the raw language string, then update the text box with the returned value
			ips.getAjax()( '?app=core&module=system&controller=vle&do=get&key=' + elem.attr('data-vle') )
				.done( function (response) {
					console.log( elem.attr('data-vle') );
					inputNode
						.val( response )
						.attr( { 'data-original': response } )
			 			.removeClass('ipsField_loading')
			 			.focus()
			 			.select()
				})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('js_login_both'),
					});
				});

		},

		/**
		 * Removes stray language tags from the provided element
		 *
		 * @param 	{element} 	element 	Element from which to remove tags
		 * @returns {void}
		 */
		_removeLangTag: function (element) {
			var elem = $( element );
			elem.contents().filter(function() { return this.nodeType === 3 || this.tagName === "LABEL" || this.tagName === "SPAN"; }).each(function(){
				$(this).replaceWith( $(this).text().replace( /\#VLE\#.+?#!#\[(.+?)\]#!##/gm, '$1' ) );
			});
			elem.find('i[class]').each(function(){
				$(this).attr( 'class', $(this).attr('class').replace( /\#VLE\#.+?#!#\[(.+?)\]#!##/gm, '$1' ) );
			});
			elem.find('[placeholder]').each(function(){
				$(this).attr( 'placeholder', $(this).attr('placeholder').replace( /\#VLE\#.+?#!#\[(.+?)\]#!##/gm, '$1' ) );
			});
			elem.find('[title]').each(function(){
				$(this).attr( 'title', $(this).attr('title').replace( /\#VLE\#.+?#!#\[(.+?)\]#!##/gm, '$1' ) );
			});
			elem.find('[aria-label]').each(function(){
				$(this).attr( 'aria-label', $(this).attr('aria-label').replace( /\#VLE\#.+?#!#\[(.+?)\]#!##/gm, '$1' ) );
			});
		},

		/**
		 * Turns strings into editable spans in the provided element
		 *
		 * @param 	{element} 	element 	Element in which to replace language strings
		 * @returns {void}
		 */
		_setUpTextNodes: function ( element ) {			
			var regex = /\#VLE\#(.+?)#!#\[(.+?)\]#!##/gm;		

			$( element )
				.find('*')
				.contents()
					.filter( function () {
						var elem = $( this );
						return !elem.is('iframe') && !elem.closest('[data-ipsEditor]').length && !elem.is('textarea') && ( elem.is('[value]') || this.nodeType == 3 );
					})
				    	.each( function (idx, elem) {
				    		var elem = $( elem );
				    		if( elem.get(0).nodeType == 3 ){
				    			// Text inputs
								elem.replaceWith( elem.text().replace( regex, '<span data-vle="$1" data-original="$2">$2</span>' ) );
							} else if( elem.is('[value]') ){
								// Inputs
								if( elem.val() != '' ){
									elem.attr( 'data-vle', elem.val().replace( regex, '$1' ) ).val( elem.val().replace( regex, '$2' ) );	
								}							
							}
						});
		}
	});
}(jQuery, _));