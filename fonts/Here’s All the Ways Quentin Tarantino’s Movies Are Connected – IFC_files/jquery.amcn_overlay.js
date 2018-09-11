/**
 * jQuery plugin for launching an overlay. AMCN specific so intercept
 * can be disabled as a whole at once.
 */
;(function($) {

	/**
	 * Launches the fancybox as this is called, immediately.
	 * @params fancybox parameters. You should call the object
	 * by setting content and such.
	 */
	$.amcn_launchOverlay = function(params) {
		try {
			var anchor =  $('<a href="#" style="display:none">&nsbp;</a>').fancybox(params);
			if(typeof amcn_intercept_vars.enabled != 'undefined' && amcn_intercept_vars.enabled) {
				var amcn_interval = setInterval(function(){
					if(!amcn_intercept_vars.suppress_overlay) {
						clearInterval(amcn_interval);
						anchor.click();
					}
				}, 200);
			}
			else {
				anchor.click();
			}
		}
		catch(t) {
			if(window.console)
				console.log(t);
		}
	};

})(jQuery);