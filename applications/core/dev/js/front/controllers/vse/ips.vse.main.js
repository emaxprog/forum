/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.vse.main.js - Main VSE controller
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.front.vse.main', {

		_mainFrame: null,
		_mainWindow: null,
		_frameReady: false,
		_data: {},
		_originalData: {},
		_xrayOn: false,
		_customCSSOpen: false,
		_url: '',
		_unsaved: false,
		_codeMirror: null,
		_vseData: null,

		/**
		 * Initialization: set up our events
		 *
		 * @returns 	{void}
		 */
		initialize: function () {
			// Interface buttons
			this.on( 'click', '#vseStartXRay', this.toggleXRay );
			this.on( 'click', '#vseColorize', this.startColorizer );
			this.on( 'click', '#vseAddCustomCSS', this.toggleCustomCSS );
			this.on( 'click', '[data-action="buildSkin"]', this.buildSkin );
			this.on( 'click', '[data-action="cancelSkin"]', this.cancelSkin );
			// Class list
			this.on( 'click', '#vseClassList [data-styleID]', this.selectClass );
			this.on( 'click', '[data-action="back"]', this.editorBack );
			// Messages coming from panels
			this.on( 'styleUpdated', this.styleUpdated );
			this.on( 'revertChanges', this.revertChanges );
			this.on( 'click', '[data-action="colorizerBack"]', this.colorizerBack );
			this.on( 'closeColorizer', this.colorizerBack );
			this.on( 'change', '#ipsTabs_vseSection_vseSettingsTab_panel :input', this.settingChanged );
			// Window events
			this.on( window, 'message', this.handleCommand );
			this.on( window, 'beforeunload', this.windowBeforeUnload );

			this.setup();
		},

		/**
		 * Setup
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			var self = this;

			this._mainFrame = $('#vseMainWrapper');
			this._mainWindow = this._mainFrame.find('iframe').get(0).contentWindow;

			if( !ipsVSEData || !_.isObject( ipsVSEData ) || !colorizer || !_.isObject( colorizer ) ){
				Debug.error("VSE JSON data not found, cannot continue.");
				return;
			}
			
			this._originalData = $.extend( true, {}, ipsVSEData );
			this._data = this.getVSEData();

			// Build URL
			var url = ips.utils.url.getURIObject( window.location.href );
			this._url = url.protocol + '://' + url.host;
			if ( url.port && url.port != 80 ) {
				this._url = this._url + ':' + url.port;
			}

			// Set up codemirrior
			this._codeMirror = CodeMirror.fromTextArea( document.getElementById('vseCustomCSS_editor'), { 
				mode: 'css',
				lineWrapping: true,
				lineNumbers: true
			});

			this._codeMirror.setSize( null, 235 );
			this._codeMirror.on( 'change', function (doc, cm) {
				self._updateCustomCSS();
			});

			$('#vseCustomCSS').hide();

			this._buildClassList();
		},
		
		/**
		 * Merge resume data with vseData
		 *
		 * @return {object}
		 */
		getVSEData: function()
		{
			if ( _.isObject( this._vseData ) )
			{
				return this._vseData;
			}
			
			this._vseData = ipsVSEData;
			
			if ( ipsResumeVse.data )
			{
				if ( ! _.isObject( ipsResumeVse.data ) )
				{
					ipsResumeVse.data = JSON.parse( ipsResumeVse.data );
					
					if ( ! _.isObject( ipsResumeVse.data ) )
					{
						return this._vseData;
					}
				}
				
				this._vseData = _.extend( ipsVSEData, ipsResumeVse.data );
			}
						
			return this._vseData;
		},
		
		/**
		 * Handles a command from the frame window, running one of our own methods if it exists
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		handleCommand: function (e) {
			if( e.originalEvent.origin != this._url ){
				Debug.error("Invalid origin");
				return;
			}

			var commandName = 'command' + e.originalEvent.data.command.charAt(0).toUpperCase() + e.originalEvent.data.command.slice(1);

			if( !_.isUndefined( this[ commandName ] ) ){
				this[ commandName ]( e.originalEvent.data );
			}
		},

		/**
		 * Sends the provided command to the frame window
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		sendCommand: function (command, data) {
			this._mainWindow.postMessage( _.extend( data || {}, { command: command } ), this._url );
		},

		/**
		 * Event handler for the window unloading.
		 * If we have unsaved changes, warn the user before leaving
		 *
		 * @returns 	{void}
		 */
		windowBeforeUnload: function (e) {
			if( this._unsaved ){
				return "You haven't saved this theme. By leaving this page, you will lose any changes you've made.";
			}
		},

		/**
		 * Builds this skin by sending data to the backend
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		buildSkin: function (e) {
			var self = this;
			
			if( !this._unsaved ){
				ips.ui.alert.show( {
					type: 'alert',
					icon: 'info',
					message: ips.getString('vseNoChanges'),
					callbacks: {}
				});

				return;
			}

			ips.getAjax()( ipsSettings['baseURL'] + '?app=core&module=system&controller=vse&do=build' + '&csrfKey=' + ipsSettings['csrfKey'], {
				type: 'post',
				data: this._buildFinalStyleData(),
				showLoading: true
			})
				.done( function (response) {
					self._unsaved = false;

					ips.ui.alert.show( {
						type: 'verify',
						icon: 'success',
						message: ips.getString('vseSkinBuilt'),
						buttons: { yes: ips.getString('yes'), no: ips.getString('no') },
						callbacks: {
							yes: function () {
								self._closeEditor( ipsSettings['baseURL'] + '?app=core&module=system&controller=vse&do=home&id=' + response.theme_set_id + '&csrfKey=' + ipsSettings['csrfKey'] );
							}
						}
					});
				})
				.fail( function (jqXHR, textStatus, errorThrown) {
					
					Debug.log("Error saving theme:");
					Debug.error( textStatus );

					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('vseSkinBuilt_error'),
						callbacks: {}
					});
				});
		},

		/**
		 * Event handler for 'close editor' button
		 *
		 * @returns 	{void}
		 */
		cancelSkin: function (e) {
			e.preventDefault();

			var self = this;

			if( this._unsaved ){
				ips.ui.alert.show( {
					type: 'confirm',
					icon: 'question',
					message: ips.getString('vseUnsaved'),
					callbacks: {
						ok: function () {
							self._closeEditor( $( e.currentTarget ).attr('href') );
						}
					}
				});
			} else {
				this._closeEditor( $( e.currentTarget ).attr('href') );
			}
		},

		/**
		 * A value in the settings tab has been changed
		 *
		 * @returns 	{void}
		 */
		settingChanged: function () {
			this._unsaved = true;
		},

		/**
		 * Responds to events bubbled by panels/widgets indicating a style has been updated
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data 	Event data object
		 * @returns 	{void}
		 */
		styleUpdated: function (e, data) {
			var styles = this._generateLiveStyleObject( data.selector );

			this._updateSwatch( data.selector );

			this.sendCommand('updateStyle', {
				selector: data.selector,
				styles: styles
			});

			this._unsaved = true;
		},

		/**
		 * Reverts all changes, changing colors back to their original state when the page was loaded
		 *
		 * @returns 	{void}
		 */
		revertChanges: function () {
			var self = this;

			this._data = $.extend( true, {}, this._originalData );

			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					self.trigger( 'styleUpdated', {
						selector: styleData.selector
					});
				});
			});

			this._unsaved = false;
		},

		/**
		 * Responds to a command from the frame indicating that it is ready
		 *
		 * @returns 	{void}
		 */
		commandWindowReady: function () {
			this._frameReady = true;
			this.sendCommand('selectorData', {
				selectors: this._getSelectors()
			});
		},

		/**
		 * Responds to a command from the frame, sending a complete stylesheet object in response
		 *
		 * @returns 	{void}
		 */
		commandGetStylesheet: function () {
			this.sendCommand('createStylesheet', {
				classes: this._generateLiveStyleObject(),
				custom: this.scope.find('#vseCustomCSS_editor').val()
			});
		},

		/**
		 * Responds to command from the frame indicating an element has been selected by the xray
		 * Method receives the primary match and other related matches
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		commandSelectorsMatched: function (data) {
			var self = this;

			// Loop through our list, hiding any that don't match
			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					if( styleData.selector != data.primary && _.indexOf( data.other, styleData.selector ) === -1 ){
						self.scope.find('li[data-styleid="' + sectionKey + '_' + styleKey + '"]').hide();
					}
				})
			});

			// Also hide section title
			this.scope.find('#vseClassList .ipsToolbox_sectionTitle').hide();

			// Add new section title
			this.scope.find('#vseClassList > ul').prepend( ips.templates.render('vse.classes.title', {
				title: ips.getString('vseMatchedStyles'),
				role: "xrayResultsTitle"
			}));
		},

		/**
		 * Event handler for clicking a class in the list
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		selectClass: function (e) {
			var styleID = $( e.currentTarget ).attr('data-styleID');

			if( !styleID ){
				return;
			}

			var styleData = this._getStyleData( styleID );

			// Do we need to build panels?
			if( !$('#vseClassEditor').find('[data-styleid="' + styleID + '"]').length ){
				this._buildPanel( styleID, styleData );
			}

			// Update title
			$('#vseClassEditor').find('[data-role="classTitle"]').text( styleData.title );

			// Hide all panels but show the one we're working on
			$('#vseClassEditor')
				.find('[data-styleid]')
					.hide()
				.end()
				.find('[data-styleid="' + styleID + '"]')
					.show();

			// Add class to the wrapper which will start the animation
			$('#vseClassWrap').addClass('vseShow_editor');
		},

		/**
		 * Event handler for clicking 'back' in the class editor
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		editorBack: function (e) {
			$('#vseClassWrap').removeClass('vseShow_editor');
		},

		/**
		 * Event handler for the 'show custom css' pane
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleCustomCSS: function (e) {
			e.preventDefault();

			if( this._customCSSOpen ){
				$( e.currentTarget ).removeClass('ipsButton_normal').addClass('ipsButton_primary');
				this._customCSSOpen = false;
				$('#vseCustomCSS').hide();
				$('#vseMainWrapper').css({ bottom: '0px' });
			} else {
				$( e.currentTarget ).removeClass('ipsButton_primary').addClass('ipsButton_normal');
				this._customCSSOpen = true;
				ips.utils.anim.go( 'fadeIn', $('#vseCustomCSS') );
				$('#vseMainWrapper').css({ bottom: '300px' });
			}
		},

		/**
		 * Event handler for the 'select element' button. Toggles xray functionality.
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		toggleXRay: function (e) {
			e.preventDefault();

			if( this._xrayOn ){
				$( e.currentTarget ).removeClass('ipsButton_normal').addClass('ipsButton_primary');
				this._xrayOn = false;
				this.stopXRay();
			} else {
				$( e.currentTarget ).removeClass('ipsButton_primary').addClass('ipsButton_normal');
				this._xrayOn = true;
				this.startXRay();
			}
		},

		/**
		 * Sends command to frame to start XRay
		 *
		 * @returns 	{void}
		 */
		startXRay: function () {
			this.sendCommand('xrayStart');
		},

		/**
		 * Sends command to frame to stop XRay
		 *
		 * @returns 	{void}
		 */
		stopXRay: function () {
			this.sendCommand('xrayCancel');

			// Remove results if any
			this.scope
				.find('#vseClassList > ul')
					.find('> li[data-role="xrayResultsTitle"]')
						.remove()
					.end()
					.find('> li')
						.show();
		},

		/**
		 * Builds/shows the colorizer panel
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		startColorizer: function (e) {
			e.preventDefault();

			// Disable the two buttons
			$('#vseColorize, #vseStartXRay').attr('disabled', true);

			this.scope.find('#vseClassWrap').hide();
			ips.utils.anim.go('fadeIn', this.scope.find('#vseColorizerPanel') );
		},

		/**
		 * Event handler for back button on the colorizer panel
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		colorizerBack: function (e) {
			e.preventDefault();

			// Disable the two buttons
			$('#vseColorize, #vseStartXRay').attr( 'disabled', false );

			this.scope.find('#vseColorizerPanel').hide();
			ips.utils.anim.go('fadeIn', this.scope.find('#vseClassWrap') );
		},

		/**
		 * Close the editor by calling the close method, then redirecting.
		 *
		 * @returns 	{void}
		 */
		_closeEditor: function ( url ) {
			ips.getAjax()( ipsSettings['baseURL'] + '?app=core&module=system&controller=vse&do=close', {
				showLoading: true
			})
				.always( function () {
					window.location = url || ips.getSetting('baseURL');
				});
		},

		/**
		 * Tells the window to update the custom CSS contents
		 *
		 * @returns 	{void}
		 */
		_updateCustomCSS: function () {
			this._unsaved = true;
			this._codeMirror.save();
			
			this.sendCommand('updateCustomCSS', {
				css: $('#vseCustomCSS_editor').val()
			});
		},

		/**
		 * Generates an object of style properties that can be passed into ips.utils.css to build a style block
		 *
		 * @param 		{string} 	selector 		If provided, will only returns the styles for the given selector. Otherwise, all selectors are built.
		 * @returns 	{object}
		 */
		_generateLiveStyleObject: function (selector) {
			var self = this;
			var returnedObject = {};

			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					if( selector && styleData.selector == selector ){
						returnedObject = self._getStyleObjectForSelector( styleData, styleKey, sectionKey );						
					} else if( _.isUndefined( selector ) ) {
						if( _.isUndefined( returnedObject[ styleData.selector ] ) ){
							returnedObject[ styleData.selector ] = {};
						}

						returnedObject[ styleData.selector ] = self._getStyleObjectForSelector( styleData, styleKey, sectionKey );
					}
				});
			});

			return returnedObject;
		},

		/**
		 * Takes style data from our main data object and returns an object containing CSS rules, ready to be used by ips.utils.css
		 * Intended to be executed by this._generateLiveStyleObject, not directly
		 *
		 * @param		{object} 	styleData 	The data for the selector this iteration is building
		 * @param 		{string} 	styleKey	The key in our master data object that identifies this style
		 * @param		{string} 	sectionKey 	The key in our master data object that identifies the section this style belongs to
		 * @returns 	{object}
		 */
		_getStyleObjectForSelector: function (styleData, styleKey, sectionKey) {
			var self = this;
			var returnedObject = {};
			var orig = this._originalData;

			// Background
			if( !_.isUndefined( styleData.background ) ){
				var tmpNew = styleData.background;
				var tmpOrig = orig.sections[ sectionKey ][ styleKey ];
				var doGradient = false;

				// Background COLOR
				if( !_.isUndefined( tmpNew.color ) ){
					if( _.isUndefined( tmpOrig.background ) || _.isUndefined( tmpOrig.background.color ) || 
							tmpOrig.background.color != tmpNew.color ) {
						returnedObject[ ( !_.isUndefined( tmpNew.gradient ) ) ? 'background-color' : 'background' ] = '#' + tmpNew.color.replace('#', '');
					}
				}

				// Background GRADIENT
				if( !_.isUndefined( tmpNew.gradient ) ){
					if( _.isUndefined( tmpOrig.background ) || _.isUndefined( tmpOrig.background.gradient ) ) {
						doGradient = true;
					} else if ( tmpOrig.background.gradient.angle != tmpNew.gradient.angle ) {
						doGradient = true;
					} else {
						// Compare each stop
						for( var i = 0; i < tmpNew.gradient.stops.length; i++ ){
							if( _.isUndefined( tmpOrig.background.gradient.stops[ i ] ) ){
								doGradient = true;
								break;
							}

							if( tmpNew.gradient.stops[ i ][ 0 ] != tmpOrig.background.gradient.stops[ i ][ 0 ] ){
								doGradient = true;
								break;
							}

							if( tmpNew.gradient.stops[ i ][ 1 ] != tmpOrig.background.gradient.stops[ i ][ 1 ] ){
								doGradient = true;
								break;
							}
						}
					}

					if( doGradient ){
						returnedObject['background-image'] = ips.utils.css.generateGradient( tmpNew.gradient.angle, tmpNew.gradient.stops, false );
					}
				} else {
					// No gradient here, but if our original data does, we need to remove it
					if( !_.isUndefined( tmpOrig.background.gradient ) ){
						returnedObject['background-image'] = 'none';
					}
				}
			}

			// Font
			if( !_.isUndefined( styleData.font ) ){
				var tmpNew = styleData.font;
				var tmpOrig = orig.sections[ sectionKey ][ styleKey ];

				// Background COLOR
				if( !_.isUndefined( tmpNew.color ) ){
					if( _.isUndefined( tmpOrig.font ) || _.isUndefined( tmpOrig.font.color ) || 
							tmpOrig.font.color != tmpNew.color ) {
						returnedObject['color'] = '#' + tmpNew.color.replace('#', '');
					}
				}
			}

			return returnedObject;
		},

		/**
		 * Builds the class list, from which the user can choose which class to edit
		 *
		 * @returns 	{void}
		 */
		_buildClassList: function () {
			var self = this;
			var output = '';

			_.each( this.getVSEData().sections, function (value, key) {
				output += ips.templates.render('vse.classes.title', {
					title: ips.getString( 'vseSection_' + key ),
					key: key
				});

				if( _.isObject( value ) && _.size( value ) ){
					_.each( value, function (item, itemKey) {
						output += ips.templates.render('vse.classes.item', {
							title: item.title,
							hasFont: !_.isUndefined( item.font ),
							styleid: key + '_' + itemKey,
							swatch: self._buildSwatch( item, true )
						});
					});
				}
			});

			this.scope.find('#vseClassList > ul').html( output );
		},

		/**
		 * Builds style properties to be used on the swatch in the class list
		 *
		 * @param		{object} 	data 		Key/value pairs of styles to be changed
		 * @param 		{boolean} 	toString 	If true, object is turned into string to use in style=''
		 * @returns 	{mixed}		Object or string
		 */
		_buildSwatch: function (data, toString) {
			var defaultStyle = {
				'display': 'block',
				'background-color': 'transparent',
				'background-image': 'none',
				'border': 'none'
			};

			var main = _.clone( defaultStyle );
			var sub = _.clone( defaultStyle );

			if( !_.isUndefined( data.background ) ){
				if( !_.isUndefined( data.background.color ) ){
					_.extend( main, { 'background-color': '#' + data.background.color } );
				}

				if( !_.isUndefined( data.background.gradient ) ){
					_.extend( main, { 'background-image': ips.utils.css.generateGradient( data.background.gradient.angle, data.background.gradient.stops ) } );
				}
			} else {
				_.extend( main, { background: 'transparent' } );
			}

			if( !_.isUndefined( data.font ) && !_.isUndefined( data.font.color ) ){
				_.extend( sub, { background: '#' + data.font.color } );
			}

			if( toString ){
				var finalObj = {};

				_.each( { main: main, sub: sub }, function (obj, key) {
					var output = [];
					var pairs = _.pairs( obj );

					_.each( pairs, function (value, idx ){
						if( _.isArray( value[ 1 ] ) ){
							for( var i = 0; i < value[ 1 ].length; i++ ){
								output.push( value[ 0 ] + ': ' + value[ 1 ][ i ] );
							}
						} else {
							output.push( value.join(': ') );
						}
					});

					finalObj[ key ] = output.join('; ');
				});				

				return finalObj;
			} else {
				return { main: main, sub: sub };
			}
		},

		/**
		 * Updates an existing swatch based on its selector
		 *
		 * @param		{string} 	selector 	Selector in which to find the swatch
		 * @returns 	{void}
		 */
		_updateSwatch: function (selector) {
			var selectorData = this._findDataBySelector( selector );
			var newStyles = this._buildSwatch( selectorData.styleData, true );

			// Find the swatch
			var row = this.scope.find('[data-styleid="' + selectorData.sectionKey + '_' + selectorData.styleKey + '"]');
			var mainSwatch = row.find('a > .vseClass_swatch');
			var subSwatch = row.find('a > .vseClass_swatch > .vseClass_swatch');

			// Update css
			// Use the style attribute here because _buildSwatch is returning a string like background: ...; color: ...;, so .css() won't work
			mainSwatch.attr( 'style', newStyles.main );

			if( subSwatch.length && newStyles.sub ){
				subSwatch.attr( 'style', newStyles.sub );
			}
		},

		/**
		 * Returns data from our main data object based on the selector provided. Returns the style data, style key, section data and section key.
		 *
		 * @param		{string} 	selector 	Selector to return data for
		 * @returns 	{object|null}
		 */
		_findDataBySelector: function (selector) {
			var data = null;

			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					if( styleData.selector == selector ){
						data = {
							styleData: styleData,
							styleKey: styleKey,
							sectionData: sectionData,
							sectionKey: sectionKey
						};
					}
				});
			});

			return data;
		},

		/**
		 * Returns style data for the given style ID
		 *
		 * @param		{string} 	styleID 	Style ID to fetch
		 * @returns 	{mixed}		Object or false
		 */
		_getStyleData: function (styleID) {
			var pieces = styleID.split('_');

			if( !_.isUndefined( this.getVSEData().sections[ pieces[0] ][ pieces[ 1 ] ] ) ){
				return this.getVSEData().sections[ pieces[0] ][ pieces[ 1 ] ];
			}

			return false;
		},

		/**
		 * Returns an array of selectors the VSE can work with
		 *
		 * @returns 	{array}
		 */
		_getSelectors: function () {
			var selectors = [];

			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {
					selectors.push( styleData.selector );
				});
			});

			return selectors;
		},

		/**
		 * Builds an empty panel
		 *
		 * @param 		{string} 	styleID 	The styleID of the panel being created
		 * @param 		{object} 	styleData 	Data for this style from our main data object
		 * @returns 	{void}
		 */
		_buildPanel: function (styleID, styleData) {
			var output = [];
			var innerContainer = $('<div/>').attr('data-role', 'widgets');
			var container = $('<div/>')
								.attr( 'id', styleID + '_panel' )
								.attr( 'data-styleid', styleID )
								.attr('data-controller', 'core.front.vse.panel')
								.append( innerContainer );


			if( !styleData ){
				return;
			}

			$('#vseClassEditor')
				.find('[data-role="panels"]')
					.append( container )
				.end()
				.find( '#' + styleID + '_panel' )
					.data( 'styleData', styleData );

			$( document ).trigger( 'contentChange', [ container ] );
		},

		/**
		 * Takes our data object and turns it into a stylesheet and an object representing settings to be updated
		 *
		 * @returns 	{object}
		 */
		_buildFinalStyleData: function () {
			var self = this;
			var settingsObj = {};
			var stylesObj = {};
			var styleBlock = '';
			var orig = this._originalData;
			
			var setStyle = function (selector) {
				if( _.isUndefined( stylesObj[ selector ] ) ){
					stylesObj[ selector ] = {};
				}

				return stylesObj[ selector ];
			};

			var updateSetting = function (key, value) {
				settingsObj[ key ] = value;
			};

			// Loop through every section then every style, and build 
			_.each( this._data.sections, function (sectionData, sectionKey) {
				_.each( sectionData, function (styleData, styleKey) {

					if( !_.isUndefined( styleData.background ) ){
						var tmpNew = styleData.background;
						var tmpOrig = orig.sections[ sectionKey ][ styleKey ].background || false;

						// Background COLOR
						if( !_.isUndefined( tmpNew.color ) ){
							if(  ( !tmpOrig || _.isUndefined( tmpOrig.color ) ) || tmpOrig.color != tmpNew.color ) {

								var settingKeyColor = self._settingKey( styleData, 'background', 'color' );
								
								// Do we have a setting for this one?
								if( settingKeyColor ){
									updateSetting( settingKeyColor, '#' + tmpNew.color.replace('#', '') );
								} else {
									setStyle( styleData.selector )[ ( !_.isUndefined( tmpNew.gradient ) ) ? 'background-color' : 'background' ] = '#' + tmpNew.color.replace('#', '');
								}
							}
						}

						// Background GRADIENT
						if( !_.isUndefined( tmpNew.gradient ) ){

							// First stage - figure out if our gradients have the same angle, stop locations and stop length
							// If so, and if settings exist, we can just update settings. Otherwise we need to build a new gradient block
							var settingKeyFrom = self._settingKey( styleData, 'background', 'from' );
							var settingKeyTo = self._settingKey( styleData, 'background', 'to' );
							var gradientDone = false;

							if( settingKeyFrom && settingKeyTo && !_.isUndefined( tmpOrig.gradient ) ){
								var stopsMatch = self._doStopLocationsMatch( tmpOrig.gradient.stops, tmpNew.gradient.stops );

								if( stopsMatch && tmpOrig.gradient.angle == tmpNew.gradient.angle ){
									updateSetting( settingKeyFrom, tmpNew.gradient.stops[0][0] );
									updateSetting( settingKeyTo, tmpNew.gradient.stops[1][0] );
									gradientDone = true;
								}
							}

							if( !gradientDone ){
								setStyle( styleData.selector )['background-image'] = ips.utils.css.generateGradient( tmpNew.gradient.angle, tmpNew.gradient.stops, false );
							}
						} else {
							// No gradient here, but if our original data does, we need to remove it
							if( !_.isUndefined( tmpOrig.gradient ) ){
								setStyle( styleData.selector )['background-image'] = 'none';
							}
						}
					}

					// Font
					if( !_.isUndefined( styleData.font ) ){
						var tmpNew = styleData.font;
						var tmpOrig = orig.sections[ sectionKey ][ styleKey ].font || false;
						var settingKeyFont = self._settingKey( styleData, 'color' ); 

						// Background COLOR
						if( !_.isUndefined( tmpNew.color ) ){
							if( !tmpOrig || _.isUndefined( tmpOrig.color ) || tmpOrig.color != tmpNew.color ) {
								if( settingKeyFont ){
									updateSetting( settingKeyFont, '#' + tmpNew.color.replace('#', '') );
								} else {
									setStyle( styleData.selector )['color'] = '#' + tmpNew.color.replace('#', '');
								}
							}
						}
					}
				});
			});

			if( _.size( stylesObj ) ){
				_.each( stylesObj, function (value, selector) {
					styleBlock += ips.utils.css.buildStyleBlock( selector, value );
				});
			}

			// Get other form fields
			this.scope.find('#ipsTabs_vseSection_vseSettingsTab_panel :input').each( function () {
				settingsObj[ $( this ).attr('name') ] = $( this ).val();
			});

			return {
				customcss: $('#vseCustomCSS_editor').val(),
				values: JSON.stringify( this._data ),
				css: styleBlock,
				settings: settingsObj
			};
		},

		/**
		 * Finds and returns a setting key in the provided data object
		 *
		 * @param 		{object} 	data 		Data object to look in. 'settings' should be a child value.
		 * @param 		{string}	levelOne 	Key of the first level inside settings
		 * @param 		{string}	levelTwo 	Key of the second level inside settings. Optional.
		 * @returns 	{string|void}
		 */
		_settingKey: function (data, levelOne, levelTwo) {
			if( !data.settings || !levelOne ){
				return;
			}

			if( levelTwo ){
				if( !_.isUndefined( data.settings[ levelOne ][ levelTwo ] ) ){
					return data.settings[ levelOne ][ levelTwo ];
				}
			}
			
			return data.settings[ levelOne ];

			return;
		},

		/**
		 * Compares two gradient stop arrays, returning false if their lengths don't match or any locations differ
		 *
		 * @param 		{array} 	originalStops 	Original array of stops
		 * @param 		{string}	newStops 		New array of stops
		 * @returns 	{boolean}
		 */
		_doStopLocationsMatch: function (originalStops, newStops) {

			if( originalStops.length != newStops.length ){
				return false;
			}

			// originalStops[ i ][ 0 ] != newStops[ i ][ 0 ] ||
			for( var i = 0; i < originalStops.length; i++ ){
				if( originalStops[ i ][ 1 ] != newStops[ i ][ 1 ] ){
					return false;
				}
			}

			return true;
		}
	});

}(jQuery, _));