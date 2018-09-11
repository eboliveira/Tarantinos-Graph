var amcnPlatform = amcnPlatform || {};

// register events module
amcnPlatform.namespace('amcnPlatform.module.events');
amcnPlatform.module.events = (function(){
    // event module data
    var eventData = 'modules.events.pageSettings';
    var pageSettings = function(){
        var config = {
            flash: null,
            mobile: null,
            // allows for an action to disable the autoplay component
            auto: null,
            // release object has been recieved
            releaseSet: null,
            // auth required
            auth: null,
            // auth has been set
            authSet: null,
            // resume required
            resume: null,
            // resume has been set
            resumeSet: null,
            // ads required
            ads: true,
            // ads have been set
            adsSet: null,
            // intercepts are complete
            interceptSet: null
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
            setValue: setValue,
        };
    };

    var mediaPrefix = 'http://data.media.theplatform.com/media/data/Media/';

    // register primary global event listeners
    var init = function(response){
        console.log('%c //////// events | init //////// ', 'background-color:#0000ff; color:#ffffff', response);

        var listeners = eventListeners();

        // hook into custom events w/ extra player context data
        $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', listeners.OnPlayerLoaded, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnLoadReleaseUrl', listeners.OnLoadReleaseUrl, '*');
        $pdk.controller.addEventListener('amcn.pdk.events.OnReleaseEnd', listeners.OnReleaseEnd, '*');
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

    // add player page settings data to the player object
    var initializePlayerSettings = function(instance, isFlash, isMobile){
        var pageSettingsTemplate = new pageSettings();

        var player = getPlayerInstance(instance);

        // intial setting of flag data
        player.addData(eventData, pageSettingsTemplate);

        // get flag reference
        var flags = player.getData(eventData);

        // update mobile/flash values
        flags.setValue('flash', isFlash);
        flags.setValue('mobile', isMobile);
    };

    // store the video data, which is stored from the OnLoadReleaseUrl event
    var setVideoValues = function(releaseData){
        console.log('%c //////// events | setVideoValues //////// ', 'background-color:#0000ff; color:#ffffff', releaseData);

        // enforce requirements of ID being available, - required event setup
        if(typeof(releaseData.id) == 'undefined' || releaseData.id == null || releaseData.id == ''){
            throw 'missing release ID';
        }

        // grab full release ID
        var fullVideoID = releaseData.id;
        // strip out media prefixing
        var videoID = fullVideoID.replace(mediaPrefix, '');

        // asset settings - retrieved from the release data
        var videoData = {
            releaseURL: typeof(releaseData.url) !== 'undefined' && releaseData.url != '' ? releaseData.url : 'MISSING URL',
            videoName: typeof(releaseData.title) !== 'undefined' && releaseData.title != '' ? releaseData.title : 'MISSING TITLE',
            videoPublicID: typeof(releaseData.mediaPID) !== 'undefined' && releaseData.mediaPID != '' ? releaseData.mediaPID : releaseData.pid,
            videoID: fullVideoID,
            videoRating: typeof(releaseData.ratings[0]) !== 'undefined' && releaseData.ratings[0].rating != '' ? releaseData.ratings[0].rating : 'MISSING RATING',
            duration: typeof(releaseData.duration) !== 'undefined' ? releaseData.duration : typeof(releaseData.length) !== 'undefined' ? releaseData.length : 0,
            custom: {},
            isLivestream: false
        }

        // loop through customValues of releaseData and merge into video data
        for(var customValue in releaseData.customValues){
            fieldName = releaseData.customValues[customValue]['fieldName'];
            fieldValue = releaseData.customValues[customValue].value;

            // store custom data
            videoData.custom[fieldName] = fieldValue;
        }

        // check for Live Stream category, and set value
        for(var i = 0; i < releaseData.categories.length; i++){
            if(releaseData.categories[i].name == 'Live Stream'){
                videoData.isLivestream = true;
            }
        }

        // push video data into main players object
        if(videoID in amcnPlatformPlayers){
            amcnPlatformPlayers[videoID].addVideoConfig(videoData, videoID);
            console.log('%c player config updates', 'background-color:#0000ff; color:#ffffff', videoID, amcnPlatformPlayers[videoID].getConfig());

            // send custom event
            $pdk.controller.dispatchEvent('OnSetVideoValues', 'ready', [videoID]);
            $pdk.controller.dispatchEvent('OnReleaseUrlReady', {type: 'release', set: true, players: [videoID]}, [videoID]);
        }
    };

    // sets up required event listeners which are necessary prior to video playback
    var setPlayerDisplay = function(instance){
        console.log('%c //////// events | setPlayerDisplay //////// ', 'background-color:#0000ff; color:#ffffff', instance);

        // retrieve this instance's player config
        var playerConfig = amcnPlatformPlayers[instance].getConfig();

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // add required items to config
        flags.setValue('auth', playerConfig.playback.auth);
        flags.setValue('resume', playerConfig.playback.resume);
        flags.setValue('auto', playerConfig.playback.autoplay);

        // add respective listeners
        $pdk.controller.addEventListener('OnAdsReady', displayPlayer, [instance]);
        $pdk.controller.addEventListener('OnReleaseUrlReady', displayPlayer, [instance]);
        if(playerConfig.playback.auth === true){
            console.log('%c //////// events | setPlayerDisplay > auth listener added //////// ', 'background-color:#0000ff; color:#ffffff');
            $pdk.controller.addEventListener('OnAuthReady', displayPlayer, [instance]);
        }
        if(playerConfig.playback.resume === true){
            console.log('%c //////// events | setPlayerDisplay > resume listener added //////// ', 'background-color:#0000ff; color:#ffffff');
            $pdk.controller.addEventListener('OnResumeReady', displayPlayer, [instance]);
        }
        $pdk.controller.addEventListener('OnInterceptComplete', displayPlayer, [instance]);
    };

    // when all conditions met, displays player and potentially autoplays
    var displayPlayer = function(response){
        console.log('%c //////// events | displayPlayer //////// ', 'background-color:#0000ff; color:#ffffff', response.type, response);

        var players = response.data.players;

        // iterate through all players
        for(var i = 0; i < players.length; i++){
            // get player flags
            var player = getPlayerInstance(players[i]);
            var flags = player.getData(eventData);

            flags.setValue(response.data.type+'Set', response.data.set);

            // check for autoplay disabler flag from event
            if(typeof(response.data.autoplay) !== 'undefined' && response.data.autoplay === false){
                flags.setValue('auto', false);
            }

            // get full config to check status
            var autoplayConfig = {
                // check autoplay toggle
                auto: flags.getValue('auto'),

                // check for release object
                releaseSet: flags.getValue('releaseSet'),

                // check auth
                auth: flags.getValue('auth'),
                authSet: flags.getValue('authSet'),

                // check resume
                resume: flags.getValue('resume'),
                resumeSet: flags.getValue('resumeSet'),

                // check ads
                ads: flags.getValue('ads'),
                adsSet: flags.getValue('adsSet'),

                // check intercept status
                interceptSet: flags.getValue('interceptSet')
            };

            // remove listener
            $pdk.controller.removeEventListener(response.type, displayPlayer, [players[i]]);

            // check status of all 'Set' properties, determine if playback is ready
            if(((autoplayConfig.auth === true && autoplayConfig.authSet === true) || autoplayConfig.auth === false) && ((autoplayConfig.resume === true && autoplayConfig.resumeSet === true) || autoplayConfig.resume === false) && (autoplayConfig.adsSet === true) && (autoplayConfig.releaseSet === true) && (autoplayConfig.interceptSet === true) ){
                console.log('%c //////// events | displayPlayer > player ready //////// ', 'background-color:#0000ff; color:#ffffff', players[i]);
                // hide image placeholder
                $pdk.jQuery('.instance-'+players[i]).hide();

                // play on desktop, and when autoplay has not been disabled by a component
                if(!($pdk.isIOS || $pdk.isAndroid) && flags.getValue('auto') !== false){
                    // $pdk.controller.clickPlayButton([players[i]]);
                    amcnPlatform.module.autoplay.maybeAutoPlay();
                }
            }
        }
    };

    // retrieve the MVPD details by reading in cookie data
    var retrieveMVPD = function(){
        // NOTE: readCookie defined in: live/wp-content/plugins/amcn-mvpd-auth/assets/js/cookie.js
        var mvpdCookie = readCookie(amcnPlatformConfig.network + '-tve-authn');
        var mvpdClickedCookie = readCookie(amcnPlatformConfig.network + '-tve-authn-clicked');

        var platformMVPD = mvpdCookie != null ? mvpdCookie : mvpdClickedCookie != null ? mvpdClickedCookie : 'NonAuth';

        console.log('%c //////// events | retrieveMVPD //////// ', 'background-color:#0000ff; color:#ffffff', platformMVPD);

        return platformMVPD;
    };

    var eventListeners = function(){

        // set up properties and player settings
        var OnPlayerLoaded = function(response){
            console.log('%c //////// events | OnPlayerLoaded //////// ', 'background-color:#0000ff; color:#ffffff', response);

            // detect mobile usage
            var isMobile = $pdk.isIOS || $pdk.isAndroid;

            // detect flash
            var playerInstance = $pdk.env.Detect.getInstance();
            var isFlash = playerInstance._component_runtime == 'flash' ? true : false;

            // set up settings in player object
            initializePlayerSettings(response.data.player.instance, isFlash, isMobile);

            // player can now register for auto play
            setPlayerDisplay(response.data.player.instance);

            $pdk.controller.dispatchEvent('OnAmcSetMvpd', retrieveMVPD(), amcnPlatform.core.handler.getPlayerScope());
        };

        // asset load event listener - sets video object values for reuse
        var OnLoadReleaseUrl = function(response){
            console.log('%c //////// events | OnLoadReleaseUrl //////// ', 'background-color:#0000ff; color:#ffffff', response);

            // store the release data, used in authorization requests
            try{
                // set the video values
                setVideoValues(response.data.eventResponse.data);
            }
            catch(err){
                console.log('%c setvideoValues failure: '+err, 'background-color:#ff0000; color:#ffffff');
            }

            // web vtt support for mobile
            if($pdk.isIOS){
                jQuery('video').attr('crossorigin', 'anonymous');
            }
        };

        // complete event listener - for mobile usage to replace end card display
        var OnReleaseEnd = function(response){
            console.log(' //////// events | OnReleaseEnd //////// ', response);

            var player = getPlayerInstance(response.data.player.instance);
            var flags = player.getData(eventData);

            // check for mobile usage
            if(flags.getValue('mobile') === true){
                console.log(' %%%%% Mobile end, setting pseudo-end card %%%%% ');

                // halt playback on mobile
                $pdk.controller.endRelease(response.data.player.instance);
                // end full screen on mobile
                jQuery('video')[0].webkitExitFullscreen();

                // hide player container
                jQuery('.platform-container').hide();
                // show the standalone end card content
                jQuery('.pdk-endcard-content').show().addClass('active mobile');
            }
        };

        return {
            OnPlayerLoaded: OnPlayerLoaded,
            OnLoadReleaseUrl: OnLoadReleaseUrl,
            OnReleaseEnd: OnReleaseEnd
        };
    };

    return {
        init: init
    };
}());

// register events module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.events.init);
