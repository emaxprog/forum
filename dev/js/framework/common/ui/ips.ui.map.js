/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.map.js - Interactive Map
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){

	ips.createModule('ips.ui.map', function(){
		
		var defaults = {
			apiKey: null,
			zoom: 2,
			markers: '[]',
			contentUrl: null
		};

		/**
		 * Respond to a menu trigger being clicked
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @param	{event} 	e 		 	The event object
		 * @returns {void}
		 */
		var respond = function (elem, options, e) {
			
			options = _.defaults( options, defaults );
			
			ips.loader.get( [ 'https://maps.googleapis.com/maps/api/js?key=' + options.apiKey + '&callback=ips.ui.map.googleCallback' ] );
						
			$( window ).on( 'googleApiLoaded', function(){
				
				var map = new google.maps.Map( elem.get(0), {
					zoom: options.zoom,
					center: { lat: 45, lng: 0 },
					scrollwheel: false
				});
				
				var infowindow = new google.maps.InfoWindow({
					content: ips.getString('loading')
				});
				
				var markers = $.parseJSON( options.markers );
				for ( var id in markers ) {
															
					var marker = new google.maps.Marker({
					  position: { lat: markers[id].lat, lng: markers[id].long },
					  map: map,
					  title: markers[id].title,
					  icon: {
						  fillColor: 'blue'
					  },
					  id: id
					});
					
					if ( options.contentUrl ) {
						marker.addListener('click', function() {	
							
							infowindow.setContent( ips.getString('loading') )					
							infowindow.open(map,this);
							
							ips.getAjax()( options.contentUrl + this.id ).done(function(response){
								infowindow.setContent( response );
							});

						});
					}
				}
				
			});
		};
		
		var googleCallback = function(){
			$( window ).trigger( 'googleApiLoaded' );
		};
		
		ips.ui.registerWidget('map', ips.ui.map, [ 'apiKey', 'zoom', 'markers', 'contentUrl' ] );

		return {
			respond: respond,
			googleCallback: googleCallback
		};
	});
}(jQuery, _));