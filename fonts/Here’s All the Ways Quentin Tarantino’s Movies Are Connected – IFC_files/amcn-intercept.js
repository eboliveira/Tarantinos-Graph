console.log(amcn_intercept_vars);
function amcnGUP( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results === null )
    return "";
  else
    return results[1];
}

function amcnInterceptOverlay(mso) {

	(function($){

		var data = {
			mso : mso
		};

		if(amcnGUP('QA') && amcnGUP('post-drop'))
			data.postDrop = true;

		$.getJSON(amcn_intercept_vars.amcn_intercept_content_url, data, function(json){

			if(!amcnGUP('QA')){
				var duration = json.cookieData.duration ? json.cookieData.duration : 24;
				var cookieDate = new Date();
				cookieDate.setHours(cookieDate.getHours()+duration);
				$.cookie(amcn_intercept_vars.cookie_id, 'true', {expires: cookieDate, path: '/', 'domain' : amcn_intercept_cookie_domain});
			}

			if(json.success) {

				console.log('Intercept Loaded');

				var hidden_link = $('<a class="amcn-intercept" style="display:none;">AMCN Intercept</a>').appendTo('body');
				hidden_link.fancybox({
					'content' : json.content,
					'padding' : 0,
					'margin' : 0,
					'showCloseButton' : true,
					'centerOnScroll' : false,
					'scrolling' : 'no',
					'overlayColor' : "#000",
					'height' : 580,
					'width' : 800,
					'fitToView' : false,
					'onComplete' : function() {
						if($("#counter-wrapper").length > 0)
							countdown(json.dropdate.year, json.dropdate.month, json.dropdate.day, json.dropdate.hour);

						_ca.trackEvent({
							'action': json.ga.event_action,
							'label': json.ga.event_label
						});

						/* keep-messaging */
						/*$(window).resize(function(){
							$.fancybox.center();
							onCustomResize();
						});

						function onCustomResize() {
							var e = $('.amcn-intercept');
							e.css({'width': json.width + 'px', 'height': json.height + 'px' });
							var w = e.outerWidth();
							var h = e.outerHeight();
							var left = ($(window).width() - w)/2 > 0 ? ($(window).width() - w)/2 : '';
							var top = ($(window).height() - h)/2 ? ($(window).height() - h)/2 : ($(window).height())/2;
							$("#fancybox-inner").css({'width': w + 'px', 'height': h + 'px'});
							$("#fancybox-wrap").css({'left' : left + 'px', 'top' : top + 'px', 'z-index' : '10000'})
						}*/

					    $("#fancybox-wrap").addClass('iframe-position');

					    if(window.location.href.indexOf("watch-now") > -1) {
						   $("#fancybox-wrap").addClass('intercept-tve');
					       console.log("on full episodes");
					    }

					    /* //keep-messaging */

					}
				}).click();
			}
		});
	})(jQuery);
}

function amcnInterceptISPSniffer(res) {
	(function($){
		// check if this is QA
		if(amcnGUP('QA')) {
			amcnInterceptOverlay(amcnGUP('QA'));
			return;
		}

		if (res.ok === false)
			amcnInterceptOverlay(res.isp);
		else {
			amcn_intercept_vars.suppress_overlay = false;
			amcn_intercept_vars.enabled = false;
		}

	})(jQuery);
}

(function($){
	$(function(){
		try {

			// break if viewport is below certain size.
			/*if($(window).width() <= 450 || $(window).height() <= 225) {
				amcn_intercept_vars.suppress_overlay = false;
				return false;
			}*/

			var amcnInterceptCookie = $.cookie(amcn_intercept_vars.cookie_id);

			if(amcnGUP('QA')) {
				amcnInterceptOverlay(amcnGUP('QA'));
			}
			else if (amcnInterceptCookie === null || amcnInterceptCookie === false || amcnInterceptCookie == undefined){
				var testIP = amcnGUP('testip') ? '?testip=' + amcnGUP('testip') : '';
				$.ajax({
					url: '//score.svc.ds.amcn.com/cgi-bin/true-ip.cgi' + testIP,
					dataType: 'jsonp',
					cache: true,
					jsonpCallback: 'amcnInterceptISPSniffer'
				});
			}
			else {
				amcn_intercept_vars.suppress_overlay = false;
				amcn_intercept_vars.enabled = false;
			}
		}
		catch(t) {
			if(window.console)
				console.log(t);
		}
	});
})(jQuery);