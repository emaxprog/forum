/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.databases.form.js
 *
 * Author: Matt Mecham
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.front.records.form', {
		lastChecked: '',
		
		initialize: function () {
			$( '#elInput_' + this.scope.attr('data-ipsTitleField') ).on( 'blur', $.proxy( this.updateSlug, this ) );
			this.scope.find('button[data-ipsChange]').on( 'click', $.proxy( this.manualToggle, this ) );
			this.scope.find('button[data-ipsCancel]').on( 'click', $.proxy( this.manualCancel, this ) );
			
			/* Stuff already populated? */
			if ( this.scope.find('input[name=record_static_furl_set_checkbox]').prop('checked') )
			{
				this.scope.removeClass('ipsHide');
				this._show();
			}
		},
		
		/**
		 * Hide options
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		_hide: function() {
			this.scope.find('span[data-ipsSlugManual]').addClass('ipsHide');
			this.scope.find('span[data-ipsSlugSlug]').removeClass('ipsHide');
			this.scope.find('span[data-ipsSlugExt]').removeClass('ipsHide');
			this.scope.find('button[data-ipsCancel]').addClass('ipsHide');
			this.scope.find('button[data-ipsChange]').removeClass('ipsHide');
			
			this.scope.find('input[name=record_static_furl_set_checkbox]').prop('checked', false);
			this.scope.find('input[name=record_static_furl_set]').val(0);
		},
		
		/**
		 * Show options
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		_show: function() {
			this.scope.find('button[data-ipsCancel]').removeClass('ipsHide');
			this.scope.find('button[data-ipsChange]').addClass('ipsHide');
			this.scope.find('span[data-ipsSlugManual]').removeClass('ipsHide');
			this.scope.find('span[data-ipsSlugSlug]').addClass('ipsHide');
			this.scope.find('span[data-ipsSlugExt]').addClass('ipsHide');
			
			this.scope.find('input[name=record_static_furl_set_checkbox]').prop('checked', true);
			this.scope.find('input[name=record_static_furl_set]').val(1);
		},
		
		/**
		 * Changed ones mind
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		manualCancel: function (e) {
			e.preventDefault();
			
			this._hide();
		},
		
		/**
		 * Enter a manual URL
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		manualToggle: function (e) {
			e.preventDefault();
			
			this._show();
		},
		
		/**
		 * Slug is being updated?
		 *
		 * @param	{event} 	e 	Event object
		 * @returns {void}
		 */
		updateSlug: function (e) {
			var value = $( '#elInput_' + this.scope.attr('data-ipsTitleField') ).val();
			var self  = this;
			
			if ( value != this.lastChecked )
			{
				ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=cms&module=database&controller=ajax&do=makeFurl', {
					data: {
						slug: value
					}
				})
				.done( function (response) {
					self.scope.removeClass('ipsHide');
					self.scope.find('span[data-ipsSlugSlug]').html( '/' + response.slug );
				});	
				
				this.lastChecked = value;
			}
		}
	});
}(jQuery, _));