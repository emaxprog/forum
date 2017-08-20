/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.core.instantNotifications.js - Instant notifications controller
 *
 * Explanation of logic
 * ---------------------------
 * Every 20 seconds, this controller will check localStorage and determine if the last poll was > 20s ago.
 * If it was, it will fire an ajax request to get any new notifcations, and presnt those to the user. It will
 * then store this as the latest result in localStorage. We use localStorage so that multiple browser tabs
 * aren't all doing their own poll.
 * When the user first loads the page, we'll also compare the current message/notification count to what's in
 * localStorage. If there's new notifications, we'll fetch them and show them, to make it feel 'instanty'.
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.core.instantNotifications', {

		_pollTimeout: 20, // Seconds
		_windowInactivePoll: 0,
		_pollMultiplier: 1, // multiplier for decay
		_messagesEnabled: null,
		_ajaxObj: null,
		_debugPolling: true,
		_browserNotifications: {},
		_paused: false,
		_interval: null,

		initialize: function () {
			this.on( document, ips.utils.events.getVisibilityEvent(), this.windowVisibilityChange );
			this.on( window, 'storage', this.storageChange );
			this.setup();
		},

		/**
		 * Setup method
		 *
		 * @returns {void}
		 */
		setup: function () {
			if( !ips.utils.db.isEnabled() || !_.isFunction( JSON.parse ) ){
				Debug.warn("Sorry, your browser doesn't support localStorage or JSON so we can't load instant notifications for you.");
				return;
			}

			this._messagesEnabled = this.scope.find('[data-notificationType="inbox"]').length;
			this._setInterval( this._pollTimeout);

			this._doInitialCheck();
		},

		/**
		 * Responds to window storage event so we can update instantly if any other tab
		 * changes our data
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void} 
		 */
		storageChange: function (e) {
			var event = e.originalEvent;

			if( event.key !== 'notifications.' + ips.getSetting('baseURL') ){
				return;
			}

			if( this._debugPolling ){
				Debug.log('Notifications: updating instantly from storage event');
			}			

			try {
				var data = JSON.parse( event.newValue );
				var counts = this._getCurrentCounts();

				this._updateIcons( {
					messages: parseInt( data.messages ),
					notifications: parseInt( data.notifications )
				}, counts );
			} catch(err) {}
		},

		/**
		 * Handles window visibiliy changes; removes count from title bar
		 *
		 * @returns {void} 
		 */
		windowVisibilityChange: function () {
			var hiddenProp = ips.utils.events.getVisibilityProp();

			if( !_.isUndefined( hiddenProp ) && !document[ hiddenProp] ){
				// Document is now in focus
				this._updateBrowserTitle( 0 );
				this._pollMultiplier = 1;
				this._windowInactivePoll = 0;

				if( this._paused ){
					document.title = document.title.replace( "❚❚ ", '' );
					this._checkNotifications(); // Do an immediate check
					this._setInterval( this._pollTimeout );
				}

				if( this._debugPolling ){
					Debug.log( "Notifications: Resetting inactive poll.");
				}
			}
		},

		/**
		 * Handles setting up our interval poll
		 *
		 * @param 	{number} 	timeoutInSecs 	Seconds between polls
		 * @returns {void} 
		 */
		_setInterval: function (timeoutInSecs) {
			clearInterval( this._interval );
			this._interval = setInterval( _.bind( this._checkNotifications, this ), timeoutInSecs * 1000 );
		},

		/**
		 * On page load, does an initial check to see if we need to call the server
		 *
		 * @returns {void} 
		 */
		_doInitialCheck: function () {
			// Fetch the latest poll from localStorage
			var storage = ips.utils.db.get( 'notifications', ips.getSetting('baseURL') );
			var counts = this._getCurrentCounts();

			if( !storage || !_.isObject( storage ) ){
				return;
			}

			// If our bubble is reporting more notifications or messages than we have in storage,
			// we'll fetch them immediately
			if( ( this._messagesEnabled && counts.messages > storage.messages ) || counts.notifications > storage.notifications ){
				if( this._debugPolling ){
					Debug.log("Notifications: bubbles reporting higher counts for notifications or messages.");
				}

				var dataToSend = {
					notifications: storage.notifications
				};

				if( this._messagesEnabled ){
					dataToSend = _.extend( dataToSend, {
						messages: storage.messages
					});
				}

				this._doAjaxRequest( dataToSend );
			}
		},		

		/**
		 * The main method to check notification status
		 * Checks in localstorage to see if the last poll was < 20s ago
		 *
		 * @returns {void}
		 */
		_checkNotifications: function () {
			// Fetch the latest poll from localStorage
			var storage = ips.utils.db.get( 'notifications', ips.getSetting('baseURL') );
			var timestamp = ips.utils.time.timestamp();
			var counts = this._getCurrentCounts();
			var currentTimeout = this._pollTimeout * this._pollMultiplier;

			// If our window is inactive, increase the count
			if( document[ ips.utils.events.getVisibilityProp() ] ){
				if( this._windowInactivePoll >= 45 && this._pollMultiplier === 1 ){ // 15 minutes @ 20s poll
					if( this._debugPolling ){
						Debug.log( "Notifications: Polled over 15 minutes, increasing multiplier to 2");
					}
					this._pollMultiplier = 2;
					this._setInterval( this._pollTimeout * this._pollMultiplier );
				} else if( this._windowInactivePoll >= 113 && this._pollMultiplier === 2 ) { // 15 minutes @ 20s poll, 45 minutes at 40s poll
					if( this._debugPolling ){
						Debug.log( "Notifications: Polled over 60 minutes, increasing multiplier to 3");
					}
					this._pollMultiplier = 3;
					this._setInterval( this._pollTimeout * this._pollMultiplier );
				} else if( this._windowInactivePoll >= 233 && this._pollMultiplier === 3 ) { // 15 minutes @ 20s, 45 minutes at 40s poll, 2 hours at 60s poll
					if( this._debugPolling ){
						Debug.log( "Notifications: Polled over 3 hours, stopping polling");
					}
					this._stopPolling();
					return;
				}

				this._windowInactivePoll++;
			}

			// Do we need to poll?
			// the -1 in the below logic gives us a little fuzziness to account for the delay in processing the script
			if( ( storage && _.isObject( storage ) ) && parseInt( storage.timestamp ) > ( timestamp - ( ( currentTimeout - 1 ) * 1000 ) ) ){ 
				// We *don't* need to poll, it has been less than 20s
				this._updateIcons( storage, counts );

				if( this._debugPolling ){
					Debug.log("Notifications: fetching from localStorage");
				}
			} else {
				
				// We send our currently-displayed bubble count to the backend
				// to find out if there's any change in number
				var dataToSend = {
					notifications: counts.notifications
				};

				if( this._messagesEnabled ){
					dataToSend = _.extend( dataToSend, {
						messages: counts.messages
					});
				}

				this._doAjaxRequest( dataToSend );				
			}
		},

		/**
		 * Calls the backend to get new notification data
		 *
		 * @param	{object} 	dataToSend 	 	Object containing current message and notification counts
		 * @returns {void} 
		 */
		_doAjaxRequest: function (dataToSend) {
			var self = this;
			var url = ips.getSetting( 'baseURL' ) + '?app=core&module=system&controller=ajax&do=instantNotifications';

			if( this._debugPolling ){
				Debug.log("Notifications: sending ajax request");
			}

			// We'll update the timestamp before polling so that other windows
			// don't start polling before this one is finished
			this._updateTimestamp();

			// We do need to poll, it's been more than 20s
			this._ajaxObj = ips.getAjax()( url, {
				data: dataToSend
			})
				.done( _.bind( this._handleResponse, this ) )
				.fail( function () {
					self._stopPolling(true);
					Debug.error("Problem polling for new notifications; stopping.");
				});
		},

		/**
		 * Processes an ajax response
		 *
		 * @param	{object} 	response 	 	Server response
		 * @returns {void} 
		 */
		_handleResponse: function (response) {

			try {
				// If auto-polling is now disabled, stop everything
				if( response.error && response.error == 'auto_polling_disabled' ){
					this._stopPolling( true );
					return;
				}

				var counts = this._getCurrentCounts();

				if( response.notifications.count > counts.notifications && this._debugPolling ){
					Debug.log("Notifications: I'm the winner! I found there's " + response.notifications.count + " new notifications");
				}

				this._updateIcons( {
					messages: response.messages.count,
					notifications: response.notifications.count
				}, counts );

				// Update localStorage with the new count
				ips.utils.db.set( 'notifications', ips.getSetting('baseURL'), {
					timestamp: ips.utils.time.timestamp(),
					messages: response.messages.count,
					notifications: response.notifications.count
				});

				var total = response.messages.data.length + response.notifications.data.length;

				// How many NOTIFICATIONS do we have to show?
				if( response.notifications.data.length ){
					this._showNotification( this._buildNotifyData( response.notifications.data, 'notification' ), 'notification' );
				}

				// How many MESSAGES do we have to show?
				if( response.messages.data.length ){
					this._showNotification( this._buildNotifyData( response.messages.data, 'message' ), 'message' );
				}
			} catch (err) {
				this._stopPolling( true );
				return;
			}
			
			// Do we need to play a sound?
			if( total > 0 ){
				if( !ips.getSetting('disableNotificationSounds') ){
					ips.loader.get( ['core/interface/buzz/buzz.min.js'] ).then( function () {
						var sound = new buzz.sound( ips.getSetting('baseURL') + 'applications/core/interface/sounds/notification', {
							webAudioApi: true,
						    formats: [ "mp3" ]
						});

						sound.play();
					});
				}


				// Do we need to update the browser title?
				if( document[ ips.utils.events.getVisibilityProp() ] ){
					this._updateBrowserTitle( total );
				}
			}		
		},

		/**
		 * Updates the browser title bar with a new count (or removes it if 0)
		 *
		 * @param 	{number} 	count 		Count to show in the browser title bar
		 * @returns {void}
		 */
		_updateBrowserTitle: function (count) {
			var cleanTitle = $.trim( document.title.replace( /^\(\d+\)/, '' ) );

			if( count ){
				document.title = "(" + count + ") " + cleanTitle;	
			} else {
				document.title = cleanTitle;
			}
		},

		/**
		 * Builds notification data for the given items based on type
		 *
		 * @param 	{array} 	items 			Array of items from the backend
		 * @param	{string} 	type 	 		Type of notification being build (message or notification)
		 * @returns {object}	Object of notification data 
		 */
		_buildNotifyData: function (items, type) {
			var self = this;
			var notifyData = {
				count: items.length
			};

			if( items.length === 1 ){
				notifyData = _.extend( notifyData, {
					title: ips.getString( type + 'GeneralSingle'),
					icon: items[0].author_photo,
					body: items[0].title,
					url: items[0].url,
					onClick: function () {
						// Try and focus the window (security settings may prevent it, though)
						try {
							window.focus();
						} catch (err) {}

						window.location = items[0].url;
					}
				});
			} else {
				notifyData = _.extend( notifyData, {
					title: ips.pluralize( ips.getString( type + 'GeneralMultiple'), [ items.length ] ),
					body: items[0].title,
					icon: ips.getSetting('imgURL') + '/notifyIcons/' + type + '.png',
					onClick: function () {
						// Try and focus the window (security settings may prevent it, though)
						try {
							window.focus();
						} catch (err) {}

						self._getIcon( ( type == 'message' ) ? 'inbox' : 'notify' ).click();
					}
				});
			}

			return notifyData;
		},

		/**
		 * Determines which is the appropriate notification method to use to let the user know about new data
		 *
		 * @param 	{object} 	notifyData 		Notification data to use when building the notification
		 * @param	{string} 	type 	 		Type of notification being build (message or notification)
		 * @returns {void}
		 */
		_showNotification: function (notifyData, type) {
			if( document[ ips.utils.events.getVisibilityProp() ] && ips.utils.notification.supported ){
				// When the window is INACTIVE (and we support HTML5 notifications)
				// Show a browser notification & play a sound
				this._showBrowserPopup( notifyData, type );
			} else {
				// When the window is ACTIVE
				// Show a flash message
				this._showFlashMessage( notifyData, type );
			}
		},

		/**
		 * Shows a HTML5 browser popup notification
		 *
		 * @param 	{object} 	notifyData 		Object containing notification data
		 * @param 	{string}	type 			Type of notification (notification or message)
		 * @returns {void}
		 */
		_showBrowserPopup: function (notifyData, type) {
			notifyData = _.extend( notifyData, {
				timeout: 15
			});

			// Try and hide any existing popup for this type (even though it'll be on a timeout)
			if( this._browserNotifications[ type ] ){
				try {
					this._browserNotifications[ type ].hide();
				} catch (err) {}
			}

			// Create the new one
			this._browserNotifications[ type ] = ips.utils.notification.create( notifyData );
			this._browserNotifications[ type ].show();
		},

		/**
		 * Shows a flash message at the bottom of the user's window
		 *
		 * @param 	{object} 	notifyData 		Object containing notification data
		 * @param 	{string}	type 			Type of notification (notification or message)
		 * @returns {void}
		 */
		_showFlashMessage: function (notifyData, type) {
			var html = '';
			var self = this;

			if( notifyData.count === 1 ){
				notifyData = _.extend( notifyData, { text: ips.getString( type + 'FlashSingle') } );
				html = ips.templates.render( 'core.notification.flashSingle', notifyData );	
			} else {
				notifyData = _.extend( notifyData, { text: ips.pluralize( ips.getString( type + 'FlashMultiple'), [ notifyData.count ] ) } );
				html = ips.templates.render( 'core.notification.flashMultiple', notifyData );
			}						

			if( $('#elFlashMessage').is(':visible') && $('#elFlashMessage').find('[data-role="newNotification"]').length ){
				$('#elFlashMessage').find('[data-role="newNotification"]').replaceWith( html );
			} else {
				ips.ui.flashMsg.show( html, { 
					timeout: 8,
					position: 'bottom',
					extraClasses: 'cNotificationFlash ipsPad_half',
					dismissable: function () {
						self._stopPolling();
					}
				});
			}
		},

		/**
		 * Updates our storage timestamp to now
		 *
		 * @returns {void}
		 */
		_updateTimestamp: function () {
			var storage = ips.utils.db.get( 'notifications', ips.getSetting('baseURL') );

			storage = _.extend( storage, {
				timestamp: ips.utils.time.timestamp()
			});

			ips.utils.db.set( 'notifications', ips.getSetting('baseURL'), storage );
		},

		/**
		 * Updates the bubble on both icons if the count differs from what's alrady displayed
		 *
		 * @param	{object} 	newData 	 	The latest counts (either from storage or ajax response)
		 * @param 	{object} 	oldData 		Existing counts from the bubbles
		 * @returns {void}
		 */
		_updateIcons: function (newData, oldData) {
			var reportBadge = this.scope.find('[data-notificationType="reports"]');
			var reportCount = reportBadge.length ? parseInt( reportBadge.text() ) : 0;

			// Some data we'll pass in an event
			var notifyData = {
				total: parseInt( newData.notifications ) + reportCount,
				notifications: parseInt( newData.notifications ),
				reports: reportCount
			};

			if( parseInt( newData.notifications ) !== oldData.notifications ){
				this._updateIcon( 'notify', newData.notifications );
				this.scope.trigger( 'clearUserbarCache', { type: 'notify' } );
			}

			if( this._messagesEnabled ){
				if( parseInt( newData.messages ) !== oldData.messages ){
					this._updateIcon( 'inbox', newData.messages );
					this.scope.trigger( 'clearUserbarCache', { type: 'inbox' } );
				}

				notifyData.total += parseInt( newData.messages );
				notifyData.messages = parseInt( newData.messages );
			}

			// Trigger an event to let the document know
			this.scope.trigger( 'notificationCountUpdate', notifyData );
		},

		/**
		 * Updates a bubble on an icon, and uses the appropriate animation to show it
		 *
		 * @param	{string} 	type 	 	notify or inbox
		 * @param 	{number} 	count 		The new count to show
		 * @returns {void}
		 */
		_updateIcon: function (type, count) {
			var icon = this._getIcon( type );

			icon.attr( 'data-currentCount', count ).text( count );

			if( parseInt( count ) ){
				ips.utils.anim.go( ( !icon.is(':visible') ) ? 'zoomIn' : 'pulseOnce', icon.removeClass('ipsHide') );
			} else {
				icon.fadeOut();
			}
		},

		/**
		 * Returns a reference to the icon of the given type
		 *
		 * @param	{string} 	type 	 	notify or inbox
		 * @returns {element} 	jQuery element
		 */
		_getIcon: function (type) {
			return $('body').find('[data-notificationType="' + type + '"]');
		},

		/**
		 * Gets the current counts from the bubbles on-screen
		 *
		 * @returns {object} 	Contains two keys, messages & notifications, containing the currently-displayed counts
		 */
		_getCurrentCounts: function () {
			var messages = this.scope.find('[data-notificationType="inbox"]');
			var notifications = this.scope.find('[data-notificationType="notify"]');

			return {
				notifications: parseInt( notifications.attr('data-currentCount') ),
				messages: ( messages.length ) ? parseInt( messages.attr('data-currentCount') ) : null
			};
		},

		/**
		 * Stops our internal loop from polling for any more notifications
		 *
		 * @returns {void}
		 */
		_stopPolling: function (fatal) {
			Debug.info("Stopping instant notification polling");
			clearInterval( this._interval );
			this._paused = true;
			document.title = "❚❚ " + document.title.replace("❚❚ ", "");
		}
	});
}(jQuery, _));