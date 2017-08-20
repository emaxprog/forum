/* MENUS */
ips.templates.set('core.appMenu.reorder', " \
	<span data-role='reorder' style='display: none'><i class='fa fa-bars'></i></span>\
");

/* CONTROL STRIP TEMPLATES */
ips.templates.set('core.controlStrip.menu', " \
	<ul class='ipsMenu ipsMenu_auto' role='menu' id='{{id}}_menu' style='display: none'>\
		{{{content}}}\
	</ul>\
");

ips.templates.set('core.controlStrip.menuItem', " \
	<li class='ipsMenu_item ipsControlStrip_menuItem' role='menuitem' id='{{id}}'>\
		{{{item}}}\
	</li>\
");

ips.templates.set('core.controlStrip.dropdown', " \
	<li class='ipsControlStrip_button ipsControlStrip_dropdown' data-dropdown id='{{id}}'>\
		<a href='#'>\
			<i class='ipsControlStrip_icon fa fa-angle-down'></i>\
		</a>\
	</li>\
");

/* TOGGLE TEMPLATES */
ips.templates.set('core.forms.toggle', " \
	<span class='ipsToggle {{className}}' id='{{id}}' tabindex='0'>\
		<span data-role='status'>{{status}}</span>\
	</span>\
");

/* TREES */
ips.templates.set('core.trees.childWrapper', " \
	{{{content}}}\
");

ips.templates.set('core.trees.loadingRow', " \
	<ol class='ipsTree'><li class='ipsTree_loadingRow ipsLoading_tiny'>{{#lang}}loading{{/lang}}</li></ol>\
");

ips.templates.set('core.trees.loadingPane', " \
	<div class='ipsLoading' style='height: 150px'>&nbsp;</div>\
");

ips.templates.set('core.trees.noRows', " \
	<div class='ipsType_center ipsPad ipsType_light'>{{#lang}}no_results{{/lang}}</div>\
");

/* LIVE SEARCH */
ips.templates.set('core.livesearch.noResults', " \
	<li class='ipsType_center ipsPad ipsType_light ipsType_normal' data-role='result'>\
		<br><br>\
	</li>\
");

/* LANGUAGES */
ips.templates.set('languages.translateString', " \
	<div class='cTranslateTable_field'>\
		<textarea>{{value}}</textarea>\
		<a href='#' data-action='saveWords' tabindex='-1' class='ipsButton ipsButton_positive ipsButton_verySmall ipsButton_narrow'><i class='fa fa-check'></i> {{#lang}}languageSave{{/lang}}</a>\
	</div>\
");