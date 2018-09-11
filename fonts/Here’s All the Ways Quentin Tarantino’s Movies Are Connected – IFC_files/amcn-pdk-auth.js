var amcnPlatform = amcnPlatform || {};

// register auth module
amcnPlatform.namespace('amcnPlatform.module.auth');
amcnPlatform.module.auth = (function(){

    var requestorID = 'null';
    var authenticatedWith = 'none';
    var userAuth = null;
    var errorsEndpoint = '/api/mvpds/v1/get.errors';
    var publishStateCookie = amcnPlatformConfig.network + '-tve-publish_state';

    var resource_default = amcnPlatformConfig.resource_default ||  window.requestor_id; //if resource_default doesn't exist, default to old requestor_id
    var resource_adfree = amcnPlatformConfig.resource_adfree || '';

    var restricted_end = null;
    // auth status/info setters and getters
    var setRequestorID = function(requestor){
        requestorID = window.requestor_id;
    };

    var getRequestorID = function(){
        return requestorID;
    }

    var getResourceID = function(){

        //@TODO: logic for determining between public/restricted video assets
        //default to default resource for now.
        //could use timestamps here to determine adfree resource
        
        if(readCookie(publishStateCookie) == null){ 
            $resource_id = 'public'; 
        }else{ 
            $resource_id =readCookie(publishStateCookie); 
        } 
        

        if($resource_id == 'restricted'){
            return resource_adfree;
        }else {
            return resource_default;
        }
    }

    var setAuth = function(provider){
        authenticatedWith = provider;
    };

    var getAuth = function(){
        return authenticatedWith;
    };

    var setUserAuth = function(status){
        userAuth = status;
    };

    var getUserAuth = function(){
        return userAuth;
    };


    // all adobe pass specific callbacks
    var callbacks = function(){

        // Called when the JavaScript Access Enabler has completed initialization and is ready to receive requests.
        // This the entry point for your communication with the Access Enabler.
        var entitlementLoaded = function(){
            console.log('%c {{{{{{{{ entitlementLoaded }}}}}}}} ', 'background-color:#00ff00; color:#000000');


            // auth - requestor ID
            setRequestorID(window.requestor_id);

            // build login area
            amcnAdobeUI.buildAuthenticated();

            ae.bind('errorEvent', 'logError');

            // make access enabler requests to check for auth status
            ae.setRequestor(getRequestorID());

            //if premiere cookie is restricted, trigger UI state (faster than preflight check)
            if(readCookie(publishStateCookie) == 'restricted'){
                console.log('%c {{{{{{{{ PREMIERE | %s cookie exists }}}}}}}} ', 'background-color:gold; color:#000000', publishStateCookie, readCookie(publishStateCookie));
                //paint app as premiere during preflight chec
                triggerUserState('adfree');
            }
            /*
            //run preflight check anyways, which will create/update publishStateCookie for next page load
            //need to do this again because user may upgrade, and next page load will update cookie of user state
            ae.checkPreauthorizedResources([resource_default,resource_adfree]);
            */
            //adobe regular check authentication
            ae.checkAuthentication();

            if(typeof(authRequired) !== 'undefined' && authRequired === true){

                var $ = jQuery.noConflict();

                // trigger the tracking event for an auth requirement
                $(document).trigger("amcn.pdk.events.authNeeded");
            }
        };

        // Called when an authorization request or a check-authorization request
        // has completed successfully. Passes the ID for the resource for which authorization was
        // requested, and the authorization token provided by the MVPD.
        var setToken = function(inRequestedResourceID, inToken){
            console.log('%c {{{{{{{{ setToken }}}}}}}} ', 'background-color:#00ff00; color:#000000', inRequestedResourceID, inToken);

            ae.getMetadata('maxRating');

            try{
                // generate token, update, and play asset
                addToken(inToken);
            }
            catch(err){
                console.log('%c {{{{ Error updating token: ', 'background-color:#ff0000; color:#ffffff', err);
            }
        };

        // Called when an authorization or a check-authorization request has failed. Can optionally be used by an MVPD to provide a custom message to be displayed by the Programmer.
        //
        // Parameters:
        // inRequestedResourceID - A string providing the Resource ID that was used on the authorization request.
        // inRequestErrorCode - A string that displays the Adobe Pass error code, indicating the reason for the failure; possible values are
        //      "User Not Authenticated Error" and "User Not Authorized Error"; for more details, see "Callback error codes" below.
        // inRequestDetails - An additional descriptive string suitable for display, if available. Null if no string is supplied.
        // This can be used by an MVPD to pass custom error messages or sales-related messages. For example, if a subscriber is denied authorization for a resource,
        //      the MVPD could reply with an inRequestDetails message such as: "You currently do not have access to this channel in your package. If you would like to
        //      upgrade your package click *here*." The message is passed by Adobe Pass through this callback to the Programmer's site. The Programmer then has the option
        //      to display or ignore it. Adobe Pass can also use inRequestDetails to notify the Programmer of the condition that might have led to an error. For example,
        //      "A network error occurred when communicating with the provider's authorization service".
        var tokenRequestFailed = function(inRequestedResourceID, inRequestErrorCode, inRequestDetails){
            console.log('%c {{{{{{{{ tokenRequestFailed }}}}}}}} ', 'background-color:#ff0000; color:#ffffff', inRequestedResourceID, inRequestErrorCode, inRequestDetails);

            var $ = jQuery.noConflict();

            //grab errors endpoint
            $.get( errorsEndpoint, function( res ) {
              if( res.data && res.success === true){

                res.data.map(function(error){
                  //find 'generic' error from errors endpoint
                  if(error.name === 'generic'){

                    var placeholderMessage = '<div class="platform-error-border generic-message">';
                    placeholderMessage += '<h2>'+ ((error.messages.primary) ? error.messages.primary : '' ) +'</h2>';
                    placeholderMessage += '<ul>';
                    if(error.reasons){
                      error.reasons.map(function(reason){
                          placeholderMessage += '<li>'+ reason+'</li>';
                      });
                    }
                    placeholderMessage += '</ul>';
                    placeholderMessage += '<h3>'+ ((error.messages.secondary) ? error.messages.secondary : '' )+'</h3>';
                    placeholderMessage += '</div>';

                    //set error in dom
                    errorMessage(placeholderMessage);
                  }
                });
              }else{ //request for errors returns bad data
                errorMessage();
              }
            }).fail(function() {//request for errors fails
              errorMessage();
          });

          //placeholder message function
          function errorMessage(placeholderMessage){

            if (typeof placeholderMessage == 'undefined') {
              //backup message if request failed
              var placeholderMessage = '<div class="platform-error-border">';
              placeholderMessage += '<h2>Unfortunately it appears as if your user account is not authorized to view this content. This could be due to the following reasons:</h2>';
              placeholderMessage += '<ul>';
              placeholderMessage += '<li>This channel is not included in your paid TV subscription.</li>';
              placeholderMessage += '<li>Your subscription is for Internet only.</li>';
              placeholderMessage += '<li>Parental control settings may be blocking this content.</li>';
              placeholderMessage += '</ul>';
              placeholderMessage += '<h3>For further information, please contact your TV provider.</h3>';
              placeholderMessage += '</div>';
            }

            var errorMessage = inRequestDetails.length > 0 ? inRequestDetails.replace(/^https.*$/mg, "") : placeholderMessage; //Strip out URL - this assumes it's on a line by itself
            $('.platform-error').html(errorMessage).show();
            $('.platform-container').hide();

          }


        };

        // Called upon completion of checkPreauthorizedResources
        // returns available resource ID's for current MVPD
        //
        // Parameters:
        // authorizedResources - Provides array of resource ID's
        var preauthorizedResources = function(authorizedResources){
            var $ = jQuery.noConflict();

            console.log('%c {{{{{{{{ preauthorizedResources }}}}}}}} ', 'background-color:#00ff00; color:#000000', authorizedResources);

            //if premiere user (only for amc right now)
            if($.inArray(resource_adfree, authorizedResources) !== -1){

                //set cookie in browser that user is premiere/restricted
                createCookie(publishStateCookie, 'restricted', 1);
                var reload = readCookie('userStateRefresh');
                if(reload !== 'refresh'){
                    createCookie('userStateRefresh', 'refresh', 1);
                    location.reload();
                }
                console.log('%c {{{{{{{{ PREMIERE | %s cookie set }}}}}}}} ', 'background-color:gold; color:#000000', publishStateCookie, readCookie(publishStateCookie));
                console.log('%c {{{{{{{{ PREMIERE | authorized resources }}}}}}}} ', 'background-color:gold; color:#000000', authorizedResources);

                //trigger premiere user during preflight check
                triggerUserState('adfree');

            }else if($.inArray(resource_default, authorizedResources) !== -1){//if not premiere, check for regular network
                createCookie(publishStateCookie, 'public', 1);
                var reload = readCookie('userStateRefresh');
                if(reload !== 'refresh'){
                    createCookie('userStateRefresh', 'refresh', 1);
                    location.reload();
                }
                //triger default user state
                triggerUserState('auth');

            }else{ //user has network blocked (no authorized resources returned)
                createCookie(publishStateCookie, 'public', 1);
                //triger default user state
                triggerUserState('auth');

            }
        };

        // Called upon completion of a checkAuthentication() request. Passes the authentication status (1=authenticated or 0=not authenticated),
        // and a descriptive error message if any error occurred while attempting to determine the status (empty string on successful completion of the check).
        //
        // Parameters:
        // isAuthenticated - Provides authentication status: 1 (authenticated) or 0 (not authenticated).
        // errorCode - Any error that occurred when determining authentication status. An empty string if none.
        var setAuthenticationStatus = function(isAuthenticated, errorCode){
            console.log('%c {{{{{{{{ setAuthenticationStatus }}}}}}}} ', 'background-color:#00ff00; color:#000000', isAuthenticated);


            setUserAuth(isAuthenticated);
            if(typeof($pdk.controller) !== 'undefined'){
                $pdk.controller.dispatchEvent('amcn.pdk.events.setAuthenticationStatus', amcnPlatform.core.handler.getPlayerScope(), [amcnPlatform.core.handler.getPlayerScope()]);
            }

            var $ = jQuery.noConflict();
            if(isAuthenticated) {
                console.log('%c {{{{{{{{ checkPreauthorizedResources }}}}}}}} ', 'background-color:#00ff00; color:#000000');
                ae.checkPreauthorizedResources([resource_default,resource_adfree]);

                console.log('%c {{{{ User Authenticated }}}} ', 'background-color:#00ff00; color:#000000');
                ae.getSelectedProvider();

                // display authenticated status in login area
                amcnAdobeUI.displayAuthenticated();
            }
            else{
                console.log('%c {{{{ User Not Authenticated }}}} ', 'background-color:#00ff00; color:#000000');

                //trigger default user state
                triggerUserState('non_auth');

                // reset the MVPD param
                createCookie(amcnPlatformConfig.network + '-tve-authn', 'NonAuth');

                //remove cookie if is stuck
                eraseCookie(publishStateCookie);

                // janrain logged user, prompt the MVPD picker
                if(window.location.search.indexOf('onLogin=true') >= 0){
                    amcnAdobeUI.displayProviderDialog();
                }

                // set login links
                amcnAdobeUI.displayNotAuthenticated();
            }


            if(errorCode && errorCode != ''){
                console.log('%c {{{{ setAuthenticationStatus | Error }}}} ', 'background-color:#ff0000; color:#ffffff', errorCode);
            }
        };

        //Description: Callback triggered by the Access Enabler that delivers the metadata requested via a getMetadata() call.
        //
        // Parameters:
        // key: The name of the metadata for which the request was made.
        // args: This parameter is available only when the key is ‘TTL_AUTHZ’ or a User Metadata key. For ‘TTL_AUTHZ’, args is an array containing the resource id.
        //      For a User Metadata request, args is a Boolean value that specifies if the returned metadata is encrypted or not. For all other requests, args is null and should be ignored.
        // result: For simple requests (‘TTL_AUTHN’, ‘TTL_AUTHZ’, ‘DEVICEID’), result is a String (representing the Authentication TTL, Authorization TTL or Device ID).
        //      In case of a User Metadata request, result can be a primitive or JSON object representing the metadata payload. The exact structure of the user metadata objects is documented by Adobe.
        //
        // Triggered by: getMetadata()
        var setMetadataStatus = function(key, args, result){
            console.log('%c {{{{{{{{ setMetadataStatus }}}}}}}} ', 'background-color:#00ff00; color:#000000', key, args, result);
        };

        // Called when the selected MVPD requires an iFrame in which to display its authentication UI. You must implement this function in the script for your page that invokes login.
        var createIFrame = function(inWidth, inHeight){
            console.log('%c {{{{{{{{ createIFrame }}}}}}}} ', 'background-color:#00ff00; color:#000000');
        };

        // If you supply your own custom provider-selection UI, implement a simple interface that defines this callback function. Called when the login process is initiated.
        // The parameter is an array of Objects representing the requested MVPDs:
        // Your UI should use the display name (and optional logo) to provide the customer's choices, and send the associated ID for the chosen provider in the call to setSelectedProvider().
        var displayProviderDialog = function(providers){
            console.log('%c {{{{{{{{ displayProviderDialog }}}}}}}} ', 'background-color:#00ff00; color:#000000');

            // generate the provider list
            amcnAdobeUI.buildProviderDialog(providers);
        };

        // The getSelectedProvider() function returns its result to this callback function.
        //
        // Parameters:
        // MVPD The currently selected MVPD, or null if no MVPD was selected.
        // AE_State The result of authentication for the current customer, one of "New User", "User Not Authenticated", or "User Authenticated
        var selectedProvider = function(result){
            console.log('%c {{{{{{{{ selectedProvider }}}}}}}} ', 'background-color:#00ff00; color:#000000', result);

            var $ = jQuery.noConflict();
            if(result.MVPD == null) {
                setAuth('NonAuth');
            }
            else{
                setAuth(result.MVPD);
                createCookie(amcnPlatformConfig.network + '-tve-authn', result.MVPD);
            }

            amcnAdobeUI.displayProvider();
        };

        // Called to provide tracking data when specific events occur. You can use this, for example, to keep track of how many users have logged in with the same credentials.
        // Tracking is not currently configurable.
        var sendTrackingData = function(trackingEventType, trackingData){
            console.log('%c {{{{{{{{ sendTrackingData }}}}}}}} ', 'background-color:#00ff00; color:#000000', trackingEventType, trackingData);
        };

        // error detection and handling
        var logError = function(error){
            console.log('%c {{{{{{{{ AE ERROR }}}}}}}} ', 'background-color:#ff0000; color:#ffffff', error);

            // error - auth, but different device detected - requires re-auth
            if(error.errorId == 'SEC412'){
                // prompt to re-auth
                jQuery('.img-placeholder .loading-spinner').remove();
                jQuery('.img-placeholder .login').show();

                // remove logged in status image
                amcnAdobeUI.displayNotAuthenticated();
            }
        };

        return {
            entitlementLoaded: entitlementLoaded,
            setToken: setToken,
            tokenRequestFailed: tokenRequestFailed,
            setAuthenticationStatus: setAuthenticationStatus,
            preauthorizedResources: preauthorizedResources,
            setMetadataStatus: setMetadataStatus,
            createIFrame: createIFrame,
            displayProviderDialog: displayProviderDialog,
            selectedProvider: selectedProvider,
            sendTrackingData: sendTrackingData,
            logError: logError
        };
    };

    // main initialization function - determines if auth should be activated
    var maybeGenerateAuth = function(response){
        console.log('%c {{{{{{{{ maybeGenerateAuth }}}}}}}} ', 'background-color:#00ff00; color:#000000', response);
     
        var config_auth = response.data.player.playback.auth;

        if(config_auth === true){
            console.log('%c {{{{{{{{ maybeGenerateAuth | adding VideoConfigSet listener }}}}}}}} ', 'background-color:#00ff00; color:#000000');
            // register player for token updating
            $pdk.controller.addEventListener('VideoConfigSet', amcnPlatform.module.auth.generateAuthRequest, '*');
        }
        else if(config_auth === false){
           
                console.log('%c {{{{{{{{ maybeGenerateAuth | auth not required }}}}}}}} ', 'background-color:#00ff00; color:#000000');
                // auth is not required
                $pdk.controller.dispatchEvent('OnAuthReady', {type: 'auth', set: true, players: [response.data.player.instance]}, [response.data.player.instance]);

            
        }
    };

    // adds an auth token to  players as needed
    var addToken = function(token){
        console.log('%c {{{{{{{{ addToken }}}}}}}} ', 'background-color:#999999; color:#000000');

        var escapedToken = encodeURIComponent(token);

        // update all scoped players
        var players = amcnPlatform.core.handler.getStoredPlayers();
        for(var i = 0; i < players.length; i++){
            var playerConfig = players[i].getConfig();
            var playerInstance = playerConfig.instance;

            // update the stored releaseURL
            var releaseURL = playerConfig.settings.video.details.releaseURL;

            // check for existance of existing query params
            if (releaseURL.indexOf("?") >= 0){
                releaseURL += "&auth=" + escapedToken;
            }
            else{
                releaseURL += "?auth=" + escapedToken;
            }

            // load the updated release, with token appended
            $pdk.controller.loadReleaseURL(releaseURL, true, [playerInstance]);

            // fire event determining auth has been completed
            $pdk.controller.dispatchEvent('OnAuthReady', {type: 'auth', set: true, players: [playerInstance]}, [playerInstance]);
        }
    };

    // sets up for main auth request
    var generateAuthRequest = function(response){
        console.log('%c {{{{{{{{ generateAuthRequest }}}}}}}} ', 'background-color:#00ff00; color:#000000', response);

        console.log('getUserAuth', getUserAuth());

        // detect user's AuthN status
        if(getUserAuth() != true && getUserAuth() != 1){
            console.log('%c {{{{{{{{ generateAuthRequest > missing AuthN }}}}}}}} ', 'background-color:#00ff00; color:#000000');

            // fire missing auth event
            $pdk.controller.dispatchEvent('amcn.pdk.events.MissingAuth', {userAuth: getUserAuth(), players: [response.data]}, [response.data]);

            // hook onto listener again in condition where AuthN request completes AFTER this generateAuthRequest had executed
            $pdk.controller.addEventListener('amcn.pdk.events.setAuthenticationStatus', amcnPlatform.module.auth.generateAuthRequest, '*');

            return false;
        }

        // authorize and initialize player
        try{
            var player = amcnPlatformPlayers[response.data];
            var playerConfig = player.getConfig();
            var restricted_end = playerConfig.settings.video.restricted_end;
            console.log('restricted end', restricted_end);
            var date = new Date();
            var date_in_seconds = date.getTime() /1000;
            console.log('time in seconds', date_in_seconds);
             
            if(readCookie(publishStateCookie) == 'restricted' && date_in_seconds < restricted_end){
                var check_auth = true;
                
            } else {
                var check_auth = playerConfig.playback.auth;
                console.log('check auth', check_auth);

            }
             
            if(check_auth === true){
                console.log('%c {{{{{{{{ generateAuthRequest | getAuthorization > }}}}}}}} ', 'background-color:#00ff00; color:#000000');
                // determine rating type for auth request
                if(playerConfig.settings.video.details.custom.videoCategory == 'Movies-Auth'){
                    var rating = {
                        type: 'mpaa',
                        value: playerConfig.settings.video.details.custom.rating
                    };
                }
                else{
                    var rating = {
                        type: 'v-chip',
                        value: playerConfig.settings.video.details.videoRating
                    };
                }
 
                // generate the authz request MRSS based on video asset values
                var mrss = buildAuth(getResourceID(), playerConfig.settings.video.details.videoName, playerConfig.settings.video.details.videoPublicID, rating);
                 // execute the authorization request for the video asset
                ae.getAuthorization(mrss);
            }
            else{
                console.log('%c {{{{{{{{ generateAuthRequest | auth not required }}}}}}}} ', 'background-color:#00ff00; color:#000000');
            }
        }
        catch(err){
            console.log('%c {{{{ Video Auth Init Failed }}}} ', 'background-color:#ff0000; color:#ffffff', err);
        }

        // deregister the event handler for this scoped player
        $pdk.controller.removeEventListener('VideoConfigSet', generateAuthRequest, [response.data]);
    };

    // Generates the MRSS required in making the Adobe Pass authorization request for the video asset
    var buildAuth = function(resourceID, title, guid, rating){
        var mrss = '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">'+
                            '<channel>'+
                                '<title>'+resourceID+'</title>'+
                                '<item>'+
                                    '<title>'+title.replace('&', '&amp;')+'</title>'+
                                    '<guid>'+guid+'</guid>'+
                                    '<media:rating scheme="urn:'+rating.type+'">'+rating.value+'</media:rating>'+
                                '</item>'+
                            '</channel>'+
                        '</rss>';

        return mrss;
    };


    var triggerUserState = function(state){
        if(state == 'adfree'){
            jQuery(document).trigger('amcn.adobe.userstate.events.v1', {userLevel: 'adfree'})
        }else if(state == 'auth'){
            jQuery(document).trigger('amcn.adobe.userstate.events.v1', {userLevel: 'auth'});
        }else if(state == 'non_auth'){
            jQuery(document).trigger('amcn.adobe.userstate.events.v1', {userLevel: 'non_auth'});
        }
        console.log('%c {{{{{{{{ triggerUserState | %s }}}}}}}} ', 'background-color:gold; color:#000000', state);
    }


    // executes video specific logouts, and then logs out of Adobe Pass
    var logout = function(){
        // clear auth cookie
        eraseCookie(amcnPlatformConfig.network + '-tve-authn');
        eraseCookie(publishStateCookie);
        eraseCookie('userStateRefresh');
        ae.logout();
    };

    return {
        setRequestorID: setRequestorID,
        getRequestorID: getRequestorID,
        setAuth: setAuth,
        getAuth: getAuth,
        setUserAuth: setUserAuth,
        getUserAuth: getUserAuth,
        maybeGenerateAuth: maybeGenerateAuth,
        addToken: addToken,
        generateAuthRequest: generateAuthRequest,
        callbacks: callbacks,
        buildAuth: buildAuth,
        triggerUserState: triggerUserState,
        logout: logout
    };
}());

// register auth module, with maybeGenerateAuth method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.auth.maybeGenerateAuth);

// Adobe Pass callback handlers //

jQuery(document).ready(function(){
	var $ = jQuery.noConflict();

    var authCallbacks = amcnPlatform.module.auth.callbacks();

	// attach callbacks to auth module
	$(document).on("amcn.entitlementLoaded", function(event){
		authCallbacks.entitlementLoaded();
	});
	$(document).on("amcn.setToken", function(event, inRequestedResourceID, inToken){
		authCallbacks.setToken(inRequestedResourceID, inToken);
	});
	$(document).on("amcn.tokenRequestFailed", function(event, inRequestedResourceID, inRequestErrorCode, inRequestDetails){
		authCallbacks.tokenRequestFailed(inRequestedResourceID, inRequestErrorCode, inRequestDetails);
	});
	$(document).on("amcn.setAuthenticationStatus", function(event, isAuthenticated, errorCode){
		authCallbacks.setAuthenticationStatus(isAuthenticated, errorCode);
	});
    $(document).on("amcn.preauthorizedResources", function(event, authorizedResources){
        authCallbacks.preauthorizedResources(authorizedResources);
    });
	$(document).on("amcn.setMetadataStatus", function(event, key, args, result){
		authCallbacks.setMetadataStatus(key, args, result);
	});
	$(document).on("amcn.createIFrame", function(event, inWidth, inHeight){
		authCallbacks.createIFrame(inWidth, inHeight);
	});
	$(document).on("amcn.displayProviderDialog", function(event, providers){
		authCallbacks.displayProviderDialog(providers);
	});
	$(document).on("amcn.selectedProvider", function(event, result){
		authCallbacks.selectedProvider(result);
	});
	$(document).on("amcn.sendTrackingData", function(event, trackingEventType, trackingData){
		authCallbacks.sendTrackingData(trackingEventType, trackingData);
	});
	$(document).on("amcn.logError", function(event, error){
		authCallbacks.logError(error);
	});

	// special listener for the Janrain inline usage - overrides popup
	$(document).on("_amcn_janrain.showMVPDScreen", function(event, targetID){
		ae.getAuthentication();
	});
});

// pass callbacks along to main amcnAdobePass handler
function entitlementLoaded(){
	jQuery(document).trigger("amcn.entitlementLoaded");
}

function setToken(inRequestedResourceID, inToken){
	jQuery(document).trigger("amcn.setToken", [inRequestedResourceID, inToken]);
}

function tokenRequestFailed(inRequestedResourceID, inRequestErrorCode, inRequestDetails){
	jQuery(document).trigger("amcn.tokenRequestFailed", [inRequestedResourceID, inRequestErrorCode, inRequestDetails]);
}

function setAuthenticationStatus(isAuthenticated, errorCode){
	jQuery(document).trigger("amcn.setAuthenticationStatus", [isAuthenticated, errorCode]);
}

function preauthorizedResources(authorizedResources){
	jQuery(document).trigger("amcn.preauthorizedResources", [authorizedResources]);
}

function setMetadataStatus(key, args, result){
	jQuery(document).trigger("amcn.setMetadataStatus", [key, args, result]);
}

function createIFrame(inWidth, inHeight){
	jQuery(document).trigger("amcn.createIFrame", [inWidth, inHeight]);
}

function displayProviderDialog(providers){
	jQuery(document).trigger("amcn.displayProviderDialog", [providers]);
}

function selectedProvider(result){
	jQuery(document).trigger("amcn.selectedProvider", [result]);
}

function sendTrackingData(trackingEventType, trackingData){
	jQuery(document).trigger("amcn.sendTrackingData", [trackingEventType, trackingData]);
}

// error callback bound to Access Enabler errorEvent
function logError(error){
	jQuery(document).trigger("amcn.logError", [error]);
}
