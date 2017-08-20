/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.databases.revisions.js
 *
 * Author: Brandon Farber
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.register('cms.front.records.revisions', {
		initialize: function () {
			var self = this;

			ips.loader.get( ['core/interface/codemirror/diff_match_patch.js','core/interface/codemirror/codemirror.js'] ).then( function () {
				self._initCodeMirror();
			});
		},
		
		/**
		 * Initializes CodeMirror on a textarea with the provided key
		 *
		 * @returns {void}
		 */
		_initCodeMirror: function () {
			var self = this;
			var count = 0;

			_.each( self.scope.find("[data-key]"), function(elem){
				if( $(elem).attr('data-method') == 'merge' )
				{
					CodeMirror.MergeView( document.getElementById( $(elem).attr('id') ), {
						value: self.scope.find( '[data-original="' + $(elem).attr('data-key') + '"]' ).val(),
						origLeft: self.scope.find( '[data-current="' + $(elem).attr('data-key') + '"]' ).val(),
						lineWrapping: true,
						lineNumbers: false,
						mode: 'htmlmixed',
						revertButtons: false
					} );
				}
				else if( _.isUndefined( $(elem).attr('data-complete') ) )
				{
					var diff			= new diff_match_patch();
					var differences		= diff.diff_main( self.scope.find( '[data-original="' + $(elem).attr('data-key') + '"]' ).html(), self.scope.find( '[data-current="' + $(elem).attr('data-key') + '"]' ).html() );
					var currentDiff		= diff.diff_prettyHtml(differences);

					self.scope.find( '[data-current="' + $(elem).attr('data-key') + '"]' ).html( currentDiff );

					$(elem).attr( 'data-complete', 1 );
				}
			});
		}
	});
}(jQuery, _));