var mapResumeData = function(target, account_id_num){
    console.log('%c //////// resume | mapResumeData //////// ', 'background-color:#660066; color:#ffffff', target);

    var output = '';
    var userID = null;
    var userToken = null;

    var tokenEndpoint = '/api/resume/v1/token';
    var listEndpoint = '/api/resume/v1/list';
    var episodeEndpoint = '/api/resume/v1/search';

    // check for janrain session
    var janrainSession = _amcn_janrain.getSessionInfo();

    if(janrainSession !== false && typeof(janrainSession.uid) !== 'undefined'){

        // store janrain ID
        userID = janrainSession.uid;

        // request user token
        jQuery.ajax({
            url: tokenEndpoint,
            data: {
                uid: userID
            },
            success: function(data){
                console.log('%c //////// resume | mapResumeData > getToken > resumeToken > //////// ', 'background-color:#660066; color:#ffffff', data);

                var response = data;

                // set the token
                if(response.success && response.data.token != null && response.data.token != ''){
                    console.log('%c //////// resume | mapResumeData > getToken > resumeToken > setting token //////// ', 'background-color:#660066; color:#ffffff');

                    userToken = response.data.token;

                    // pass token to resume endpoint, to retrieve all resume data
                    jQuery.ajax({
                        url: listEndpoint,
                        data: {
                            token: userToken
                        },
                        success: function(response){
                            var videoResponse = response;

                            console.log('%c //////// resume | mapResumeData > getListEndpoint > //////// ', 'background-color:#660066; color:#ffffff', videoResponse);

                            // check for success response
                            if(!videoResponse.success || jQuery.isEmptyObject(videoResponse.data.videos)){
                                disable();
                                return false;
                            }

                            // request episode data for those video ID's
                            jQuery.ajax({
                                url: episodeEndpoint,
                                data: {
                                    videos: videoResponse.data.videos
                                },
                                success: function(resp){
                                    var postResponse = resp;
                                    var resumeOutput = {};

                                    console.log('%c //////// resume | mapResumeData > episode endpoint response //////// ', 'background-color:#660066; color:#ffffff', postResponse, videoResponse);

                                    // default response
                                    if(!postResponse.success || postResponse.data.count == 0){
                                        disable();
                                        return false;
                                    }

                                    jQuery.each(postResponse.data.episodes, function(index, postData){
                                        if(postData.post.status == 'draft'){
                                            // designate expired content, link to parent
                                            resumeOutput[videoResponse.data.videos[index].modified] = '<div class="resume-item '+videoResponse.data.videos[index].modified+' draft">' +
                                                            '<div class="resume-image">' +
                                                                '<a href="'+postData.post.parent_permalink+'">' +
                                                                    '<div class="resume-thumbnail"><img src="'+postData.post.thumbnail+'" /></div>' +
                                                                    '<div class="resume-remaining resume-expired">This video has expired.</div>'+
                                                                '</a>' +
                                                            '</div>' +
                                                            '<div class="resume-text">' +
                                                                '<div class="resume-show">'+postData.video.show+'</div>' +
                                                                '<div class="resume-title"><a href="'+postData.post.parent_permalink+'">'+postData.post.title+'</a></div>' +
                                                                '<div class="resume-season">'+postData.video.season+'</div>' +
                                                                '<div class="resume-episode">Episode '+postData.video.episode+'</div>' +
                                                                '<div class="resume-remove" data-platform-id="urn:theplatform:pdk:media:'+postData.video.id+'">Remove</div>' +
                                                            '</div>' +
                                                        '</div>';
                                        }
                                        else{
                                            var percentComplete = Math.floor((videoResponse.data.videos[index].progress / videoResponse.data.videos[index].duration) * 100);

                                            // generate standard resume item output
                                            resumeOutput[videoResponse.data.videos[index].modified] = '<div class="resume-item '+videoResponse.data.videos[index].modified+'">' +
                                                            '<div class="resume-image">' +
                                                                '<a href="'+postData.post.permalink+'">' +
                                                                    '<div class="resume-thumbnail"><img src="'+postData.post.thumbnail+'" /></div>' +
                                                                    '<div class="resume-remaining">'+ ( postData.video.days_left != false ? postData.video.days_left : '' )+'</div>' +
                                                                '</a>' +
                                                                '<div class="resume-progress-bar">' +
                                                                    '<div class="resume-progress-bar-completion" data-percent="'+percentComplete+'"></div>' +
                                                                '</div>' +
                                                                '<div class="resume-progress-text">'+percentComplete+'% Complete</div>' +
                                                            '</div>' +
                                                            '<div class="resume-text">' +
                                                                '<div class="resume-show">'+postData.video.show+'</div>' +
                                                                '<div class="resume-title"><a href="'+postData.post.permalink+'">'+postData.post.title+'</a></div>' +
                                                                '<div class="resume-season">'+postData.video.season+'</div>' +
                                                                '<div class="resume-episode">Episode '+postData.video.episode+'</div>' +
                                                                '<div class="resume-remove" data-platform-id="urn:theplatform:pdk:media:'+postData.video.id+'">Remove</div>' +
                                                            '</div>' +
                                                        '</div>';
                                        }
                                    });

                                    // reverse sort timestamps, want newest->oldest
                                    resumeOutputOrder = Object.keys(resumeOutput).sort().reverse();

                                    output = '<div class="user-resume-data">';

                                    // add sorted resume items to output
                                    jQuery.each(resumeOutputOrder, function(index, order){
                                        output += resumeOutput[order];
                                    });

                                    output += '</div>';

                                    jQuery(target).html(output);

                                    // attach remove click handler
                                    jQuery('.resume-remove').click(function(){
                                        try{
                                            // delete the bookmark
                                            $pdk.bookmarks.removeBookmark('full-episodes', userToken, account_id_num, jQuery(this).attr('data-platform-id'), {
                                				onSuccess:function(result){
                                                    console.log('%c //////// resume | mapResumeData > removeBookmark > onSuccess //////// ', 'background-color:#660066; color:#ffffff', result);

                                					// push into Janrain for permanent view history storage
                                					if(status == 'complete'){
                                						_amcn_janrain.addVideoHistory(jQuery(this).attr('data-platform-id'), {complete: true}, function(response){
                                                            console.log('%c //////// resume | mapResumeData > removeBookmark > onSuccess > addVideoHistory //////// ', 'background-color:#660066; color:#ffffff', response);
                                						});
                                					}

                                				},
                                				onFailure:function(error){
                                                    console.log('%c //////// resume | mapResumeData > removeBookmark > onFailure //////// ', 'background-color:#660066; color:#ffffff', error);
                                					throw error;
                                				}
                                			});

                                            // remove item from display
                                            jQuery(this).parents('.resume-item').hide();
                                        }
                                        catch(err){
                                            console.log('Unable to remove bookmark: '+err);
                                        }
                                    });

                                    // trigger the mapResumeDataComplete event
                                    jQuery(document).trigger("amcn.pdk.events.mapResumeDataComplete");
                                }
                            });
                        }
                    });
                }
                else{
                    console.log('%c //////// resume | mapResumeData > getToken > resumeToken > token failure //////// ', 'background-color:#660066; color:#ffffff', response.message);
                    disable();
                    return false;
                }
            },
            error: function(jqXHR, status, error){
                console.log('%c //////// resume | mapResumeData > getToken > resumeToken > no token available //////// ', 'background-color:#660066; color:#ffffff', error, status);
                disable();
                return false;
            }
        });
    }
    else{
        disable();
        return false;
    }

    var disable = function(){
        try {
            output = amcnPlatformConfig.fullEpisodeArchive;
        } catch (err) {
            console.log('No config set');
            output = '<p>You have no full episodes in your library.</p>';
        }
        jQuery(target).html(output);
    }
};
