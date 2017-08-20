ips.templates.set('follow.frequency', "\
	{{#hasNotifications}}\
		<i class='fa fa-bell'></i>\
	{{/hasNotifications}}\
	{{^hasNotifications}}\
		<i class='fa fa-bell-slash-o'></i>\
	{{/hasNotifications}}\
	{{text}}\
");

ips.templates.set('notification.granted', "\
	<div class='ipsAreaBackground_light cNotificationBox'>\
		<div class='ipsPhotoPanel ipsPhotoPanel_tiny ipsAreaBackground_positive ipsPad'>\
			<i class='fa fa-check ipsPos_left ipsType_normal'></i>\
			<div>\
				<span class='ipsType_large'>{{#lang}}notificationsAccepted{{/lang}}</span>\
			</div>\
		</div>\
		<div class='ipsPad'>\
			<p class='ipsType_reset ipsType_medium'>\
				{{#lang}}notificationsAcceptedBlurb{{/lang}}\
			</p>\
		</div>\
	</div>\
");

ips.templates.set('notification.denied', "\
	<div class='ipsAreaBackground_light cNotificationBox'>\
		<div class='ipsPhotoPanel ipsPhotoPanel_tiny ipsAreaBackground_negative ipsPad'>\
			<i class='fa fa-times ipsPos_left ipsType_normal'></i>\
			<div>\
				<span class='ipsType_large'>{{#lang}}notificationsDisabled{{/lang}}</span>\
			</div>\
		</div>\
		<div class='ipsPad'>\
			<p class='ipsType_reset ipsType_medium ipsSpacer_bottom'>\
				{{#lang}}notificationsDisabledBlurb{{/lang}}\
			</p>\
		</div>\
	</div>\
");

ips.templates.set('notification.default', "\
	<div class='ipsAreaBackground_light cNotificationBox'>\
		<div class='ipsPhotoPanel ipsPhotoPanel_tiny ipsAreaBackground ipsPad'>\
			<i class='fa fa-times ipsPos_left ipsType_normal'></i>\
			<div>\
				<span class='ipsType_large'>{{#lang}}notificationsNotSure{{/lang}}</span>\
			</div>\
		</div>\
		<div class='ipsPad'>\
			<p class='ipsType_reset ipsType_medium ipsSpacer_bottom'>\
				{{#lang}}notificationsDefaultBlurb{{/lang}}\
			</p>\
			<button data-action='promptMe' class='ipsButton ipsButton_veryLight ipsButton_fullWidth'>{{#lang}}notificationsAllow{{/lang}}</button>\
			<p class='ipsType_small ipsSpacer_top ipsSpacer_half ipsHide' data-role='promptMessage'>\
				{{#lang}}notificationsAllowPrompt{{/lang}}\
			</p>\
		</div>\
	</div>\
");