/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.editor.emoticons.js - Controller for emoticons panel
 *
 * Author: Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('core.global.editor.emoticons', {

		_doneInit: false,
		_emoticonsObj: {},
		_typeTimer: null,
		_lastVal: '',
		_lastActive: null,

		initialize: function () {
			this.on( document, 'menuOpened', this.menuOpened );

			this.on( 'menuItemSelected', '[data-role="categoryTrigger"]', this.changeCategory );
			this.on( 'focus', '[data-role="emoticonSearch"]', this.searchEmoticons );
			this.on( 'blur', '[data-role="emoticonSearch"]', this.stopSearchEmoticons );

			// Emoticon click event
			this.on( 'click', '[data-emoticon]', this.insertEmoticon );

			// Init
			this.setup();
		},

		/**
		 * Setup when the controller is initialized
		 * Builds the emoticons panel, then the overview section
		 *
		 * @returns 	{void}
		 */
		setup: function () {
			var self = this;

			this.editorID = this.scope.attr('data-editorID');

			// Do we need to init?
			if( !this._doneInit ){
				if( !_.size( this._emoticonsObj ) ){
					this._getJSON().done( function (){
						self._buildEmoticonsPanel();
						self._buildOverview();		
					});
				} else {
					this._buildEmoticonsPanel();
					this._buildOverview();		
				}				
			}
		},

		/**
		 * Event handler called when an emoticon is clicked
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		insertEmoticon: function (e) {
			var emoticonKey = $( e.currentTarget ).attr('data-emoticon');
			var emoticonSrc = $( e.currentTarget ).attr('data-src');
			var emoticonSrcSet = $( e.currentTarget ).attr('data-srcset');
			var emoticonWidth = $( e.currentTarget ).attr('data-width');
			var emoticonHeight = $( e.currentTarget ).attr('data-height');

			// Insert the emoticon
			this.trigger( $( document ), 'insertEmoticon', {
				editorID: this.editorID,
				text: emoticonKey,
				src: emoticonSrc,
				srcset: emoticonSrcSet,
				width: emoticonWidth,
				height: emoticonHeight
			});

			// Send an event to close the menu too, only if shift isn't held
			if( e && !e.shiftKey ){
				this.scope.trigger( 'closeMenu' );
			}

			// "Recently used"
			// We'll only enable this feature where JSON is supported natively
			if( window.JSON ){
				// Set the cookie to remember this
				// 09/09/15 - 4.1 - Converting this cookie to use localStorage to avoid a mod_security issue
				// @todo remove in a future release
				//------------------------------
				this._convertEmoticonsToLocalStorage();
				//------------------------------

				var existing = ips.utils.db.get( 'emoticons', 'recent' );
				var newItem = { src: emoticonSrc, text: emoticonKey, srcset: emoticonSrcSet, width: emoticonWidth, height: emoticonHeight };

				if( !existing || !_.isArray( existing ) ){
					var json = [ newItem ];					
					ips.utils.db.set( 'emoticons', 'recent', json );
				} else {					
					
					for( var key in existing ){
						var obj = existing[key];
						
						if( obj.src == newItem.src ){
							return;
						}
					}

					existing.unshift( newItem );

					if( existing.length > 7 ){
						existing.splice( ( existing.length - 7 ) * -1, existing.length - 7 );
					} 

					ips.utils.db.set( 'emoticons', 'recent', existing );
				}
			}
		},

		/**
		 * Converts the recent emoticons cookie to localStorage
		 *
		 * @returns 	{void}
		 */
		_convertEmoticonsToLocalStorage: function () {
			var emoticonCookie = ips.utils.cookie.get('recentEmoticons');
			var existing = [];

			if( !ips.utils.db.isEnabled() ){
				return;
			}

			if( !_.isUndefined( emoticonCookie ) && emoticonCookie !== '-' ){
				try {
					existing = $.parseJSON( emoticonCookie );
				} catch(err) {
					Debug.log( err );
				}

				ips.utils.db.set( 'emoticons', 'recent', existing );
				ips.utils.cookie.set('recentEmoticons', '-', true);
				ips.utils.cookie.unset('recentEmoticons');
			}
		},

		/**
		 * The search box has received focus
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		searchEmoticons: function (e) {
			// Find the last-active panel. If search is the last active (because we blurred then
			// came back), then just carry on without rememberig it
			var lastActive = this.scope.find('[data-panel]:visible').attr('data-panel');

			if( lastActive != 'search' ){
				this._lastActive = lastActive;
			}

			// Set a continuous timer
			this._typeTimer = setInterval( _.bind( this._typing, this ), 200 );
		},

		/**
		 * The search box has blurred
		 *
		 * @param 		{event} 	e 		Event object
		 * @returns 	{void}
		 */
		stopSearchEmoticons: function (e) {
			if( this._typeTimer ){
				clearInterval( this._typeTimer );
				this._typeTimer = null;
			}
		},

		/**
		 * Runs a continuous interval to check the current search value, and call the search function
		 *
		 * @param 		{event} 	e 		Event object	
		 * @returns 	{void}
		 */
		_typing: function () {
			var textElem = this.scope.find('[data-role="emoticonSearch"]');

			if( this._lastVal == textElem.val() ){
				return;
			}

			if( textElem.val() == '' ){
				this._clearSearch();
			} else {
				this._doSearch( textElem.val() );
			}

			this._lastVal = textElem.val();
		},

		/**
		 * Clears the search panel (called when value is empty)
		 *
		 * @returns 	{void}
		 */
		_clearSearch: function () {
			if( this.scope.find('[data-panel="search"]') ){
				this.scope.find('[data-panel="search"]').remove();

				// Display the previous panel
				if( !this._lastActive ){
					this._lastActive = 'overview';
				}
				
				this.scope.find('[data-panel="' + this._lastActive + '"]').show();
			}
		},

		/**
		 * Finds emoticons matching the value
		 *
		 * @param 		{string} 	value  		Search value	
		 * @returns 	{void}
		 */
		_doSearch: function (value) {
			var panel = this._getSearchPanel();
			var matchEmoticons = [];

			for( var cat in this._emoticonsObj ){
				var catLength = this._emoticonsObj[cat].emoticons.length;

				// Loop through each emoticon, and do a very simple indexOf search on the 
				// src and text properties
				for( var i = 0; i < catLength; i++ ){
					if( this._emoticonsObj[cat].emoticons[i].src.indexOf( value ) !== -1 ||
							this._emoticonsObj[cat].emoticons[i].text.indexOf( value ) !== -1 ){
						matchEmoticons.push( { 
							src: this._emoticonsObj[cat].emoticons[i].src,
							text: this._emoticonsObj[cat].emoticons[i].text
						});
					}
				}
			}

			if( !matchEmoticons.length ){
				panel.html( ips.templates.render('core.editor.emoticonNoResults') );
			} else {
				var rows = this._buildEmoticonRows( matchEmoticons );

				var content = ips.templates.render('core.editor.emoticonCategory', {
					emoticons: rows.join(''),
					title: ips.getString('emoticonSearch'),
					categoryID: 'search'
				});

				panel.html( ips.templates.render('core.editor.emoticonSection', { 
					content: content,
					id: 'search'
				}));
			}
		},

		/**
		 * Gets the search results panel, or builds it
		 *
		 * @returns 	{element}
		 */
		_getSearchPanel: function () {
			var panel = this.scope.find('[data-panel="search"]');

			if( !panel.length ){
				this.scope
					.find('.ipsMenu_innerContent')
						.append( ips.templates.render('core.editor.emoticonSection', { 
							content: '',
							id: 'search'
						}));

				panel = this.scope.find('[data-panel="search"]');

				// Now hide all panels, then fade in the one we want
				this.scope.find('[data-panel]').hide();
				ips.utils.anim.go( 'fadeIn', this.scope.find('[data-panel="search"]') );
			}

			return panel;
		},

		/**
		 * Event handler called when the emoticons menu is opened.
		 * Iniializes the menu if it hasn't already been done
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		menuOpened: function (e, data) {
			if( data.elemID == 'elEmoticons' ){
				data.originalEvent.preventDefault();

				// Do we need to init?
				if( !this._doneInit ){
					this._buildEmoticonsPanel();
					this._buildOverview();
				}
			}
		},

		/**
		 * Event handler called when the a category is selected
		 *
		 * @param 		{event} 	e 		Event object
		 * @param 		{object} 	data	Event data object
		 * @returns 	{void}
		 */
		changeCategory: function (e, data) {

			if( !$.contains( this.scope.get(0), data.triggerElem ) ){
				return;
			}

			data.originalEvent.preventDefault();
			e.stopPropagation();

			var categoryID = data.selectedItemID || false;
			
			// See if we've got an invalid ID for some reason
			if( categoryID === false || ( categoryID != 'overview' && !this._emoticonsObj[ categoryID ] ) ){	
				return;
			}

			// Already showing this one?
			if( this.scope.find('[data-panel="' + categoryID + '"]').is(':visible') ){
				return;
			}

			// If the panel doesn't already exist, build it
			if( !this.scope.find('[data-panel="' + categoryID + '"]').length ){	
				var primaryContent = '';	
				var rows = this._buildEmoticonRows( this._emoticonsObj[ categoryID ].emoticons );

				primaryContent = ips.templates.render( 'core.editor.emoticonCategory', {
					emoticons: rows.join(''),
					title: this._emoticonsObj[ categoryID ].title,
					categoryID: categoryID
				});

				this.scope
					.find('.ipsMenu_innerContent')
						.append( ips.templates.render('core.editor.emoticonSection', { 
							content: primaryContent,
							id: categoryID
						}));
			}

			// Now hide all panels, then fade in the one we want
			this.scope.find('[data-panel]').hide();
			ips.utils.anim.go( 'fadeIn', this.scope.find('[data-panel="' + categoryID + '"]') );
		},

		/**
		 * Called by the initialization function. Sets up the panel, building the initial overview
		 * list and compiling templates we'll need later.
		 *
		 * @returns 	{void}
		 */
		_buildEmoticonsPanel: function () {

			// Build the categories menu
			var menuContent = [];

			for( var cat in this._emoticonsObj ){
				menuContent.push( ips.templates.render('core.editor.emoticonMenu', { 
					title: this._emoticonsObj[ cat ].title,
					count: this._emoticonsObj[ cat ].total,
					categoryID: cat
				}));
			}

			$( this.scope ).find('[data-role="categoryMenu"]').append( menuContent.join('') );

			// Mark as done
			this._doneInit = true;
		},

		_getJSON: function () {
			var deferred = $.Deferred();
			var self = this;

			// If there's already a request going, abort it
			if( this._ajaxObj && this._ajaxObj.abort ){
				this._ajaxObj.abort();
			}

			this._ajaxObj = ips.getAjax();

			// Set loading to true
			this._setLoading();

			this._ajaxObj( ips.getSetting('baseURL') + 'index.php?app=core&module=system&controller=editor&do=emoticons', {
				dataType: 'json'
			})
				.done( function (emoticons) {
					ips.setSetting('emoticons', emoticons);		    		
					self._emoticonsObj = emoticons;
					deferred.resolve();
	    		})
	    		.fail( function () {
	    			deferred.reject();
	    		})
	    		.always( function () {
	    			self._setLoadingDone();
	    		});

	    	return deferred.promise();
		},

		/**
		 * Sets the panel as loading - adds a loading thingy, disables the search box
		 * and hides the category menu
		 *
		 * @returns 	{void}
		 */
		_setLoading: function () {
			this.scope
				.find('[data-panel="loading"]')
					.remove()
				.end()
				.find('.ipsMenu_innerContent')
					.append( ips.templates.render('core.editor.emoticonSection', { 
						content: '',
						id: 'loading'
					}))
					.find('[data-panel="loading"]')
						.css( { height: '150px' } )
						.addClass('ipsLoading')
					.end()
				.end()
				.find('[data-role="emoticonSearch"]')
					.prop('disabled', true)
				.end()
				.find('[data-role="categoryTrigger"]')
					.hide();
		},

		/**
		 * Removes the loading state - removes loading thing, enabled textbox, shows category menu
		 *
		 * @returns 	{void}
		 */
		_setLoadingDone: function () {
			this.scope
				.find('[data-panel="loading"]')
					.remove()
				.end()
				.find('[data-role="emoticonSearch"]')
					.prop('disabled', false)
				.end()
				.find('[data-role="categoryTrigger"]')
					.show();
		},

		/**
		 * Fills the overview panel with up to 21 emoticons from each category
		 *
		 * @returns 	{void}
		 */
		_buildOverview: function () {

			// 09/09/15 - 4.1 - Converting this cookie to use localStorage to avoid a mod_security issue
			// @todo remove in a future release
			this._convertEmoticonsToLocalStorage();

			var primaryContent = [];
			var recentlyUsed = ips.utils.db.get('emoticons', 'recent' );

			if( recentlyUsed ){
				var rows = this._buildEmoticonRows( recentlyUsed, 7 );

				primaryContent.push( ips.templates.render('core.editor.emoticonCategory', {
					emoticons: rows.join(''),
					title: ips.getString('emoticonRecent'),
					categoryID: 'recent'
				}));	
			}

			// Build the emoticons
			// Loop through each category, then loop through each emoticon in each
			for( var cat in this._emoticonsObj ){				
				var rows = this._buildEmoticonRows( this._emoticonsObj[ cat ].emoticons, 21 );

				primaryContent.push( ips.templates.render('core.editor.emoticonCategory', {
					emoticons: rows.join(''),
					title: this._emoticonsObj[ cat ].title,
					categoryID: cat
				}));
			}

			this.scope
				.find('.ipsMenu_innerContent')
					.html( ips.templates.render('core.editor.emoticonSection', { 
						content: primaryContent.join(''),
						id: 'overview'
					}));
		},

		/**
		 * Given an array of emoticons, builds rows of emoticons for panels, up to the maximum number of
		 * emoticons specified
		 *
		 * @param 		{array} 	emoticons 		Array of emoticon data
		 * @param 		{number} 	max				Max number of emoticons to show. Shows all if not specified
		 * @returns 	{array} 	Array of rows, ready to be joined as a string
		 */
		_buildEmoticonRows: function (emoticons, max) {
			if( !max ){
				max = emoticons.length;
			}

			var thisCategory = [];
			var emoticonArray = [];
			var pos = 0;

			for( var i = 0; i < max; i++ ){	
				if( pos == 0 && _.isUndefined( emoticons[ i ] ) ){
					break;
				}

				if( !_.isUndefined( emoticons[ i ] ) ){
					/* The user may have an emoticon cookie that doesn't contain these new items */
					var opts = {
						"srcset": !_.isUndefined( emoticons[i].srcset ) ? emoticons[i].srcset : '',
						"width": !_.isUndefined( emoticons[i].width ) ? emoticons[i].width : 'auto',
						"height": !_.isUndefined( emoticons[i].height ) ? emoticons[i].height : 'auto'
					};

					emoticonArray.push( ips.templates.render('core.editor.emoticonItem', { 
						tag: emoticons[i].text,
						src: emoticons[i].src,
						srcset: ( opts.width !== 'auto' && opts.height !== 'auto' ) ? opts.srcset : '',
						width: opts.width,
						height: opts.height,
						img: "<img src='" + emoticons[i].src + "' " + ( ( opts.width !== 'auto' && opts.height !== 'auto' ) ? "srcset='" + opts.srcset + "' " : '' ) + "' width='" + opts.width + "' height='" + opts.height + "'>"
					}));

					this._testEmoticon( emoticons[i].src );
				} else {
					emoticonArray.push( ips.templates.render('core.editor.emoticonBlank') );
				}

				pos++;

				if( pos == 7 || ( i + 1 ) == max ){
					thisCategory.push( ips.templates.render('core.editor.emoticonRow', { emoticons: emoticonArray.join('') }) );
					pos = 0;
					emoticonArray = [];
				}
			}

			return thisCategory;
		},

		/**
		 * Test if an image actually exists before adding it to the array
		 *
		 * @param	{string}	emoticon	Emoticon URL
		 */
		 _testEmoticon: function( emoticon ) {
		 	var image = new Image();
		 	var noerror = true;
		 	image.onerror = function(){ 
		 		$('[data-src="' + emoticon + '"]').remove(); 
		 	}
		 	image.src = emoticon;
		 }
	});
}(jQuery, _));