ips.templates.set('core.streams.teaser', "\
	<li data-action='insertNewItems' class='ipsStreamItem_loadMore' style='display: none'>\
		<button class='ipsButton ipsButton_light ipsButton_fullWidth ipsButton_medium'>{{{words}}}</button>\
	</li>\
");

ips.templates.set('core.streams.unreadBar', "\
	<li data-role='unreadBar' class='ipsStreamItem_bar'><hr class='ipsHr'></li>\
");

ips.templates.set('core.streams.noMore', "\
	<li class='ipsType_center ipsType_light ipsType_medium ipsPad' data-role=\"loadMoreContainer\">\
		{{#lang}}noMoreActivity{{/lang}}\
	</li>\
");

ips.templates.set('core.streams.loadMore', "\
	<a href='#' class='ipsButton ipsButton_light ipsButton_small' data-action='loadMore'>{{#lang}}loadNewActivity{{/lang}}</a>\
");