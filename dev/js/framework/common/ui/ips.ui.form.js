/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.forms.js - Form handling in the AdminCP
 * Sets up basic form elements and behaviors used throughout the acp. More complex form controls (e.g.
 * uploading or autocomplete) are handled in their own widgets.
 *
 * Author: Mark Wade & Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.form', function(){

		var _cmInstances = {};
		var _support = {};

		var formTypes = {
			// Toggles to allow 'unlimited' values
			'unlimited': '[data-control~="unlimited"]',
			// Disables elements when certain values in a select are chosen
			'selectDisable': '[data-control~="selectDisable"]',
			// Polyfills dates
			'date': 'input[type="date"], [data-control~="date"]',
			// Makes range inputs a bit nicer
			'range': 'input[type="range"], [data-control~="range"]',
			// Polyfills colors
			'color': 'input[type="color"], [data-control~="color"]',
			// Width/height changers
			'dimensions': '[data-control~="dimensions"]',
			// Width/height unlimited toggles
			'dimensionsUnlimited': '[data-control~="dimensionsUnlimited"]',
			// Disables fields if JS is enabled
			'jsDisable': 'input[data-control~="jsdisable"]',
			// Toggles form rows when another element value changes
			'toggle': '[data-control~="toggle"]',
			// Codemirror
			'codemirror': '[data-control~="codemirror"]',
			// CheckboxSets with Unimited toggles
			'granularCheckboxset': '[data-control~="granularCheckboxset"]',
			// Phone number international dialling code select
			'diallingCode': '[data-control="diallingCode"]'
		};

		/**
		 * Called when module is initialized.
		 * Observes the content change event, and calls our respond method. This allows us to initialize new form controls
		 * that might be added inside the form.
		 *
		 * @returns {void}
		 */
		var init = function () {
			$( document ).on( 'contentChange', function (e, data) {
				if( $( data[0] ).closest('[data-ipsForm]').length ){
					respond( $( data[0] ) );
				}
			});

			/* This listens for codeMirrorInsert which is triggered from ips.editor.customtags.js and then inserts into code mirror instances */
			$( document ).on( 'codeMirrorInsert', function (e, data) {
				if( !_.isUndefined( _cmInstances[ data.elemID ] ) ) {
					_cmInstances[ data.elemID ].replaceRange( data.tag, _cmInstances[ data.elemID ].getCursor( "end" ) );
				}
			});
			
			$( document ).on( 'tabChanged', function (e, data) {
				var form = $( '#' + data['barID'] ).closest('[data-ipsForm]');
				if ( $('input[name=' + form.attr('data-formId' ) + '_activeTab]' ).length ) {
					$('input[name=' + form.attr('data-formId' ) + '_activeTab]' ).val( data['tabID'].replace( form.attr('data-formId' ) + '_tab_', '' ) );
				}
			});
		},

		/**
		 * Respond method
		 * Loops through each form type, finds elements that match, then initializes them
		 *
		 * @returns {void}
		 */
		respond = function (elem, options) {
			var runControlMethod = function (i){				
				_controlMethods[ type ]( $(this), elem ) || $.noop;
			};

			// Loop through each type of control we'll work with
			for( var type in formTypes ){
				$( elem ).find( formTypes[ type ] ).each( runControlMethod );
			}	
			
			/* Sort any select boxes that need it */
			$(elem).find('select[data-sort]').each(function(){
				var value = $(this).val();
				$(this).children('optgroup').each(function(){
					$(this).append( $(this).children('option').remove().sort(localeSort) );
				});
				$(this).append( $(this).children('optgroup').remove().sort(localeSort) );
				$(this).append( $(this).children('option').remove().sort(localeSort) );
				$(this).val( value );
			});
		};
		
		/**
		 * Locale sort
		 */
		var localeSort = function (a, b) {
			if ( $(a).prop("tagName") == 'OPTGROUP' ) {
				var aValue = $(a).attr('label');
			} else {
				if (!a.value) {
			        return -1;   
			    }
				var aValue = a.innerHTML;
			}
			if ( $(b).prop("tagName") == 'OPTGROUP' ) {
				var bValue = $(b).attr('label');
			} else {
				if (!b.value) {
			        return 1;   
			    }
				var bValue = b.innerHTML;
			}
									 
		    try {
		    	return aValue.localeCompare( bValue );
		    } catch ( err ) {
			    return ( aValue > bValue ) ? 1 : -1;
		    }
		};

		// Object containing methods for each control
		var _controlMethods = {
			/**
			 * Handles codemirror fields
			 *
			 * @param	{element}	elem		The textarea element
			 * @returns {void}
			 */
			codemirror: function (elem) {
				ips.loader.get( ['core/interface/codemirror/diff_match_patch.js','core/interface/codemirror/codemirror.js'] ).then( function () {
					var elemId	= $( elem ).attr('id');

					// If there's already an instance here, we need to remove it and reinitialize
					// This happens when, for example, a form is validated in a modal, meaning the same element
					// ID is used again
					if( !_.isUndefined( _cmInstances[ elemId ] ) ) {
						// 10/23/15 we were still losing the contents of codemirror when switching tabs. To fix this, we need to save
						// the contents to the textarea *before* removing the CM instance.
						_cmInstances[ elemId ].save();
						//-----

						$( _cmInstances[ elemId ].getWrapperElement() ).remove();
						delete _cmInstances[ elemId ];
					} 

					_cmInstances[ elemId ]	= CodeMirror.fromTextArea( document.getElementById(elemId), { 
						mode: $(elem).attr('data-mode'),
						lineWrapping: true,
						lineNumbers: false,
						leaveSubmitMethodAlone: true
					} );
					
					if ( $(elem).attr('data-height') ){
						_cmInstances[ elemId ].setSize( null, $(elem).attr('data-height') );					
						$('div[data-codemirrorid=' + elemId + '] ul[data-role=tagsList]').css('max-height', $(elem).attr('data-height') );
					}
					
					$( '#' + elemId ).data('CodeMirrorInstance', _cmInstances[ elemId ] );
					
					// Support custom tags
					$('[data-codemirrorcustomtag]').on( 'click', function( e ){
						_cmInstances[ elemId ].replaceRange( $( e.currentTarget ).attr('data-codemirrorcustomtag'), _cmInstances[ elemId ].getCursor( "end" ) );
					});
				});
			},

			/**
			 * Makes range inputs a little nicer to use
			 *
			 * @param	{element}	elem		The range element
			 * @returns {void}
			 */
			range: function (elem) {
				if( _.isUndefined( _support['range'] ) ){
					var i = document.createElement("input");
					i.setAttribute("type", "range");

					_support['range'] = !( i.type === 'text' );
				}

				if( !_support['range'] ){
					elem.siblings('[data-role="rangeBoundary"]').hide();
				} else {
					var valueElem = $( '#' + elem.attr('name') + '_rangeValue' );
					valueElem.text( elem.val() );
					
					elem.on( 'change', function () {
						valueElem.text( elem.val() );
					});
				}
			},

			/**
			 * Enables functionality for 'unlimited' toggles
			 *
			 * @param	{element}	elem		The checkbox element
			 * @returns {void}
			 */
			unlimited: function (elem) {				
				elem.on( 'change', function () {
					_unlimitedCheck( elem );
				});

				_unlimitedCheck( elem );
			},

			/**
			 * Disables select boxes when the selected option element has a data-disable attribute
			 *
			 * @param	{element}	elem		The select box
			 * @returns {void}
			 */
			selectDisable: function (elem) {
				elem.on( 'change', function () {
					_selectDisable( elem );
				});
				
				_selectDisable( elem );
			},

			/**
			 * Handles date fields by adding a jquery plugin if the browser doesn't natively support type='date'
			 *
			 * @param	{element}	elem		The date form control
			 * @returns {void}
			 */
			date: function (elem) {
				if( _.isUndefined( _support['date'] ) ){
					var i = document.createElement("input");
					i.setAttribute("type", "date");

					_support['date'] = !( i.type === 'text' );
				}

				if( !_support['date'] ){
					if( $(elem).attr('data-preferredFormat') )
					{
						$(elem).val( $(elem).attr('data-preferredFormat') );
					}

					ips.loader.get( ['core/interface/jquery/jquery-ui.js'] ).then( function () {
												
						var _buildDatepicker = function () {
							
							$.datepicker.regional['xx'] = {
								closeText: ips.getString('date_picker_done'), // Display text for close link
								prevText: ips.getString('date_picker_prev'), // Display text for previous month link
								nextText: ips.getString('date_picker_next'), // Display text for next month link
								currentText: ips.getString('date_picker_next'), // Display text for current month link
								monthNames: [ips.getString('month_0'),ips.getString('month_1'),ips.getString('month_2'),ips.getString('month_3'),ips.getString('month_4'),ips.getString('month_5'),ips.getString('month_6'),ips.getString('month_7'),ips.getString('month_8'),ips.getString('month_9'),ips.getString('month_10'),ips.getString('month_11')], // Names of months for drop-down and formatting
								monthNamesShort: [ips.getString('month_0'),ips.getString('month_1'),ips.getString('month_2'),ips.getString('month_3'),ips.getString('month_4'),ips.getString('month_5'),ips.getString('month_6'),ips.getString('month_7'),ips.getString('month_8'),ips.getString('month_9'),ips.getString('month_10'),ips.getString('month_11')], // For formatting
								dayNames: [ips.getString('day_0'),ips.getString('day_1'),ips.getString('day_2'),ips.getString('day_3'),ips.getString('day_4'),ips.getString('day_5'),ips.getString('day_6')], // For formatting
								dayNamesShort: [ips.getString('day_0_short'),ips.getString('day_1_short'),ips.getString('day_2_short'),ips.getString('day_3_short'),ips.getString('day_4_short'),ips.getString('day_5_short'),ips.getString('day_6_short')], // For formatting
								dayNamesMin: [ips.getString('day_0_short'),ips.getString('day_1_short'),ips.getString('day_2_short'),ips.getString('day_3_short'),ips.getString('day_4_short'),ips.getString('day_5_short'),ips.getString('day_6_short')], // Column headings for days starting at Sunday
								weekHeader: ips.getString('date_picker_week'), // Column header for week of the year
								dateFormat: ips.getSetting( 'date_format' ), // See format options on parseDate
								firstDay: ips.getSetting( 'date_first_day' ), // The first day of the week, Sun = 0, Mon = 1, ...
								isRTL: $('html').attr('dir') == 'rtl', // True if right-to-left language, false if left-to-right
								showMonthAfterYear: false, // True if the year select precedes month, false for month then year
								yearSuffix: "", // Additional text to append to the year in the month headers
								shortYearCutoff: 10
							};
							$.datepicker.setDefaults($.datepicker.regional['xx']);
							
							elem.datepicker( {
								changeMonth: true,
								changeYear: true,
								yearRange: "-120:+10",
								dateFormat: ips.getSetting( 'date_format' ),
								firstDay: ips.getSetting( 'date_first_day' ),
							});
							
							//elem.datepicker('refresh');
							elem.datepicker('show');
						};

						elem.on( 'focus', function () {
							_buildDatepicker();
						});
					});
				}
			},

			/**
			 * Handles color fields by adding a jquery plugin if the browser doesn't natively support type='color'
			 *
			 * @param	{element}	elem		The color control
			 * @returns {void}
			 */
			color: function (elem) {
				if( elem.hasClass('color') )
				{
					return;
				}

				elem.addClass('color');

				ips.loader.get( ['core/interface/jscolor/jscolor.js'] ).then( function () {
					// We need to set the image dir for jscolor manually because when our JS is compiled,
					// jscolor's auto-detect function won't get it right
					jscolor.dir = ips.getSetting('baseURL') + 'applications/core/interface/jscolor/';
					new jscolor.color( elem.get(0), { required: false } );
				});
			},

			/**
			 * Toggles one or more form rows when the element value changes
			 *
			 * @param	{element}	elem		The form control that is the trigger
			 * @returns {void}
			 */
			toggle: function (elem, form) {	

				// "On" toggles
				var togglesOn = ( elem.attr('data-togglesOn') || elem.attr('data-toggles') || '' ).split(',');
				var togglesOff = ( elem.attr('data-togglesOff') || '' ).split(',');

				// Call _toggler once each for 'on' and 'off' toggles
				if( togglesOn.length ){
					_toggler( elem, form, togglesOn, true );
				}

				if( togglesOff.length ){
					_toggler( elem, form, togglesOff, false );
				}
			},

			/**
			 * Handles dimension controls, which have dragging functionality to choose a size
			 *
			 * @param	{element}	elem	The dimensions element
			 * @returns {void}
			 */
			dimensions: function (elem) {
				var container = elem.closest('.ipsWidthHeight_container');

				elem.resizable( {
					resize: function (event, ui) {
						container.find('input.ipsWidthHeight_width').val( elem.width() );
						container.find('input.ipsWidthHeight_height').val( elem.height() );
					}
				});

				container.find('input.ipsWidthHeight_width').on( 'change', function () {
					elem.width( $( this ).val() );
				});

				container.find('input.ipsWidthHeight_height').on( 'change', function () {
					elem.height( $( this ).val() );
				});			
			},

			/**
			 * Sets up events for unlimited checkbox for dimension controls
			 *
			 * @param	{element}	elem	THe checkbox element
			 * @returns {void}
			 */
			dimensionsUnlimited: function (elem) {
				elem.on( 'change', function () {
					_dimensionsUnlimitedCheck( elem );
				});

				_dimensionsUnlimitedCheck( elem );
			},

			/**
			 * Disables fields if JS is enabled
			 *
			 * @param	{element}	elem		The element this widget is being created on
			 * @returns {void}
			 */
			jsDisable: function (elem) {
				elem.prop('disabled', true);
			},
			
			/**
			 * CheckboxSet with Unlimited checkbox
			 *
			 * @param	{element}	elem		The element this widget is being created on
			 * @returns {void}
			 */
			granularCheckboxset: function (elem) {
				elem.find('[data-role="checkboxsetUnlimitedToggle"]').on( 'change', function () {
					// We don't want to check disabled boxes, but we do want to uncheck them
					if( $(this).is(':checked') )
					{
						elem.find('[data-role="checkboxsetGranular"] input:enabled[type="checkbox"]').prop( 'checked', $(this).is(':checked') );
					}
					else
					{
						elem.find('[data-role="checkboxsetGranular"] input[type="checkbox"]').prop( 'checked', $(this).is(':checked') );
					}
				});
				
				elem.find('[data-action="checkboxsetCustomize"]').on( 'click', function () {
					elem.find('[data-role="checkboxsetUnlimited"]').hide();
					elem.find('[data-role="checkboxsetUnlimitedToggle"]').prop( 'checked', false );
					elem.find('[data-role="checkboxsetGranular"]').slideDown();
				});
				
				elem.find('[data-action="checkboxsetAll"]').on( 'click', function () {
					elem.find('[data-role="checkboxsetGranular"] input:enabled[type="checkbox"]').prop( 'checked', true );
					elem.find('[data-role="checkboxsetUnlimited"]').slideDown();
					elem.find('[data-role="checkboxsetGranular"]').slideUp();
					elem.find('[data-role="checkboxsetUnlimitedToggle"]').prop( 'checked', true ).change();
				});
				elem.find('[data-action="checkboxsetNone"]').on( 'click', function () {
					elem.find('[data-role="checkboxsetGranular"] input[type="checkbox"]').prop( 'checked', false );
					elem.find('[data-role="checkboxsetUnlimited"]').slideDown();
					elem.find('[data-role="checkboxsetGranular"]').slideUp();
					elem.find('[data-role="checkboxsetUnlimitedToggle"]').prop( 'checked', false ).change();
				});
			},
			
			/**
			 * Dialling code select box
			 *
			 * @param	{element}	elem		The element this widget is being created on
			 * @returns {void}
			 */
			diallingCode: function(elem) {
				
				var selected = elem.find('option:selected');
				if ( selected.length ) {
					selected.html( selected.attr('data-code') );
				}
				
				elem.on('change mouseleave', function(){
				    elem.find('option').each(function(){
				      $(this).html( $(this).attr('data-text') ); 
				    });
				    elem.find('option:selected').html( elem.find('option:selected').attr('data-code')  );
				    $(this).blur();
				});
				elem.on('focus', function(){
				    elem.find('option').each(function(){
				        $(this).html( $(this).attr('data-text') ); 
				    });
				});
			}
		},

		//--------------------------------------------------------------
		// Helper methods for individual form control types
		//--------------------------------------------------------------

		/**
		 * Handles toggling for a given element by calling the appropriate method for the type of element
		 *
		 * @param	{element}	elem			The element on which the toggle is specified
		 * @param 	{element}	form 			The form element
		 * @param	{string} 	toggleList 		The comma-separated list of element IDs to be toggled
		 * @param 	{boolean} 	toggleOn 		Whether the provided IDs should be shown (true) or hidden (false)
		 * @returns {void}
		 */
		_toggler = function (elem, form, toggleList, toggleOn) {
			var toCall;
			var triggerElem;
			var eventType = 'change';

			// Turn toggleList into a selector
			var selectorList = ips.utils.getIDsFromList( toggleList );

			if( !selectorList ){
				return;
			}

			// Get the right function and element depending on the type
			if( elem.is('option') ){
				toCall = _toggleSelect;
				triggerElem = elem.closest('select');
			} else if( elem.is('input[type="checkbox"]') ){
				toCall = _toggleCheckbox;
				triggerElem = elem;
			} else if( elem.is('input[type="radio"]') ){
				toCall = _toggleRadio;
				triggerElem = form.find('input[name="' + elem.attr('name') + '"]');
			} else if( elem.is('.ipsSelectTree_item') ){
				toCall = _toggleNode;
				triggerElem = elem.closest('.ipsSelectTree');
				eventType = 'nodeSelectedChanged';
			} else {
				toCall = _toggleGeneric;
				triggerElem = elem;
			}

			var reverse = !toggleOn;

			// Set the event
			triggerElem.on( eventType, function () {
				toCall.call( this, triggerElem, selectorList, elem, form, reverse );
			});
			
			// And call immediately to initialize, if it's currently visible
			if( triggerElem.is(':visible') || ( triggerElem.attr('data-toggle-visibleCheck') && $( triggerElem.attr('data-toggle-visibleCheck') ).is(':visible') ) ){
				toCall.call( this, triggerElem, selectorList, elem, form, reverse );	
			}
		},


		/**
		 * Handles the 'unlimited' checkbox for dimension controls
		 *
		 * @param	{element}	elem	The checkbox element
		 * @returns {void}
		 */
		_dimensionsUnlimitedCheck = function (elem) {
			var container = elem.closest('.ipsWidthHeight_container');

			if( elem.is(':checked') ){
				container
					.find('[data-control="dimensions"]')
						.hide()
					.end()
					.find('input.ipsWidthHeight_width, input.ipsWidthHeight_height')
						.val('')
						.prop( 'disabled', true );
			} else {
				container
					.find('[data-control="dimensions"]')
						.show()
					.end()
					.find('input.ipsWidthHeight_width, input.ipsWidthHeight_height')
						.change()
						.prop( 'disabled', false );
			}
		},

		/**
		 * Toggle behavior for radio buttons
		 * Hides all toggle panes assosciated with radio buttons sharing the same name, then shows
		 * panes necessary if this radio button is checked
		 *
		 * @param	{array}		radioList	All radio buttons that share the same name
		 * @param	{string}	toggleList	Selector list of elements to toggle
		 * @param	{element}	thisElem	The radio button that was clicked
		 * @returns {void}
		 */
		_toggleRadio = function (radioList, toggleList, thisElem, form) {

			// Hide all toggles
			radioList.each( function () {
				var thisToggles = ips.utils.getIDsFromList( $( this ).attr('data-toggles') );

				if( thisToggles ){
					_hideFormRows( thisToggles, form );
				}
			});

			// Find the checked one
			radioList.each( function () {
				if( $( this ).is(':checked') ){
					var thisToggles = ips.utils.getIDsFromList( $( this ).attr('data-toggles') );

					if( thisToggles ){
						_showFormRows( thisToggles, form );
					}
				}
			});
			
		},

		/**
		 * Toggle behavior for select boxes
		 *
		 * @param	{element}	elem		Checkbox that was changed
		 * @param	{string}	toggleList	Selector list of elements to toggle
		 * @returns {void}
		 */
		_toggleSelect = function (selectElem, toggleList, thisElem, form) {
			selectElem.find('option').each( function (idx, elem) {
				if( $( this ).attr('data-toggles') ){
					_hideFormRows( ips.utils.getIDsFromList( $( this ).attr('data-toggles') ), form );
				}
			});

			// Get selected items
			selectElem.find('option:selected').each( function (i, elem) {
				if( $( elem ).attr('data-toggles') ){
					_showFormRows( ips.utils.getIDsFromList( $( this ).attr('data-toggles') ), form );
				}
			});
		},

		/**
		 * Toggle behavior for checkboxes
		 *
		 * @param	{element}	elem		Checkbox that was changed
		 * @param	{string}	toggleList	Selector list of elements to toggle
		 * @returns {void}
		 */
		_toggleCheckbox = function (elem, toggleList, thisElem, form, reverse) {
			// Get the value
			var show = elem.is(':checked');

			if( reverse ){
				show = !show;
			}

			if( show ){
				_showFormRows( toggleList, form );
			} else {
				_hideFormRows( toggleList, form );
			}
		},

		/**
		 * Toggle behavior for node selector
		 *
		 * @param	{element}	elem		Input field that was changed
		 * @param	{string}	toggleList	Selector list of elements to toggle
		 * @returns {void}
		 */
		_toggleNode = function (nodeElem, toggleList, thisElem, form) {

			nodeElem.find('[data-action="nodeSelect"][data-toggles]').each( function (idx, elem) {
				_hideFormRows( ips.utils.getIDsFromList( $( this ).attr('data-toggles') ), form );
			});

			// Now get the selected ones
			nodeElem.find('[data-action="nodeSelect"][data-toggles].ipsSelectTree_selected').each( function (idx, elem) {
				_showFormRows( ips.utils.getIDsFromList( $( this ).attr('data-toggles') ), form );
			});
		},
		
		/**
		 * Toggle behavior for other input types
		 *
		 * @param	{element}	elem		Input field that was changed
		 * @param	{string}	toggleList	Selector list of elements to toggle
		 * @returns {void}
		 */
		_toggleGeneric = function (elem, toggleList, thisElem, form) {
			// Get the value
			var show = elem.val() == 0 ? false : true;

			if( !_.isUndefined( elem.attr('data-togglereverse') ) ){
				show = !show;
			}
			
			if( show ){
				_showFormRows( toggleList, form );
			} else {
				_hideFormRows( toggleList, form );
			}
		},

		/**
		 * Hides the form rows contained in the provided selector. Works recursively to hide any toggled
		 * panes of elements that become hidden
		 *
		 * @param	{string}	hide	Selector containing elements to hide
		 * @returns {void}
		 */
		_hideFormRows = function (hide, form) {
			if( _.isArray( hide ) ){
				hide = hide.join(',');
			}
						
			$( form || document ).find( hide )
				.hide()
				.addClass('ipsHide')
				.find('[data-toggles],[data-togglesOn],[data-togglesOff]')
					.each( function (i, elem) {
						_hideFormRows( ips.utils.getIDsFromList( $( elem ).attr('data-toggles') ), form );
						_hideFormRows( ips.utils.getIDsFromList( $( elem ).attr('data-togglesOn') ), form );
						_hideFormRows( ips.utils.getIDsFromList( $( elem ).attr('data-togglesOff') ), form );
					});
		},

		/**
		 * Shows the form rows contained in the provided selector, and sets up any toggles contained on
		 * elements that become visible
		 *
		 * @param	{string}	show	Selector containing elements to show
		 * @returns {void}
		 */
		_showFormRows = function (show, form) {
			if( _.isArray( show ) ){
				show = show.join(',');
			}
			
			$( form || document )
				.find( show )
					.not('[data-ipsToggle]')
					.show()
				.end()
				.removeClass('ipsHide')
				.find('[data-toggles],[data-togglesOn]')
					.each( function (i, elem) {
						_controlMethods.toggle( $( elem ), form );
					});
		},

		/**
		 * Disables elements when an option within the <select> has a data-disable attribute
		 *
		 * @param	{element}	elem		Select element
		 * @returns {void}
		 */
		_selectDisable = function (elem) {
			var option = elem.find('[data-disable]');

			if( !option.length ){
				return;
			}

			var disable = option.attr('data-disable');

			if( !option.is(':selected') ){
				$( disable ).prop('disabled', false);
			} else {
				$( disable ).prop('disabled', true);
			}
		},

		/**
		 * 'Unlimited' checkbox implementation
		 * Disables inputs if the element is checked
		 *
		 * @param	{element}	checkbox		Checkbox element
		 * @returns {void}
		 */
		_unlimitedCheck = function (checkbox) {
			if( !checkbox.is(':disabled') ){
				if( checkbox.is(':checked') ){
					checkbox.closest('.ipsFieldRow_content,[data-role="unlimitedCatch"]')
						.find('input:not([type="checkbox"],[type="hidden"]),select,textarea').each( function () {
							var thisInput = $( this );
							thisInput.attr( 'data-previousvalue', thisInput.val() );
							thisInput.val(''); 
							thisInput.prop( 'disabled', true );
						})
						.find('[data-role="rangeBoundary"]')
							.css( { opacity: 0.5 } );
				} else {
					checkbox.closest('.ipsFieldRow_content,[data-role="unlimitedCatch"]')
						.find('input:not([type="checkbox"],[type="hidden"]),select,textarea').each( function () {
							var thisInput = $( this );
							thisInput.prop( 'disabled', false );
							if ( thisInput.attr( 'data-previousvalue' ) ) {
								thisInput.val( thisInput.attr( 'data-previousvalue' ) );
							}
						})
						.find('[data-role="rangeBoundary"]')
							.css( { opacity: 1 } );
				}
			}

			// Do we have any toggles on the fields we need to reinit?
			var toggles = checkbox.closest('.ipsFieldRow_content').find('[data-control="toggle"]');
			var form = checkbox.closest('[data-ipsForm]');

			if( toggles.length ){
				toggles.each( function () {
					_controlMethods.toggle( $( this ), form );
				});
			}
		},
		
		/**
		 * Displays a validation error
		 *
		 * @param	{elem}		field		Field row in which to display an error
		 * @param	{string}	error		Error message
		 * @returns {void}
		 */
		_validationError = function (field, error) {
			field
				.closest('.ipsFieldRow')
				.find('.ipsFieldRow_title')
					.addClass('error')
				.end()
				.find('.ipsType_warning')
					.html( error );
		};

		ips.ui.registerWidget( 'form', ips.ui.form );

		return {
			respond: respond,
			init: init
		};
	});
}(jQuery, _));