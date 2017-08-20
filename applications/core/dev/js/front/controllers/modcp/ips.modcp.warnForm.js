/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.modcp.warnForm.js - Controller for the add warning form
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.modcp.warnForm', {
	
		initialize: function () {
			this.on( 'change', '[name="warn_reason"]', this.changeReason ); 
			this.on( 'change', '[name="warn_points"]', this.changePoints );
			this.on( 'editorWidgetInitialized', this.editorInitialized );
		},

		editorInitialized: function (e, data) {
			if( data.id == 'warn_member_note' ){
				$('[name="warn_reason"]').change(); // Set for initial value	
			}
		},
		
		/**
		 * Change reason handler
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changeReason: function(e) {
			var scope = this.scope;
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=warnings&do=reasonAjax&id=' + $( e.target ).val() ).done( function(response) {

                scope.find('[name="warn_points"]').val( response.points ).change().prop( 'disabled', response.points_override == 0 );
                
                if ( response.remove.unlimited ) {
	                scope.find('[name="warn_remove_unlimited"]').prop( 'checked', true );
				} else {
					scope.find('[name="warn_remove_unlimited"]').prop( 'checked', false );
					scope.find('[name="warn_remove"]').val( response.remove.date ).prop( 'disabled', response.remove_override == 0 );
					scope.find('[name="warn_remove_time"]').val( response.remove.time ).prop( 'disabled', response.remove_override == 0 );
				}
				scope.find('[name="warn_remove_unlimited"]').prop( 'disabled', response.remove_override == 0 );

				var editor = ips.ui.editor.getObj( $( 'textarea[name="warn_member_note"]' ).closest('[data-ipsEditor]') );

				if( response.notes ){
					editor.unminimize( function(){
						if( !editor.checkDirty() ){
							editor.reset();
							editor.insertHtml( response.notes );
							editor.resetDirty();
						}
					});
				} else {
					if( editor && !editor.minimized && !editor.checkDirty() ){
						editor.reset();
					}
				}
				
			} );
		},
		
		/**
		 * Change points handler
		 *	
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		changePoints: function(e) {
			var scope = this.scope;
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=warnings&do=actionAjax&points=' + $( e.target ).val() + '&member=' + scope.attr('data-member') ).done( function(response) {
				var types = [ 'mq', 'rpa', 'suspend' ];
				
				for( var i = 0; i < 3; i++ ) {
					scope.find( '[name="warn_punishment[' + types[i] + ']"]' ).prop( 'checked', ( response.actions[ types[i] ].date || response.actions[ types[i] ].unlimited ) ).change();
					scope.find( '[name="warn_' + types[i] + '"]' ).val( response.actions[ types[i] ].date ).prop( 'disabled', !response.override );
					scope.find( '[name="warn_' + types[i] + '_time"]' ).val( response.actions[ types[i] ].time ).prop( 'disabled', !response.override );
					scope.find( '[name="warn_' + types[i] + '_unlimited"]' ).prop( 'checked', response.actions[ types[i] ].unlimited ).prop( 'disabled', !response.override );
				}
			} );
		}
		

	});
}(jQuery, _));
