/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.ui.matrix.js - Matrix widget for the AdminCP permissions systems
 *
 * Author: Mark Wade & Rikki Tissier
 */
;( function($, _, undefined){
	"use strict";

	ips.createModule('ips.ui.matrix', function(){

		var defaults = {
			manageable: true,
			squashFields: false
		};

		var respond = function (elem, options) {
			if( !$( elem ).data('_matrix') ){
				$( elem ).data('_matrix', matrixObj(elem, _.defaults( options, defaults ) ) );
			}
		};

		ips.ui.registerWidget( 'matrix', ips.ui.matrix, [ 'manageable', 'squashFields' ] );

		return {
			respond: respond
		};
	});

	/**
	 * Matrix instance
	 *
	 * @param	{element} 	elem 		The element this widget is being created on
	 * @param	{object} 	options 	The options passed into this instance
	 * @returns {void}
	 */
	var matrixObj = function (elem, options) {

		/**
		 * Sets up this instance
		 *
		 * @returns 	{void}
		 */
		var init = function () {
			_setUpEvent();

			if( options.manageable ){
				_setUpManageable();
			}

			_checkRows();
		},

		/**
		 * Sets up the various events the matrix needs
		 *
		 * @returns {void}
		 */
		_setUpEvent = function () {
			elem.on( 'click', 'td, th', _clickCell );
			elem.on( 'click', 'td input, th input', _clickInputInCell );
			elem.on( 'click', '.matrixAdd', _addRow );
			elem.on( 'click', '.matrixDelete', _deleteRow );
			elem.on( 'click', '[data-action="checkRow"]', _checkRow );
			elem.on( 'click', '[data-action="unCheckRow"]', _unCheckRow );
			elem.on( 'change', '[data-action="checkAll"]', _checkAll ); 
			elem.on( 'change', 'td input[type="checkbox"]', _checkboxChanged );
			elem.closest('form').on( 'submit', _submitForm );
			$( document ).on( 'tabShown', function () {
				_checkRows();
			});
		},

		/**
		 * Called when any cell checkbox is checked. Checks all checkboxes in the column to see if all are checked.
		 * If all are checked, checks the column header. Otherwise, unchecks column header.
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_checkboxChanged = function (e){
			// Which column are we in?
			var col = $( e.currentTarget ).closest('[data-col]').attr('data-col');
			var colHead = elem.find('[data-checkallheader="' + col + '"]');

			if( _.isUndefined( col ) || !elem.find('[data-checkallheader="' + col + '"]').length ){
				return;
			}

			// Get all checkboxes with the same column key
			var similar = elem.find('[data-col="' + col + '"] input[type="checkbox"]');

			colHead.prop('checked', similar.filter(':checked').length == similar.length );
		},

		/**
		 * Event handler for clicking in a cell
		 * Check a checkbox if it exists in a cell, otherwise focus the input
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_clickCell = function (e) {
										
			// find input
			if( !$( e.target ).is('td') && !$( e.target ).is('th') ){
				return;
			}

			var input = $( e.currentTarget ).find('input:not([type="hidden"]),select,textarea');

			if( input.attr('type') == 'checkbox' ){
				input.click();
			} else {
				input.focus();
			}
		},
		
		/**
		 * Checks all checkboxes in the row
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_checkRow = function (e) {
			e.preventDefault();

			$( e.target )
				.closest('tr')
				.find('input[type="checkbox"]:not(:disabled)')
					.prop( 'checked', true )
					.trigger('change');
		},
		
		/**
		 * Unchecks all checkboxes in the row
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_unCheckRow = function (e) {
			e.preventDefault();

			$( e.target )
				.closest('tr')
				.find('input[type="checkbox"]:not(:disabled)')
					.prop( 'checked', false )
					.trigger('change');
		},

		/**
		 * Checks all checkboxes that match the column
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_checkAll = function (e) {
			var regex = '^.*\\[' + $(this).attr('data-checkallheader') + '_checkbox\\]$';

			$(this).closest( 'table.ipsMatrix' ).find( 'input[type="checkbox"]:not(:disabled)' ).filter( function () {
				return $(this).attr('name').match( regex );
			} ).prop( 'checked', $(this).is(':checked') );
		},

		/**
		 * Event handler for deleting a row of the matrix
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_deleteRow = function (e) {
			e.preventDefault();
			var row = $( this ).closest('tr');

			// Change the value of the hidden input
			row.closest('form').find('input[data-matrixrowid="' + row.attr('data-matrixrowid') + '"]').val( 0 );

			// Fade it out them remove
			ips.utils.anim.go( 'fadeOut', row )
				.done( function () {
					row.remove();
					_checkRows();
				});
		},

		/**
		 * Event handler for the Add Row button
		 * Adds a new row by cloning the blank row
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_addRow = function (e) {
			var table = elem.find( '.ipsTable[data-matrixID="' + $( this ).attr('data-matrixID') + '"]' );
			var blankRow = table.find('tbody tr:not( .ipsMatrix_empty ):last-child');

			// Clone the blank row and insert the copy to form our new row
			var newRow = blankRow.clone();
			newRow.insertBefore( blankRow );
			
			// Rename the form fields inside the new row
			var index = newRow.index();
			newRow.find('input,textarea,select,option').each( function () {
				var input = $( this );

				if( input.attr( 'name' ) ){
					input.attr( 'name', input.attr( 'name' ).replace( /_new_\[x\]/g, '_new_[' + index + ']' ) ).show();
				}

				if( input.attr( 'id' ) ){
					input.attr( 'id', input.attr( 'id' ).replace( /_new__x_/g, '_new__' + index + '_' ) );
				}

				if( input.attr( 'data-toggles' ) ){
					input.attr( 'data-toggles', input.attr( 'data-toggles' ).replace( /_new__x_/g, '_new__' + index + '_' ) );
				}
			});

			// Animate
			ips.utils.anim.go( 'fadeIn', newRow )
				.done( function () {
					// Hide the empty row if necessary
					_checkRows();
				});
				
			// Let the document know
			$( document ).trigger( 'contentChange', [ newRow ] );

			// Scroll to it
			$('html, body').animate( { scrollTop: newRow.offset().top } );

			newRow.find('input,textarea,select').first().focus();
			
			return false;
		},

		/**
		 * Shows the 'empty' row if there's no real rows
		 *
		 * @returns {void}
		 */
		_checkRows = function () {
			if( elem.find('[data-matrixrowid]:visible').length > 0 ){
				elem.find('.ipsMatrix_empty').addClass('ipsHide');
			} else {
				elem.find('.ipsMatrix_empty').removeClass('ipsHide');
			}
		},

		/**
		 * Event handler for clicking an input within a cell
		 * Simply stops propagation
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_clickInputInCell = function (e) {
			e.stopPropagation();
		},

		/**
		 * Hooks into the submit event for the form, to wipe out the name on the blank row inputs
		 *
		 * @param 	{event} 	e 	Event object
		 * @returns {void}
		 */
		_submitForm = function (e) {
			// Remove names from the inputs in the blank row
			elem.find('.matrixBlankRow').find('input, select, textarea').attr( 'name', '' );

			// Are we squashing fields?
			if( !options.squashFields ){
				return;
			}

			// Get all values from the matrix
			var formElements = elem.find('[data-matrixid] *').filter(':input');
			var output = ips.utils.form.serializeAsObject( formElements );
			var matrixID = elem.find('[data-matrixid]').attr('data-matrixid');
			var newInput = $('<input />').attr('type', 'hidden').attr('name', matrixID + '_squashed');

			// JSON encode the data
			Debug.log("Before encoding, matrix data is:");
			Debug.log( output );			
			output = JSON.stringify( output );

			// Add a new hidden form field
			elem.prepend( newInput.val( output ) );

			// Disable all of the elements we squashed so that they don't get sent
			formElements.prop('disabled', true);
		},

		/**
		 * Initializes the blank row by removing the required attribute, and hiding it
		 *
		 * @returns {void}
		 */
		_setUpManageable = function () {
			elem.find('tr:last-child').find('input, select[required], textarea').removeAttr('required');
			elem.find('tbody tr:not( .ipsMatrix_empty ):last-child').hide();
		};

		init();

		return {
			init: init
		};
	};
}(jQuery, _));