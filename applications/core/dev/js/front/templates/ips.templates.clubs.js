ips.templates.set('club.request.approve', "\
	<span class='cClubRequestCover_icon ipsAreaBackground_positive'>\
		<i class='fa fa-check'></i>\
	</span>\
	<br>\
	<span class='ipsBadge ipsBadge_large ipsBadge_positive'>Request Approved</span>\
");

ips.templates.set('club.request.decline', "\
	<span class='cClubRequestCover_icon ipsAreaBackground_negative'>\
		<i class='fa fa-times'></i>\
	</span>\
	<br>\
	<span class='ipsBadge ipsBadge_large ipsBadge_negative'>Request Denied</span>\
");