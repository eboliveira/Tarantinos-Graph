(function($){
	$(document).ready(function(){
		/* Detect IE version 11 or below */
		function detectIE() {
		  var ua = window.navigator.userAgent;
			var os = window.navigator.appVersion;

			// If Windows 7
			if ( (os.indexOf("Windows NT 7.0") != -1) || (os.indexOf("Windows NT 6.1") != -1) ) {

				// If Internet Explorer 11
				if(ua.indexOf('MSIE ') != -1 || ua.indexOf('Trident/') != -1){
					return true;
				}
			}

		  return false;
		}

		if(detectIE()){
			$('#ie-advisory').show();
		}
	});
})(window.jQuery);
