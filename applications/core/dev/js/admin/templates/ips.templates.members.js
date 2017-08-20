
ips.templates.set( 'moderatorPermissions.checkUncheckAll', "\
	<li class='ipsFieldRow ipsPad_half ipsClearfix'>\
		<div class='ipsFieldRow_title'>\
		</div>\
		<div class='ipsFieldRow_content'>\
			<ul class='ipsList_inline'>\
				<li><a href='#' data-role='checkAll'>{{#lang}}check_all{{/lang}}</a></li>\
				<li><a href='#' data-role='uncheckAll'>{{#lang}}uncheck_all{{/lang}}</a></li>\
			</ul>\
		</div>\
	</li>\
");