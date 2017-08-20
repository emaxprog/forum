/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.mymediasection.js - My media section
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.mymediasection', {

		_timer: null,
		_ajax: null,
		_value: '',

		initialize: function () {
			//this.on( 'input', '[data-role="myMediaSearch"]', this.myMediaSearch );
			this.on( 'focus', '[data-role="myMediaSearch"]', this.focusMediaSearch );
			this.on( 'blur', '[data-role="myMediaSearch"]', this.blurMediaSearch );
			this.on( 'paginationClicked paginationJump', this.paginationClicked );
		},

		paginationClicked: function (e, data) {
			var self = this;
			var results = this.scope.find('[data-role="myMediaResults"]');
			var url = data.href;

			data.originalEvent.preventDefault();

			if( url == '#' ){
				// Manually build URL if we're using the pagejump
				url = data.paginationElem.find('[data-role="pageJump"]').attr('action') + '&page=' + data.pageNo;
			}

			// Load another page
			this._ajax = ips.getAjax()( url, {
				showLoading: true,
				data: {
					search: this._value
				}
			} )
				.done( function (response) {
					results.html( response );
					$( document ).trigger( 'contentChange', [ results ] );
				});
		},

		/**
		 * Event handler for focusing the search box
		 *
		 * @returns	{void}
		 */
		focusMediaSearch: function () {
			// Start the timer going
			this._timer = setInterval( _.bind( this._checkValue, this ), 700 );
		},

		/**
		 * Event handler for blurring the search box
		 *
		 * @returns	{void}
		 */
		blurMediaSearch: function () {
			clearInterval( this._timer );
		},

		/**
		 * If the current value is different to the previous value, run the search
		 *
		 * @returns	{void}
		 */
		_checkValue: function () {
			var value = this.scope.find('[data-role="myMediaSearch"]').val();

			if( value == this._value ){
				return;
			}

			this._value = value;
			this._loadResults();
		},

		/**
		 * Runs a search
		 *
		 * @returns	{void}
		 */
		_loadResults: function () {
			var self = this;
			var url = this.scope.attr('data-url');
			
			// Abort any requests running now
			if( this._ajax && this._ajax.abort ){
				this._ajax.abort();
			}

			this.scope.find('[data-role="myMediaSearch"]').addClass('ipsField_loading');

			this._ajax = ips.getAjax()( url, {
				data: {
					search: this._value
				}
			})
				.done( function (response) {
					self.scope.find('[data-role="myMediaResults"]').html( response );
					$( document ).trigger( 'contentChange', [ self.scope.find('[data-role="myMediaResults"]') ] );
				})
				.always( function () {
					self.scope.find('[data-role="myMediaSearch"]').removeClass('ipsField_loading');
				});
		}
	});
}(jQuery, _));