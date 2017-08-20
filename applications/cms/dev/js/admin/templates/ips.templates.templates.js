/* TEMPLATE EDITOR TEMPLATES */
/* TEMPLATECEPTION */
ips.templates.set('templates.editor.newTab', " \
	<li data-fileid='{{fileid}}' data-location='{{location}}'>\
		<a href='#' class='ipsTabs_item' id='{{id}}'>{{title}} <span data-action='closeTab'><i class='fa fa-times'></i></span></a>\
	</li>\
");

ips.templates.set('templates.editor.tabPanel', " \
	<div data-fileid='{{fileid}}' id='ipsTabs_elTemplateEditor_tabbar_tab_{{fileid}}_panel' class='ipsTabs_panel' style='display: none' data-location='{{location}}' data-type='{{type}}' data-group='{{group}}' data-name='{{name}}' data-type='{{type}}' data-itemID='{{id}}' data-inherited-value='{{inherited}}'>\
		{{{content}}}\
	</div>\
");

ips.templates.set('templates.editor.tabContent', " \
	<input data-role='group' type='hidden' name='group_{{fileid}}' value=\"{{{group}}}\">\
	<input data-role='variables' type='hidden' name='variables_{{fileid}}' value=\"{{{variables}}}\">\
	<input data-role='title' type='hidden' name='title_{{fileid}}' value=\"{{{title}}}\">\
	<input data-role='description' type='hidden' name='description_{{fileid}}' value=\"{{{description}}}\">\
	<textarea data-fileid='{{fileid}}' id='editor_{{fileid}}'>{{{content}}}</textarea>\
");

ips.templates.set('templates.editor.unsaved', " \
	<i class='fa fa-circle'></i>\
");

ips.templates.set('templates.editor.saved', " \
	<i class='fa fa-times'></i>\
");