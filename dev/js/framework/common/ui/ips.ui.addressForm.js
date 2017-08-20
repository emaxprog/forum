/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.addressForm.js - Address form element widget
 *
 * Author: Mark Wade
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.addressForm', function(){
		
		var defaults = {
			minimize: false,
			country: "",
			requireFullAddress: true
		};

		var respond = function (elem, options, e) {
			// Don't reinitialize an existing address field
			if( !_.isUndefined( elem.data('initialized') ) ){
				return;
			}

			options = _.defaults( options, defaults );

			if( options.minimize ){
				minimizeAddress( elem, options );
			} else {
				init( elem, options, e );
			}

			elem.data('initialized', true);
		};
			
		var init = function (elem, options, e) {						
			// Watch for country changes (so we can change state/region to a select box if appropriate
			elem.on( 'change', '[data-role="countrySelect"]', _.bind( countryChange, e, elem, options ) );
			$( elem ).find('[data-role="countrySelect"]').change();
			
			// Add a + button for address lines
			recalculateAddAddressLineButton( elem );
		};
		
		var googlePlacesCallback = function(){
			$( window ).trigger( 'googlePlacesLoaded' );
		};

		var minimizeAddress = function (elem, options) {
			var tempInput = $('<input/>')
								.attr( 'type', 'text' )
								.attr( 'data-role', 'minimizedVersion' )
								.attr( 'placeholder', ips.getString('specifyLocation') )
								.on( 'focus', function (e) {
									// Hide the minimized version
									$( this ).hide();

									// Set country if applicable
									if( options.country ){
										$( elem ).find('[data-role="countrySelect"]').val( options.country );
									}
									
									// Init 
									init( elem, options, e );

									// Show the main address fields
									elem.show().find('input').first().focus();
								});

			var value = [];

			// Build the existing value
			elem.find('input, select').each( function (addressPart) {
				if( $( this ).val() ){
					if( $( this ).is('select') ){
						value.push( $.trim( $( this ).find('option[value="' + $( this ).val() + '"]').text() ) );
					} else {
						value.push( $.trim( $( this ).val() ) );
					}
				}
				
			});

			if( value.length ){
				tempInput.val( value.join(', ') );
			}

			elem
				.hide()
				.after( tempInput );
		};

		var countryChange = function(elem, options, e) {
			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=ajax&do=states&country=' + $( e.target ).val() )
				.done( function (response) {
					if( response.length ) {
						if( !$( elem ).find('[data-role="regionSelect"]').length )
						{
							var regionText = $( elem ).find('[data-role="regionText"]');
						}
						else
						{
							var regionText = $( elem ).find('[data-role="regionSelect"]');
						}
						
						var regionSelect = $('<select data-role="regionSelect" />');

						regionSelect.attr( 'name', regionText.attr('name') );
						
						if ( !options.requireFullAddress ) {
							regionSelect.append( $('<option />').attr( 'value', '' ).html( $( elem ).find('[data-role="regionText"]').attr('placeholder') ) );
						}

						for( var i = 0; i < response.length; i++ ){
							regionSelect.append( $('<option />').attr( 'value', response[i] ).html( response[i] ) );

							if( response[i].toLowerCase() == regionText.val().toLowerCase() ){
								regionSelect.val( response[i] );
							}
						}

						regionText.replaceWith( regionSelect );
					} else {
						if( !$( elem ).find('[data-role="regionText"]').length ){
							var regionSelect = $( elem ).find('[data-role="regionSelect"]');
							var regionText = $('<input type="text" data-role="regionText" placeholder="' + ips.getString('address_region') + '" />');

							regionText.attr( 'name', regionSelect.attr('name') ).val( "" );
							regionSelect.replaceWith( regionText );
						}
					}
				} );

				if ( typeof elem.attr('data-ipsAddressForm-googlePlaces') !== typeof undefined && elem.attr('data-ipsAddressForm-googlePlaces') !== false ) {
					if ( elem.attr( 'data-ipsAddressForm-googlePlaces' ) === 'loaded' ) {
						googlePlacesInit( elem );
					} else {
						ips.loader.get( [ 'https://maps.googleapis.com/maps/api/js?key=' + elem.attr('data-ipsAddressForm-googleApiKey') + '&libraries=places&sensor=false&callback=ips.ui.addressForm.googlePlacesCallback' ] );
						$( window ).on( 'googlePlacesLoaded', function(){
							elem.attr( 'data-ipsAddressForm-googlePlaces', 'loaded' );
							googlePlacesInit( elem );
						});
					}
				}
		};
		
		var addAddressLine = function (elem, value) {
			var lastLine = elem.find('[data-role="addressLine"]').closest('li').last();
			var newLine = lastLine.clone();

			if( value ) {
				newLine.find('input').focus().val( value );
			}

			lastLine.after( newLine );
		};
		
		var recalculateAddAddressLineButton = function (elem) {
			elem.find( '[data-role="addAddressLine"]' ).remove();
			var button = $('<i class="fa fa-plus" style="cursor:pointer; margin-left: 4px" data-role="addAddressLine">');

			button.click( function () {
				addAddressLine(elem, '');
				recalculateAddAddressLineButton(elem);
			});

			elem.find('[data-role="addressLine"]').last().after( button );
		};
		
		var googlePlacesInit = function (elem) {
			var googlePlacesInput = $(elem).find('[data-role="addressLine"]').first();
			var options = {
				types: [ 'geocode' ],
				componentRestrictions: { country: $(elem).find('[data-role="countrySelect"]').val() }
			};
			var autocomplete = new google.maps.places.Autocomplete( googlePlacesInput.get(0), options );

			googlePlacesInput.on( 'focus', function () {
				if( navigator.geolocation ){
					navigator.geolocation.getCurrentPosition( function (position) {
						var geolocation = new google.maps.LatLng( position.coords.latitude,position.coords.longitude );
						autocomplete.setBounds( new google.maps.LatLngBounds( geolocation, geolocation ) );
					});
				}
			} );
			googlePlacesInput.on( 'keypress', function(e) {
				if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
					return false;
				}
			} );

			google.maps.event.addListener( autocomplete, 'place_changed', function () {
				var place = autocomplete.getPlace();
				var i;
				var streetNumber;
				var addressLines = [];
								
				for( i in place.address_components ) {
					switch ( place.address_components[i].types[0] ) {
						case 'street_number':
							streetNumber = place.address_components[i].long_name;
							break;
						case 'street_address':
						case 'route':
						case 'sublocality':
						case 'neighborhood':
						case 'premise':
						case 'subpremise':
							addressLines.push( place.address_components[i].long_name );
							break;
						case 'administrative_area_level_1':
						case 'administrative_area_level_2':
							elem.find('[data-role="regionSelect"]').val( place.address_components[i].long_name );
							elem.find('[data-role="regionText"]').focus().val( place.address_components[i].long_name );
							break;
						case 'locality':
						case 'postal_town':
							elem.find('[data-role="city"]').focus().val( place.address_components[i].long_name );
							break;
						case 'postal_code':
							elem.find('[data-role="postalCode"]').focus().val( place.address_components[i].long_name );
							break;
					}
				}

				for( var i = 0; i < $( elem ).find('[data-role="addressLine"]').length; i++ ){
					$( elem ).find('[data-role="addressLine"]').val( '' );
				}
				
				setTimeout( function () {
					var existingAddressLines = $( elem ).find('[data-role="addressLine"]').length;

					if( streetNumber && addressLines[0] ){
						// Some locales don't use "{streetNumber} {addressLine}" so see if the first part of formatted_address looks like it matches, and if so, use that...
						var splitFormatted = place.formatted_address.split(',');
						if ( splitFormatted[0].indexOf( addressLines[0] ) != -1 ) {
							addressLines[0] = splitFormatted[0];
						}
						// Otherwise, fallback to "{streetNumber} {addressLine}"
						else {
							addressLines[0] = streetNumber + ' ' + addressLines[0];
						}
					}

					for( var i = 0; i < addressLines.length; i++ ){
						if( existingAddressLines ){
							$( elem ).find('[data-role="addressLine"]').slice( i, 1 ).focus().val( addressLines[i] );
							existingAddressLines--;
						} else {
							addAddressLine(elem, addressLines[i]);
						}
					}
				}, 50 );
			});
		}

		// Register this module as a widget to enable the data API and
		// jQuery plugin functionality
		ips.ui.registerWidget( 'addressForm', ips.ui.addressForm, ['minimize','country','requireFullAddress'] );

		return {
			respond: respond,
			googlePlacesCallback: googlePlacesCallback
		};
	});
}(jQuery, _));