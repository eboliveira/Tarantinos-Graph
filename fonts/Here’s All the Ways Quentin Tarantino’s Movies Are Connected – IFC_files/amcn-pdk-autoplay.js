var amcnPlatform = amcnPlatform || {};

// register autoplay module
amcnPlatform.namespace('amcnPlatform.module.autoplay');
amcnPlatform.module.autoplay = (function(){

    var autoplay = false;
    var autoplayActive = false;

    var init = function(){
        console.log('%c ^^^^^^^^^ autoplay init ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff');

        // check for basic properties to determine if autoplay can be enabled
        if(!($pdk.isIOS || $pdk.isAndroid) && window.autoplay == true){
            autoplayActive = true;
        }

		// check for safari 11 plus, disable autoplay
		// this is done because autoplay breaks playback in Safari 11+
		if($pdk.isSafari11Plus){
			autoplayActive = false;
		}
    };

    var maybeAutoPlay = function(){
        console.log('%c ^^^^^^^^^ autoplay > maybeAutoPlay ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff', autoplayActive);
        // check if autoplay is enabled
        if(isAutoPlayActive()){
            // check if we can start playback
            if(canAutoPlay()){
                console.log('%c ^^^^^^^^^ autoplay > maybeAutoPlay > ENABLED, STARTING ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff');
                $pdk.controller.clickPlayButton(amcnPlatform.core.handler.getPlayerScope());
            }
            else{
                console.log('%c ^^^^^^^^^ autoplay > maybeAutoPlay > ENABLED, NOT READY ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff');
                // add event listener to check again once ghost completes
                jQuery(document).on('amcn.ghostAllowAutoplay', maybeAutoPlay);
            }
        }
        // autoplay is disabled by config
        else{
            console.log('%c ^^^^^^^^^ autoplay > maybeAutoPlay > DISABLED ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff');
        }
    };

    // callback to flip flag for autoplay
    var setAutoPlay = function(){
        console.log('%c ^^^^^^^^^ autoplay > setAutoPlay ^^^^^^^^^ ', 'background-color:#336633; color:#ffffff');
        autoplay = true;
    };

    // public getter for autoplay status
    var canAutoPlay = function(){
        return autoplay;
    };

    // public getter for autoplay enabled status
    var isAutoPlayActive = function(){
        return autoplayActive;
    };

    return {
        init: init,
        maybeAutoPlay: maybeAutoPlay,
        setAutoPlay: setAutoPlay,
        canAutoPlay: canAutoPlay,
        isAutoPlayActive: isAutoPlayActive,
    };
}());

// register autoplay module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.autoplay.init);

// register listener for ghost
jQuery(document).on('amcn.ghostAllowAutoplay', function(){
    amcnPlatform.module.autoplay.setAutoPlay();
});

// check for existance of cookie upon init of js
if(typeof _amcn_ghost_config === 'undefined' || jQuery.cookie('_amcn_ghost.udb_check')){
    amcnPlatform.module.autoplay.setAutoPlay();
}
