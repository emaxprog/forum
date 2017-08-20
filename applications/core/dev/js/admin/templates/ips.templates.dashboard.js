/* DASHBOARD TEMPLATES */
ips.templates.set('dashboard.widget', " \
	<li id='elWidget_{{key}}' data-widgetKey='{{key}}' data-widgetName='{{name}}' data-widgetBy='{{by}}' style='display: none'>\
		<div class='ipsBox acpWidget_item'>\
			<h2 class='ipsBox_titleBar ipsType_reset'>\
				<ul class='ipsList_reset ipsList_inline acpWidget_tools'>\
					<li>\
						<a href='#' class='acpWidget_reorder ipsJS_show ipsCursor_drag' data-ipsTooltip title='Reorder widget'><i class='fa fa-bars'></i></a>\
					</li>\
					<li>\
						<a href='#' class='acpWidget_close' data-ipsTooltip title='Close widget'><i class='fa fa-times'></i></a>\
					</li>\
				</ul>\
				{{name}} {{#by}}<span class='ipsType_light ipsType_medium ipsType_unbold'>By {{by}}</span>{{/by}}\
			</h2>\
			<div class='ipsPad' data-role='widgetContent'>\
				{{content}}\
			</div>\
		</div>\
	</li>\
");

ips.templates.set('dashboard.menuItem', " \
	<li class='ipsMenu_item' data-ipsMenuValue='{{key}}' data-widgetName='{{name}}' data-widgetBy='{{by}}'>\
		<a href='#'>{{name}}</a>\
	</li>\
");