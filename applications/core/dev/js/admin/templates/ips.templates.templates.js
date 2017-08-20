/* TEMPLATE EDITOR TEMPLATES */
/* TEMPLATECEPTION */
ips.templates.set('templates.editor.newTab', " \
	<li data-fileid='{{fileid}}'>\
		<a href='#' class='ipsTabs_item' id='{{id}}'>{{title}} <span data-action='closeTab'><i class='fa fa-times'></i></span></a>\
	</li>\
");

ips.templates.set('templates.editor.tabPanel', " \
	<div data-fileid='{{fileid}}' id='ipsTabs_elTemplateEditor_tabbar_tab_{{fileid}}_panel' class='ipsTabs_panel' style='display: none' data-app='{{app}}' data-location='{{location}}' data-group='{{group}}' data-name='{{name}}' data-type='{{type}}' data-itemID='{{id}}' data-inherited-value='{{inherited}}'>\
		{{{content}}}\
	</div>\
");

ips.templates.set('templates.editor.tabContent', " \
	<input data-role='variables' type='hidden' name='variables_{{fileid}}' value=\"{{{variables}}}\">\
	<textarea data-fileid='{{fileid}}' id='editor_{{fileid}}'>{{{content}}}</textarea>\
");

ips.templates.set('templates.editor.unsaved', " \
	<i class='fa fa-circle'></i>\
");

ips.templates.set('templates.editor.saved', " \
	<i class='fa fa-times'></i>\
");

ips.templates.set('templates.editor.diffHeaders', " \
	<div class='cTemplateMergeHeaders ipsAreaBackground_light'>\
		<div class='cTemplateMergeHeader'>\
			<div class='ipsPad_half'><strong>{{#lang}}theme_diff_original_header{{/lang}}</strong> <span class='ipsType_small ipsType_light'>{{#lang}}theme_diff_original_desc{{/lang}}</span></div>\
		</div>\
		<div class='cTemplateMergeHeader ipsPos_right'>\
			<div class='ipsPad_half'><strong>{{#lang}}theme_diff_custom_header{{/lang}}</strong> <span class='ipsType_small ipsType_light'>{{#lang}}theme_diff_custom_desc{{/lang}}</span></div>\
		</div>\
	</div>\
");
