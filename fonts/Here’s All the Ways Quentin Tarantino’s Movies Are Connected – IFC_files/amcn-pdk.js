var amcnPlatformPlayers = amcnPlatformPlayers || {};
var amcnPlatform = amcnPlatform || {};

// player config object
function amcnPlayer(amcnVideo){
	console.log('%c //////// amcnPlayer //////// ', 'background-color:#ffff00; color:#000000');

	// store video configuration
    var config = amcnVideo;
	var registeredEvents = [];
	var data = {};

    // push player config object into platform handler object
    amcnPlatform.core.handler.addPlayer(this);

	// public method to retrieve config value
	this.getConfig = function(){
		return config;
	};

	this.getEvents = function(){
		return registeredEvents;
	}

	// public method to push video config details into video object
	this.addVideoConfig = function(videoData, scope){
		config.settings.video.details = videoData;
		$pdk.controller.dispatchEvent('VideoConfigSet', scope, scope);
	};

	this.addData = function(dataType, dataValue){
		if(typeof data[dataType] === 'undefined'){
			data[dataType] = dataValue;
		}
		else{
			throw 'Data type has already been defined.';
		}
	}

	this.getData = function(dataType){
		if(typeof data[dataType] !== 'undefined'){
			return data[dataType];
		}
		else{
			throw 'Data type is not defined: '+dataType;
		}
	}

	// event listener wrapper for all PDK events
	this.eventListener = function(responseObj){
		// set up config values for events to be referenced
		var responseData = {
			eventResponse: responseObj,
			eventType: responseObj.type,
			player: config
		};

		// setup custom event structure
		var eventToFire = 'amcn.pdk.events.'+responseObj.type;

		// fire scoped event with additional response data
		$pdk.controller.dispatchEvent(eventToFire, responseData, [config.instance]);
	};

	// special event listener for amcn init
	this.initListener = function(response){
		console.log('%c //// amcnPlayer | initListener //// ', 'background-color:#ffff00; color:#000000', response);

		// retrieve all registered modules
		var modules = amcnPlatform.core.handler.getModules();

		// loop through and execute init callbacks
		for(var i = 0; i < modules.length; i++){
			modules[i](response);
		}
	};
};

amcnPlatform.namespace = function(namespace){
	var parts = namespace.split('.');
	var parent = amcnPlatform;
	var i;

	// strip parent from namespace string
	if(parts[0] === "amcnPlatform"){
		parts = parts.slice(1);
	}

	for(i = 0; i< parts.length; i++){
		// detect existance of property
		if(typeof parent[parts[i]] === 'undefined'){
			// add the empty property
			parent[parts[i]] = {};
		}
		// set parent with property
		parent = parent[parts[i]];
	}

	return parent;
};

// register core handler object
amcnPlatform.namespace('amcnPlatform.core.handler');
amcnPlatform.core.handler = (function(){
    var initialized = false;
    var players = [];
    var scope = [];
	var me = this;

	var registeredModules = [];

	// initialize the PDK player handling
    var init = function(){
		// only initialize once
        if(!initialized){
            console.log('%c //////// init //////// ', 'background-color:#00ffff; color:#000000');

			// retrieve all players pushed into storage
			var storedPlayers = getStoredPlayers();

            // set player scope
            scope = registerPlayerScope(storedPlayers);

			// set all event handlers with scoped responses
			registerPlayerEvents();

			// initialize players
			$pdk.initialize();

			// custom event to denote init has completed
			$pdk.controller.dispatchEvent('OnAMCNInit', 'ready', getPlayerScope());

			// set initialized flag
            initialized = true;
        }
    };

	// register a player and push into players array
    var addPlayer = function(amcnVideo){
        players.push(amcnVideo);
    };

	// register a js module for execution on initialization
	var addModule = function(method){
		registeredModules.push(method);
	}

    // store the instance values to use as player scope in PDK event listeners
    var registerPlayerScope = function(players){
        var playerInstances = [];

		// register all player objects
        for(var i = 0; i < players.length; i++){
			// retrieve the player's configuration values
			var playerConfig = players[i].getConfig();
			// push player instance value into storage
            playerInstances.push(playerConfig.instance);
        }

        console.log('%c //////// registerPlayerScope //////// ', 'background-color:#00ffff; color:#000000', playerInstances);
        return playerInstances;
    };

    // set appropriate actions for playback options
    var registerPlayerEvents = function(){
		console.log('%c //////// registerPlayerEvents //////// ', 'background-color:#00ffff; color:#000000');

		// iterate through all registered players
		for(var i = 0; i < players.length; i++){
			// retrieve the player's configuration values
			var playerConfig = players[i].getConfig();
			var playerInstance = playerConfig.instance;

			// set listeners
			$pdk.controller.addEventListener('OnPlayerLoaded', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnReleaseStart', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnReleaseEnd', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnMediaError', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnPlayButtonClicked', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnLoadReleaseUrl', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnMediaPlaying', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnMediaSeek', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnMediaStart', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
	        $pdk.controller.addEventListener('OnMediaEnd', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnMediaComplete', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnShowCard', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnMediaPause', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);

			// custom events
			$pdk.controller.addEventListener('OnAMCNInit', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnSetVideoValues', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('resume.OnResume', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnAdStarted', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);
			$pdk.controller.addEventListener('OnAdEnded', amcnPlatformPlayers[playerInstance].eventListener, [playerInstance]);

			// special init listener
			$pdk.controller.addEventListener('amcn.pdk.events.OnAMCNInit', amcnPlatformPlayers[playerInstance].initListener, [playerInstance]);
		}
    };

	// retrieve stored player objects
	var getStoredPlayers = function(){
		return players;
	};

	// return instance references to player objects
	var getPlayerScope = function(){
		return scope;
	};

	// return array of registered modules
	var getModules = function(){
		return registeredModules;
	}

	return {
		init: init,
		addPlayer: addPlayer,
		addModule: addModule,
		getStoredPlayers: getStoredPlayers,
		getPlayerScope: getPlayerScope,
		getModules: getModules
	};

}());
