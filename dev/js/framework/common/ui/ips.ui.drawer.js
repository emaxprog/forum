/* global ips, _ */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.drawer.js - A drawer (e.g. iOS-style sidebar) widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.drawer', function(){

		var defaults = {};

		/**
		 * Respond to a menu trigger being clicked
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			e.preventDefault();

			if( !$( elem ).data('_drawer') ){
				$( elem ).data('_drawer', drawerObj(elem, _.defaults( options, defaults ) ) );
			}

			$( elem ).data('_drawer').show();
		};

		ips.ui.registerWidget('drawer', ips.ui.drawer, 
			[ 'drawerElem' ],	
			{ lazyLoad: true, lazyEvents: 'click' } 
		);

		return {
			respond: respond
		};
	});

	/**
	 * Drawer instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var drawerObj = function (elem, options) {

		var modal, // The modal background
			drawerElem,
			drawerContent;

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			modal = ips.ui.getModal().addClass('ipsDrawer_modal');
			drawerElem = $( options.drawerElem ),
			drawerContent = drawerElem.find('.ipsDrawer_menu');

			drawerElem.on('click', '[data-action="close"]', function () {
				hide();
			});

			drawerElem.on('click', function (e) {
				if( !$.contains( drawerContent.get(0), e.target ) ){
					hide();
				}
			});

			// set up sub-menus
			drawerElem
				.on( 'click', '.ipsDrawer_itemParent > h4', _showSubMenu )
				.on( 'click', '[data-action="back"]', _subMenuBack )
				.find('.ipsDrawer_itemParent > ul')
					.addClass('ipsDrawer_subMenu')
					.hide();
		},

		_showSubMenu = function (e) {
			e.preventDefault();

			var item = $( e.currentTarget );
						
			item
				.parents('.ipsDrawer_list')
					.animate( ( $('html').attr('dir') === 'rtl' ) ? { marginRight: '-100%' } : { marginLeft: '-100%' } )
				.end()
				.siblings('.ipsDrawer_list')
					.show();
		},

		_subMenuBack = function (e) {
			e.preventDefault();
			
			var item = $( e.currentTarget ),
				thisMenu = item.parent('.ipsDrawer_list');
						
			thisMenu	
				.parents('.ipsDrawer_list')
				.first()
					.animate( ( $('html').attr('dir') === 'rtl' ) ? { marginRight: '0' } : { marginLeft: '0' }, function () {
						thisMenu.hide();
					});

		},

		show = function () {
			window.scrollTo(0,-1);

			// Show modal
			modal.css( { zIndex: ips.ui.zIndex() } );
			
			// Hide close elem
			drawerElem.find('.ipsDrawer_close').hide();
			ips.utils.anim.go( 'fadeIn fast', modal );

			// Show drawer
			drawerElem
				.css( { zIndex: ips.ui.zIndex() } )
				.show();
				
			if( $('html').attr('dir') === 'rtl' ) {
				ips.utils.anim.go( 'slideRight fast', drawerElem );
			} else {
				ips.utils.anim.go( 'slideLeft fast', drawerElem );
			}

			drawerElem.find('.ipsDrawer_close').delay(500).fadeIn();

			// Make body non-scrolly
			$('body').css( {
				overflow: 'hidden'
			});
		},

		hide = function () {
			ips.utils.anim.go( 'fadeOut fast', modal );

			drawerElem.hide();

			$('body').css( {
				overflow: 'auto'
			});
		};

		init();

		return {
			init: init,
			show: show,
			hide: hide
		};
	};
}(jQuery, _));