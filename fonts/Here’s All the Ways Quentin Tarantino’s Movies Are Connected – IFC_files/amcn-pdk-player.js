var amcnPlatform = amcnPlatform || {};

// register auth module
amcnPlatform.namespace('amcnPlatform.module.player');
amcnPlatform.module.player = (function(){

    // @TODO - store at player level
    var endCardActive = false;
    var shareCardActive = false;
    var overlayConfig = {
        'top' : '',
        'bottom' : '',
        'image' : ''
    };

    var liveStreamTimeout = {
        timeout: 20,
        timeoutLastRun: 0,
        // 2 hours, in milliseconds
        timeoutDuration: 2 * 60 * 60 * 1000,
        timeoutDisplayed: false
    };

    // register primary global event listeners
    var init = function(response){
        console.log('%c //////// player | init //////// ', 'background-color:#999999; color:#000000', response);

        var cardMethods = cards();
        var cardListeners = listeners();

		$pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardMethods.endCard, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardMethods.shareCard, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardMethods.stillWatchingCounterCard, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardMethods.stillWatchingRestartCard, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardMethods.imageOverlayCard, '*');

        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaPlaying', cardListeners.OnMediaPlaying, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnSetVideoValues', cardListeners.OnSetVideoValues, '*');

    };

    var toggleShareCard = function(){
        console.log('%c //////// player | toggleShareCard //////// ', 'background-color:#999999; color:#000000', shareCardActive);
		if(shareCardActive === false){
			console.log('%c //////// player | toggleShareCard > show //////// ', 'background-color:#999999; color:#000000');
			$pdk.controller.showPlayerCard('forms', 'tpShareCard', 'urn:theplatform:pdk:area:player', {}, '*');
		}
		else{
			console.log('%c //////// player | toggleShareCard > hide //////// ', 'background-color:#999999; color:#000000');
			$pdk.controller.hidePlayerCard('forms', 'tpShareCard', '*');
		}
	};

    var cards = function(){
        var endCard = function(){
            console.log('%c //////// player | register > endCard //////// ', 'background-color:#999999; color:#000000');

            var cardContent = '<div class=\"endcard-container pdk-card\">'+$pdk.jQuery('.pdk-endcard-content').html()+'</div>';

            var presenter = {
                show: function(initVars){
                    console.log('%c //////// player | register > endCard > show //////// ', 'background-color:#999999; color:#000000', initVars);

                    endCardActive = true;

                    // set active class to end card
                    $pdk.jQuery('.pdk-endcard-content').addClass('active');

                    // attach the click handler to the replay button for non-mobile devices
                    if(!($pdk.isIOS || $pdk.isAndroid)){
                        $pdk.jQuery('.pdk-endcard-container .replay-text').click(function(){
                            $pdk.controller.hidePlayerCard('forms', 'endCard', '*');

                            // @TODO - add specific player scope
                            $pdk.controller.clickPlayButton(amcnPlatform.core.handler.getPlayerScope());
                            $pdk.jQuery('.pdk-endcard-content').removeClass('active');
                        });
                    }
                },
                hide: function(){
                    endCardActive = false;
                }
            };

            $pdk.controller.addPlayerCard('forms', 'endCard', cardContent, 'urn:theplatform:pdk:area:player', {}, presenter, 99, amcnPlatform.core.handler.getPlayerScope());
        };

        var shareCard = function(){
            console.log('%c //////// player | register > shareCard //////// ', 'background-color:#999999; color:#000000');

            var cardContent = '<div class=\"sharecard-container pdk-card\"><div class=\"pdk-sharecard-container\">'+jQuery('.amcn-share-card').html()+'</div></div>';

            var presenter = {
                show: function(initVars){
                    shareCardActive = true;

                    // attach click handler to close button
                    $pdk.jQuery('#amcn-share-close').click(function(){
                        $pdk.controller.hidePlayerCard('forms', 'tpShareCard', '*');
                    });
                },
                hide: function(){
                    shareCardActive = false;
                }
            };

            // only override default tpShareCard if amcn-video-share plugin is enabled
            if($pdk.jQuery('.amcn-share-card').length){
                console.log('%c //////// player | register > shareCard - attached //////// ', 'background-color:#999999; color:#000000');
                $pdk.controller.addPlayerCard('forms', 'tpShareCard', cardContent, 'urn:theplatform:pdk:area:player', {}, presenter, 1, amcnPlatform.core.handler.getPlayerScope());
            }
            else{
                console.log('%c //////// player | register > shareCard - no custom, using default //////// ', 'background-color:#999999; color:#000000');
            }
        };

        var stillWatchingCounterCard = function(){
            console.log('%c //////// player | register > stillWatchingCounterCard //////// ', 'background-color:#999999; color:#000000');

	        var html = '<div class="tpPlayerCard tpResumePlaybackCard stillWatchingCounterCard">' +
						'<div class="tpResumePlaybackCardInner">' +
							'<div class="resume-message">${message}</div>' +
							'<div class="resume-buttons">' +
									'<div class="resume">${restart}</div>' +
							'</div>' +
						'</div>' +
					'</div>';

		    // custom presenter - for form submission handling
		    var presenter = {
			    show: function(initVars){
                    console.log('%c //////// player | register > stillWatchingCounterCard > show //////// ', 'background-color:#999999; color:#000000');

				    var secondsLeft = liveStreamTimeout.timeout;

                    $pdk.jQuery(initVars.card).find(".resume-buttons .resume").click(function(){
                        $pdk.controller.hidePlayerCard('overlays', 'stillWatchingCounterCard', '*');
                        reset();
                    });

                    // countdown and push to restart card at end
                    intervalID = setInterval(function(){
                        secondsLeft -= 1;
                        console.log(secondsLeft);
                        if(secondsLeft <= 0){
                            $pdk.controller.hidePlayerCard('overlays', 'stillWatchingCounterCard', '*');
                            $pdk.controller.showPlayerCard('forms', 'stillWatchingRestartCard', 'urn:theplatform:pdk:area:player', {}, amcnPlatform.core.handler.getPlayerScope());
                            reset();
                        }
                    }, 1000);
                },
                hide: function(){}
            };

            var reset = function(){
                clearInterval(intervalID);
                liveStreamTimeout.timeoutDisplayed = false;
            }

            $pdk.controller.addPlayerCard('overlays', 'stillWatchingCounterCard', html, 'urn:theplatform:pdk:area:player', {message: 'Are you still watching?', restart: 'Yes'}, presenter, 99);
        };

	    var stillWatchingRestartCard = function(){
            console.log('%c //////// player | register > stillWatchingRestartCard //////// ', 'background-color:#999999; color:#000000');

            var html = '<div class="tpPlayerCard tpResumePlaybackCard stillWatchingRestartCard">' +
                            '<div class="tpResumePlaybackCardInner">' +
                                '<div class="resume-message">${message}</div>' +
                                '<div class="resume-buttons">' +
                                    '<div class="resume">${restart}</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>';

            // custom presenter - for form submission handling
            var presenter = {
                show: function(initVars){
                    console.log('%c //////// player | register > stillWatchingRestartCard > show //////// ', 'background-color:#999999; color:#000000');

                    $pdk.jQuery(initVars.card).find('.resume-buttons .resume').click(function(){
                        $pdk.controller.hidePlayerCard('forms', 'stillWatchingRestartCard', '*');
                    });
                },
                hide: function(){}
            };

            $pdk.controller.addPlayerCard('forms', 'stillWatchingRestartCard', html, 'urn:theplatform:pdk:area:player', {message: 'Are you still watching?', restart: 'Yes'}, presenter, 99);
        };

        var imageOverlayCard = function(){
            console.log('%c //////// player | register > imageOverlayCard //////// ', 'background-color:#999999; color:#000000');

            var html = '<div class="tpPlayerCard tpImageOverlayCard imageOverlayCard">' +
                            '<div class="tpImageOverlayCardInner">' +
                                '<span class="overlay-top">${top}</span>' +
                                '<span class="overlay-bottom">${bottom}</span>' +
                                '<span class="overlay-logo">${image}</span>' +
                            '<div>';
                        '</div>';

            var presenter = {
                show: function (initVars){
                    console.log('%c //////// player | register > imageOverlay > show //////// ', 'background-color:#999999; color:#000000');
                },
                hide: function(){}
            }

            $pdk.controller.addPlayerCard('overlays', 'imageOverlayCard', html, 'urn:theplatform:pdk:area:overlay', {}, presenter, 1, amcnPlatform.core.handler.getPlayerScope());
        };

        return {
            endCard: endCard,
            shareCard: shareCard,
            stillWatchingCounterCard: stillWatchingCounterCard,
            stillWatchingRestartCard: stillWatchingRestartCard,
            imageOverlayCard: imageOverlayCard
        };
    };

    var listeners = function(){
        // manages still watching card for livestream
		var OnMediaPlaying = function(response){
            // check for livestream status, and if timeout is already displayed
            if(response.data.player.settings.video.details.isLivestream === true && liveStreamTimeout.timeoutDisplayed === false){

                var currentTime = response.data.eventResponse.data.currentTimeAggregate;

				// check against total time, minus the last time the timecheck ran
				if((currentTime - liveStreamTimeout.timeoutLastRun) > liveStreamTimeout.timeoutDuration){
                    console.log('%c //////// player | OnMediaPlaying > livestream > stillWatchingCounterCard show timeout //////// ', 'background-color:#999999; color:#000000', response);
					liveStreamTimeout.timeoutDisplayed = true;
					// store the time when the card was displayed
					liveStreamTimeout.timeoutLastRun = currentTime;
					$pdk.controller.showPlayerCard('overlays', 'stillWatchingCounterCard', 'urn:theplatform:pdk:area:player', {}, amcnPlatform.core.handler.getPlayerScope());
				}
            }
        };

        var OnSetVideoValues = function(release){
            var instance = release.data.player.instance;
            var customValues = release.data.player.settings.video.details.custom;

            // Try to retrieve network config
            try {
                overlayImagePath = amcnPlatformConfig.overlayImage;
            } catch (err) {
                console.log('%c //////// player | OnSetVideoValues > imageOverlayCard > error //////// ', 'background-color:#660066; color:#ffffff', err);
                overlayImagePath = '';
            }
            // If default logo is defined in network config, build out image tag
            if(!overlayImagePath == ''){
                overlayConfig['image'] = '<img src="'+overlayImagePath+'" />';
            }

            // Only redefine overalyConfig values if they exist in player config
            if(customValues.overlayTextTop){
                overlayConfig['top'] = customValues.overlayTextTop;
            }

            if(customValues.overlayTextBottom){
                overlayConfig['bottom'] = customValues.overlayTextBottom;
            }

            // If image overaly is defined and enabled in mpx, get config data
            if(customValues.overlayEnabled === true){
                console.log('%c //////// player | OnSetVideoValues > imageOverlayCard //////// ', 'background-color:#999999; color:#000000', release);

                $pdk.controller.showPlayerCard("overlays", "imageOverlayCard", "urn:theplatform:pdk:area:overlay", overlayConfig, [instance]);
                $pdk.controller.addEventListener('amcn.pdk.events.OnAdEnded', OnAdEnded, [instance]);
            }
        };

        // OnAdEnded
        var OnAdEnded = function(response){
            console.log('%c //////// player | OnAdEnded > imageOverlayCard //////// ', 'background-color:#999999; color:#000000', response);
            // Re-display image overlay after ad pod

            $pdk.controller.showPlayerCard("overlays", "imageOverlayCard", "urn:theplatform:pdk:area:overlay", overlayConfig, "*");

        };

        return {
            OnMediaPlaying: OnMediaPlaying,
            OnSetVideoValues: OnSetVideoValues,
            OnAdEnded: OnAdEnded
        };
    };

    return {
        init: init,
        toggleShareCard: toggleShareCard
    };
}());

// register player module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.player.init);
