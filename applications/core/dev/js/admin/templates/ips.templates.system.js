ips.templates.set( 'menuManager.temporaryDropdown', "\
	<li class='ipsMenu_item {{#selected}}cMenuManager_active{{/selected}}' data-itemID='temp' data-role='menuItem'>\
		<span>\
			<ul class='ipsList_inline ipsPos_right cMenuManager_tools'>\
				<li>\
					<a href='#' data-action='removeItem' data-ipsTooltip title='{{#lang}}menuManagerRemoveItem{{/lang}}' class='ipsType_blendLinks'>\
						<i class='fa fa-times'></i></i>\
					</a>\
				</li>\
			</ul>\
			{{#lang}}menuManagerNewItem{{/lang}}\
		</span>\
	</li>\
");

ips.templates.set( 'menuManager.temporaryMenuItem', "\
	<li id='menu_{{id}}' data-role='menuNode'>\
		<div class='cMenuManager_leaf {{#selected}}cMenuManager_active{{/selected}}' data-itemID='temp' data-role='menuItem'>\
			<ul class='ipsList_inline ipsPos_right cMenuManager_tools'>\
				<li>\
					<a href='#' data-action='removeItem' data-ipsTooltip title='{{#lang}}menuManagerRemoveItem{{/lang}}' class='ipsType_blendLinks'>\
						<i class='fa fa-times'></i></i>\
					</a>\
				</li>\
			</ul>\
			<h3 class='cMenuManager_leafTitle'>{{#lang}}menuManagerNewItem{{/lang}}</h3>\
		</div>\
	</li>\
");


ips.templates.set( 'menuManager.emptyList', "\
	<li class='cMenuManager_emptyList ipsType_light ipsType_center'>{{#lang}}menuManagerEmptyList{{/lang}}</li>\
");
