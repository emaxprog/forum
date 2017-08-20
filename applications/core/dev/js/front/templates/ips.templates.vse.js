/* CLASS LIST TEMPLATES */
ips.templates.set('vse.classes.title', " \
<li class='ipsToolbox_sectionTitle ipsType_reset' data-role='{{role}}'>{{title}}</li>\
");

ips.templates.set('vse.classes.item', " \
<li data-styleID='{{styleid}}'>\
	<a href='#'>\
		<span class='vseClass_swatch' style='{{swatch.main}}'>{{#swatch.sub}}<span class='vseClass_swatch' style='{{swatch.sub}}'></span>{{/swatch.sub}}</span>{{title}}\
	</a>\
</li>\
");

ips.templates.set('vse.panels.header', " \
	<h2 class='ipsType_sectionHead'>{{title}}</h2>\
	{{#desc}}\
		<p class='ipsType_reset ipsType_light ipsType_small'>\
			{{desc}}\
		</p>\
	{{/desc}}\
	<br>\
");

ips.templates.set('vse.panels.wrapper', " \
	<div class='vseStyleSection' data-role='{{type}}Panel'>\
		{{{content}}}\
	</div>\
");

ips.templates.set('vse.panels.background', " \
	<h3>{{#lang}}vseBackground{{/lang}}</h3>\
	<div data-role='backgroundControls' class='ipsGrid'>\
		<div class='ipsGrid_span3'>\
			<div data-role='backgroundPreview' class='vseBackground_preview'>&nbsp;</div>\
		</div>\
		<div class='ipsGrid_span9'>\
			<input type='text' class='ipsField_fullWidth color vseBackground_color' data-role='backgroundColor' value='{{backgroundColor}}'>\
			<br>\
			<div class='ipsGrid'>\
				<!--<div class='ipsGrid_span6'>\
					<button data-ipsTooltip title='{{#lang}}vseBackground_image{{/lang}}' class='ipsButton ipsButton_primary ipsButton_verySmall ipsButton_fullWidth ipsType_center ipsType_large'><i class='fa fa-picture-o'></i></button>\
				</div>-->\
				<div class='ipsGrid_span6'>\
					<button data-ipsTooltip title='{{#lang}}vseBackground_gradient{{/lang}}' data-action='launchGradientEditor' class='ipsButton ipsButton_primary ipsButton_verySmall ipsButton_fullWidth ipsType_center ipsType_large'><i class='fa fa-barcode'></i></button>\
				</div>\
			</div>\
		</div>\
	</div>\
");

ips.templates.set('vse.panels.font', " \
	<h3>{{#lang}}vseFont_color{{/lang}}</h3>\
	<input type='text' class='ipsField_fullWidth color' data-role='fontColor' value='{{fontColor}}'>\
");

ips.templates.set('vse.gradient.editor', " \
	<div data-role='gradientPreview' class='vseBackground_gradient'></div>\
	<div class='ipsGrid'>\
		<button data-action='gradientAngle' data-angle='90' class='ipsButton ipsButton_primary ipsButton_verySmall ipsGrid_span3'>\
				<i class='fa fa-arrow-down'></i>\
		</button>\
		<button data-action='gradientAngle' data-angle='0' class='ipsButton ipsButton_primary ipsButton_verySmall ipsGrid_span3'>\
			<i class='fa fa-arrow-left'></i>\
		</button>\
		<button data-action='gradientAngle' data-angle='45' class='ipsButton ipsButton_primary ipsButton_verySmall ipsGrid_span3'>\
			<i class='fa fa-arrow-up'></i>\
		</button>\
		<button data-action='gradientAngle' data-angle='120' class='ipsButton ipsButton_primary ipsButton_verySmall ipsGrid_span3'>\
			<i class='fa fa-arrow-right'></i>\
		</button>\
	</div>\
	<hr class='ipsHr'>\
	<ul class='ipsList_reset' data-role='gradientStops'>\
		<li class='ipsGrid'>\
			<p class='ipsType_reset ipsGrid_span1'>&nbsp;</p>\
			<p class='ipsType_reset ipsType_light ipsType_small ipsGrid_span5'>{{#lang}}vseGradient_color{{/lang}}</p>\
			<p class='ipsType_reset ipsType_light ipsType_small ipsGrid_span6'>{{#lang}}vseGradient_position{{/lang}}</p>\
		</li>\
		<li class='ipsGrid'>\
			<p class='ipsType_reset ipsGrid_span1'>&nbsp;</p>\
			<p class='ipsType_reset ipsGrid_span11'><a href='#' class='ipsType_medium' data-action='gradientAddStop'>{{#lang}}vseAddStop{{/lang}}</a></p>\
		</li>\
	</ul>\
	<hr class='ipsHr'>\
	<div class='ipsGrid'>\
		{{{buttons}}}\
	</div>\
");

ips.templates.set('vse.gradient.twoButtons', "\
	<button data-action='saveGradient' class='ipsGrid_span8 ipsButton ipsButton_normal ipsButton_verySmall ipsButton_fullWidth'>{{#lang}}vseGradient_save{{/lang}}</button>\
	<button data-action='cancelGradient' class='ipsGrid_span4 ipsButton ipsButton_normal ipsButton_verySmall ipsButton_fullWidth'>{{#lang}}vseCancel{{/lang}}</button>\
");

ips.templates.set('vse.gradient.threeButtons', "\
	<button data-action='saveGradient' class='ipsGrid_span4 ipsButton ipsButton_normal ipsButton_verySmall ipsButton_fullWidth'>{{#lang}}vseSave{{/lang}}</button>\
	<button data-action='cancelGradient' class='ipsGrid_span4 ipsButton ipsButton_normal ipsButton_verySmall ipsButton_fullWidth'>{{#lang}}vseCancel{{/lang}}</button>\
	<button data-action='removeGradient' class='ipsGrid_span4 ipsButton ipsButton_important ipsButton_verySmall ipsButton_fullWidth'>{{#lang}}vseDelete{{/lang}}</button>\
");

ips.templates.set('vse.gradient.stop', " \
	<li class='ipsGrid'>\
		<span class='ipsGrid_span1 ipsType_light ipsType_center'><i class='fa fa-bars'></i></span>\
		<input type='text' class='ipsGrid_span5' value='{{color}}' maxlength='6' pattern='^([0-9a-zA-Z]{6})$'>\
		<input type='range' class='ipsGrid_span5' min='0' max='100' value='{{location}}'>\
		<p class='ipsType_reset ipsType_center ipsGrid_span1'><a href='#' data-action='gradientRemoveStop'><i class='fa fa-times'></i></a></p>\
	</li>\
");

ips.templates.set('vse.colorizer.panel', " \
	<p class='ipsType_light ipsPad'>\
		{{#lang}}vseColorizer_desc{{/lang}}\
	</p>\
	<div class='ipsPad'>\
		<div class='ipsGrid'>\
			<div class='ipsGrid_span1'></div>\
			<div class='ipsGrid_span4 ipsType_center'>\
				<input type='text' class='vseColorizer_swatch color' data-role='primaryColor' value='{{primaryColor}}'>\
				<span class='ipsType_light'>{{#lang}}vseColorizer_primary{{/lang}}</span>\
			</div>\
			<div class='ipsGrid_span2'></div>\
			<div class='ipsGrid_span4 ipsType_center'>\
				<input type='text' class='vseColorizer_swatch color' data-role='secondaryColor' value='{{secondaryColor}}'>\
				<span class='ipsType_light'>{{#lang}}vseColorizer_secondary{{/lang}}</span>\
			</div>\
			<div class='ipsGrid_span1'></div>\
		</div>\
		<br>\
		<div class='ipsGrid'>\
			<div class='ipsGrid_span1'></div>\
			<div class='ipsGrid_span4 ipsType_center'>\
				<input type='text' class='vseColorizer_swatch color' data-role='tertiaryColor' value='{{tertiaryColor}}'>\
				<span class='ipsType_light'>{{#lang}}vseColorizer_tertiary{{/lang}}</span>\
			</div>\
			<div class='ipsGrid_span2'></div>\
			<div class='ipsGrid_span4 ipsType_center'>\
				<input type='text' class='vseColorizer_swatch color' data-role='textColor' value='{{textColor}}'>\
				<span class='ipsType_light'>{{#lang}}vseColorizer_text{{/lang}}</span>\
			</div>\
			<div class='ipsGrid_span1'></div>\
		</div>\
		<br><br>\
		<button class='ipsButton ipsButton_normal ipsButton_small ipsButton_fullWidth' data-action='revertColorizer' disabled>{{#lang}}vseColorizer_revert{{/lang}}</button>\
	</div>\
");