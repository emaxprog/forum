/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.statusToggle.js - Toggles things between enabled/disabled, online/offline etc.
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.statusToggle', function(){

		/**
		 * Respond method for statusToggles
		 * Finds the active item, and determines the next state. Fires an ajax request to set the state,
		 * and updates the badge shown as needed.
		 *
		 * @param		{element} 	elem 		The element the widget is registered on
		 * @param		{object} 	options		Options object for this widget instance
		 * @param 		{event} 	e 			Event object
		 * @returns 	{void}
		 */
		var respond = function (elem, options, e) {
			e.preventDefault();

			elem = $( elem );
			
			if( elem.attr('data-loading') ){
				return;
			}

			// What's selected now?
			var currentBadge = elem.find('[data-state]:visible');
			var currentState = currentBadge.attr('data-state');
			var url = currentBadge.attr('href');
			
			// Don't do anything if the button opens a dialog
			if ( currentBadge.attr('data-ipsdialog' ) ) {
				return;
			}

			var nextState;

			if( options.intermediate ){
				nextState = ( currentState == 'enabled' ) ? 'intermediate' : ( currentState == 'disabled' ) ? 'enabled' : 'disabled';
			} else {
				nextState = ( currentState == 'enabled' ) ? 'disabled' : 'enabled';
			}

			var nextBadge = elem.find('[data-state="' + nextState + '"]');

			if( !nextBadge.length ){
				Debug.warn( "No badge found for " + nextState + " state");
				return;
			}

			elem.attr( 'data-loading', true );
			currentBadge.css({ opacity: 0.5 });

			// Send ajax request to make the change
			ips.getAjax()( url, {
				showLoading: true // show our global loading indicator
			})
				.done( function (response) {
					currentBadge.hide().css({ opacity: 1 });
					nextBadge.show();

					elem.removeAttr('data-loading');

					// Trigger an event to let the page know
					elem.trigger( 'stateChanged', {
						status: nextState
					});
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					if( Debug.isEnabled() ){
						Debug.error( textStatus );
						Debug.error( jqXHR.responseText );
					} else {
						window.location = url;
					}
				});

		};

		ips.ui.registerWidget( 'statusToggle', ips.ui.statusToggle, [
			'intermediate'
		], { lazyLoad: true, lazyEvent: 'click' } );

		return {
			respond: respond
		};
	});
}(jQuery, _));