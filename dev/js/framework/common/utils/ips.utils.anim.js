/* global ips, _, Debug */
/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.utils.anim.js - Simple CSS classname-based animations
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
"use strict";

	ips.createModule('ips.utils.anim', function(){

		/* Check for animation support */
		var animationSupport = false;
		var elm = document.createElement('div'),
			animation = false,
		    animationstring = 'animation',
		    keyframeprefix = '',
		    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
		    pfx  = '';
		if( elm.style.animationName ){
			animationSupport = true; 
		}    
		if( animationSupport === false ) {
			for( var i=0; i < domPrefixes.length; i++ ) {
		    	if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
		      		pfx = domPrefixes[ i ];
		      		animationstring = pfx + 'Animation';
		      		keyframeprefix = '-' + pfx.toLowerCase() + '-';
		      		animationSupport = true;
		      		break;
		    	}
		 	}
		}

		var init = function () {
			
		},

		/** Object containing all of our transition definitions */
		_transitions = {
			// Fades a single element in
			fadeIn: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem							
							.show()
							.addClass( [ 'ipsAnim', 'ipsAnim_fade', 'ipsAnim_in', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.fadeIn('fast');
				}
			},

			// Fades a single element out
			fadeOut: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem							
							.addClass( [ 'ipsAnim', 'ipsAnim_fade', 'ipsAnim_out', speed ].join(' ') )
							.animationComplete( function() { 
								elem.hide();
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.fadeOut('fast');
				}
			},

			// Fades a single element in while sliding down a little
			fadeInDown: {
				anim: function (elem, speed) {
					cleanClasses( elem );
					
					return elem
							.show()
							.addClass( [ 'ipsAnim', 'ipsAnim_fade', 'ipsAnim_in', 'ipsAnim_down', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.fadeIn('fast');
				}
			},

			// Fades a single element out while sliding down a little
			fadeOutDown: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_fade', 'ipsAnim_out', 'ipsAnim_down', speed ].join(' ') )
							.animationComplete( function() { 
								elem.hide();
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.fadeOut('fast');
				}
			},

			// Slide an element from the right, to the left
			slideLeft: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_slide', 'ipsAnim_left', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.show();
				}
			},

			// Blind down animation, from 0 height to full height
			blindDown: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.show()
							.addClass( [ 'ipsAnim', 'ipsAnim_blind', 'ipsAnim_down', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.show();
				}
			},

			// Blind up animation, from full to 0 height
			blindUp: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.show()
							.addClass( [ 'ipsAnim', 'ipsAnim_blind', 'ipsAnim_up', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.hide();
				}
			},

			// Zoom element in from 0x0 to normal size
			zoomIn: {
				anim: function (elem, speed) {
					cleanClasses( elem );
					
					return elem
							.show()
							.addClass( [ 'ipsAnim', 'ipsAnim_zoom', 'ipsAnim_in', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.show();
				}
			},

			// Zoom element in from 0x0 to normal size
			zoomOut: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_zoom', 'ipsAnim_out', speed ].join(' ') )
							.animationComplete( function() {
								elem.hide();
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem.hide();
				}
			},

			// Shake from left to right
			wobble: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_wobble', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem;
				}
			},

			jiggle: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_jiggle' ].join(' ') )
							.animationComplete( function () {
								cleanClasses( elem );
							})
				},
				fallback: function (elem) {
					return elem;
				}
			},

			// Pulse one time
			pulseOnce: {
				anim: function (elem, speed) {
					cleanClasses( elem );

					return elem
							.addClass( [ 'ipsAnim', 'ipsAnim_pulseOnce', speed ].join(' ') )
							.animationComplete( function() {
								cleanClasses( elem );
							});
				},
				fallback: function (elem) {
					return elem;
				}
			}
		},

		/**
		 * Executes the given transition, passing through provided objects
		 *
		 * @param	{string} 	animationInfo 	Name of the transition to use, and 
		 *										optionally a speed (space-separated)
		 * @param	{element} 	[...]	 		Arbitrary number of elements to pass to the transition handler
		 * @returns {object}	Returns a promise object that resolves when animation is completed on ALL provided elements
		 */
		go = function (animationInfo) {

			var thisArgs = arguments,
				run = 'anim';

			// Make arguments an array first
			thisArgs = ips.utils.argsToArray( thisArgs );

			// Get rid of the first item
			thisArgs.shift();

			// Get animName pieces
			animationInfo = animationInfo.split(' ');

			var animName = animationInfo[0];
			var animSpeed = ( animationInfo[1] ) ? 'ipsAnim_' + animationInfo[1] : ''; // default is blank right now

			if( !_transitions[ animName ] ){
				Debug.warn( "The animation '" + animName + "' doesn't exist");
				return;
			}

			// Which kind of function should we run?
			if( !animationSupport ){
				run = 'fallback';	
			}

			// Make the animation speed the last argument
			thisArgs.push( animSpeed );

			var elem = $( thisArgs[0] );
			var deferred = $.Deferred();
			var done = 0;

			// Function which checks whether all elements are done animating
			var _checkCount = function () {
				done++;

				if( done >= elem.length ){
					deferred.resolve();
				}
			};

			// Loop through each element, adding to its animation queue
			_.each( elem, function () {
				_addToQueue( elem, animName, run, thisArgs ).always( _checkCount );
				_checkQueue( elem );
			});
			
			return deferred.promise();
		},

		/**
		 * Add an animation to the queue of the provided element
		 *
		 * @param	{element} 	elem 		Element on which the animation executes
		 * @param	{string} 	animName	Animaton to be run
		 * @param 	{string}	toRun 		Type of anim to run (anim, or fallback)
		 * @param	{array} 	args 		Array of arguments to be passed to animation method
		 * @returns {object}	Returns a promise object, resolved when this animation has been executed
		 */
		_addToQueue = function (elem, animName, toRun, args) {
			var deferred = $.Deferred();

			// If we currently have a queue, then add this item
			if( !elem.data('animQueue') || !_.isArray( elem.data('animQueue') ) ){
				elem.data( 'animQueue', [] );
			}

			elem.data('animQueue').push({
				animName: animName,
				run: toRun,
				args: args,
				deferred: deferred
			});

			return deferred.promise();
		},

		/**
		 * Checks the queue of the provided element, and executes the next animation if ready
		 *
		 * @param	{element} 	elem 	Element to be checked
		 * @returns {void}
		 */
		_checkQueue = function (elem) {
			var queue = elem.data('animQueue');

			if( elem.attr('animating') == true || !queue || !_.isArray( queue ) || !queue.length ){
				return;
			}

			var item = queue.shift();

			if( item.run == 'anim' ){
				elem.animationComplete( function () {
					elem.attr( 'animating', false );
					item.deferred.resolve();
					_checkQueue( elem );
				});

				elem.attr( 'animating', true );
				_transitions[ item.animName ][ item.run ].apply( this, item.args );
			} else {
				item.deferred.resolve();
				_transitions[ item.animName ][ item.run ].apply( this, item.args );
				_checkQueue( elem );
			}

			item.deferred.resolve();
		},

		/**
		 * Removes all ipsAnim_* classnames from an element
		 * Used to prepare an element for new animations
		 *
		 * @param	{element} 	elem 	Element to clean
		 * @returns {element} 	Cleaned element
		 */
		cleanClasses = function (elem) {
			$( elem ).removeClass('ipsAnim').removeClass( function (index, css) {
				return ( css.match( /ipsAnim[0-9a-z_\-]+/gi ) || [] ).join(' ');
			});

			return elem;
		},

		/**
		 * Determines whether a transition already exists
		 *
		 * @param	{string} 	name 	Name of transition to check
		 * @returns {boolean}
		 */
		isTransition = function (name) {
			return !_.isUndefined( _transitions[ name ] );
		},

		/**
		 * Registers a transition
		 *
		 * @param	{string} 	name 				Name of this transitions
		 * @param	{function} 	cssAnimation		Function to execute when CSS animation is used
		 * @param 	{function} 	fallbackAnimation	Function to execute when fallback animation is needed
		 * @returns {void}
		 */
		addTransition = function (name, cssAnimation, fallbackAnimation) {
			if( _transitions[ name ] ){
				Debug.warn("A transition with the name '" + name + "' already exists");
				return;
			}

			_transitions[ name ] = {
				anim: cssAnimation,
				fallback: fallbackAnimation
			};
		},

		/**
		 * Animates scrolling on an element
		 *
		 * @returns 	{boolean}
		 */
		scrollTo = function (elem, options) {
			
		};

		return {
			init: init,
			cleanClasses: cleanClasses,
			animationSupport: animationSupport,
			isTransition: isTransition,
			addTransition: addTransition,
			go: go,
			cancel: cleanClasses
		};

	});

}(jQuery, _));