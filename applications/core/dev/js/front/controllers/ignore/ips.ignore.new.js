/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ignore.new.js - Manage Ignored Users controller
 *
 * Author: Rikki Tissier / Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.ignore.new', {
	
		/**
 		 * Initialize controller events
		 * Sets up the events from the view that this controller will handle
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			this.on( 'submit', '#elIgnoreForm', this.addIgnoredUser );
			this.on( 'tokenAdded', this.showExtraControls );
			this.setup();
		},

		/**
 		 * Non-event-based setup
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			if ( parseInt( this.scope.attr('data-id') ) === 0 ) {
				$('#elIgnoreTypes, #elIgnoreSubmitRow').hide();
			}	
		},
				
		/**
 		 * Submit handler for add user form. Gathers the types of content to be ignored, and emits an
 		 * event allowing the model to handle it
		 *
		 * @param 		{event} 	e 	Event object
		 * @returns 	{void}
		 */
		addIgnoredUser: function (e) {
			var form = this.scope.find('#elIgnoreForm');
			
			if( form.attr('data-bypassValidation') ){
				return;
			}
			
			e.preventDefault();
				
			var self = this;
			var scope = this.scope;

			ips.getAjax()( form.attr('action'), {
				data: form.serialize(),
				type: 'post'
			}).done( function (response, textStatus, jqXHR) {
				if ( jqXHR.responseJSON ) {
					ips.utils.anim.go( 'fadeOut', $('#elIgnoreTypes, #elIgnoreSubmitRow') ).then( function () {
						var field = scope.find('[name="member"]');
						ips.ui.autocomplete.getObj( field ).removeAll();
						form.find( "[type='checkbox']" ).attr( 'checked', '' ).change();
					});

					// Show confirmation
					ips.ui.flashMsg.show( 
						ips.getString('addedIgnore', {
							user: _.escape( response.name )
						})
					);

					// Find the table, and refresh
					self.triggerOn( 'core.global.core.table', 'refreshResults' );	
					
				} else {
					form.attr('data-bypassValidation', true).submit();
				}
			}).fail( function (jqXHR, textStatus, errorThrown) {
				form.attr('data-bypassValidation', true).submit();
			});
		},
		
		/**
 		 * Triggered when the autocomplete field has added a token. Shows the extra options
 		 * on the form.
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Data object from the event. Contains token information.
		 * @returns 	{void}
		 */
		showExtraControls: function (e, data) {
			
			var field = this.scope.find('[name="member"]');
			var wrapper = $( '#' + field.attr('id') + '_wrapper' );
			wrapper.addClass('ipsField_loading');
						
			var form = this.scope.find('#elIgnoreForm');
			
			ips.getAjax()( form.attr('action'), {
				type: 'post',
				data: {
					do: 'add',
					name: this.scope.find('[name="member"]').val()
				}
			} )
				.done( function( response ) {
					var i;
					for ( i in response ) {
						form.find( "[name='ignore_" + i + "_checkbox']" ).attr( 'checked', response[i] == 1 ).change();
					}
					
					ips.utils.anim.go( 'fadeIn', $('#elIgnoreTypes, #elIgnoreSubmitRow') );
				})
				.fail( function( jqXHR, textStatus, errorThrown ) {
					ips.ui.alert.show({
						message: jqXHR.responseJSON['error']
					});

					field.data('_autocomplete').removeAll();
				}).always(function(){
					wrapper.removeClass('ipsField_loading');
				});
		}		

	});
}(jQuery, _));