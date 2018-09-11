var amcnPlatform = amcnPlatform || {};

// register events module
amcnPlatform.namespace('amcnPlatform.module.resume');
amcnPlatform.module.resume = (function(){

    var cookieName = 'amcn_pdk_resume_token';

    var endpoints = {
        tokenEndpoint: '/api/resume/v1/token',
    	listEndpoint: '/api/resume/v1/list',
    	episodeEndpoint: '/api/resume/v1/search',
    };

    var eventData = 'modules.resume.resumeSettings';
    var resumeSettings = function(){
        var config = {
            context: 'full-episodes',
            bookmarkResult: null,
            bookmarkRetrieveFailed: false,

            startOffset: 0,
            lastUpdatedPercentage: 0,
            percentageInterval: 2,
            maxResumePercentage: 98,

            account: {
                ID: null,
                num: null,
            },

            media: {
                ID: null,
                duration: 0,
            },

            status: {
                block: false,
                enabled: false,
            },

            userToken: null,
            userID: null,

            resumeStarted: false,
            contentStarted: false
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

    // set main listeners for resume setup
    var init = function(response){
        console.log('%c //////// resume | init //////// ', 'background-color:#660066; color:#ffffff', response);

        // check for asset resume status
        if(response.data.player.playback.resume === true){
            console.log('%c //////// resume | init | active //////// ', 'background-color:#660066; color:#ffffff');

            var cardFunctions = new card();
            var tokensFunctions = new tokens();

            // config setup
            $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', initializePlayerSettings, '*');
            // card initialization
            $pdk.controller.addEventListener('amcn.pdk.events.OnPlayerLoaded', cardFunctions.resumeCard, '*');
			// set the asset details in the config
            $pdk.controller.addEventListener('amcn.pdk.events.OnSetVideoValues', setAssetData, '*');
			// register event listener for the token completion
            $pdk.controller.addEventListener('amcn.pdk.events.resume.setUserTokenComplete', resumeStart, '*');
            // retrieve the user token
            $pdk.controller.addEventListener('amcn.pdk.events.resume.OnSetAssetDataComplete', tokensFunctions.getToken, '*');
            // force disable when on auth content, and user is lacking AuthN
            $pdk.controller.addEventListener('amcn.pdk.events.MissingAuth', missingAuth, '*');

			// event listener for Janrain logout
			jQuery(document).on('amcn.onJanrainLogout', userLogout);
		}
		else{
            console.log('%c //////// resume | init | inactive //////// ', 'background-color:#660066; color:#ffffff');
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

    // add player page settings data to the player object
    var initializePlayerSettings = function(response){
        console.log('%c //////// resume | initializePlayerSettings > //////// ', 'background-color:#660066; color:#ffffff', response);

        var resumeSettingsTemplate = new resumeSettings();

        var player = getPlayerInstance(response.data.player.instance);

        // intial setting of flag data
        player.addData(eventData, resumeSettingsTemplate);
    };

    // set value for platform asset
	var setAssetData = function(response){
        console.log('%c //////// resume | setAssetData > //////// ', 'background-color:#660066; color:#ffffff', response);

        var instance = response.data.player.instance;

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // set asset account info
        var account = {
            ID: response.data.player.settings.account.account_id,
            num: response.data.player.settings.account.account_id_num
        };
        flags.setValue('account', account);

        // set asset media info
        var media = {
            ID: 'urn:theplatform:pdk:media:'+instance,
            duration: response.data.player.settings.video.details.duration / 1000
        }
        flags.setValue('media', media);

        // fire event to notify that asset data (including media ID) is ready
        $pdk.controller.dispatchEvent('amcn.pdk.events.resume.OnSetAssetDataComplete', {instance: instance}, amcnPlatform.core.handler.getPlayerScope());
	};

    // allow for resume start when bookmark restored
    var resumeStart = function(response){
        console.log('%c //////// resume | resumeStart //////// ', 'background-color:#660066; color:#ffffff', response);

        var instance = response.data.instance;

		try{
            var bookmarksFunctions = new bookmarks();

			// check bookmark status for this video
			bookmarksFunctions.getResumeBookmark(instance);
		}
		catch(error){
            console.log('%c //////// resume | resumeStart > getResumeBookmark error > //////// ', 'background-color:#660066; color:#ffffff', error);

            // disable resume functionality
			disable(instance);

            // fire event determining resume has been completed
            $pdk.controller.dispatchEvent('OnResumeReady', {type: 'resume', set: true, players: [instance]}, [instance]);
		}

		// should only run once, remove the event listener
        $pdk.controller.removeEventListener('amcn.pdk.events.resume.setUserTokenComplete', resumeStart, [instance]);
	};

    // clean up after Janrain session ends
    var userLogout = function(event, sessionInfo){
        console.log('%c //////// resume | janrain > userLogout //////// ', 'background-color:#660066; color:#ffffff', event, sessionInfo);

        var tokensFunctions = new tokens();
        tokensFunctions.deleteToken();
    };

	// sets all resume event listeners for saving bookmarks
	var enable = function(instance){
        console.log('%c //////// resume | enable //////// ', 'background-color:#660066; color:#ffffff', instance);

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // update flag
        var status = flags.getValue('status');
        status.enabled = true;
        flags.setValue('status', status);

        var saveFunctions = new save();
        var bookmarksFunctions = new bookmarks();

		// pause listener for resume data
		$pdk.controller.addEventListener('amcn.pdk.events.OnMediaPause', saveFunctions.pauseUpdate, [instance]);
		// progress based resume data
		$pdk.controller.addEventListener('amcn.pdk.events.OnMediaPlaying', saveFunctions.progressUpdate, [instance]);
		// updates last updated to scrub point, blocks saving for an additional interval after scrubbing
		$pdk.controller.addEventListener('amcn.pdk.events.OnMediaSeek', saveFunctions.scrubDetect, [instance]);
		// event handler for media complete, to delete bookmark and store in janrain
		$pdk.controller.addEventListener('amcn.pdk.events.OnReleaseEnd', bookmarksFunctions.clearFinished, [instance]);

        // custom ad start/end events
        $pdk.controller.addEventListener('amcn.pdk.events.OnAdStarted', onAdStarted, [instance]);
        $pdk.controller.addEventListener('amcn.pdk.events.OnAdEnded', onAdEnded, [instance]);
	};

	// purges all resume event listeners
	var disable = function(instance){
		console.log('%c //////// resume | disable //////// ', 'background-color:#660066; color:#ffffff', instance);

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // update flag
        var status = flags.getValue('status');
        status.enabled = false;
        flags.setValue('status', status);

        var cardFunctions = new card();
        var saveFunctions = new save();
        var bookmarksFunctions = new bookmarks();

        $pdk.controller.removeEventListener('amcn.pdk.events.OnPlayerLoaded', cardFunctions.resumeCard, [instance]);
		$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaStart', bookmarksFunctions.offsetResume, [instance]);
		$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaPause', saveFunctions.pauseUpdate, [instance]);
		$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaPlaying', saveFunctions.progressUpdate, [instance]);
		$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaSeek', saveFunctions.scrubDetect, [instance]);
		$pdk.controller.removeEventListener('amcn.pdk.events.OnReleaseEnd', bookmarksFunctions.clearFinished, [instance]);

        $pdk.controller.removeEventListener('amcn.pdk.events.OnSetVideoValues', setAssetData, [instance]);
        $pdk.controller.removeEventListener('amcn.pdk.events.resume.setUserTokenComplete', resumeStart, [instance]);

        $pdk.controller.removeEventListener('amcn.pdk.events.OnAdStarted', onAdStarted, [instance]);
        $pdk.controller.removeEventListener('amcn.pdk.events.OnAdEnded', onAdEnded, [instance]);
	};

    // clear event listener for saving bookmarks during ad breaks
    var onAdStarted = function(response){
        console.log('%c //////// resume | onAdStarted //////// ', 'background-color:#660066; color:#ffffff', response);

        var player = getPlayerInstance(response.data.player.instance);
        var flags = player.getData(eventData);

        // get status flag
        var status = flags.getValue('status');

        var saveFunctions = new save();

        if(status.enabled == true){
            console.log('%c //////// resume | onAdStarted > disabling listeners //////// ', 'background-color:#660066; color:#ffffff', response.data.player.instance);
            $pdk.controller.removeEventListener('amcn.pdk.events.OnMediaPause', saveFunctions.pauseUpdate, [response.data.player.instance]);
            $pdk.controller.removeEventListener('amcn.pdk.events.OnMediaPlaying', saveFunctions.progressUpdate, [response.data.player.instance]);
        }
    };

    // restore listener for content
    var onAdEnded = function(response){
        console.log('%c //////// resume | onAdEnded //////// ', 'background-color:#660066; color:#ffffff', response);

        var player = getPlayerInstance(response.data.player.instance);
        var flags = player.getData(eventData);

        // get status flag
        var status = flags.getValue('status');

        var saveFunctions = new save();

        if(status.enabled == true){
            console.log('%c //////// resume | onAdEnded > activating listeners //////// ', 'background-color:#660066; color:#ffffff', response.data.player.instance);
            $pdk.controller.addEventListener('amcn.pdk.events.OnMediaPause', saveFunctions.pauseUpdate, [response.data.player.instance]);
            $pdk.controller.addEventListener('amcn.pdk.events.OnMediaPlaying', saveFunctions.progressUpdate, [response.data.player.instance]);
        }
    };

    // force disable resume when user is missing AuthN on an auth required asset
    var missingAuth = function(response){
        console.log('%c //////// resume | missingAuth //////// ', 'background-color:#660066; color:#ffffff', response);

        // retrieve player array
        var players = response.data.players;

        // force disable each player
        for(i = 0; i < players.length; i++){
            disable(players[i]);
            $pdk.controller.dispatchEvent('OnResumeReady', {type: 'resume', set: true, players: [players[i]]}, [players[i]]);
        }
    }

	// windowing for resume saving, to avoid multiple saves concurrently
	var blockResume = function(instance){
        console.log('%c //////// resume | blockResume //////// ', 'background-color:#660066; color:#ffffff', instance);

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // update flag
        var status = flags.getValue('status');
        status.block = true;
        flags.setValue('status', status);
	};
	var unblockResume = function(instance){
        console.log('%c //////// resume | unblockResume //////// ', 'background-color:#660066; color:#ffffff', instance);

        var player = getPlayerInstance(instance);
        var flags = player.getData(eventData);

        // update flag
        var status = flags.getValue('status');
        status.block = false;
        flags.setValue('status', status);
	};

    var bookmarks = function(){

        // bookmark management
		var getResumeBookmark = function(instance){
            console.log('%c //////// resume | getResumeBookmark //////// ', 'background-color:#660066; color:#ffffff', instance);

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            // retrieve config info
            var context = flags.getValue('context');
            var userToken = flags.getValue('userToken');
            var account = flags.getValue('account');
            var media = flags.getValue('media');

			// check for existance of bookmark
			$pdk.bookmarks.hasBookmark(context, userToken, account.num, media.ID, true, {
				onSuccess:function(result){
                    console.log('%c //////// resume | getResumeBookmark > hasBookmark > onSuccess //////// ', 'background-color:#660066; color:#ffffff', result);

					if(result){
                        console.log('%c //////// resume | getResumeBookmark > hasBookmark > onSuccess > result //////// ', 'background-color:#660066; color:#ffffff');
						// bookmark exists, retrieve it
						$pdk.bookmarks.getBookmark(context, userToken, account.num, media.ID, {
							onSuccess: function(result){
                                console.log('%c //////// resume | getResumeBookmark > getBookmark > onSuccess //////// ', 'background-color:#660066; color:#ffffff', result);

								// check for valid bookmark data
								if(result && result.position !== 0 && result.position !== null){
									// initialize block to true prior to player running
									blockResume(instance);

									// store result data
                                    flags.setValue('bookmarkResult', result);

                                    var cardFunctions = new card();

									// attach UI event to display resume card prompt
                                    cardFunctions.showUIPrompt(instance);
								}
								else{
									// attach main events for saving immediately - no resume dialog
									enable(instance);
								}
							},
							onFailure: function(error){
								console.log('%c //////// resume | getResumeBookmark > getBookmark > onFailure //////// ', 'background-color:#660066; color:#ffffff', error);

								throw error;
							}
						});
					}
					else{
                        console.log('%c //////// resume | getResumeBookmark > hasBookmark > onSuccess > no result //////// ', 'background-color:#660066; color:#ffffff');
						// attach main events for saving immediately - no resume dialog
						enable(instance);

						// normal block status
						unblockResume(instance);

                        // fire event determining resume has been completed
                        $pdk.controller.dispatchEvent('OnResumeReady', {type: 'resume', set: true, players: [instance]}, [instance]);
					}
				},
				onFailure: function(error){
                    console.log('%c //////// resume | getResumeBookmark > hasBookmark > onFailure //////// ', 'background-color:#660066; color:#ffffff', error);

                    var tokensFunctions = new tokens();

					// remove token & cookie
					tokensFunctions.deleteToken();

                    var bookmarkRetrieveFailed = flags.getValue('bookmarkRetrieveFailed');

					// attempt again - for errors w/ expired tokens
					if(!bookmarkRetrieveFailed){
                        console.log('%c //////// resume | getResumeBookmark > hasBookmark > onFailure > re-running getToken //////// ', 'background-color:#660066; color:#ffffff');

                        // update flag
						flags.setValue('bookmarkRetrieveFailed', true);

						// retrieve fresh user token
						tokensFunctions.getToken({instance: instance});
					}
					else{
                        console.log('%c //////// resume | getResumeBookmark > hasBookmark > onFailure > second token failed, exiting //////// ', 'background-color:#660066; color:#ffffff');
						throw error;
					}
				}
			});
		};

        // removes completed bookmarks when asset is finished
		var clearFinished = function(response){
            console.log('%c //////// resume | clearFinished //////// ', 'background-color:#660066; color:#ffffff', response);

            var instance = response.data.player.instance;

			try{
                var bookmarksFunctions = new bookmarks();

				// remove the bookmark
				bookmarksFunctions.deleteResumeBookmark(instance, 'complete', false);
			}
			catch(error){
                console.log('%c //////// resume | clearFinished > error //////// ', 'background-color:#660066; color:#ffffff', error);
			}
		};

        // deletes bookmark directly
		var deleteResumeBookmark = function(instance, status, externalMediaID){
            console.log('%c //////// resume | deleteResumeBookmark //////// ', 'background-color:#660066; color:#ffffff', instance, status, externalMediaID);

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);
			var bookmarkMediaID;

			// normal usage
			if(externalMediaID === false){
                var media = flags.getValue('media');
				bookmarkMediaID = media.ID;
			}
			else{
				// validate externalMediaID - urn:theplatform:pdk:media: + 12 digits
				if(externalMediaID.match(/^urn:theplatform:pdk:media:(\d){12}?$/gi)){
					bookmarkMediaID = externalMediaID;
				}
				else{
					throw 'Invalid media ID provided';
				}
			}

            // retrieve config info
            var context = flags.getValue('context');
            var userToken = flags.getValue('userToken');
            var account = flags.getValue('account');

			$pdk.bookmarks.removeBookmark(context, userToken, account.num, bookmarkMediaID, {
				onSuccess:function(result){
                    console.log('%c //////// resume | deleteResumeBookmark > removeBookmark > onSuccess //////// ', 'background-color:#660066; color:#ffffff', result);

					// push into Janrain for permanent view history storage
					if(status == 'complete'){
						_amcn_janrain.addVideoHistory(bookmarkMediaID, {complete: true}, function(response){
                            console.log('%c //////// resume | deleteResumeBookmark > removeBookmark > onSuccess > addVideoHistory //////// ', 'background-color:#660066; color:#ffffff', response);
						});
					}

				},
				onFailure:function(error){
                    console.log('%c //////// resume | deleteResumeBookmark > removeBookmark > onFailure //////// ', 'background-color:#660066; color:#ffffff', error);
					throw error;
				}
			});
		};

        // updates a bookmark value
		var updateResumeBookmark = function(instance, mediaTime, mediaCompletePercent){
            console.log('%c //////// resume | updateResumeBookmark //////// ', 'background-color:#660066; color:#ffffff', instance, mediaTime, mediaCompletePercent);

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            // retrieve config info
            var context = flags.getValue('context');
            var userToken = flags.getValue('userToken');
            var account = flags.getValue('account');
            var media = flags.getValue('media');

			$pdk.bookmarks.updateBookmark(context, userToken, account.num, media.ID, mediaTime, media.duration, {
				onSuccess: function(result){
                    console.log('%c //////// resume | updateResumeBookmark > onSuccess //////// ', 'background-color:#660066; color:#ffffff', result, mediaCompletePercent);

					// update the percentage
                    flags.setValue('lastUpdatedPercentage', mediaCompletePercent);

					// normal block status
					unblockResume(instance);
				},
				onFailure: function(error){
                    console.log('%c //////// resume | updateResumeBookmark > onFailure //////// ', 'background-color:#660066; color:#ffffff', error);

					// normal block status
					unblockResume(instance);
					// immediately remove listener
					$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaPlaying', save.progressUpdate, [instance]);

					throw error;
				}
			});

		};

        return {
            getResumeBookmark: getResumeBookmark,
            clearFinished: clearFinished,
            deleteResumeBookmark: deleteResumeBookmark,
            updateResumeBookmark: updateResumeBookmark
        };
    };

    var save = function(){
        // registers an updated bookmark when user pauses the video
		var pauseUpdate = function(response){
            console.log('%c //////// resume | pauseUpdate //////// ', 'background-color:#660066; color:#ffffff', response);

            var instance = response.data.player.instance;

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            var userToken = flags.getValue('userToken');

			// ensure the user token is available
			if(userToken !== null){
				// calculate time values
				var mediaTime = response.data.eventResponse.data.clip.mediaTime / 1000;
				var mediaCompletePercent = (response.data.eventResponse.data.clip.mediaTime / response.data.eventResponse.data.clip.mediaLength) * 100;
				// prevent rapid firing save
				var percentageThreshold = flags.getValue('lastUpdatedPercentage') + .1;

                var status = flags.getValue('status');

                console.log('%c //////// resume | pauseUpdate > saving //////// ', 'background-color:#660066; color:#ffffff', mediaTime, status.block, mediaCompletePercent, percentageThreshold);

				if(!status.block && mediaCompletePercent > percentageThreshold){
					try{
						// blocking on - prevents bookmark running multiple times
						blockResume(instance);

                        var bookmarksFunctions = new bookmarks();

						bookmarksFunctions.updateResumeBookmark(instance, mediaTime, mediaCompletePercent);

						// fire the resume save event
						jQuery(document).trigger("amcn.pdk.events.ResumeSave", [Math.floor(mediaCompletePercent)]);
					}
					catch(error){
                        console.log('%c //////// resume | pauseUpdate > unable to store bookmark //////// ', 'background-color:#660066; color:#ffffff', error);

						// disable the event listeners
						disable(instance);
					}
				}
				else{
                    console.log('%c //////// resume | pauseUpdate > skipping pause save, too fast //////// ', 'background-color:#660066; color:#ffffff');
				}
			}
			else{
                console.log('%c //////// resume | pauseUpdate > no user token found, disabling //////// ', 'background-color:#660066; color:#ffffff');
				// continue without resume, remove listeners
				disable(instance);
			}
		};

		// handles progress based resume updates
		var progressUpdate = function(response){
            // console.log('%c //////// resume | progressUpdate > //////// ', 'background-color:#66ff66; color:#ffffff', response);

            var instance = response.data.player.instance;

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            var userToken = flags.getValue('userToken');

			// ensure the user token is available
			if(userToken !== null){
				var mediaCompletePercent = response.data.eventResponse.data.percentCompleteAggregate;

                var lastUpdatedPercentage = flags.getValue('lastUpdatedPercentage');
                var percentageInterval = flags.getValue('percentageInterval');

				// set baseline updated percentage
				if(lastUpdatedPercentage === 0){
                    console.log('%c //////// resume | progressUpdate > resume percent default, setting to > //////// ', 'background-color:#660066; color:#ffffff', mediaCompletePercent);

                    // update the percentage
                    flags.setValue('lastUpdatedPercentage', mediaCompletePercent)

					return;
				}

				// determine next percentage threshold to run a bookmark update
				var percentageThreshold = lastUpdatedPercentage + percentageInterval;

                var status = flags.getValue('status');

				if(!status.block && mediaCompletePercent > percentageThreshold){
                    // time in seconds
					var mediaTime = response.data.eventResponse.data.currentTimeAggregate / 1000;

					console.log('%c //////// resume | progressUpdate > saving progress //////// ', 'background-color:#660066; color:#ffffff', mediaTime, mediaCompletePercent);

					try{
						// blocking on - prevents bookmark running multiple times
						blockResume(instance);

                        var bookmarksFunctions = new bookmarks();

						bookmarksFunctions.updateResumeBookmark(instance, mediaTime, mediaCompletePercent);

						// fire the resume save event
						jQuery(document).trigger("amcn.pdk.events.ResumeSave", [Math.floor(mediaCompletePercent)]);
					}
					catch(error){
                        console.log('%c //////// resume | progressUpdate > unable to save //////// ', 'background-color:#660066; color:#ffffff', error);

						// disable the event listeners
						disable(instance);
					}
				}
			}
			else{
                console.log('%c //////// resume | progressUpdate > no user token - disabling //////// ', 'background-color:#660066; color:#ffffff');

				// continue without resume, remove listeners
				disable(instance);
			}
		};

		// prevents bookmark saving for additional interval after scrubbing, and resets point if user scrubs backwards
		var scrubDetect = function(response){
            console.log('%c //////// resume | scrubDetect > blocking //////// ', 'background-color:#660066; color:#ffffff', response);

            var instance = response.data.player.instance;

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

			// blocking on - prevents bookmark from running at same time as the percentage changing
			blockResume(instance);

			// move last updated to this scrub end point
            flags.setValue('lastUpdatedPercentage', response.data.eventResponse.data.end.percentCompleteAggregate);

			// normal block status
			unblockResume(instance);
		};

        return {
            pauseUpdate: pauseUpdate,
            progressUpdate: progressUpdate,
            scrubDetect: scrubDetect
        };
    };

    var card = function(){
        // display the resume card, with resume/restart prompt
		var showUIPrompt = function(instance){
            console.log('%c //////// resume | showUIPrompt //////// ', 'background-color:#660066; color:#ffffff', instance);

            // fire event determining resume has been completed
            $pdk.controller.dispatchEvent('OnResumeReady', {type: 'resume', set: true, autoplay: false, players: [instance]}, [instance]);

			// display the resume card
			$pdk.controller.showPlayerCard('forms', 'tpResumePlaybackCard', 'urn:theplatform:pdk:area:player', {}, [instance]);
		};

        // handles submission of card and determins if player resumes, or deletes bookmark
		var doSubmitForm = function(instance, resume){
            console.log('%c //////// resume | doSubmitForm //////// ', 'background-color:#660066; color:#ffffff', instance, resume);

			// force mobile to write player for seek purposes
			if($pdk.isIOS || $pdk.isAndroid){
				$pdk.controller.writePlayer("", true, amcnPlatform.core.handler.getPlayerScope());
			}

            var bookmarksFunctions = new bookmarks();

			if(resume){
                console.log('%c //////// resume | doSubmitForm > resume //////// ', 'background-color:#660066; color:#ffffff');

                var player = getPlayerInstance(instance);
                var flags = player.getData(eventData);

                // update flag
                var bookmarkResult = flags.getValue('bookmarkResult');
                var maxResumePercentage = flags.getValue('maxResumePercentage');

				// calculate percentage offset
				var offsetPercent = (bookmarkResult.position / bookmarkResult.total) * 100;

				if(offsetPercent < maxResumePercentage){
                    console.log('%c //////// resume | doSubmitForm > resuming playback > //////// ', 'background-color:#660066; color:#ffffff', offsetPercent);

					// fire the resume event
					jQuery(document).trigger("amcn.pdk.events.UserResume", [Math.floor(offsetPercent)]);

					// custom PDK event
					$pdk.controller.dispatchEvent('resume.OnResume', bookmarkResult, [instance]);

					// block resume while scrubbing to resume point
					blockResume(instance);

                    // set listener for release start to set up proper offset
					$pdk.controller.addEventListener('amcn.pdk.events.OnMediaStart', offsetResume, [instance]);
				}
				// out of max resume limit
				else{
                    console.log('%c //////// resume | doSubmitForm > skipping resume, past max % //////// ', 'background-color:#660066; color:#ffffff');
					try{
						// delete this bookmark and archive?
						bookmarksFunctions.deleteResumeBookmark(instance, 'complete', false);
					}
					catch(error){
                        console.log('%c //////// resume | doSubmitForm > skipping resume > delete bookmark failed > //////// ', 'background-color:#660066; color:#ffffff', error);
					}
				}
			}
			else{
				try{
                    console.log('%c //////// resume | doSubmitForm > clearing bookmark //////// ', 'background-color:#660066; color:#ffffff');

					// clear bookmark for this video
					bookmarksFunctions.deleteResumeBookmark(instance, 'restart', false);

					// fire restart event
					jQuery(document).trigger("amcn.pdk.events.UserRestart", []);
				}
				catch(error){
                    console.log('%c //////// resume | doSubmitForm > clearing bookmark failed > //////// ', 'background-color:#660066; color:#ffffff', error);
				}
			}

			// attach main events for saving since the resume window is complete
			enable(instance);

			// end resume bookmark blocking
			unblockResume(instance);

			// auto-play the video - need tiny offset, otherwise ad stops
            if(!($pdk.isIOS || $pdk.isAndroid)){
				// setTimeout(function(){ $pdk.controller.clickPlayButton([instance]); }, 1);
                setTimeout(function(){ amcnPlatform.module.autoplay.maybeAutoPlay(); }, 1);
			}
		};

		// skip to the percentage once release started
		var listener = function(response){
            console.log('%c //////// resume | listener > //////// ', 'background-color:#660066; color:#ffffff', response);

			$pdk.controller.removeEventListener('amcn.pdk.events.OnReleaseStart', listener, '*');

            var offset = config.bookmarkResult.position * 1000;

            console.log('%c //////// resume | listener > marking offset //////// ', 'background-color:#660066; color:#ffffff', offset);

            config.lastUpdatedPercentage = offset;
            config.startOffset = offset;

            // set the offset
            $pdk.controller.addEventListener('amcn.pdk.events.OnMediaStart', offsetResume, '*');
		};

        // sets playback to the resume point on video initialization
        var offsetResume = function(response){
            console.log('%c //////// resume | offsetResume //////// ', 'background-color:#660066; color:#ffffff', response);

            var instance = response.data.player.instance;

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            // update flag
            var bookmarkResult = flags.getValue('bookmarkResult');
            var resumeStarted = flags.getValue('resumeStarted');

            var offset = bookmarkResult.position * 1000;

            flags.setValue('lastUpdatedPercentage', offset);
            flags.setValue('startOffset', offset);

			// check against ads, should be first non-ad clip
			if(!(response.data.eventResponse.data.title == 'ad' || response.data.eventResponse.data.baseClip.isAd) && !resumeStarted){
                console.log('%c //////// resume | offsetResume > setting offset //////// ', 'background-color:#660066; color:#ffffff', offset);

                // adjust to position for playback
				$pdk.controller.seekToPosition(offset, [instance]);
				flags.setValue('resumeStarted', true);

				// remove the listener
				$pdk.controller.removeEventListener('amcn.pdk.events.OnMediaStart', offsetResume, [instance]);
			}
		};

        // HTML rendering of resume card
        var resumeCard = function(response){
            console.log('%c //////// resume | register > resumeCard //////// ', 'background-color:#660066; color:#ffffff', response);

            var html = '<div class="tpPlayerCard tpResumePlaybackCard">' +
                            '<div class="tpResumePlaybackCardInner">' +
                                '<div class="resume-message">${message}</div>' +
                                '<div class="resume-buttons">' +
                                    '<div class="restart">Restart</div>' +
                                    '<div class="resume">Resume</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>';

            // custom presenter - for form submission handling
            var presenter = {
                show: function(initVars){
                    console.log('%c //////// resume | register > resumeCard > show > //////// ', 'background-color:#660066; color:#ffffff', initVars);
                    var instance = initVars.player.scopes;

                    $pdk.jQuery(initVars.card).find(".resume-buttons .restart").click(function(){
                        console.log('%c //////// resume | register > resumeCard > RESTART //////// ', 'background-color:#660066; color:#ffffff');
                        doSubmitForm(instance, false);
                        $pdk.controller.hidePlayerCard('forms', 'tpResumePlaybackCard', [instance]);
                    });

                    $pdk.jQuery(initVars.card).find(".resume-buttons .resume").click(function(){
                        console.log('%c //////// resume | register > resumeCard > RESUME //////// ', 'background-color:#660066; color:#ffffff');
                        doSubmitForm(instance,true);
                        $pdk.controller.hidePlayerCard('forms', 'tpResumePlaybackCard', [instance]);
                    });
                },
                hide: function(){}
            };

            $pdk.controller.addPlayerCard('forms', 'tpResumePlaybackCard', html, 'urn:theplatform:pdk:area:player', {message: 'Would you like to resume watching \'${release.title}\' from where you left off?'}, presenter, 99, amcnPlatform.core.handler.getPlayerScope());
        };

        return {
            showUIPrompt: showUIPrompt,
            doSubmitForm: doSubmitForm,
            listener: listener,
            resumeCard: resumeCard
        };
	};

	var tokens = function(){
		// user token management
		var getToken = function(response){
            console.log('%c //////// resume | getToken //////// ', 'background-color:#660066; color:#ffffff', response);

            var instance = response.data.instance;

			// check for stored token
			var storedToken = retrieveToken();

			if(storedToken && storedToken.length){
                console.log('%c //////// resume | getToken > existing user token found > //////// ', 'background-color:#660066; color:#ffffff', storedToken);
				setUserToken(instance, storedToken);
			}
			else{
                console.log('%c //////// resume | getToken > generating new user token //////// ', 'background-color:#660066; color:#ffffff');

                var player = getPlayerInstance(instance);
                var flags = player.getData(eventData);

                var usersFunctions = new users();

				// check for user ID
				var idFound = usersFunctions.checkUserID(instance);

                // disable and begin playback
                if(!idFound){
                    console.log('%c //////// resume | getToken > unable to retrieve User ID, exiting //////// ', 'background-color:#660066; color:#ffffff');
                    disable(instance);

                    // fire event determining resume has been completed
                    $pdk.controller.dispatchEvent('OnResumeReady', {type: 'resume', set: true, players: [instance]}, [instance]);

                    return;
                }

                var userID = flags.getValue('userID');

				// request against endpoint to generate a new token
				jQuery.ajax({
					url: endpoints.tokenEndpoint,
					data: {
						uid: userID
					},
					success: function(data){
                        console.log('%c //////// resume | getToken > resumeToken > //////// ', 'background-color:#660066; color:#ffffff', data);

						var response = data;

						// set the token
						if(response.success && response.data.token != null && response.data.token != ''){
                            console.log('%c //////// resume | getToken > resumeToken > setting token //////// ', 'background-color:#660066; color:#ffffff');

                            var tokensFunctions = new tokens();

							// set token via the PDK controller
							tokensFunctions.setUserToken(instance, response.data.token);

                            enable(instance);
						}
						else{
                            console.log('%c //////// resume | getToken > resumeToken > token failure //////// ', 'background-color:#660066; color:#ffffff', response.message);

							// disable the resume functionality by removing the event listeners
							disable(instance);
						}
					},
					error: function(jqXHR, status, error){
                        console.log('%c //////// resume | getToken > resumeToken > no token available //////// ', 'background-color:#660066; color:#ffffff', error, status);

						// disable the resume functionality by removing the event listeners
						disable(instance);
					}
				});
			}
		};

		// retrieve the platform user token from storage
		var retrieveToken = function(){
            console.log('%c //////// resume | retrieveToken //////// ', 'background-color:#660066; color:#ffffff');
			return readCookie(cookieName);
		};

		// write the platform user token to storage
		var storeToken = function(token){
            console.log('%c //////// resume | storeToken //////// ', 'background-color:#660066; color:#ffffff', token);
			createCookie(cookieName, token, 1);
		};

        // clear the user token
		var deleteToken = function(){
            console.log('%c //////// resume | deleteToken //////// ', 'background-color:#660066; color:#ffffff');

            // remove token
			eraseCookie(cookieName);
		};

		// uses controller to set the user auth token, then initializes player
		var setUserToken = function(instance, token){
            console.log('%c //////// resume | setUserToken //////// ', 'background-color:#660066; color:#ffffff', instance, token);

            var player = getPlayerInstance(instance);
            var flags = player.getData(eventData);

            var tokensFunctions = new tokens();

			// store token value
            flags.setValue('userToken', token);

			// set token in cookie
			tokensFunctions.storeToken(token);

			// attach resume loader
            $pdk.controller.dispatchEvent('amcn.pdk.events.resume.setUserTokenComplete', {instance: instance}, [instance]);
		};

        return {
            getToken: getToken,
            retrieveToken: retrieveToken,
            storeToken: storeToken,
            deleteToken: deleteToken,
            setUserToken: setUserToken
        };
	};

	var users = function(){
        // check for janrain status, and determine UID value
		var checkUserID = function(instance){
            console.log('%c //////// resume | checkUserID //////// ', 'background-color:#660066; color:#ffffff', instance);

			// check against Janrain
			var janrainSession = _amcn_janrain.getSessionInfo();
            console.log('%c //////// resume | checkUserID > janrain session > //////// ', 'background-color:#660066; color:#ffffff', janrainSession);

			// check for session status, disable on non-janrain logged users
			if(janrainSession !== false && typeof(janrainSession.uid) !== 'undefined'){

                var player = getPlayerInstance(instance);
                var flags = player.getData(eventData);

                // update flag
                flags.setValue('userID', janrainSession.uid);

                return true;
			}
			else{
                console.log('%c //////// resume | checkUserID > no janrain session, exiting //////// ', 'background-color:#660066; color:#ffffff');

                return false;
			}
		};


        return {
            checkUserID: checkUserID
        };
	};

    return {
        init: init,
        setAssetData: setAssetData,
        userLogout: userLogout,
        bookmarks: bookmarks,
        save: save,
        card: card,
        tokens: tokens,
        users: users
    };
}());

// register player module, with init method executed
amcnPlatform.core.handler.addModule(amcnPlatform.module.resume.init);
