﻿CKEDITOR.plugins.add("ipsimage",{icons:"ipsimage",hidpi:!0,init:function(c){c.addCommand("ipsImage",{allowedContent:"img",exec:function(a){var b=a.getSelection().getSelectedElement(),c="",e=getComputedStyle(b.$,null).getPropertyValue("float");"A"===b.$.parentNode.tagName&&(c=b.$.parentNode.href,e=getComputedStyle(b.$.parentNode,null).getPropertyValue("float"));var g=b.$.alt;Debug.log(b.$);var d=parseInt(getComputedStyle(b.$,null).getPropertyValue("border-left-width").replace("px","")),h=parseInt(getComputedStyle(b.$,
null).getPropertyValue("margin-left").replace("px","")),f=parseInt(getComputedStyle(b.$,null).getPropertyValue("padding-left").replace("px",""));a={editorId:a.name,actualWidth:b.$.naturalWidth,actualHeight:b.$.naturalHeight,width:b.$.width+2*(d+f),height:b.$.height+2*(d+f),border:d,margin:h,"float":e,link:c,imageAlt:g};Debug.log(a);a="?app\x3dcore\x26module\x3dsystem\x26controller\x3deditor\x26do\x3dimage\x26"+$.param(a);ips.ui.dialog.create({title:ips.getString("editorImageButton"),fixed:!1,size:"narrow",
url:a,destructOnClose:!0}).show()}});c.on("doubleclick",function(a){a=CKEDITOR.plugins.ipslink.getSelectedLink(c)||a.data.element;!a.isReadOnly()&&a.is("img")&&(c.getSelection().selectElement(a),c.execCommand("ipsImage"))});c.contextMenu&&(c.addMenuGroup("ipsImage"),c.addMenuItem("editIpsImage",{label:ips.getString("editorImageButtonEdit"),icon:this.path+"icons"+(CKEDITOR.env.hidpi?"/hidpi":"")+"/ipsimage.png",command:"ipsImage",group:"ipsImage"}),c.contextMenu.addListener(function(a){if(a.getAscendant("img",
!0))return{editIpsImage:CKEDITOR.TRISTATE_OFF}}))}});