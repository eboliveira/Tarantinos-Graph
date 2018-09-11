
function toggle_facebook(e){
	var $ = jQuery.noConflict();
	e.preventDefault();

	$('.amcn-share').hide();
	$('.facebook-share').show();
}

function toggle_embed(e){
	var $ = jQuery.noConflict();
	e.preventDefault();

	$('.amcn-iframe-share').toggleClass('active');
}


function close_window(e) {
	var $ =jQuery.noConflict();
	e.preventDefault();

	$('.facebook-share').hide();
	$('.amcn-share').show();
}