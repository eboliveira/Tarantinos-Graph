var amcnPDK = {
    video: {},
    releaseSet: false,
    defaultRating: 'PG',
    progress: {
		last: 0,
		increment: 25
	},
    timeoutDisplayed: false,
};
var pdkEvents = {
	registeredEvents: {},

	// attach event listener functions to specific events needed for auth, playback options, etc
	register: function(){
		console.log(' %%%%% pdkEvents register %%%%% ');
		$pdk.controller.addEventListener('OnPlayerLoaded', pdkEvents.eventListeners.onPlayerLoaded, '*');
		$pdk.controller.addEventListener('OnLoadReleaseUrl', pdkEvents.eventListeners.onLoadReleaseUrl, '*');
		$pdk.controller.addEventListener('OnMediaComplete', pdkEvents.eventListeners.onMediaComplete, '*');
		$pdk.controller.addEventListener('OnMediaStart', pdkEvents.eventListeners.onMediaStart, '*');
		$pdk.controller.addEventListener('OnMediaPlaying', pdkEvents.eventListeners.onMediaPlaying, '*');
	},
	// general trigger registration for events
	registerEvents: function(){
		console.log(' %%%%% pdkEvents registerEvents %%%%% ');
		// register events for tracking
		for(var pdkEvent in $pdk.controller._events){
			// store event registration
			var eventType = "amcn.pdk.events."+pdkEvent;
			pdkEvents.registeredEvents[pdkEvent] = eventType;

			// add listener which triggers specific pdk.events.NAME
			$pdk.controller.addEventListener(pdkEvent, function(eventData){
				jQuery(document).trigger("amcn.pdk.events."+eventData.type, eventData);
			}, '*');
		}
	},
	// store the video data, which is stored from the OnLoadReleaseUrl callback
	setVideoValues : function(releaseData){
		console.log(' %%%%% setVideoValues %%%%% ');
		console.log(releaseData);

		// asset settings - retrieved from the release data
		amcnPDK.video.releaseURL = typeof(releaseData.url) !== 'undefined' ? releaseData.url : '';
		amcnPDK.video.videoName = typeof(releaseData.title) !== 'undefined' ? releaseData.title : '';
		amcnPDK.video.videoID = typeof(releaseData.pid) !== 'undefined' ? releaseData.pid : '';
		amcnPDK.video.platformID = typeof(releaseData.id) !== 'undefined' ? releaseData.id : '';
		amcnPDK.video.videoRating = typeof(releaseData.ratings[0]) !== 'undefined' ? releaseData.ratings[0].rating : amcnPDK.defaultRating;
		amcnPDK.video.duration = typeof(releaseData.duration) !== 'undefined' ? releaseData.duration : typeof(releaseData.length) !== 'undefined' ? releaseData.length : 0;

		// loop through customValues of releaseData and merge into video data
		for(var customValue in releaseData.customValues ){
			fieldName = releaseData.customValues[customValue]['fieldName'];
			fieldValue = releaseData.customValues[customValue].value;

			var videoProperties = {};
			videoProperties[fieldName] = fieldValue;
			jQuery.extend(amcnPDK.video, videoProperties);
		}

		amcnPDK.releaseSet = true;
	},
	eventListeners: {
		contentStarted: false,

		// player load event listener
		onPlayerLoaded: function(data){
			console.log(' %%%%% OnPlayerLoaded %%%%% ');
			console.log(data);

			jQuery(document).trigger("amcn.pdk.events.OnPlayerLoaded", data);
		},
		// asset load event listener - needed for Adobe Pass integration
		onLoadReleaseUrl: function(release){
			console.log(' %%%%% OnLoadReleaseUrl %%%%% ');
			console.log(release.data.url);

			// store the release data, used in authorization requests
			pdkEvents.setVideoValues(release.data);
		},
		// complete event listener - for mobile usage to replace end card display
		onMediaComplete: function(clip){
			console.log(' %%%%% OnMediaComplete %%%%% ');
			console.log(clip);

			if(clip.data.title == 'ad' || clip.data.baseClip.isAd){
				// fire the ad complete track event
				jQuery(document).trigger("amcn.pdk.events.adEvent.adComplete", [clip]);
			}
			else{
				// fire the video end event for tracking
				jQuery(document).trigger("amcn.pdk.events.VideoEnd", [clip]);
			}
		},

		// event which fires when media starts, including chapter changes - needed for ad detection
		onMediaStart: function(clip){
			console.log(' %%%%% OnMediaStart %%%%% ');
			console.log(clip);

			if(clip.data.title == 'ad' || clip.data.baseClip.isAd){
				// disable main OnMediaPlaying listener for ads
				$pdk.controller.removeEventListener('OnMediaPlaying', pdkEvents.eventListeners.onMediaPlaying, '*');

				// fire the ad track event
				jQuery(document).trigger("amcn.pdk.events.adEvent.adStart", [clip]);
			}
			else{
				// renable the OnMediaPlaying listener
				$pdk.controller.addEventListener('OnMediaPlaying', pdkEvents.eventListeners.onMediaPlaying, '*');

				// check if this is the first non-ad unit, if so, fire the start event
				if(!pdkEvents.eventListeners.contentStarted){
					jQuery(document).trigger("amcn.pdk.events.VideoStart", [clip]);
					pdkEvents.eventListeners.contentStarted = true;
				}
			}
		},
		// tracking for specified increment of playback
		onMediaPlaying: function(timeObject){
			var currentPercent = timeObject.data.percentCompleteAggregate;
			var nextProgress = amcnPDK.progress.last + amcnPDK.progress.increment;

			// livestream timecheck
			if(window.isLivestream && !amcnPDK.timeoutDisplayed){
				// check against total time, minus the last time the timecheck ran
				if((timeObject.data.currentTimeAggregate - amcnPDK.timeoutLastRun) > amcnPDK.timeoutDuration){
					amcnPDK.timeoutDisplayed = true;
					// store the time when the card was displayed
					amcnPDK.timeoutLastRun = timeObject.data.currentTimeAggregate;
				}
			}

			if(currentPercent > nextProgress){
				console.log(' !!!!! Triggering progress event !!!!! ');

				// update progress marker
				amcnPDK.progress.last = Math.floor(nextProgress % currentPercent);

				// fire tracking event
				jQuery(document).trigger("amcn.pdk.events.OnMediaProgress", [amcnPDK.progress.last]);
			}
			jQuery(document).trigger("amcn.pdk.events.OnMediaProgressRaw", timeObject);
		},

	}
};

amcnPlatform.core.handler.addModule(pdkEvents.register);
