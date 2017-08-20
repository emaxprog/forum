/* VIEW TEMPLATES */
ips.templates.set('messages.view.placeholder', " \
<div class='ipsType_center ipsType_large cMessageView_inactive ipsEmpty'>\
	<i class='fa fa-envelope'></i><br>\
	{{#lang}}no_message_selected{{/lang}}\
</div>\
");

ips.templates.set('messages.main.folderMenu', "\
<li class='ipsMenu_item' data-ipsMenuValue='{{key}}'><a href='#'><span class='ipsMenu_itemCount'>{{count}}</span> <span data-role='folderName'>{{name}}</span></a></li>\
");