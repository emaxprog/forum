/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.rating.js - Rating widget
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.rating', function(){

		var defaults = {
			changeRate: true,
			canRate: true
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_rating') ){
				$( elem ).data('_rating', ratingObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		ips.ui.registerWidget('rating', ips.ui.rating, 
			[ 'url', 'changeRate', 'canRate', 'size', 'value', 'userRated' ]
		);

		/**
		 * Rating instance
		 *
		 * @param	{element} 	elem 		The element this widget is being created on
		 * @param	{object} 	options 	The options passed into this instance
		 * @returns {void}
		 */
		var ratingObj = function (elem, options) {

			var selected = null,
				max = 0,
				ratingElem = null,
				userRated = false, // Has the user rated on this page load?
				loading = false;

			/**
			 * Sets up this instance
			 * Hides the contents of thw widget, fetch the current value (based on which radio is selected),
			 * then build the stars dynamically
			 *
			 * @returns 	{void}
			 */
			var init = function () {
				// Hide all inputs
				elem.children().hide();

				// Get the selected value (if any)
				if ( options.value ) {
					selected = options.value;
				} else {
					selected = elem.find('input[type="radio"]:checked').val();
				}
				
				var maxElem = _.max( elem.find('input[type="radio"]'), function (value) {
					return parseInt( $( value ).attr('value') );
				});

				max = $( maxElem ).attr('value');

				_buildRatingElem();

				// Set up events
				ratingElem.on( 'mouseenter', 'li', _enterStar );
				ratingElem.on( 'mouseleave', 'li', _leaveStar );
				ratingElem.on( 'click', 'li', _clickStar );
			},

			/**
			 * Builds the stars elements
			 *
			 * @returns {void}
			 */
			_buildRatingElem = function () {
				var content = '';
				
				for( var i = 1; i <= max; i++ ){
					if ( i <= selected ) {
						content += ips.templates.render('core.rating.star', {
							value: i,
							className: 'ipsRating_on'
						});
					} else if ( ( i - 0.5 ) <= selected ) {
						content += ips.templates.render('core.rating.halfStar', {
							value: i
						});
					} else {
						content += ips.templates.render('core.rating.star', {
							value: i,
							className: 'ipsRating_off'
						});
					}
				}

				content = ips.templates.render('core.rating.wrapper', {
					content: content,
					status: ( options.userRated ) ? ips.pluralize( ips.getString('youRatedThis'), [ options.userRated ] ) : ''
				});
				
				elem.append( content );

				// Get new rating elem
				ratingElem = elem.find('.ipsRating');

				// Size?
				if( options.size ){
					ratingElem.addClass( 'ipsRating_' + options.size );
				}

				// URL?
				/*if( options.url ){
					ratingElem.after( ips.templates.render('core.rating.loading') );
				}*/
			},

			/**
			 * User hovers on a star
			 * If rating is possible, highlight the stars up the one being hovered
			 *
			 * @param	{event}		e 		Event object
			 * @returns {void}
			 */
			_enterStar = function (e){
				if( ( selected != null && !options.changeRate ) || !options.canRate || loading ){
					return;
				}

				_starActive( $( e.currentTarget ).attr('data-ratingValue'), true );
			},

			/**
			 * User stops hovering on a star
			 * If rating was possible, unhighlight all the stars then set them back to the proper rating
			 *
			 * @param	{event}		e 		Event object
			 * @returns {void}
			 */
			_leaveStar = function (e) {
				if( ( selected != null && !options.changeRate ) || !options.canRate || loading ){
					return;
				}

				// Put the rating back to what it was
				_starActive( selected, false );
			},

			/**
			 * User clicks a star
			 * If rating is possible, either fire an ajax request or set a radio
			 *
			 * @param	{event}		e 		Event object
			 * @returns {void}
			 */
			_clickStar = function (e) {
				e.preventDefault();

				if( ( selected != null && !options.changeRate ) || !options.canRate || loading ){
					return;
				}

				var value = $( e.currentTarget ).attr('data-ratingValue');
				selected = value;
				userRated = true;

				_starActive( value );

				// Animate the selected one
				ips.utils.anim.go( 'pulseOnce', $( e.currentTarget ) );

				elem.find('[data-role="ratingStatus"]').text( ips.pluralize( ips.getString('youRatedThis'), [ value ] ) );

				// If this is pinging a URL, do that now
				if( options.url ){
					_remoteRating( value );
					return;
				}

				// Set the form field
				elem
					.find('input[type="radio"]')
						.prop( 'checked', false )
						.filter('input[type="radio"][value="' + value + '"]')
							.prop( 'checked', true );

				elem.trigger('ratingSaved', {
					value: value
				});				
			},

			/**
			 * Makes a star active, either in 'on' or 'hover' state
			 *
			 * @param	{number}		value 		Value up to and including the highlighted value
			 * @param 	{boolean}		hover 		Should the value be shown as 'hover'?
			 * @returns {void}
			 */
			_starActive = function (value, hover) {
				ratingElem
					.find('> ul[data-role="ratingList"]')
						.toggleClass('ipsRating_mine', ( hover || userRated ) )
					.end()
					.find('.ipsRating_half').each(function(){
						$(this).replaceWith( ips.templates.render('core.rating.star', {
							value: $(this).attr('data-ratingValue'),
							className: 'ipsRating_off'
						}) );
					})
					.end()
					.find('li')
						.removeClass('ipsRating_on')
						.removeClass('ipsRating_hover')
						.addClass('ipsRating_off')
					.end()
					.find('li[data-ratingValue="' + value + '"]')
						.prevAll('li')
						.andSelf()
							.removeClass('ipsRating_off')
							.addClass( 'ipsRating_on');
			},

			/**
			 * Handles pinging a URL with the rating value
			 *
			 * @param	{number}		value 		Value the user rated
			 * @returns {void}
			 */
			_remoteRating = function (value) {
				_setLoading( true );

				var statusElem = elem.find('[data-role="ratingStatus"]');

				// Show loading
				statusElem.html( ips.templates.render('core.rating.loading' ) );

				ips.getAjax()( options.url, {
					data: {
						rating: parseInt( value )
					}
				})
					.done( function (response) {
						statusElem.text( ips.getString('rating_saved') );
						elem.trigger('ratingSaved', {
							value: value
						});
					})
					.fail( function (jqXHR) {
						statusElem.text( ips.getString('rating_failed') );
						elem.trigger('ratingFailed', {
							value: value
						});
					})
					.always( function () {
						//_setLoading( false );
					});
			},

			/**
			 * Toggle the loading status of the widget
			 *
			 * @param 	{boolean} 	isLoading 	Show as loading?
			 * @returns {void}
			 */
			_setLoading = function (isLoading) {
				loading = isLoading;
				ratingElem.toggleClass( 'ipsRating_loading', isLoading );
			};

			init();

			return {};
		};

		return {
			respond: respond
		};
	});

}(jQuery, _));