
var UA = navigator.userAgent;
var app_type;
var banner_cookie = getCookie('app-banner');
var link_iOS = 'https://itunes.apple.com/us/app/watch-ifc/id1061473874';
var link_android = 'https://play.google.com/store/apps/details?id=com.ifc.ifcapp';
//var link_windows = '';


function getCookie(name){
	var parse = new RegExp(name + "=([^;]+)");
	var cookie_value = ( parse.exec(document.cookie) );
	return (cookie_value != null) ? unescape(cookie_value[1]) : null;
}

jQuery(document).ready(function(){
	// iOS devices + Chrome
	/*
	if( ( UA.match(/iPhone|iPad|iPod/i) != null ) && (UA.match(/CriOS/i) != null ) ) {
		app_type = 'iOS';
		jQuery( ".banner-launch a").attr("href", link_iOS );
	}
	*/
	// Android
	if (UA.match(/Android/i) != null) {
		app_type = 'android';
		jQuery(".banner-launch a").attr("href", link_android );
	}

	if( ( app_type == 'iOS' || app_type == 'android' ) && ( banner_cookie != 'dismissed' ) ) {
		jQuery("#amcn-app-banner").delay(3000).queue(function(){
			jQuery(this).addClass("animate").dequeue();
			jQuery("#mso-nav").addClass("app-banner");
		});
	}

	jQuery(".banner-close").click(function(){
		jQuery.cookie("app-banner", 'dismissed');
		jQuery("#amcn-app-banner").removeClass("animate");
		jQuery("#mso-nav").removeClass("app-banner");
	});
});