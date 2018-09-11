var amcnPlatform = amcnPlatform || {};

// register intercept module
amcnPlatform.namespace('amcnPlatform.module.intercept');
amcnPlatform.module.intercept = (function(){

	var init = function(response){
		console.log('%c //////// intercept | init //////// ', 'background-color:#c30058; color:#ffffff');

		var listeners = eventListeners();
		$pdk.controller.addEventListener('amcn.pdk.events.OnSetVideoValues', listeners.OnSetVideoValues, '*');

		if( !($pdk.isIOS || $pdk.isAndroid) || (typeof amcnInterceptConfig === 'undefined') || jQuery.cookie("amcn_pdk_intercept")){
			console.log('%c //////// intercept | complete //////// ', 'background-color:#c30058; color:#ffffff');
			$pdk.controller.dispatchEvent('OnInterceptComplete', {type: 'intercept', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
		}
		else if( amcnInterceptConfig.intercept === false ){
			console.log('%c //////// intercept | bypass //////// ', 'background-color:#c30058; color:#ffffff');
			$pdk.controller.dispatchEvent('OnInterceptComplete', {type: 'intercept', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
		}
		else{
			console.log('%c //////// intercept | show //////// ', 'background-color:#c30058; color:#ffffff');
			showIntercept();
		}
	};

	// return player instance for data usage
	var getPlayerInstance = function(instance){
		if(typeof amcnPlatformPlayers[instance] !== 'undefined'){
			return amcnPlatformPlayers[instance];
		}
		else{
			throw 'Undefined player instance ['+instance+']';
		}
	};

	var showIntercept = function(){
		console.log('%c //////// intercept | create intercept //////// ', 'background-color:#c30058; color:#ffffff');
		var fallbackMessage = 'Unfortunately it appears that you are using an unsupported device. Please try switching to a different device or desktop browser.';
		var clickthrough = (typeof amcnInterceptConfig.clickthrough != 'undefined' ) ? '<a href="" class="dismiss">'+amcnInterceptConfig.clickthrough+'</a>' : '';

		if($pdk.isIOS && typeof amcnInterceptConfig.message.iOS != 'undefined'){
			var message = amcnInterceptConfig.message.iOS;
		}
		else if($pdk.isAndroid && typeof amcnInterceptConfig.message.android != 'undefined'){
			var message = amcnInterceptConfig.message.android;
		}
		else if(!($pdk.isIOS || $pdk.isAndroid) && typeof amcnInterceptConfig.message.default != 'undefined' ){
			var message = amcnInterceptConfig.message.default;
		}
		else{
			var message = (typeof amcnInterceptConfig.message != 'undefined' && typeof amcnInterceptConfig.message === "string") ? amcnInterceptConfig.message : fallbackMessage;
		}

		var intercept = '<div id="platform-intercept">' +
							'<div class="intercept-message">' +
								'<p>'+message+'</p>' +
								'<p>'+clickthrough+'</p>'+
							'</div>';
						'</div>';
		
		jQuery('.platform-container').prepend(intercept);
	};

	var hideIntercept = function(){
		var players = amcnPlatform.core.handler.getStoredPlayers();
		for(var i = 0; i < players.length; i++){
			var playerConfig = players[i].getConfig();
			var playerInstance = playerConfig.instance;

			$pdk.controller.dispatchEvent('OnInterceptComplete', {type: 'intercept', set: true, players: [playerInstance]}, [playerInstance]);
		}
		jQuery('#platform-intercept').remove();
	};

	var eventListeners = function(){
		var longform = ['TVE-Auth', 'TVE-Unauth'];
		var movies = ['Movies-Auth', 'Movies-Unauth'];

		// asset load event listener - sets video object values for reuse
		var OnSetVideoValues = function(response){
			try{
				var player = getPlayerInstance(response.data.player.instance);
				var playerConfig = player.getConfig();

				// if player is Live Stream and playback has been whitelisted in config, hide intercept
				if(playerConfig.settings.video.details.isLivestream === true && amcnInterceptConfig.playLivestream === true){
					console.log('%c //////// intercept | dismiss livestream intercept //////// ', 'background-color:#c30058; color:#ffffff');
					amcnPlatform.module.intercept.hideIntercept();
				}
				// if video is Shortform, and playback has been whitelisted in config, hide intercept
				if(playerConfig.settings.video.details.custom.videoCategory === 'Shortform' && amcnInterceptConfig.playShortform === true){
					console.log('%c //////// intercept | dismiss shortform intercept //////// ', 'background-color:#c30058; color:#ffffff');
					amcnPlatform.module.intercept.hideIntercept();
				}
				// if video is Longform, and playback has been whitelisted in config, hide intercept
				if((longform.indexOf(playerConfig.settings.video.details.custom.videoCategory) > -1) && amcnInterceptConfig.playLongform === true){
					console.log('%c //////// intercept | dismiss longform intercept //////// ', 'background-color:#c30058; color:#ffffff');
					amcnPlatform.module.intercept.hideIntercept();
				}
				// if video is a movie, and playback has been whitelisted in config, hide intercept
				if((movies.indexOf(playerConfig.settings.video.details.custom.videoCategory) > -1) && amcnInterceptConfig.playMovies === true){
					console.log('%c //////// intercept | dismiss movie intercept //////// ', 'background-color:#c30058; color:#ffffff');
					amcnPlatform.module.intercept.hideIntercept();
				}
			}
			catch(e){
				console.log('%c INTERCEPT ERROR (OnMediaPlaying): ', e, '', response.data.player.instance);
			}
		};

		return {
			OnSetVideoValues: OnSetVideoValues,
		};
	};
	
	return {
		init: init,
		showIntercept: showIntercept,
		hideIntercept: hideIntercept
	};
}());

// register intercept module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.intercept.init);

// register listener
jQuery(document).on('click', '.dismiss', function(event){
	console.log('%c //////// intercept | dismiss intercept //////// ', 'background-color:#c30058; color:#ffffff');
	event.preventDefault();
	// set cookie for return visitors
	if( amcnInterceptConfig.cookie === true ){
		jQuery.cookie("amcn_pdk_intercept", 1, { expires : 7 });
	}
	amcnPlatform.module.intercept.hideIntercept();
});