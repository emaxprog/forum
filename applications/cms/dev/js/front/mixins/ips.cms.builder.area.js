/**
 * Invision Community
 * (c) Invision Power Services, Inc. - https://www.invisioncommunity.com
 *
 * ips.cms.builder.area.js - Front-end mixin for tables 
 *
 * Author: Matt Mecham
 */
;( function($, _, undefined){
	"use strict";

	ips.controller.mixin('builder.area', 'core.front.widgets.area', true, function () {
		
		_pageID: null;
		
		/**
		 * After init, init
		 *
		 * @returns {void}
		 */
		this.after('setup', function () {
			if( ! $('.cWidgetContainer').length ) {
				$('[data-action="openSidebar"]').hide();
			}
		});
		
		/**
		 * Updates the ordering of widgets in this area
		 *
		 * @returns {void}
		 */
		this.updateOrdering = function (without) {
			var body = $('body');
			var order = this.scope.find('> ul').sortable('toArray', {
				attribute: 'data-blockID'
			});

			order = ( without ) ? _.without( _.uniq( order ), without ) : _.uniq( order );

			// Remove hidden blocks as these should not be stored
			var self = this;
			_.each( order, function( value, key )
			{
				if ( self.scope.find('li[data-blockID=' + value + ']').attr('data-hidden') == 'true' )
				{
					order = _.without( order, value );
				}
			} );

			ips.getAjax()( ips.getSetting('baseURL') + 'index.php?app=cms&module=pages&controller=builder&do=saveOrder&orientation='  + this._orientation, {
				data: {
					order: order,
					pageID: $('#elCmsPageWrap').attr('data-pageid'),
					area: this._areaID,
					exclude: _.isString(without) ? without : ''
				}
			})
				.fail( function () {
					ips.ui.alert.show( {
						type: 'alert',
						icon: 'warn',
						message: ips.getString('sidebarError'),
						callbacks: {}
					});
				});
		};
		
	});
}(jQuery, _));