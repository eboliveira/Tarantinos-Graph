var amcnInterceptConfig = {
	intercept: true,
	cookie: false,
	playLivestream: true, // Allow livestream playback; Note: intercept is also hidden by css in _video-player.scss.
	playShortform: true, // Note: intercept is also hidden by css in _video-player.scss.
	playLongform: false,
	playMovies: false,
	message: {
		default: ('To view full episodes on your device, download the IFC app for <a href="https://itunes.apple.com/us/app/watch-ifc/id1061473874" class="amcn_intercept_ios_app">iOS</a> or <a href="https://play.google.com/store/apps/details?id=com.ifc.ifcapp" class="amcn_intercept_android_app">Android</a>.'),
		iOS: ('To view full episodes on your device, download the <a href="https://itunes.apple.com/us/app/watch-ifc/id1061473874" class="amcn_intercept_ios_app">IFC app</a> for iPhone and iPad.'),
		android: ('To view full episodes on your device, download the <a href="https://play.google.com/store/apps/details?id=com.ifc.ifcapp" class="amcn_intercept_android_app">IFC app</a> for Android.')
	},
	clickthrough: ('Just play video')
};

(function($){
	/* Click Event: Player Intercept - launch iOS app store */
	$(document).on('click', '#platform-intercept .amcn_intercept_ios_app', function(){
	    _ca.trackEvent2({
	      'category':'player_intercept',
	      'action': 'itunes_app_store',
	      'label': 'download_app_link'
	    });
	});

	/* Click Event: Player Intercept - launch Google Play store */
	$(document).on('click', '#platform-intercept .amcn_intercept_android_app', function(){
	    _ca.trackEvent2({
	      'category':'player_intercept',
	      'action': 'google_play_store',
	      'label': 'download_app_link'
	    });
	});

	/* Click Event: Player Intercept - dismiss app promotion */
	$(document).on('click', '#platform-intercept .dismiss', function(){
	    _ca.trackEvent2({
	      'category':'player_intercept',
	      'action': 'dismiss_clickthrough',
	      'label': 'download_app_link'
	    });
	});

})(window.jQuery);