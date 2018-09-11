/**
* See the following gist for examples: https://gist.github.com/yoshito/69f7c6b996e08fbe6d31
*/

/**
 * Assumes Omniture / GA Script is already on the page.
 * @param cfg
 */
function CommonAnalytics(cfg) {

	// store configuration
	this.cfg = cfg;
	this.initialized_on_timestamp = new Date().getTime();

	// add key and contexts
	this.param_defs = {};
	for(var k in this.cfg.defs) {
		if(this.cfg.defs.hasOwnProperty(k)) {
			var def = this.cfg.defs[k];
			this.param_defs[def.fname] = this.create_param_def(def);
		}
	}

	var my = this;
	(function($){
		$(function(){

			// visibility event
			$(document).on({
				'show': function() {
					my.vibility_switched = true;
				},
				'hide': function() {
					my.vibility_switched = true;
				}
			});
			my.registerEvents();
		});


		window.onbeforeunload =  function() {
			my._trackUnload();
		};

	})(jQuery);


}
CommonAnalytics.prototype = {

	/**
	 * Cookies used in this clss
	 * @type {Object}
	 */
	cookienames: {
		'uid': '__ga_uid',
		'mvpd': '_adobepass.mvpd'
	},

	/**
	 * Texts used in this class. Conveninence, so its not hardcoded.
	 * @type {Object}
	 */
	texts: {
		'no_mvpd': 'No MVPD'
	},


	// assign stopwatch
	stopwatch: null,
	hasTrackedPageView: false,
	first_req: true,
	player_initialized_on: {},
	vibility_switched: false,

	// interval at which media progress data is passed onto
	// data buffer. "brightcove_media_progress_relay_interval" must
	// be multiple of brightcove_media_progress_interval.
	brightcove_media_progress_interval: 30,
	the_platform: {
		'status': null,
		'position': -1,
		'videos': {},
		'is_resumed': false,
		'has_played_video': false,
		'has_played_ad': false,
		'percent_delta_tolerance': 3 // used to calculate the threshold for delta to be considered continuous playback
	},

	/**
	 * Add click events
	 */
	registerClickEvents: function() {
		var my = this;
		(function($){
			var e = '.ca-track-click-events';
			var clazz = '_ca-registered-click-event';
			$(e + ":not(." + clazz + ")").on('click', function(e){
				var cfg = my._defaultValues || {};
				var element = this;
				$.each(this.attributes, function(i) {
					if(this.nodeName.match(/^data-.*?/)) {
						var n = this.nodeName.substr(5);
						cfg[n] = $(element).data(n);
					}
				});
				my.trackEvent(cfg);
			}).addClass(clazz);
		})(jQuery);
	},

	/**
	 * Add ClickLink Events
	 */
	registerClickLinkEvents: function() {
		var my = this;
		(function($){
			var clazz = '_ca-registered-click-link-event';
			$("a:not(." + clazz + ")").on('click', function(){
				var comp = new RegExp(location.host);
				var is_url = this.href.match(/^(http|https)/);
				var type = is_url ? (comp.test(this.href) ? 'internal' : 'external') : 'action';

				//
				my.trackEvent2({
					category: 'clicklink',
					action: type,
					clickthrough_url: this.href
				});

				// rawer data for clicks
				// ga('send', 'event', 'clicklink', type, this.href);
			}).addClass(clazz);
		})(jQuery);
	},


	/**
	 * Event trac
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	registerBrightcoveEvent: function() {
 		var my = this;
 		(function($){
 			if($(document).data('brightcoveEventListenerRegistered') !== true) {

 				$(document).data('brightcoveEventListenerRegistered', true);

 				var $doc = $(document);
 				var $video_box = $(".video-box.brightcove-video-template, .video-player.video-link");
 				$video_box.data('last-pos', -1);

	 			// media events
	 			var events = [
		 			"brightcove.events.adEvent.adStart",
		 			"brightcove.events.adEvent.adComplete",
		 			"brightcove.events.authEvent.authNeeded",
					"brightcove.events.mediaEvent.mediaBegin",
					"brightcove.events.mediaEvent.mediaChange",
					"brightcove.events.mediaEvent.mediaComplete",
					"brightcove.events.mediaEvent.mediaError",
					"brightcove.events.mediaEvent.mediaPlay",
					"brightcove.events.mediaEvent.mediaProgress",
					"brightcove.events.mediaEvent.mediaSeekNotify",
					"brightcove.events.mediaEvent.mediaStop"
	 			];
	 			$.each(events, function(i, event_name) {

					$doc.on(event_name, function(evt, bc_evt){
						try {
							//AmcnBrightcove.mod.VIDEO_PLAYER.getCurrentVideo(function(video){

							var event_type = '';
							for(var i=0;i<events.length;i++) {
								var parts = events[i].split('.');
								if(evt.namespace.match(parts[parts.length-1])) {
									event_type = events[i];
								}
							}


							// Change the Video ID If needed.
				 			if(evt.namespace.match(/(mediaChange|mediaBegin)/)) {
				 				if(AmcnBrightcove.getAPI() === AmcnBrightcove.API.FLASH_ONLY) {
				 					var dto = AmcnBrightcove.mod.VIDEO_PLAYER.getCurrentVideo();
				 					$video_box.data('video_id', dto.id);
				 				}
				 				else {
									my_video = AmcnBrightcove.mod.VIDEO_PLAYER.getCurrentVideo(function(dto) {
										$video_box.data('video_id', dto.id);
									});
				 				}
				 			}


							var data = {
				 				'video_id': $video_box.data('video_id'),
				 				'player_id': $video_box.data('player_id')
				 			};

							if(evt.namespace.match(/mediaEvent/)){
								// do not set event position if bc event doesn'c come withit
								if(typeof bc_evt.position !== 'undefined' && bc_evt.position) {
									var pos = bc_evt.position;
									if(evt.namespace.match(/mediaProgress$/)) {
										return;
									}
									if(evt.namespace.match(/mediaComplete$/)) {
										h = Math.floor(pos/3600);
										pos %= 3600;
										m = Math.floor(pos/60);
										s = Math.floor(pos % 60);
										var hms = [h, m, s];
										for(var j=0; j<hms.length;j++) {
											// pad number
											hms[j] = ("" + hms[j]).length !== 2 ? "0" + hms[j] : "" + hms[j];
										}
										data['event_position'] = hms.join(":");
									}
								}
								data['event_type'] = event_type
							}
							else if(evt.namespace.match(/adEvent/)) {
								// nothing on adEvent
								data['event_type'] = event_type
							}
							else if(evt.namespace.match(/authEvent/)){
								// nothing on auth Eent
								data['event_type'] = event_type
							}


							my._trackBrightcoveEvent(data);

							//});
						}
						catch(t) {
							console.log("ERR ----------------", t);
						}

		 			});
	 			});

 			}

 		})(jQuery);

	},
	_trackBrightcoveEvent: function(e) {
		var note = e.event_position || "";
		note = note.length > 0 ? " | " + note : "";
		var data = {
			'category': '', // dummy data
			'label': '', // dummy data
			'action': '', // dummy data
			'category_override': 'amcn-brightcove | ' + e.player_id,
			'action_override':  "" + e.video_id,
			'label_override': e.event_type + note
		};
		this.trackEvent(data);

		// data to be passed to relay endpoint. For media progress event, only
		// track progress if relay interval is met.
		var compressed = {
			'ga_uid': this.get_uid(),
			'player_id': e.player_id,
			'video_id': e.video_id,
			'event': {
				'type': e.event_type,
				'position': e.event_position || ""
			}
		};
		// this.relay(e.event_type, compressed);

		if(window.console)
			console.log('%c COMPRESSED:', 'color:green', compressed);
	},

	/**
	 * Tracking for The Platform video content
	 */
	registerPlatformEvent: function() {
		console.log(' @@@@@ registerPlatformEvent init @@@@@ ');
		var my = this;
		var location;
		(function($){
			if($(document).data('platformEventListenerRegistered') !== true) {

				$(document).data('platformEventListenerRegistered', true);

				var $doc = $(document);
				var $video_box = $(".platform-container");
				$video_box.data('last-pos', -1);

				// media events
				var events = [
					"amcn.pdk.events.OnInitCalled",
					"amcn.pdk.events.adEvent.adStart",
					"amcn.pdk.events.adEvent.adComplete",
					"amcn.pdk.events.AuthNeeded",
					"amcn.pdk.events.VideoStart",
					"amcn.pdk.events.VideoEnd",
					"amcn.pdk.events.OnReleaseStart",
					"amcn.pdk.events.OnMediaError",
					"amcn.pdk.events.OnPlayButtonClicked",
					"amcn.pdk.events.OnPlayerLoaded",
					"amcn.pdk.events.OnMediaProgress",
					"amcn.pdk.events.OnMediaProgressRaw",
					"amcn.pdk.events.OnMediaSeek",
					"amcn.pdk.events.UserResume",
					"amcn.pdk.events.UserRestart",
					"amcn.pdk.events.ResumeSave"
				];

				$.each(events, function(i, event_name) {
					$doc.on(event_name, function(evt, pdk_evt){

						try {
							var track = true;
							var namespaces = evt.namespace.split('.');
							var ename = namespaces[0];

							if(['OnMediaError', 'OnMediaSeek'].indexOf(ename) !== -1) {
								location = Math.floor(pdk_evt.data.clip.mediaTime / pdk_evt.data.clip.mediaLength * 100);
							}
							else if(['OnInitCalled'].indexOf(ename) !== -1) {
								my.player_initialized_on[pdk_evt.player_id + '_' + pdk_evt.video_id] = new Date().getTime();
								track = false;
							}
							else if(['AuthNeeded', 'OnPlayButtonClicked', 'OnReleaseStart', 'UserRestart'].indexOf(ename) !== -1) {
								location = 0;
							}
							else if(['VideoStart'].indexOf(ename) !== -1) {
								location = null;

								// this measures first video loading time
								if(!my.the_platform.has_played_video) {
									var delta = new Date().getTime() - my.initialized_on_timestamp;
									my._trackTiming(
										'amcn-platform | ' + $video_box.attr('data-player-id'),
										'VideoStart | ' + $video_box.attr('data-video-id'),
										delta
									);
									my.the_platform.has_played_video = true;
								}
							}
							else if(ename === 'VideoEnd'){
								location = 100;

								// set the video to be complete
								var video_id = $video_box.attr('data-video-id');

								var delta = location - my.the_platform.position;
								if(delta > 0 && delta <= my.the_platform.percent_delta_tolerance ) {
									for(var i = my.the_platform.position; i <= location; i++) {
										var pos_key = '_' + i;
										my.the_platform.videos[video_id]['_' + i] = true;
									}
								}
							}
							else if(ename === 'adEvent') {
								if(evt.namespace.match(/adStart/)) {
									console.log("AD START-----", my.the_platform.has_played_ad);
									if(!my.the_platform.has_played_ad) {
										var delta = new Date().getTime() - my.initialized_on_timestamp;
										my._trackTiming(
											'amcn-platform | ' + $video_box.attr('data-player-id'),
											'adStart | ' + $video_box.attr('data-video-id'),
											delta
										);
										my.the_platform.has_played_ad = true;
									}
									location = null;
								}
								else if(evt.namespace.match(/adComplete/)) {
									location = null;
								}
								else {
									track = false;
								}
							}
							else if(['UserResume'].indexOf(ename) !== -1) {
								location = pdk_evt;
								my.the_platform.position = pdk_evt;
								if(window.console)
									console.log("%cUserResume:", 'color:red', pdk_evt  );
							}
							else if(['OnMediaProgress', 'ResumeSave'].indexOf(ename) !== -1){
								location = pdk_evt;
							}
							else if(ename === 'OnPlayerLoaded') {


								var vid = $video_box.attr('data-video-id');
								var pid = $video_box.attr('data-player-id');

								// this measures player loading time
								location = null;
								var now = new Date().getTime();
								var delta = now - my.initialized_on_timestamp;
								if(delta < 20000 && !my.vibility_switched) {
									my._trackTiming(
										'amcn-platform | ' + pid,
										'OnPlayerLoaded',
										delta
									);
								}


								if(my.player_initialized_on[pid + '_' + vid] && !my.vibility_switched) {
									var pinit_delta = now - my.player_initialized_on[pid + '_' + vid];
									if(pinit_delta < 20000) {
										my._trackTiming(
											'amcn-platform | ' + pid,
											'PlayerLoadTimeFromJSInit',
											pinit_delta
										);
									}
								}

								track = false;
							}
							// processing onMediaProgressRaw events
							else if(ename === 'OnMediaProgressRaw') {
								track = false;
								var current_position = Math.floor(pdk_evt.data.percentCompleteAggregate);
								var delta = current_position - my.the_platform.position;
								var video_id = $video_box.attr('data-video-id');
								my.the_platform.videos[video_id] = my.the_platform.videos[video_id] || {
									'player_id': $video_box.attr('data-player-id'),
									'duration': pdk_evt.data.durationAggregate,
									'logged': false
								};


								// if this is first view
								if(my.the_platform.position === -1) {
									var pos_key = '_' + current_position;
									if(current_position % 25 === 0 && !(pos_key in my.the_platform.videos[video_id])) {
										location = current_position;
										track = true;
										event_name = 'amcn.pdk.events.OnMediaProgress.unique'
									}
									my.the_platform.videos[video_id]['_' + current_position] = true;
								}
								else if(delta > 0 && delta <= my.the_platform.percent_delta_tolerance ) {
									var i = my.the_platform.position >= 0 ? my.the_platform.position : 0;
									for(var i = my.the_platform.position; i <= current_position; i++) {
										var pos_key = '_' + i;
										if(i%25 === 0 && !(pos_key in my.the_platform.videos[video_id])) {
											location = i;
											track = true;
											event_name = 'amcn.pdk.events.OnMediaProgress.unique'
										}
										my.the_platform.videos[video_id]['_' + i] = true;
									}
								}
								my.the_platform.position = current_position;
							}
							else {
								try {
									location = Math.floor(pdk_evt.data.clip.mediaTime / pdk_evt.data.clip.mediaLength * 100);

									if(window.console)
										console.log("%cunknown video event: ", 'background-color:red; color:#FFF', ename, evt.namespace);
								}
								catch (t) {
									location = null;
								}

							}

							if(track) {
								my._trackPlatformEvent({
									'video_id': $video_box.attr('data-video-id'),
									'player_id': $video_box.attr('data-player-id'),
									'event_type': event_name,
									'event_position': location
								});
								return;
							}
						}
						catch(t) {
							console.log("ERR ----------------", t);
						}

					});
				});

			}

		})(jQuery);
	},

	/**
	 * Event-driven platform tracking, with player scope
	 */
	registerPlatformScopedEvent: function(){
		console.log('%c >>>>>>>> registerPlatformScopedEvent init <<<<<<<< ', 'background-color:#ff00ff; color:#00ffff');
		var me = this;
		var location;

		(function($){
			// only run initialization a single time
			if($(document).data('platformScopedEventListenerRegistered') !== true) {
				// toggle
				$(document).data('platformScopedEventListenerRegistered', true);

				// set up listeners for tracking events
				$(document).on('amcn.pdk.events.v2.PDKVideoStart', function(evt, data){
					var eventLabel = 'VideoStart';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKVideoEnd', function(evt, data){
					var eventLabel = 'VideoEnd';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnMediaError', function(evt, data){
					// event | time
					var eventLabel = 'OnMediaError';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnPlayButtonClicked', function(evt, data){
					var eventLabel = 'OnPlayButtonClicked';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnMediaProgress', function(evt, data){
					// event | % completion
					var eventLabel = 'OnMediaProgress | '+data.completion;

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnMediaSeek', function(evt, data){
					// event | time
					var eventLabel = 'OnMediaSeek';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKAdStart', function(evt, data){
					var eventLabel = 'adEvent.adStart';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKAdComplete', function(evt, data){
					var eventLabel = 'adEvent.adComplete';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnMediaStart', function(evt, data){
					var eventLabel = 'OnMediaStart';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKVideoResume', function(evt, data){
					var eventLabel = 'VideoResume';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKVideoExit', function(evt, data){
					var eventLabel = 'VideoExit';

					me.preparePlatformScopedEvent(eventLabel, data);

					// add additional playback_duration tracking
					var playerConfig = data.player.getConfig();
					me._trackTiming(
						'video | ' + playerConfig.settings.player.player_id,
						'playback_duration.total | ' + playerConfig.settings.video.video_id,
						data.durationSeconds
					);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnLivestreamProgress', function(evt, data){
					var eventLabel = 'OnLivestreamProgress';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

				$(document).on('amcn.pdk.events.v2.PDKOnMediaMinuteProgress', function(evt, data){
					var eventLabel = 'OnMediaMinuteProgress';

					me.preparePlatformScopedEvent(eventLabel, data);
				});

			}
		})(jQuery);
	},

	preparePlatformScopedEvent: function(eventLabel, data){
		var playerConfig = data.player.getConfig();
		var videoDetails = playerConfig.settings.video.details;

		// detect livestream, and alter the category to reference this
		var category = videoDetails.isLivestream === true ? 'livestream' : this.slugify(videoDetails.custom.videoCategory);

		var trackingData = {
            'category': '', // dummy data
            'label': '', // dummy data
            'action': '', // dummy data
            'category_override': '~video | '+ category,
            'action_override':  videoDetails.videoPublicID + ' | ' + this.slugify(videoDetails.videoName),
            'label_override': eventLabel,
			// custom values
			'show': typeof(videoDetails.custom.show) !== 'undefined' && videoDetails.custom.show != '' ? this.slugify(videoDetails.custom.show) : '_none',
			'season': typeof(videoDetails.custom.season) !== 'undefined' && videoDetails.custom.season != '' ? this.slugify(videoDetails.custom.season) : '_none',
			'episode_name': typeof(videoDetails.custom.episodeTitle) !== 'undefined' && videoDetails.custom.episodeTitle != '' ? this.slugify(videoDetails.custom.episodeTitle) : '_none',
			'episode_numeric': typeof(videoDetails.custom.episode) !== 'undefined' && videoDetails.custom.episode != '' ? this.slugify(videoDetails.custom.episode) : '_none',
			'video_title': typeof(videoDetails.videoName) !== 'undefined' && videoDetails.videoName != '' ? this.slugify(videoDetails.videoName) : '_none',
			'video_category': typeof(videoDetails.custom.videoCategory) !== 'undefined' && videoDetails.custom.videoCategory != '' ? this.slugify(videoDetails.custom.videoCategory) : '_none',
			'video_total_playback_duration' : typeof(data.duration) !== 'undefined' && data.duration != '' ? data.duration : '_none',
			'video_position': typeof(data.position) !== 'undefined' && data.position != '' ? data.position : '_none',
			'video_playback_duration': typeof(data.playbackDuration) !== 'undefined' && data.playbackDuration != '' ? data.playbackDuration : '_none',
			'video_playback_timestamp': typeof(data.playbackTimestamp) !== 'undefined' && data.playbackTimestamp != '' ? data.playbackTimestamp : '_none',
			'video_play_on_auto_advance': typeof(data.autoAdvance) !== 'undefined' && data.autoAdvance != '' ? data.autoAdvance : '_none',
		};

		console.log(' >>>>> tracking > ', trackingData);

		this.trackEvent(trackingData);
	},

	_trackTiming: function(category, tvar, time, publish) {

		category = publish === true ? category : '~' + category;
		tvar = publish === true ? tvar : '~' + tvar;

		ga('send', {
			hitType: 'timing',
			timingCategory:  category,
			timingVar: tvar,
			timingValue: time
		});
	},

	/**
	 * Fires event when video playback has completed
	 */
	_trackUnload: function() {
		try {
			var my = this;
			jQuery.each(this.the_platform.videos, function(video_id, video) {
				if(video['logged'] === false) {
					my.the_platform.videos[video_id]['logged'] = true;

					var counter = 0;
					jQuery.each(video, function(key, v){
						if(key.match(/^_(100|(0*\d{1,2}))/))
							counter++;
					});
					counter = counter >= 100 ? 100 : counter - 0.5;

					// fire analytics
					my._trackTiming(
						'amcn-platform | ' + video['player_id'],
						'playback_duration.unique | ' + video_id,
						counter / 100 * video.duration
					);

					// updated analytics category
					my._trackTiming(
						'video | ' + video['player_id'],
						'playback_duration.unique | ' + video_id,
						counter / 100 * video.duration
					);
				}
			});
		}
		catch(t) {
			console.log(t);
		}
	},

	_trackPlatformEvent: function(e){

		var note = e.event_position;
		note = note !== null && (note >= 0 || note.length > 0) ? " | " + note : "";

		var data = {
			'category': '', // dummy data
			'label': '', // dummy data
			'action': '', // dummy data
			'category_override': 'amcn-platform | ' + e.player_id,
			'action_override':  "" + e.video_id,
			'label_override': e.event_type + note
		};
		this.trackEvent(data);

		// data to be passed to relay endpoint. For media progress event, only
		// track progress if relay interval is met.
		var compressed = {
			'ga_uid': this.get_uid(),
			'player_id': e.player_id,
			'video_id': e.video_id,
			'event': {
				'type': e.event_type,
				'position': e.event_position || ""
			}
		};
		// @todo - re-enable
		// this.relay(e.event_type, compressed);

		if(window.console){
			console.log('%c COMPRESSED:', 'color:green', compressed);
		}
	},



	/**
	 * Registering Adobe Pass Related Events.
	 * @return {[type]} [description]
	 */
	registerAdobePassEvent: function() {
		var my = this;
		(function($){
			// REF: https://wikidocs.adobe.com/wiki/pages/viewpage.action?pageId=79398522&navigatingVersions=true
			if($(document).data('adobepassEventListenerRegistered') !== true) {
				$(document).data('adobepassEventListenerRegistered', true);

				// register event for tracking data
				$(document).on('adobepass.sendTrackingData', function(evt, type, data){

					// mvpdSelection event. do no track this for now. callback speed is too fast.
					if(type === 'mvpdSelection') {
						/*
						my._trackAdobePassEvent({
							'ga': { 'action': type, 'label': data[0] },
							'relay': { 'type': type, 'data': { 'mvpd': data[0], }}
						});
						*/
					}

					// for authentication detection
					else if(type === 'authenticationDetection'){

						var success = data[0];
						var mvpd = data[1] || my.texts.no_mvpd;
						var userid = data[2] || '';

						my._trackAdobePassEvent({
							'ga': {
								'action': type,
								'label': mvpd + " | " + (success ? 'true' : 'false')
							},
							'relay': {
								'type': type,
								'data': {
									'success': success,
									'mvpd': mvpd,
									'adobe_uid': userid
								}
							}
						});

						// sniff if user has logged in
						var mvpd_prev = $.cookie(my.cookienames.mvpd) || my.texts.no_mvpd;
						var mvpd_new = mvpd;
						mvpd_prev = mvpd_prev.length === 0 ? my.texts.no_mvpd : mvpd_prev;
						mvpd_new = mvpd_new.length === 0 ? my.texts.no_mvpd : mvpd_new;

						if(mvpd_prev !== mvpd_new) {

							var type = 'auth.mvpd_changed';
							if(mvpd_new === my.texts.no_mvpd) {
								type = 'auth.logged_out';
							}
							else if(mvpd_prev === my.texts.no_mvpd) {
								type = 'auth.logged_in';
							}

							my._trackAdobePassEvent({
								'ga': {
									'action': type,
									'label': mvpd_prev + " | " + mvpd_new
								},
								'relay': {
									'type': type,
									'data': {
										'mvpd': {
											'prev': mvpd_prev,
											'new': mvpd_new
										},
										'adobe_uid': userid
									}
								}
							});
						}

						$.cookie(my.cookienames.mvpd, mvpd, {
							'expires': 365,
							'path': "/"
						});

					}
				});

				// fired on when dialog is displayed
				$(document).on('adobepass.displayProviderDialog', function(evt, type, data) {
					my._trackAdobePassEvent({
						'ga': {
							'action': type,
							'label': 'show'
						},
						'relay': {
							'type': type,
							'data': {}
						}
					});
				});
			}
		})(jQuery);
	},
	_trackAdobePassEvent: function(data) {

		// add  ga_uid to pass to relay endpoint
		data.relay.data['ga_uid'] = this.get_uid();

		// add track.
		this._trackCustomEvent('adobepass', data.ga.action, data.ga.label);
		//if(data.relay.type !== 'authenticationDetection')
		//	this.relay("adobepass." + data.relay.type, data.relay.data);

	},

	registerDefaultEvents: function() {
		var my = this;
		jQuery(document).on('amcn_event', function(evt, data) {
			my.trackEvent2({
				category: data.event_name,
				action: data.event_action || '',
				label: data.event_label || '',
				value: data.data.value || 0
			});
		});
	},


	/**
	 * Scan and register events
	 */
	registerEvents: function() {
		this.registerClickEvents();
		this.registerClickLinkEvents();
		this.registerBrightcoveEvent();
		this.registerPlatformEvent();
		this.registerPlatformScopedEvent();
		this.registerAdobePassEvent();
		this.registerAmcnInterceptEvent();
		this.registerDefaultEvents();
	},

	/**
	 * Simple Helper Function to create contexts definition.
	 * @param definition.
	 * @return cosntructed context object.
	 */
	create_param_def: function(def) {
		return {
			"is_custom_dimension": def.is_cust_dim,
			"required": { "pageview": def.req_pageview, "event": def.req_event },
			'category': def.category
		};
	},


	/**
	 * Relay Buffer
	 * @param {String} data_type data type of the relayed data
	 * @param {Object} data data to be passed to relayed endpoint
	 */
	relay: function(data_type, data, callback) {
		if(this.cfg.relay_url && this.cfg.relay_url.length > 0) {
			jQuery.ajax({
				'url': this.cfg.relay_url + '/' + data_type,
				'cache': true,
				'dataType': 'json',
				'type': 'POST',
				'data': JSON.stringify(data),
				'success': function(res) {
					callback(res);
				}
			});
			var qp = this.query_param();
			if(window.console && typeof qp.QA === 'string' && qp.QA === 'true') {
				console.log('%c relay' + data_type, 'color:green; bakcground-color:#FFF', data);
			}
		}
	},


	/**
	 * [registerAmcnInterceptEvent description]
	 * @return {[type]} [description]
	 */
	registerAmcnInterceptEvent: function() {
		var my = this;
		if(jQuery(document).data('amcnInterceptEventListenerRegistered') !== true) {
			jQuery(document).data('amcnInterceptEventListenerRegistered', true);
			jQuery(document).on('amcn_intercept_overlay.show', function(evt, json){
				my._trackCustomEvent(
					json.ga.event_category,
					json.ga.event_action,
					json.ga.event_label,
					0
				);
			});
		}
	},


	/**
	 * Relays location
	 * @return nothing
	 */
	relay_location: function() {
		// track
		var cookie_name = 'loc_check';
		var location_check = jQuery.cookie(cookie_name);
		if(location_check != "true") {
			this.relay('push_loc', { 'ga_uid': this.get_uid() }, function(res) {
				if(res.success) {
					var date = new Date();
					date.setTime(date.getTime() + (15 * 60 * 1000));
					jQuery.cookie(cookie_name, 'true', { expires: date });
				}
			});
		}
	},




	/**
	 * Analytics  for activation page.
	 * @return nothing
	 */
	track_second_screen_activate: function(cfg) {

		// trackign event to ga
		this.trackEvent2({
			category: 'second_screen_activate',
			action: cfg.status,
			label: cfg.status ? cfg.device_type : ''
		});

		// relay
		if(cfg.status === 'success') {
			var cookie_name = 'loc_check';
			var location_check = jQuery.cookie(cookie_name);
			this.relay('push_loc',
				{
					'ga_uid': this.get_uid(),
					'reg_code': cfg.reg_code
				},
				function(res) {
					if(res.success) {
						var date = new Date();
						date.setTime(date.getTime() + (15 * 60 * 1000));
						jQuery.cookie(cookie_name, 'true', { expires: date });
					}
				}
			);
		}
	},



	/**
	 * Wrapper for custom event
	 * @ignore
	 * @private
	 * @param  {string} category [description]
	 * @param  {string} action   [description]
	 * @param  {string} label    [description]
	 * @param  {string} value    [description]
	 * @return {string}          [description]
	 */
	_trackCustomEvent: function(category, action, label, value) {
		var data = {
			'category': '', // dummy data
			'action': '', // dummy data,
			'label': '', // dummy data
			'value': value || 0,
			'category_override': category || '',
			'action_override':  action || '',
			'label_override': label || ''
		};
		this.trackEvent(data);
	},





	/**
	 * Method to track event.
	 * @param e - See #get_params method for more details.
	 */
	trackEvent2: function(e) {

		try {
			// instantiate variable
			e = jQuery.extend(this._defaultValues, e || {});

			// Verify if this has values to track
			if(!this.verify('event', e)) {
				if(window.console)
					console.log('ERR[_ca.event]:::: this is not trackable', e);
				return;
			}

			// parameters
			var params = this.get_params(e);

			// adding common param and custom dimensions
			this._set_ga_common_params(params);

			// add custom dimensions and hitcallbacks
			var fields = this._get_ga_custom_dims(params);
			fields['hitCallback'] = params.callback;

			// send tracking event.
			var category = e.category || '';
			var action = e.action || '';
			var label = e.label || '';
			var value = e.value || 0;


			if(category.trim().length > 0) {

				// Enhanced Link Attribution - APDO-2349
				/*
				if(window.console)
					console.log("Enhanced Link Attribution");
				ga('require', 'linkid');
				*/

				ga('send', 'event', category, action, label, value, fields);
				var qp = this.query_param();
				if(window.console && typeof qp.QA === 'string' && qp.QA === 'true')
					console.log('trackEvent2', e, params);
			}
			else {
				console.log("%cInvalid _ca.trackEvent2 call", e);
			}


			this.relay_location();
		}
		catch(t) {
			console.log(t);
		}
	},


	/**
	 * Method to track event.
	 * @param e - See #get_params method for more details.
	 */
	trackEvent: function(e) {

		// instantiate variable
		e = jQuery.extend(this._defaultValues, e || {});

		// Verify if this has values to track
		if(!this.verify('event', e)) {
			if(window.console)
				console.log('ERR[_ca.event]:::: this is not trackable', e);
			return;
		}

		// parameters
		var params = this.get_params(e);

		// adding common param and custom dimensions
		this._set_ga_common_params(params);

		// add custom dimensions and hitcallbacks
		var fields = this._get_ga_custom_dims(params);
		fields['hitCallback'] = params.callback;

		// send tracking event.
		ga('send', 'event', params.category, params.action, params.label, params.value, fields);

		this.relay_location();

		var qp = this.query_param();
		if(window.console && typeof qp.QA === 'string' && qp.QA === 'true')
			console.log('trackEvent', e, params);
	},



	/**
	 * Method to call when tracking page view.
	 * @param e - object definition. See #get_params method for more details.
	 */
	trackPageView: function(e) {

		// instantiate variable
		e = jQuery.extend(this._defaultValues, e || {});

		// verify if this is trackable
		if(!this.verify('pageview', e)) {
			if(window.console)
				console.log('ERR[_ca.pageview]:::: this is not trackable', e);
			return;
		}

		// parameters
		var params = this.get_params(e);

		// creating

		// adding common param and custom dimensions
		this._set_ga_common_params(params);

		// add custom dimensions and hitcallbacks
		var fields = this._get_ga_custom_dims(params);
		fields['hitCallback'] = params.callback;

		// send
		ga('send', 'pageview', fields);

		var cs_values = this._get_cs_values(params);
		COMSCORE.beacon(cs_values);

		// start tracking how long user is on this page.
		// this._startTrackActiveTime();
		if(window.console)
			console.log("FIELDS......", fields);

		// delete after migration is complete process omniture
		this.do_omniture(e, params, 'event');


		this.relay_location();
	},











	/**
	 * Return params
	 * @params - see below for samples.
	 * sample = {
	 *
	 *   // Default values for non-defaults
	 *   'url': 'not required',
	 *   'page_type': 'required, page type such as page, video, app, etc',
	 *   'name': 'name of the page',
	 *
	 *   // Default events
	 *   'action': 'required for EVENT only',
	 *   'label': 'not necessary required but strongly recommended for event.'
	 *
	 *   // additional fields defined in the context plugin
	 * }
	 */
	get_params: function(e) {
		if(window.console)
			console.log('::ca preprocessed: ', e, this.param_defs);

		var params = {};

		// ga_uid
		params.ga_uid = this.get_uid();

		// specify raw url
		params.url = e.url || location.href;

		// set value for "page" value, in case virtual path is needed.
		params.page = (e.url || location.href).replace(/^(http|https):\/\/(.*?)\//, '/');
		params.page = params.page.match(/^(http|https):\/\//) ? '/' : params.page;

		// domain
		params.domain = typeof e !== 'undefined' ? e.domain || location.hostname : location.hostname;

		// title
		params.title = typeof e.name !== 'undefined' ? e.name || 'unknown' : jQuery.trim(jQuery('title').text());
		e.name = typeof e.name !== 'undefined' ? e.name || 'unknown' : jQuery.trim(jQuery('title').text());

		// setup protocol
		params.protocol = location.protocol;

		// generate category
		var category_parts = { 'value_only': [], 'key_value': []};
		for(var k in this.param_defs) {
			if(this.param_defs[k].category) {
				// if this is not a key-value
				var val = e[k] || '';
				if(this.param_defs[k].category.key_value === false) {
					category_parts.value_only.push(this.slugify(val || 'none'));
				}
				// if this is key_value
				else if(val.length > 0) {
					category_parts.key_value.push(this.param_defs[k].category.key + "=" + this.slugify(val));
				}
			}
		}
		var category = category_parts.value_only.join(':');
		category += category_parts.key_value.length > 0 ? ':' + category_parts.key_value.join(':') : '';

		// create values for events
		params['category'] = e.category_override || category;
		params['action'] = e.action_override || this.slugify(e.action);
		params['label'] = e.label_override || this.slugify(e.label || e.action);
		params['value'] = e.value || 0;


		// assign custom dimension
		for(var k in this.param_defs) {
			if(e.hasOwnProperty(k) && this.param_defs[k].is_custom_dimension) {
				params[k] = e[k] || 'none';
			}
		}

		// assign callback function, if it exists. do nothing, otherwise.
		params['callback'] = e.callback || function() {};

		if(window.console)
			console.log('::ca processed params: ', params);

		return params;
	},


	/**
	 * Method to simplify the queing of the common params data
	 * @param params
	 */
	_set_ga_common_params: function(params) {

		if(this.first_req) {

			// create config
			var create_cfg = {
				'cookieDomain': this.cfg.network.cookie_domain,
				'allowLinker': this.cfg.linked_domains.length > 0
			};
			var uid = this.get_uid();
			if(uid.length > 0) {
				create_cfg['userId'] = this.get_uid();
			}
			ga('create', this.cfg.ga.id, create_cfg);

			// Enhanced Link Attribution - APDO-2349
			if(window.console)
				console.log("Enhanced Link Attribution");
			ga('require', 'linkid');

			if(this.cfg.linked_domains.length > 0) {
				ga('require', 'linker');
				ga('linker:autoLink', this.cfg.linked_domains);
			}

			this.first_req = false;
		}

		// set parameters
		ga('set', 'forceSSL', true);
		ga('set', 'page', params.page);
		ga('set', 'title', params.title);
	},


	/**
	 * Maps Custom Dimensions to correct dimension index.
	 * @param params
	 * @return mapped object of custom dimensions
	 */
	_get_ga_custom_dims: function(params) {
		// adding custom dimensions
		var cdims = {};
		var qp = this.query_param();
		for(var k in this.param_defs) {
			if(params.hasOwnProperty(k) && this.param_defs[k].is_custom_dimension) {
				cdims['dimension' + this.cfg.ga.ga_custom_dimensions[k]] = params[k];
				if(window.console && typeof qp.QA === 'string' && qp.QA === 'true')
					console.log('cust dims: (name, dim_index, value)=(', k, ",", this.cfg.ga.ga_custom_dimensions[k], ",", params[k], ")");
			}
		}
		return cdims;
	},

	/**
	 * Maps page context to ComScore fields.
	 * @param params
	 * @return mapped object of ComScore fields
	 */
	_get_cs_values: function(params) {
		var cs_values = {};
		cs_values.c1 = '2'; //Media Metrix == 1, Video Metrix == 2
		cs_values.c2 = this.cfg.cs.c2_id; //Account ID
		cs_values.c4 = location.href; //Current URL w/hash
		cs_values.c5 = params.page_type; //Genre
		cs_values.c6 = params.show ? params.show : ''; //Package
		return cs_values;
	},

	/**
	 * Used to verify parameter passed in.
	 * @param {string} - pageview or event
	 * @param {object} - variable passed in
	 */
	verify: function(type, e) {
		var success = true;
		if('pageview' === type || 'event' === type) {
			for(var k in this.param_defs) {
				if(this.param_defs.hasOwnProperty(k)) {
					if(this.param_defs[k].required[type] && !e.hasOwnProperty(k)) {
						success = false;
						if(window.console)
							console.log('%c Failed Verification', 'color:Orange', k);
					}
				}
			}
		}
		else {
			if(window.console)
				console.log('Unknown Type', type);
		}
		return success;
	},



	/**
	 * A helper method. Slugifies values to make it safe. In this version of slugify, some special chars
	 * are left as is, such as "_", ":", and ".".
	 * Not undefined or null value is set to blank, as in "" and not remain as null.
	 * @param {String}
	 * @return slugified string.
	 */
	slugify: function(str){

		if(typeof str === 'undefined' || str === null)
			str = '';
		str += '';
		if(str.match(/^(http|https):\/\/.*?/))
			return str;
		str = str.toLowerCase().replace(/[^a-zA-Z0-9\s_\-\:\.=]/g,"");
		str = str.replace(/\s/g,'_');

		return str;
	},





	/**
	 * Retrieve or generate randomly generated UID. Also stores cookie information.
	 * @return {uid}
	 */
	get_uid: function() {
		var uid = jQuery.cookie(this.cookienames.uid);
		var pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
		uid = uid || pattern.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0;
			var v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		jQuery.cookie(this.cookienames.uid, uid, {
			expires: 730,
			path: '/',
			domain: this.cfg.network.cookie_domain || location.hostname
		});
		return uid;
	},





	/**
	 * Retrieves query parameter
	 * @return {[type]} [description]
	 */
	query_param: function() {
		var query_string = {};
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for(var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			if (typeof query_string[pair[0]] === "undefined") {
				query_string[pair[0]] = pair[1];
			} else if (typeof query_string[pair[0]] === "string") {
				var arr = [ query_string[pair[0]], pair[1] ];
				query_string[pair[0]] = arr;
			} else {
				query_string[pair[0]].push(pair[1]);
			}
		}
		return query_string;
	},






	/************
	 *
	 * Section below here should be deleted after migration is complete
	 *
	 ************
	 */
	/**
	 * Omnture, we are not going to be really trackign events, instead, we will track
	 * each event as page view. As such, there is common code for both trackPageView
	 * and trackEvent.
	 */
	do_omniture: function(e, params, type) {
		//
	}








};
