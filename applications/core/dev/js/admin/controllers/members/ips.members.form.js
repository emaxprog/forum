/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.members.form.js - ACP Files Form Stuffs
 *
 * Author: MTM
 */

;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.admin.members.form', {

		initialize: function () {
			this.on( 'submit', this.submitForm );
		},
		
		/**
		 * Check if move is needed
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		submitForm: function (e) {
			var self = this;
			
			if( $( e.currentTarget ).attr('data-bypassValidation') ){
				return true;
			}
			
			e.preventDefault();
		
			var isInAdminGroup = false;
			var mainGroup = this.scope.find('select[name=group]').val();
			var secondaryGroups = _.map( this.scope.find('select[name="secondary_groups[]"]').val(), function( val ){
				return parseInt( val );
			} );
			var adminGroups = $.parseJSON( this.scope.attr('data-adminGroups') );
			if( adminGroups.length ){
				for( var i = 0; i < adminGroups.length; i++ ) {
					var testId = adminGroups[i];
					if ( secondaryGroups != null && secondaryGroups.length && _.indexOf( secondaryGroups, testId ) != -1 ) {
						isInAdminGroup = true;
					}
					if ( testId == mainGroup ) {
						isInAdminGroup = true;
					}
				}
			}
			
			if ( isInAdminGroup ) {
				ips.ui.alert.show({
					type: 'confirm',
					message: ips.getString('member_edit_is_admin', { name: _.escape( this.scope.find('input[name=ips_member_name]').val() ) } ),
					icon: 'fa fa-warning',
					buttons: {
						ok: ips.getString('member_edit_ok'),
						cancel: ips.getString('member_edit_cancel')
					},
					callbacks: {
						ok: function () {
							$( e.currentTarget ).attr('data-bypassValidation', true);
							$( e.currentTarget ).submit();
						},
						cancel: function () {
							return false;
						}
					}
				});
			} else {
				$( e.currentTarget ).attr('data-bypassValidation', true);
				$( e.currentTarget ).submit();
			}
		}
	});
}(jQuery, _));