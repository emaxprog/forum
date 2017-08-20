ips.templates.set( 'templates.media.grid', "\
	<ul class='ipsGrid' data-ipsGrid data-ipsGrid-minItemSize='100' data-ipsGrid-maxItemSize='200'>\
		{{{contents}}}\
	</ul>\
");

ips.templates.set( 'templates.media.noItems', "\
	<div class='ipsType_center ipsType_large ipsType_light ipsPad_double'>\
		{{#lang}}mediaEmptyFolder{{/lang}}\
	</div>\
");

ips.templates.set( 'templates.media.noSearchResults', "\
	<div class='ipsType_center ipsType_large ipsType_light ipsPad_double'>\
		{{#lang}}mediaNoResults{{/lang}}\
	</div>\
");