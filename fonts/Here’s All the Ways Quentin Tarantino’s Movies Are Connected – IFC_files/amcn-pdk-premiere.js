var amcnPlatform = amcnPlatform || {};

// register premiere module
amcnPlatform.namespace('amcnPlatform.module.premiere');
amcnPlatform.module.premiere = (function(){

	var init = function(response){
		console.log('%c //////// premiere | init //////// ', 'background-color:gold; color:black');

		var publishStateCookie = amcnPlatformConfig.network + '-tve-publish_state';
		publishState = (jQuery.cookie(publishStateCookie) != 'undefined') ? jQuery.cookie(publishStateCookie) : 'public';

		var listeners = eventListeners();
		$pdk.controller.addEventListener('amcn.pdk.events.OnSetVideoValues', listeners.OnSetVideoValues, '*');
		$pdk.controller.addEventListener('amcn.pdk.events.triggerUserState', listeners.triggerUserState, '*');

		if( (typeof premiereConfig === 'undefined') || premiereConfig.premiereEnabled === false ){
			console.log('%c //////// premiere | disabled //////// ', 'background-color:gold; color:black');
			$pdk.controller.dispatchEvent('OnPremiereComplete', {type: 'premiere', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
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

	var premiereOverlayShow = function(messageType){
		console.log('%c //////// premiere | show overlay //////// ', 'background-color:gold; color:black', premiereConfig);

		if(messageType == 'restricted'){
			var message = premiereConfig.message.restricted;
		}
		else if(messageType == 'pre'){
			var message = premiereConfig.message.pre;
		}
		else{
			var message = premiereConfig.message.default;
		}

		var intercept = '<div id="platform-intercept" class="restricted">' +
							'<div class="intercept-message">' +
								'<p>'+message+'</p>' +
							'</div>';
						'</div>';
		
		jQuery('.platform-container').prepend(intercept);
	};

	var eventListeners = function(){

		// asset load event listener - sets video object values for reuse
		var OnSetVideoValues = function(response){
			try{
				var player = getPlayerInstance(response.data.player.instance);
				//var playerConfig = player.getConfig();
				//var videoCustomValues = playerConfig.settings.video.details.custom;
				var timestamp = + new Date() / 1000;
				var restricted_end = Number(amcnVideo.settings.video.restricted_end);
				var restricted_start = Number(amcnVideo.settings.video.restricted_start);

				if(publishState != 'restricted' && timestamp < restricted_end){
					console.log('were public and in the restricted window');
					console.log('%c //////// premiere | restricted window //////// ', 'background-color:gold; color:black');
					amcnPlatform.module.premiere.premiereOverlayShow('restricted');
				} 
				else if(publishState == 'restricted' && timestamp < restricted_start){
					console.log('were restricted and restricted start hasnt started');
					console.log('%c //////// premiere | pre restricted //////// ', 'background-color:gold; color:black');
					amcnPlatform.module.premiere.premiereOverlayShow('pre');

				}


				/*
				if(videoCustomValues.restrictedAvailableDate < timestamp && publishState == 'restricted'){
					console.log('%c //////// premiere | Premiere video available //////// ', 'background-color:gold; color:black');
					$pdk.controller.dispatchEvent('OnPremiereComplete', {type: 'premiere', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
				}
				else if(videoCustomValues.publicAvailableDate < timestamp){
					console.log('%c //////// premiere | TVE video available //////// ', 'background-color:gold; color:black');
					$pdk.controller.dispatchEvent('OnPremiereComplete', {type: 'premiere', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
				}
				else if(publishState == 'public' && (videoCustomValues.publicAvailableDate > timestamp || typeof videoCustomValues.publicAvailableDate === 'undefined')){
					console.log('%c //////// premiere | restricted window //////// ', 'background-color:gold; color:black');
					amcnPlatform.module.premiere.premiereOverlayShow('restricted');
				}
				else if(videoCustomValues.restrictedAvailableDate > timestamp){
					console.log('%c //////// premiere | video not available //////// ', 'background-color:gold; color:black');
					amcnPlatform.module.premiere.premiereOverlayShow('pre');
				}
				else if(videoCustomValues.videoName == 'AMC Live Stream' ){
					console.log('%c //////// premiere | TVE video available //////// ', 'background-color:gold; color:black');
					$pdk.controller.dispatchEvent('OnPremiereComplete', {type: 'premiere', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);
				}
				*/


			}
			catch(e){
				console.log('%c AMCP ERROR (OnMediaPlaying): ', e, '', response.data.player.instance);
			}
		};

		var triggerUserState = function(response){
			console.log('%c //////// premiere | trigger user stage //////// ', 'background-color:gold; color:black', response);
		};

		return {
			OnSetVideoValues: OnSetVideoValues,
			triggerUserState: triggerUserState
		};
	};
	
	return {
		init: init,
		premiereOverlayShow: premiereOverlayShow,
 	};
}());

// register premiere module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.premiere.init);