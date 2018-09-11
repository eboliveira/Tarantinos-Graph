var amcnPlatform = amcnPlatform || {};

// register analytics module
amcnPlatform.namespace('amcnPlatform.module.analytics');
amcnPlatform.module.analytics = (function(){

    // initialization flag
    var eventsInit = false;

    var mediaPrefix = 'https://data.media.theplatform.com/media/data/Media/';

    var init = function(response){
        console.log('%c <<<<<<<< analytics init >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

        var listeners = eventListeners();

        // primary events
        $pdk.controller.addEventListener('amcn.pdk.events.OnLoadReleaseUrl', listeners.OnLoadReleaseUrl, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnReleaseStart', listeners.OnReleaseStart, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnReleaseEnd', listeners.OnReleaseEnd, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaError', listeners.OnMediaError, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayButtonClicked', listeners.OnPlayButtonClicked, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaPlaying', listeners.OnMediaPlaying, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaSeek', listeners.OnMediaSeek, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaSeek', listeners.OnMediaSeekTracking, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnMediaStart', listeners.OnMediaStart, '*');

        // custom events
        $pdk.controller.addEventListener('amcn.pdk.events.resume.OnResume', listeners.OnResume, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnAdStarted', listeners.OnAdStarted, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnAdEnded', listeners.OnAdEnded, '*');
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

    var formatTime = function(seconds){
        var minutes = 0;
        var hours = 0;
        var formattedSeconds, formattedMinutes, formattedHours, formattedTime;

        // break down to minutes and hours
        if(seconds >= 60){
            minutes = Math.floor(seconds / 60);
            seconds = seconds - (minutes * 60);
            if(minutes >= 60){
                hours = Math.floor(minutes / 60);
                minutes = minutes - (hours * 60);
            }
        }

        // add leading zeros for formatted time - HH:MM:SS
        formattedSeconds = seconds < 10 ? '0'+seconds : seconds;
        formattedMinutes = minutes < 10 ? '0'+minutes : minutes;
        formattedHours = hours < 10 ? '0'+hours : hours;

        formattedTime = formattedHours+':'+formattedMinutes+':'+formattedSeconds;

        return formattedTime;
    };

    // store event flags to keep track of already fired events
    var eventData = 'modules.analytics.flags';
    var eventFlags = function(){
        var config = {
            videoStart: false,
            mediaStart: false,
            playingAds: false,
            duration: 0,
            progress: {
                0: false,
                25: false,
                50: false,
                75: false,
                100: false
            },
            minuteProgress: [],
            livestreamProgress: [],
            eventsInit: false
        };

        var getValue = function(property){
            if(typeof config[property] !== 'undefined'){
                return config[property];
            }
        };

        var setValue = function(property, value){
            if(typeof config[property] !== 'undefined'){
                config[property] = value;
            }
        };

        return {
            getValue: getValue,
            setValue: setValue
        };
    };

    // add the player analytic flags for tracking purposes, and set init value
    var addAnalyticsFlags = function(response){
        console.log('%c <<<<<<<< analytics | OnLoadReleaseUrl | initializing >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);
        try{
            var flagsTemplate = new eventFlags();

            // add player analytics data to the player object
            var player = getPlayerInstance(response.data.player.instance);
            // intial setting of flag data
            player.addData(eventData, flagsTemplate);

            // set flag reference
            var flags = player.getData(eventData);

            // update init flag
            flags.setValue('eventsInit', true);
        }
        catch(e){
            console.log('ANALYTICS ERROR: unable to set flags: ', e);
        }
    }

    var eventListeners = function(){

        // initialization
        var OnLoadReleaseUrl = function(response){
            console.log('%c <<<<<<<< analytics | OnLoadReleaseUrl >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);

                if(!flags.getValue('eventsInit')){
                    console.log('<<<< analytics | Flags found, but unset. Initializing');
                    addAnalyticsFlags(response);
                }
                else{
                    console.log('<<<< analytics | Flags already initialized.');
                }
            }
            catch(e){
                console.log('<<<< analytics | catch - Creating flags | ', response.data.player.instance, e);

                addAnalyticsFlags(response);
            }
        };

        // VideoStart
        var OnReleaseStart = function(response){
            console.log('%c <<<<<<<< analytics | OnReleaseStart >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);

                if(flags.getValue('videoStart') === false){
                    // check for autoadvance cookie
                    var cookies = document.cookie,
                        cookieVal;

                    if(cookies.indexOf('video_auto_advance') != -1){
                        cookieVal = cookies.match(/video_auto_advance=(.*?);/)[1];
                    } else {
                        cookieVal = undefined;
                    }

                    // fire the VideoStart tracking
                    jQuery(document).trigger('amcn.pdk.events.v2.PDKVideoStart', {player: player, autoAdvance: cookieVal});

                    // destroy autoadvance cookie if existed
                    if(cookieVal){
                        document.cookie = 'video_auto_advance=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
                    }

                    flags.setValue('videoStart', true);

                    //Only add VideoExit if videoStart flag is set
                    window.addEventListener('beforeunload', VideoExit);
                }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnReleaseStart): ', e, response.data.player.instance);

                flags.setValue('videoStart', 'error');
            }
        };

        // VideoEnd
        var OnReleaseEnd = function(response){
            console.log('%c <<<<<<<< analytics | OnReleaseEnd >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);
                var percentFired = flags.getValue('progress');

                // fire the VideoEnd tracking
                jQuery(document).trigger('amcn.pdk.events.v2.PDKVideoEnd', {player: player});

                //check if 100 has already been set by onmediaprogress 100% compeletion, if not, fire at end of video
                if(percentFired[100] === false){

                  // fire the 100% completion tracking
                  jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 100});

                  percentFired[100] = true;
                  flags.setValue('progress', percentFired);

                  console.log("onmediaprogress-100");
                  console.log(percentFired);
                }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnReleaseEnd): ', e, response.data.player.instance);
            }
        };

        // OnMediaError | {seconds}
        var OnMediaError = function(response){
            console.log('%c <<<<<<<< analytics | OnMediaError >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);

                // retrieve time of error
                var errorTime = formatTime(Math.floor(response.data.eventResponse.data.clip.mediaTime / 1000));

                // fire the OnMediaError tracking
                jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaError', {player: player, position: errorTime});
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnMediaError): ', e, response.data.player.instance);
            }
        };

        // OnPlayButtonClicked
        var OnPlayButtonClicked = function(response){
            console.log('%c <<<<<<<< analytics | OnPlayButtonClicked >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);

                // fire the OnPlayButtonClicked tracking
                jQuery(document).trigger('amcn.pdk.events.v2.PDKOnPlayButtonClicked', {player: player});
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnPlayButtonClicked): ', e, response.data.player.instance);
            }
        };


        // OnMediaProgress
        var OnMediaPlaying = function(response){
            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);
                var playerConfig = player.getConfig();

                // filter to only run while not playing ad content
                if(flags.getValue('playingAds') === false){
                    // update the overall duration value
                    var duration = flags.getValue('duration');
                    duration = Math.floor(response.data.eventResponse.data.currentTimeAggregate / 1000);
                    flags.setValue('duration', duration);

                    var currentSeconds = duration;
                    var currentPercent = Math.floor(response.data.eventResponse.data.percentCompleteAggregate);
                    var currentDuration = formatTime(currentSeconds);
                    var currentTimestamp = new Date();
                    var hours = currentTimestamp.getUTCHours() < 10 ? '0'+currentTimestamp.getUTCHours() : currentTimestamp.getUTCHours();
                    var minutes = currentTimestamp.getUTCMinutes() < 10 ? '0'+currentTimestamp.getUTCMinutes() : currentTimestamp.getUTCMinutes();
                    var timestamp = hours+':'+minutes+':00';

                    /**
                    * Set PDKOnLivestreamProgress for Livestream
                    *
                    * Interval: fire tracking on the minute marks e.g. 00:01:00
                    * Scrubbing: don't check, but doesn't matter, live stream can't scrub
                    * Video Types: only for livestream
                    */
                    if(response.data.player.settings.video.details.isLivestream === true){

                      //fire tracking on the minute marks e.g. 00:01:00
                      if(currentSeconds % 60 === 0 && currentSeconds > 0){

                          var progress = flags.getValue('livestreamProgress');

                          if(!progress[currentDuration]){
                              console.log('PDKOnLivestreamProgress: ', player.getConfig(), currentDuration, timestamp);
                              jQuery(document).trigger('amcn.pdk.events.v2.PDKOnLivestreamProgress', {player: player, position: currentDuration, playbackDuration: currentDuration, playbackTimestamp: timestamp});

                              progress[currentDuration] = true;
                              flags.setValue('livestreamProgress', progress);
                          }
                      }

                    }else{
                      // retrieve progress markers
                      var percentFired = flags.getValue('progress');

                      /**
                      * Set PDKOnMediaProgress
                      *
                      * Interval: chunks of 25% - check mod 25 for quarter markers e.g [0,25,50,75,100]
                      * Scrubbing: don't check on scrub
                      * Video Types: for both shortform and longform videos
                      */
                      if(currentPercent >= 0 && percentFired[0] === false){

                          jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 0});

                          percentFired[0] = true;
                          flags.setValue('progress', percentFired);

                          console.log('onmediaprogress-0');
                          console.log(percentFired);

                      }else if(currentPercent >= 25 && percentFired[25] === false){

                            jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 25});

                            percentFired[25] = true;
                            flags.setValue('progress', percentFired);

                            console.log('onmediaprogress-25');
                            console.log(percentFired);

                      }else if(currentPercent >= 50 && percentFired[50] === false){

                            jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 50});

                            percentFired[50] = true;
                            flags.setValue('progress', percentFired);

                            console.log('onmediaprogress-50');
                            console.log(percentFired);

                      }else if(currentPercent >= 75 && percentFired[75] === false){

                            jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 75});

                            percentFired[75] = true;
                            flags.setValue('progress', percentFired);

                            console.log('onmediaprogress-75');
                            console.log(percentFired);

                      }else if(currentPercent >= 100 && percentFired[100] === false){

                            jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaProgress', {player: player, completion: 100});

                            percentFired[100] = true;
                            flags.setValue('progress', percentFired);

                            console.log('onmediaprogress-100');
                            console.log(percentFired);
                      }

                       /**
                       * Set PDKOnMediaMinuteProgress
                       *
                       * Interval: fire tracking on the minute marks e.g. 00:01:00
                       * Scrubbing: re-fire minute event on scrub backwards (logic in OnMediaSeekTracking)
                       * Video Types: only for longform videos
                       */
                      if(currentSeconds % 60 === 0 && currentSeconds > 0){

                        //if is longform content
                        if(playerConfig.settings.video.details.custom.videoCategory !== 'Shortform'){

                          var minuteProgress = flags.getValue('minuteProgress');

                          if(!minuteProgress[currentSeconds]){ //mark off events in progress by total seconds

                              console.log('PDKOnMediaMinuteProgress: ', player.getConfig(), currentDuration, timestamp);
                              jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaMinuteProgress', {player: player, position: currentDuration, playbackDuration: currentDuration, playbackTimestamp: timestamp});

                              minuteProgress[currentSeconds] = true;
                              flags.setValue('minuteProgress', minuteProgress);
                          }

                          console.log('minute-progress');
                          console.log(minuteProgress);

                        }//end longform

                      }//PDKOnMediaMinuteProgress

                    }//end linear

                }//end non-ads
            }
            catch(e){
                console.log('%c ANALYTICS ERROR (OnMediaPlaying): ', e, '', response.data.player.instance);
            }
        };


        // OnMediaSeek | {seconds}
        var OnMediaSeek = function(response){
            console.log('%c <<<<<<<< analytics | OnMediaSeek >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);

                var seekToTime = formatTime(Math.floor(response.data.eventResponse.data.end.currentTime / 1000));

                console.log('%c <<<<< seeking to '+seekToTime, 'color: #ff00ff;');
                console.log(response.data.eventResponse.data);

                // fire the OnMediaSeek tracking
                jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaSeek', {player: player, position: seekToTime });
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnMediaSeek): ', e, response.data.player.instance);
            }
        };

        // OnMediaSeekTracking | {seconds}
        var OnMediaSeekTracking = function(response){
            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);
                var playerConfig = player.getConfig();

                var seekToTimeSecondsTotal = Math.floor(response.data.eventResponse.data.end.currentTimeAggregate / 1000);
                var minuteProgress = flags.getValue('minuteProgress');

                // filter to only run while not playing ad content
                if(flags.getValue('playingAds') === false){

                  //if is longform content
                  if(playerConfig.settings.video.details.custom.videoCategory !== 'Shortform'){

                      console.log('%c <<<<<<<< longform analytics | OnMediaSeekTracking >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);
                      //on scrub
                      console.log('seek-time');
                      console.log(seekToTimeSecondsTotal);

                      /**
                      * Reset Scrubbed values on PDKOnMediaMinuteProgress
                      */
                      //if scrub time is less than any of the flagged times, set minuteProgress-events ahead of current time to false
                      for (var minuteProgressSeconds in minuteProgress) {
                        if (seekToTimeSecondsTotal < minuteProgressSeconds) {
                          minuteProgress[minuteProgressSeconds] = false;
                        }
                      }
                      flags.setValue('minuteProgress', minuteProgress);

                      console.log('minuteProgress');
                      console.log(minuteProgress);


                  }
               }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnMediaSeek): ', e, response.data.player.instance);
            }
        };


        // OnMediaStart
        var OnMediaStart = function(response){
            console.log('%c <<<<<<<< analytics | OnMediaStart >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);

                // first time through, run 'OnMediaStart' tracking
                if(flags.getValue('mediaStart') === false){
                    console.log('%c <<<<< setting mediaStart', 'color:#0000ff;');

                    // fire the OnMediaStart tracking
                    jQuery(document).trigger('amcn.pdk.events.v2.PDKOnMediaStart', {player: player});

                    // toggle the mediaStart flag
                    flags.setValue('mediaStart', true);
                }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnMediaStart): ', e, response.data.player.instance);
            }
        };

        // VideoResume
        var OnResume = function(response){
            console.log('%c <<<<<<<< analytics | OnResume >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);

                // fire the VideoResume tracking
                // executeTracking('VideoResume', player);
                jQuery(document).trigger('amcn.pdk.events.v2.PDKVideoResume', {player: player});
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnResume): ', e, response.data.player.instance);
            }
        };

        // OnAdStarted
        var OnAdStarted = function(response){
            console.log('%c <<<<<<<< analytics | OnAdStarted >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);

                if(flags.getValue('playingAds') === false){
                    console.log('%c <<<<< now playing ads', 'color:#ff0000');

                    // fire the adEvent.adStart tracking
                    jQuery(document).trigger('amcn.pdk.events.v2.PDKAdStart', {player: player});

                    // toggle the ads flag
                    flags.setValue('playingAds', true);
                }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnAdStarted): ', e, response.data.player.instance);
            }
        };

        // OnAdEnded
        var OnAdEnded = function(response){
            console.log('%c <<<<<<<< analytics | OnAdEnded >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff', response);

            try{
                var player = getPlayerInstance(response.data.player.instance);
                var flags = player.getData(eventData);

                if(flags.getValue('playingAds') === true){
                    console.log('%c <<<<< now playing content', 'color:#0000ff;');

                    // fire the adEvent.adComplete tracking
                    jQuery(document).trigger('amcn.pdk.events.v2.PDKAdComplete', {player: player});

                    // toggle the ads flag
                    flags.setValue('playingAds', false);
                }
            }
            catch(e){
                console.log('ANALYTICS ERROR (OnAdEnded): ', e, response.data.player.instance);
            }
        };

        // VideoExit
        var VideoExit = function(e){
            console.log('%c <<<<<<<< analytics | VideoExit >>>>>>>> ', 'background-color:#ff00ff; color:#00ffff');

            // retrieve all players
            var players = amcnPlatform.core.handler.getStoredPlayers();

            // execute for each player
            for(var i = 0; i < players.length; i++){
                // retrieve the total duration (seconds) of playback
                var player = players[i];
                var flags = player.getData(eventData);
                var duration = flags.getValue('duration');
                var formattedDuration = formatTime(duration);

                jQuery(document).trigger('amcn.pdk.events.v2.PDKVideoExit', {player: player, duration: formattedDuration, durationSeconds: duration});
            }
        };

        return {
            OnLoadReleaseUrl: OnLoadReleaseUrl,
            OnReleaseStart: OnReleaseStart,
            OnReleaseEnd: OnReleaseEnd,
            OnMediaError: OnMediaError,
            OnPlayButtonClicked: OnPlayButtonClicked,
            OnMediaPlaying: OnMediaPlaying,
            OnMediaSeek: OnMediaSeek,
            OnMediaSeekTracking: OnMediaSeekTracking,
            OnMediaStart: OnMediaStart,
            OnResume: OnResume,
            OnAdStarted: OnAdStarted,
            OnAdEnded: OnAdEnded,
            VideoExit: VideoExit
        };
    };

    return {
        init: init,
        eventListeners: eventListeners
    };
}());

// register analytics module, with init executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.analytics.init);
