/*
Initializations and settings for the Capture Widget.

For more information about these settings, see the following documents:

	https://developers.janrain.com/documentation/widgets/social-sign-in-widget/social-sign-in-widget-api/settings/
	https://developers.janrain.com/documentation/widgets/user-registration-widget/capture-widget-api/settings/
*/


var _amcn_janrain = _amcn_janrain || {};
_amcn_janrain.texts = _amcn_janrain.texts || {
	login_panel: {
		login: 'sign in',
		logout: 'sign out',
		login_network: 'sign into ' + _amcn_janrain.network_label,
		logout_network: 'sign out',
		profile: 'profile'
	},
	profile: {
		'private': 'Recently Watched',
		'public': 'Talk',
		settings: 'Profile',
		'newsletters': 'Newsletters'
	},
	reminders: {
		placeholder: "You have no reminders. Click <a href=\"/schedule\">here</a> to view "+ _amcn_janrain.network_label +"'s on-air schedule."
	}
};
_amcn_janrain = jQuery.extend(_amcn_janrain, {

	last_known_screen: null,
	mvpd_screen_by: null,
	cookie_names: {
		has_session: _amcn_janrain.env + '_amcn_jr_has_session',
		display_name: _amcn_janrain.env + '_amcn_jr_displayname',
		url: _amcn_janrain.env + '_amcn_jr_url',
		uid: _amcn_janrain.env + '_amcn_jr_uid',
		profile_image: _amcn_janrain.env + '_amcn_jr_profile_image',
		email_verified: _amcn_janrain.env + '_amcn_jr_email_verified',
		email: _amcn_janrain.env + '_amcn_jr_email',
		huid: _amcn_janrain.env + '_amcn_jr_huid',
		auth_provider: _amcn_janrain.env + '_amcn_janrain_auth_provider'
	},
	ls_names: {
		uid: 'amcn_jr_uid',
	},
	session_ready: false,
	updating_editProfile: false,
	forShowMVPDScreen: false,
	engage: {
		stream_prefixes: {
			reminders: 'reminders_',
			video_history: 'videohistory_'
		}
	},
	reload_page_on_logout: true,

	tmpl: {
		reminder: '<li class="reminder">'
			+ "<div class='col-1'>"
				+ '<div class="image-wrapper"><img class="thumb" src="' + _amcn_janrain.network_logo + '"/></div>'
			+ "</div>"
			+ "<div class='col-2'>"
				+ '<div class="description-wrapper">'
					+ '<div class="title-wrapper"><h5 class="title"></h5></div>'
					+ '<div class="title-wrapper"><h6 class="episode-title"></h5></div>'
					+ '<div class="details-wrapper">'
						+ '<p class="details"></p>'
						+ '<p class="on-air-schedule"></p>'
					+ '</div>'
				+ '</div>'
				+ "<a class='remove' data-reminder-date='' data-tribune-id='' data-reminder-tz=''>Remove</a>"
			+ "</div>"
			+ '</li>'
	},
	

	// to togle traditional signin for signIn screen
	change_to_traditional_signin: null,

	init: function() {
		(function($){

			// Check for settings. If there are none, create them
			if (typeof window.janrain !== 'object') window.janrain = {};
			if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};
			if (typeof window.janrain.settings.capture !== 'object') window.janrain.settings.capture = {};

			// Load Engage and Capture. 'login' is Engage, 'capture' is Capture.
			// Changing these values without guidance can result in unexpected behavior.
			janrain.settings.packages = ['login', 'capture'];

			janrain.settings.appUrl = _amcn_janrain.app_url;
			janrain.settings.capture.captureServer = _amcn_janrain.capture_server;
			janrain.settings.capture.appId = _amcn_janrain.capture_app_id;
			janrain.settings.capture.clientId = _amcn_janrain.client_id;
			// ---- Additional
			janrain.settings.showAttribution = false;


			// These are the URLs for your Engage app's load.js file, which is necessary
			// to load the Capture Widget.
			var httpLoadUrl = _amcn_janrain.auth_widget_http;
			var httpsLoadUrl = _amcn_janrain.auth_widget_https;


			// --- Engage Widget Settings ----------------------------------------------
			janrain.settings.language = 'en-US';
			janrain.settings.tokenUrl = 'https://' + _amcn_janrain.api_domain + '/';
			janrain.settings.tokenAction = 'event';
			janrain.settings.fontFamily = 'Helvetica, Lucida Grande, Verdana, sans-serif';
			janrain.settings.actionText = ' ';
			janrain.settings.width = 280; // width reponsive


			// --- Capture Widget Settings ---------------------------------------------
			janrain.settings.capture.redirectUri = 'https://' + _amcn_janrain.api_domain;
			janrain.settings.capture.flowName = _amcn_janrain.capture_flow_name;
			janrain.settings.capture.flowVersion = 'HEAD';
			janrain.settings.capture.registerFlow = 'socialRegistration';
			janrain.settings.capture.setProfileCookie = true;
			janrain.settings.capture.keepProfileCookieAfterLogout = false;
			janrain.settings.capture.modalCloseHtml = 'X';
			janrain.settings.capture.noStyling = false;
			janrain.settings.capture.noModalBorderInlineCss = true;
			janrain.settings.capture.responseType = 'token';
			janrain.settings.capture.returnExperienceUserData = ['displayName'];
			janrain.settings.capture.stylesheets = [];
			janrain.settings.capture.mobileStylesheets = [];
			janrain.settings.noReturnExperience = true;

			// extending session of the token.
			janrain.settings.capture.accessTokenLifeHours = 6;


			// --- Mobile WebView ------------------------------------------------------
		   //janrain.settings.capture.redirectFlow = true;
			//janrain.settings.popup = false;
			//janrain.settings.tokenAction = 'url';
			//janrain.settings.capture.registerFlow = 'socialMobileRegistration'



			// --- Federate ------------------------------------------------------------
			//janrain.settings.capture.federate = true;
			//janrain.settings.capture.federateServer = '';
			//janrain.settings.capture.federateXdReceiver = '';
			//janrain.settings.capture.federateLogoutUri = '';
			//janrain.settings.capture.federateLogoutCallback = function() {};
			//janrain.settings.capture.federateEnableSafari = false;



			// --- Backplane -----------------------------------------------------------
			janrain.settings.capture.backplane = true;
			janrain.settings.capture.backplaneBusName = _amcn_janrain.engagement_busname;
			janrain.settings.capture.backplaneVersion = 1.2;
			janrain.settings.capture.backplaneBlock = 20;
			janrain.settings.capture.backplaneReplayOnPageLoad = true;




			// --- BEGIN WIDGET INJECTION CODE -----------------------------------------
			/********* WARNING: *******************************************************\
			|      DO NOT EDIT THIS SECTION                                            |
			| This code injects the Capture Widget. Modifying this code can cause the  |
			| Widget to load incorrectly or not at all.                                |
			\**************************************************************************/


			janrainUtilityFunctions().showEvents();

			janrain.ready = true;

			var injector = document.createElement('script');
			injector.type = 'text/javascript';
			injector.id = 'janrainAuthWidget';
			if (document.location.protocol === 'https:') {
				injector.src = httpsLoadUrl;
			} else {
				injector.src = httpLoadUrl;
			}
			var firstScript = document.getElementsByTagName('script')[0];
			firstScript.parentNode.insertBefore(injector, firstScript);

			// --- END WIDGET INJECTION CODE -------------------------------------------



		})(jQuery);
	},



	onCaptureRegistrationSuccess: function(result) {
		(function($){

			try {

				var $modal = $('#janrainModal');
				$modal.find('.capture_screen_container').hide();

				if(typeof result !== 'undefined' && typeof result.action !== 'undefined' && ['socialRegister', 'traditionalRegister'].indexOf(result.action) !== -1) {
					$('body').addClass('janrain-on-register');
				}

				var targetID = "mvpdLogin";
				var $clone = $("#mvpdLogin-original").clone();
				$clone.prop('id', targetID);
				$clone.show();
				$clone.addClass("has_registered");
				$clone.data('has_registered', true);
				$clone.appendTo($modal);

				$(document).trigger('_amcn_janrain.showMVPDScreen', {
					'targetID': targetID
				});

				_amcn_janrain.onLogin(result);

				var authProvider = result.screen === "traditionalRegistration"
					? 'traditional'
					: result.authProvider;

				if(_amcn_janrain.newsletters_info) {
					var nl = _amcn_janrain.newsletters_info;
					if(nl.mso.length > 0 && nl.newsletters.length > 0) {
						_amcn_janrain._post("https://" + _amcn_janrain.api_domain + "/api/user/v1/enqueue.capture",
						{
							'newsletters': _amcn_janrain.newsletters_info.newsletters,
							'leanplum_ids': _amcn_janrain.newsletters_info.leanplum_ids,
							'mso': _amcn_janrain.newsletters_info.mso,
							'email': result.userData.email,
							'url': location.href,
							'pageTitle': $('title').text(),
							'ga_campaign': _amcn_janrain.network_ga_campaign,
							'ga_source': 'capture',
							'ga_medium': 'registration'
						},
						function(res) {
							_amcn_janrain.trackCaptureEvent(
								"screen:" + _amcn_janrain.last_known_screen,
								'newsletter_signup:' + authProvider
							);
						});
					}
				}

				_amcn_janrain.trackCaptureEvent("screen:" + _amcn_janrain.last_known_screen, 'complete:' + authProvider);
			}
			catch(t) {
				console.log('bleh', t);
			}

		})(jQuery);

	},

	onCaptureSessionCreated: function(res) {
		_amcn_janrain.onChangeSession();
	},


	onChangeSession: function(res) {

		// refresh GUI
		_amcn_janrain.updateGUI();

		// invoke events
		jQuery(document).trigger(
			_amcn_janrain.session_ready ? 'amcn.onJanrainChange' : 'amcn.onJanrainReady',
			[  _amcn_janrain.getSessionInfo() ]
		);
		_amcn_janrain.session_ready = true;
	},



	onLogin: function(res) {

        var uuid = eval("(" + localStorage["janrainCaptureProfileData"] + ")").uuid;
        var entityType = _amcn_janrain.entity_type;
        var appkey = Arktan.settings.appkey;
        var authProvider = res.authProvider ? res.authProvider : "traditional";

        Arktan.initializeEngagementUser(uuid, entityType, appkey);


		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.has_session, true);
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.display_name, jQuery('<div></div>').html(res.userData.displayName).text());
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.uid, res.userData.uuid);
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.url, '/users/' + res.userData.uuid);
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.email_verified, res.userData.emailVerified || '');
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.email, res.userData.email);
		_amcn_janrain.setCookie(_amcn_janrain.cookie_names.auth_provider, authProvider);
		localStorage.setItem(_amcn_janrain.ls_names.uid, res.userData.uuid);
		if(typeof res.userData.photos !== 'undefined' && res.userData.photos.length > 0) {
			_.each(res.userData.photos, function(v) {
				if(v.type === 'original') {
					_amcn_janrain.setCookie(_amcn_janrain.cookie_names.profile_image, v.value);
				}
			});
		}
		else {
			_amcn_janrain.setCookie(_amcn_janrain.cookie_names.profile_image, _amcn_janrain.default_profile_image);
		}
		_amcn_janrain.onChangeSession();


		// dispose if there is no reason to register.
		if(['socialRegister', 'traditionalRegister'].indexOf(res.action) === -1) {
			janrain.capture.ui.modal.close();
		}

		try {
			var login_res = res;
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.session.start",
				{
					'uid': res.userData.uuid,
					'ga_uid': _ca.get_uid()
				},
				function(res) {
					try {
						// session was successfully started, logged in.
						_amcn_janrain.trackCaptureEvent('session', 'login:' + authProvider);
						jQuery(document).trigger(
							_amcn_janrain.session_ready ? 'amcn.onJanrainChange' : 'amcn.onJanrainReady',
							[  _amcn_janrain.getSessionInfo() ]
						);
						jQuery(document).trigger(
							'amcn.onJanrainLogin',
							[  _amcn_janrain.getSessionInfo() ]
						);
						_amcn_janrain.session_ready = true;


						var refresh_screens = ['socialRegistration','signIn'];
						if(
							typeof login_res.screen !== 'undefined'
							&&  refresh_screens.indexOf(login_res.screen) !== -1
							&& typeof login_res.statusMessage !== 'undefined'
							&& 'signedIn' === login_res.statusMessage
						) {
							location.href = _amcn_janrain.reloadURL(true);
						}
						else {
							janrain.events.onModalClose.addHandler(function(){
								location.href = _amcn_janrain.reloadURL(true);
							});
						}
					}
					catch(res) {
						console.log(">>>>>>>>>>>>", res);
					}
				}
			);
		}
		catch(t) {
			console.log(t);
		}

	},


	/**
	 * Called on Logoug action.
	 * @return {[type]} [description]
	 */
	onLogout: function(res) {

		var authProvider = jQuery.cookie(_amcn_janrain.cookie_names.auth_provider);
		var authProvider = authProvider || 'unknown';
		jQuery.each(_amcn_janrain.cookie_names, function(i, v) {
			_amcn_janrain.deleteCookie(v);
		});
		_amcn_janrain._ajax(
			"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.session.end",
			{},
			function(res) {
				_amcn_janrain.trackCaptureEvent('session', 'logout:' + authProvider);
				_amcn_janrain.onChangeSession();
				jQuery(document).trigger(
					'amcn.onJanrainLogout',
					[  _amcn_janrain.getSessionInfo() ]
				);

				if(_amcn_janrain.reload_page_on_logout) {
					location.href = _amcn_janrain.reloadURL();
				}
				else {
					_amcn_janrain.reload_page_on_logout = true;
				}
			}
		);

	},



	_checkLocalStorageJanrainSession: function() {
		if(localStorage.getItem("janrainCaptureToken") == null) {
			return false;
		}
		else if(localStorage.getItem("janrainCaptureToken_Expires") !== null ) {
			return Date.parse(localStorage.getItem("janrainCaptureToken_Expires")) > Date.parse(Date());
		}
		return false;
	},
	isLoggedIn: function() {
		return janrain.capture.ui.hasActiveSession();
	},
	getSessionInfo: function() {
		if(_amcn_janrain.isLoggedIn()) {
			var email_verified = jQuery.cookie(_amcn_janrain.cookie_names.email_verified);
			email_verified =  email_verified && email_verified.length !== 0 ? email_verified : null;
			var u = {
				'display_name': jQuery.cookie(_amcn_janrain.cookie_names.display_name),
				'uid': jQuery.cookie(_amcn_janrain.cookie_names.uid),
				'url': jQuery.cookie(_amcn_janrain.cookie_names.url),
				'profile_image': jQuery.cookie(_amcn_janrain.cookie_names.profile_image),
				'email_verified': email_verified,
				'auth_provider':  jQuery.cookie(_amcn_janrain.cookie_names.auth_provider)
			};
			return u;
		}
		return false;
	},



	/**
	 * Cookie Control for AMCN-Janrain
	 */
	setCookie: function(key, value, expire) {
		jQuery.cookie(key, value, {
			expires: expire ? expire : 365,
			path: '/',
			domain: location.hostname.split('.').slice(-2).join('.')
		});
	},
	extendCookie: function(key, expire) {
		jQuery.cookie(key, $.cookie(key), {
			expires: expire ? expire : 365,
			path: '/',
			domain: location.hostname.split('.').slice(-2).join('.')
		});
	},
	deleteCookie: function(key) {
		jQuery.removeCookie(key, {
			path: '/',
			domain: location.hostname.split('.').slice(-2).join('.')
		});
	},








	/**
	 * Executes callbacks with UID.
	 * @param  {[type]}   uid      [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	getUserByUID: function(uid, callback) {
		_amcn_janrain._ajax(
			"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.get.user",
			{ uid: uid },
			callback
		);
	},







	getVideoHistory: function(callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.get.video_history",
				{ uid: user.uid },
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},
	addVideoHistory: function(videoId, data, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.add.video_history",
				{
					uid: user.uid,
					"video_id": videoId,
					"data": data
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},
	removeVideoHistory: function(videoId, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.remove.video_history",
				{
					uid: user.uid,
					"video_id": videoId
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},








	/**
	 * Below are setter / getter for the reminders.
	 */
	getReminders: function(callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.get.reminders",
				{ uid: user.uid },
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},
	/**
	 * Below are setter / getter for the reminders.
	 */
	addReminderShow: function(slug, name, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.add.reminder_show",
				{
					uid: user.uid,
					show_slug: slug,
					show_name: name
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},
	/**
	 * Add Reminder for the programme.
	 * @param {[type]}   tmsid Tribune Media ID
	 * @param {[type]}   datetime Must be in YYYY-mm-dd hh:ii:ss format.
	 * @param {[type]}   tz  Timezone of the project
	 * @param {Function} callback callbakc function
	 */
	addReminderProgram: function(tmsid, datetime, tz, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.add.reminder_program",
				{
					uid: user.uid,
					"tmsid": tmsid,
					'datetime': datetime,
					'tz': tz
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},
	/**
	 * Below are setter / getter for the reminders.
	 */
	removeReminderShow: function(slug, name, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.remove.reminder_show",
				{
					uid: user.uid,
					show_slug: slug,
					show_name: name
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},

	/**
	 * Remove reminder for the programme.
	 * @param {[type]}   tmsid Tribune Media ID
	 * @param {[type]}   datetime Must be in YYYY-mm-dd hh:ii:ss format.
	 * @param {[type]}   tz  Timezone of the project
	 * @param {Function} callback callbakc function
	 */
	removeReminderProgram: function(tmsid, datetime, tz, callback) {
		if(_amcn_janrain.isLoggedIn()) {
			var user = _amcn_janrain.getSessionInfo();
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.remove.reminder_program",
				{
					uid: user.uid,
					"tmsid": tmsid,
					'datetime': datetime,
					'tz': tz
				},
				callback
			);
		}
		else {
			throw new Exception("You must be logged in.");
		}
	},


	 _ajax: function(url, data, callback) {
		jQuery.ajax({
			'url': url,
			'cache': true,
			'success': callback,
			'dataType': 'json',
			'data': data
		});
	 },

	 //like above function, but for POST
	 _post: function(url, data, callback) {
		jQuery.ajax({
			'method': "POST",
			'url': url,
			'cache': true,
			'success': callback,
			'dataType': 'json',
			'data': data
		});
	 },




	updateGUI: function() {
		(function($) {

			// retrieve copy
			var texts = _amcn_janrain.texts;

			// retieve root component for login
			var $logins = $('.amcn-login-panel');
			$("body, .amcn-login-panel").removeClass('janrain-logged-out janrain-logged-in');
			if(_amcn_janrain.getSessionInfo()) {
				var user = _amcn_janrain.getSessionInfo();

				$profile = $('<a class="profile"><div class="profile-pic-wrapper"><img class="profile"></div><span class="display_name"></span></a>');
				$profile.find('img.profile').prop('src', user.profile_image);
				$profile.find('span.display_name').text(user.display_name);
				$profile.prop('href', '/users/settings');

				$profile_dropdown = $('<a class="profile"></a>"').text(texts.login_panel.profile).prop('href', '/users/settings');
				$logout_universal = $('<a class="logout"></a>"').text(texts.login_panel.logout_network);

				$logins.addClass('janrain-logged-in');
				$("body").addClass('janrain-logged-in');

				$logins.find('.item .janrain').html($profile);
				$logins.find('.dropdown .janrain').html($profile_dropdown);
				$logins.find('.dropdown .universal').html($logout_universal);
				$logins.find('a.logout').on('click', function(evt) {
					janrain.capture.ui.endCaptureSession();
					evt.preventDefault();
				});

				$logins.find('.item .universal').empty();
			}
			else {

				$signin = $('<a class="login"></a>');
				$signin_amc = $signin.clone();
				$signin_universal = $signin.clone();

				$logins.addClass('janrain-logged-out');
				$("body").addClass('janrain-logged-out');

				$logins.find('.item .janrain').html($signin.text(texts.login_panel.login));
				$logins.find('.dropdown .janrain').html($signin_amc.text(texts.login_panel.login_network));
				$logins.find('.item .universal').html($signin_universal.text(texts.login_panel.login));

				$logins.find('a.login').on('click', function(evt) {
					janrain.capture.ui.renderScreen('signIn');
					evt.preventDefault();
				});
				$logins.find('.dropdown .universal').empty();

			}
			$logins.data('janrain-init', true);

			// for rendering profile page
			_amcn_janrain._renderProfileBase();



		})(jQuery);
	},




	_renderReminders:function(reminders) {

		_.each(reminders.ScheduleItem, function(item){

			var tmsid = item.Video.TribuneId;
			var startDate = item.StartDate;
			var startTime = item.StartTime;
			var tm_tz;
			var d = new Date();

			console.log(reminders, _amcn_janrain.reminders);

			var proceed = false;
			_.each(_amcn_janrain.reminders, function(v) {
				if(typeof v.tmsid !== 'undefined' && v.tmsid == tmsid && startDate + " " + startTime == v.datetime) {
					proceed = true;
				}
				tm_tz = v.tz;
			});
			var eid = "reminder-" + md5(tmsid + ":" + startDate + "-" + startTime );

			var data_start_time = startDate + " " + startTime;

			if(proceed && jQuery("#" + eid).length === 0) {

				var title = item.Video.Title;
				var thumb = item.Video.Thumbnail || '';
				var episodeTitle = item.Video.EpisodeTitle || '';
				var episodeSeason = item.Video.EpisodeSeason || "0";
				var episodeNumber = item.Video.EpisodeNumber || "0";
				var title = title;
				var details = (episodeSeason != "0" ? 'Season ' + episodeSeason + ' ': '')
						+ (episodeNumber != "0" ? 'Episode ' + episodeNumber: '');


				jQuery('.reminders').find('.placeholder').remove();

				var $html = jQuery(_amcn_janrain.tmpl.reminder);
				$html.appendTo('.reminders');
				$html.prop('id', eid);

				if(thumb.length > 0)
					$html.find('.thumb').prop("src", thumb);
				$html.find('.title').text(title);
				if(episodeTitle.length > 0)
					$html.find('.episode-title').text(episodeTitle);
				else
					$html.find('.episode-title').parent().remove();

				$html.find('.details').text(details);

				jQuery('#' + eid + ' .remove').attr('data-reminder-date', data_start_time);
				jQuery('#' + eid + ' .remove').attr('data-tribune-id', tmsid);
				jQuery('#' + eid + ' .remove').attr('data-reminder-tz', tm_tz);


				var startDate_array = startDate.split("-");
				var year = parseInt(startDate_array[0].slice(2 ));
				var month = parseInt(startDate_array[1]);
				var date = parseInt(startDate_array[2]);
				var startTime_array = startTime.split(":");
				var hours = ((parseInt(startTime_array[0]) + 11) % 12 + 1);
				var min = startTime_array[1];
				var suffix = (parseInt(startTime_array[0]) >= 12)? 'PM' : 'AM';

				$html.find('.on-air-schedule').text("Airing on " + month + "/" + date + "/" + year + " " + hours + ":" + min + suffix);
			}

		});
	},
	_renderProfileBase: function() {
		(function($){

			try {
				var $base = $('.janrain-profile-base');


				if(_amcn_janrain.isLoggedIn() && $('.reminders:not(.initialized)').length > 0) {
					$('.reminders').addClass('initialized');

					$('<li class="placeholder"></li>').html(_amcn_janrain.texts.reminders.placeholder).appendTo('.reminders');

					var current_user = _amcn_janrain.getSessionInfo();
					_amcn_janrain.reminders = [];
					_amcn_janrain.getReminders(function(res) {
						if(res.success) {
							_amcn_janrain.reminders = _.map(res.data, function(v) { return v.data; });
							_.each(res.data, function(r) {
								if(r.type === 'program') {
									jQuery.ajax({
										'url': '//tribune.services.amcnets.com/'+ _amcn_janrain.network_tribune +'/OnAir/JSON',
										'cache': true,
										'success': _amcn_janrain._renderReminders,
										'dataType': 'jsonp',
										'data': {
											'tmsId': r.data.tmsid,
											'tz': r.data.tz
										}
									});
								}
							});
						};
					});
				}


				// settings page
				if(_amcn_janrain.isLoggedIn() && $("#janrain-user-settings").length > 0) {

					var current_user = _amcn_janrain.getSessionInfo();
					$base.find('img.profile-image').prop('src', current_user.profile_image);
					$base.find('span.display-name').text(current_user.display_name);

					janrain.capture.ui.renderScreen('editProfile');
					$base.find('.header .tabs .public a').text(_amcn_janrain.texts.profile.public);
					$base.find('.header .tabs .private a').text(_amcn_janrain.texts.profile.private);
					$base.find('.header .tabs .settings a').text(_amcn_janrain.texts.profile.settings);
					$base.find('.header .tabs .newsletters a').text(_amcn_janrain.texts.profile.newsletters);
					$base.find(".header .tabs").show();
					$base.addClass("janrain-profile-of-authenticated-user");
					$base.removeClass("janrain-profile-initalizing");
				}
				if(_amcn_janrain.isLoggedIn() && $("#janrain-user-newsletters").length > 0) {

					var current_user = _amcn_janrain.getSessionInfo();
					$base.find('img.profile-image').prop('src', current_user.profile_image);
					$base.find('span.display-name').text(current_user.display_name);

					$base.find('.header .tabs .public a').text(_amcn_janrain.texts.profile.public);
					$base.find('.header .tabs .private a').text(_amcn_janrain.texts.profile.private);
					$base.find('.header .tabs .settings a').text(_amcn_janrain.texts.profile.settings);
					$base.find('.header .tabs .newsletters a').text(_amcn_janrain.texts.profile.newsletters);
					$base.find(".header .tabs").show();
					$base.addClass("janrain-profile-of-authenticated-user");
					$base.removeClass("janrain-profile-initalizing");
				}

				// settings page
				else if(_amcn_janrain.isLoggedIn() && $("#janrain-private-profile:not(.initialized)").length > 0) {
					try {

						var current_user = _amcn_janrain.getSessionInfo();
						$base.find('img.profile-image').prop('src', current_user.profile_image);
						$base.find('span.display-name').text(current_user.display_name);

						janrain.capture.ui.renderScreen('editProfile');
						$base.find('.header .tabs .public a').text(_amcn_janrain.texts.profile.public);
						$base.find('.header .tabs .private a').text(_amcn_janrain.texts.profile.private);
						$base.find('.header .tabs .settings a').text(_amcn_janrain.texts.profile.settings);
						$base.find('.header .tabs .newsletters a').text(_amcn_janrain.texts.profile.newsletters);
						$base.find(".header .tabs").show();
						$base.addClass("janrain-profile-of-authenticated-user");
						$base.removeClass("janrain-profile-initalizing");
					}
					catch(t) {
						console.log(t);
					}
				}


				else if(!_amcn_janrain.isLoggedIn() && $(".janrain-private-pages").length > 0) {
					location.href = '//' + document.location.hostname;
				}


				// profile page
				else if($('#janrain-public-profile:not(.initializing)').length > 0) {

					$('#janrain-public-profile:not(.initializing)').addClass("initializing");

					var current_user = _amcn_janrain.getSessionInfo();
					var parts = _.filter(window.location.href.split("?")[0].split('/'), function(p) {
						return p.length !== 0;
					});
					var uid = parts[3];

					_amcn_janrain.getUserByUID(uid, function(res){
						var $base = $('.janrain-profile-base');
						if(res.success) {
							if(typeof res.data.profile_photo !== 'undefined')
								$base.find('img.profile-image').prop('src', res.data.profile_photo);
							$base.find('span.display-name').text(res.data.displayName);
						}
					});

					if(current_user && current_user.uid === uid) {
						$base.find('.header .tabs .public a').text(_amcn_janrain.texts.profile.public);
						$base.find('.header .tabs .private a').text(_amcn_janrain.texts.profile.private);
						$base.find('.header .tabs .settings a').text(_amcn_janrain.texts.profile.settings);
						$base.find('.header .tabs .newsletters a').text(_amcn_janrain.texts.profile.newsletters);
						$base.find(".header .tabs").show();
						$base.addClass("janrain-profile-of-authenticated-user");
						$base.removeClass("janrain-profile-initalizing");

						// render reminders
						_amcn_janrain.updateReminderHtml();
					}
					else {
						$base.find(".header .tabs").hide();
						$base.addClass("janrain-not-profile-of-authenticated-user");
						$base.removeClass("janrain-profile-initalizing");
					}
				}


				if(_amcn_janrain.isLoggedIn()) {
					var current_user = _amcn_janrain.getSessionInfo();
					$base.find('.header .tabs .public a').prop('href', current_user.url)
				}
			}
			catch(t) {
				console.log(t);
			}



		})(jQuery);


	},


	updateReminderHtml: function() {




	},





	onModalClose: function(result) {
		var $modal = jQuery('#janrainModal');
		$modal.find('.mvpd-screen-ui').remove();
	},
	onCaptureRenderComplete: function(result) {
		(function($){

			// alert("capture render complete");
			if(_amcn_janrain.forShowMVPDScreen) {

				_amcn_janrain.forShowMVPDScreen = false;
				_amcn_janrain._switchToMVPDScreen();
			}else{
				_amcn_janrain._switchToJanrainScreen();
			}
			if(result.screen === 'signIn') {
				var $m = $("#janrainModal");
				if(_amcn_janrain.change_to_traditional_signin) {
					$m.find('.sign_in-native-switch').click();
					_amcn_janrain.change_to_traditional_signin = false;
				}
				$m.find('.sign-in-wrapper .left').show();
			}

		})(jQuery);
	},
	/**
	 * Alter return experience
	 * @param  {[type]} result [description]
	 * @return {[type]}        [description]
	 */
	onCaptureScreenShow: function(result) {

		!function($) {


			// this is to control modal
			if(['traditionalRegistration', 'socialRegistration'].indexOf(result.screen) !== -1) {
				$("<option><span>---</span></option>").appendTo('.capture_cableProvider.capture_select');
				$.each(_amcn_janrain.msos, function(shortname, display_name) {
					$('<option></option>')
						.prop('value', shortname)
						.text(display_name)
						.appendTo('.capture_cableProvider.capture_select');
				});

				// hide elements that already has values to simplify forms
				$('#janrainModal').find('.capture_required').each(function(i, v) {

					if(($(v).val() || $(v).parents('.capture_error').length !== 0) && $(v).prop('name') !== 'displayName') {
						if(result.screen !== 'traditionalRegistration') {
							$(v).parents('.capture_form_item').hide();
						}
					}
				});
			}


			var $newsletter_inputs = $('.capture-newsletters div.capture_checkbox').hide();
			
			if ($newsletter_inputs.length > 0) {
				_.each(_amcn_janrain.newsletters, function(newsletter, index) {
					var key = newsletter.id;
					var leanplum_id = newsletter.leanplum_id;
					
					var label = newsletter.label;

					var checkbox_container = $newsletter_inputs.get(index);

					$(checkbox_container).find('label').contents().filter(function(){
						return this.nodeType === 3;
					}).remove();

					$(checkbox_container).find('label').append('<span>' + label + '</span>')
					$(checkbox_container).find('input').val(key);

					var leanplum_input = '<span id="leanplumId_' + $(checkbox_container).find('input').attr('name') + '" style="display:none;">'
						+ leanplum_id + '</span>';
					$(checkbox_container).append(leanplum_input);
					$(checkbox_container).show();
				});
			}
			

			// for registration completion on social and traditional when email has not been verified.
			if(result.screen === 'emailVerificationNotification') {
				$('#emailVerificationNotification .amcn-show-mvpd-picker').on('click', function(evt) {
					_amcn_janrain.onCaptureRegistrationSuccess();
					evt.preventDefault();
				});
			}

			//
			$("#mvpdLogin").remove();

			// for sign-in
			if(result.screen === 'signIn') {
				var $m = $("#janrainModal");
				$('.sign_in-native-switch').on("click", function(evt) {
					$m.find('.native').show();
					$m.find('.social').hide();
					$m.find('.sign-in-wrapper').addClass('traditional');
					evt.preventDefault();
					_amcn_janrain.trackCaptureEvent("screen:" + _amcn_janrain.last_known_screen, "traditional");
				});
				$('.capture_footer a.back').on("click", function(evt) {
					$m.find('.native').hide();
					$m.find('.social').show();
					$m.find('.sign-in-wrapper').removeClass('traditional');
					evt.preventDefault();
					_amcn_janrain.trackCaptureEvent("screen:" + _amcn_janrain.last_known_screen, "default:via_back");
				});
			}


			$('.mvpd-screen-switch').on('click', function(evt) {
				_amcn_janrain.mvpd_screen_by = 'via_skip';
				_amcn_janrain.showMVPDScreen();
				evt.preventDefault();
			});

			if(result.screen === 'editProfile') {
				$("<option><span>---</span></option>").appendTo('.capture_cableProvider.capture_select');
				$.each(_amcn_janrain.msos, function(shortname, display_name) {
					$('<option></option>').prop('value', shortname).text(display_name).appendTo('.capture_cableProvider.capture_select');
				});

				if(_amcn_janrain.updating_editProfile !== true) {
					_amcn_janrain.updating_editProfile = true;
					_amcn_janrain._ajax(
						"https://" + _amcn_janrain.api_domain + "/api/user/v1/newsletters.get_uinfo",
						{ 'email': $.cookie(_amcn_janrain.cookie_names.email) },
						function(res) {
							if(res.status === 20000) {
								$("#capture_editProfile_cableProvider").val(res.data.mso);
								$(".capture-newsletters").find('input').each(function(i, v) {
									if(res.data.subscriptions.indexOf(parseInt($(v).val())) !== -1) {
										$(v).prop('checked', true);
									}
								});
								_amcn_janrain.updating_editProfile = false;
							}
						}
					);
				}
			}

			// tracking event. Also store last known screen.
			_amcn_janrain.trackCaptureEvent("screen:" + result.screen, 'default');
			_amcn_janrain.last_known_screen = result.screen;


		}(jQuery);
	},







	showMVPDScreen: function(modalOpen) {
		(function($){
			$(function(){

				try {
		console.log("------ showMVPDScreen -------");
					//
					if(modalOpen) {
						_amcn_janrain.forShowMVPDScreen = true;
						janrain.capture.ui.modal.open('signIn');
					}
					else {
						_amcn_janrain._switchToMVPDScreen();
					}

				}
				catch(t) {
					console.log(">>>>>>>>>>>>>>>>>>>>>", t);
				}

			});

		})(jQuery);
	},

	_switchToJanrainScreen: function() {

		try {
			(function($){

				var $modal = $('#janrainModal');
				 $modal.find('.janrain-capture-ui#signIn').show();
				$modal.find('.janrain-capture-ui.mvpd-screen-ui').hide();

			})(jQuery);
		}
		catch(t) {
			console.log(">>>>>>>>>>>>>", t);
		}

	},

	_switchToMVPDScreen: function() {

		try {
			(function($){

				var $modal = $('#janrainModal');
				setTimeout( function() {  $modal.find('.janrain-capture-ui:not(.mvpd-screen-ui)').hide(); }, 100);

				var targetID = "mvpdLogin";
				var $clone = $("#mvpdLogin-original").clone();

				$clone.prop('id', targetID).addClass('mvpd-screen-ui');
				$clone.show();
				$clone.data('has_registered', false);
				$clone.appendTo($modal);
				//$clone.siblings('.capture_screen_container').remove();

				console.log("<<<<<<<<<<<<<<<<<< ", $clone.siblings('.capture_screen_container'));


				$(document).trigger('_amcn_janrain.showMVPDScreen', {
					'targetID': targetID
				});

				// Prompting showing of the last_known_screen
				_amcn_janrain.trackCaptureEvent(
					"screen:" + 'mvpd_auth',
					'default' + (_amcn_janrain.mvpd_screen_by ? ":" + _amcn_janrain.mvpd_screen_by : "")
				);
				_amcn_janrain.last_known_screen = 'mvpd_auth';
				_amcn_janrain.mvpd_screen_by = null;

			})(jQuery);
		}
		catch(t) {
			console.log(">>>>>>>>>>>>>", t);
		}

	},


	hideResendLink: function(result) {
		// Hide the 'Resend confirmation email' link if it's been clicked
		// from the edit profile page. Link will reappear if the user
		// refreshes their profile page.
		if(result.controlName == "resendVerificationEmail" &&
			result.screen == "editProfile") {
			document.getElementById("capture_editProfile_resendLink").style.display = 'none';
		}
	},


	onCaptureLoginFailed: function(result) {
		if(result.action === 'traditionalSignin') {
			_amcn_janrain.change_to_traditional_signin = true;
		}
	},

	onCaptureSaveFailed: function(result) {
		// check if session needs
		_amcn_janrain._mayExtendSession(result);
	},

	onCaptureBackplaneReady: function(result) {

		Arktan.SocialApps.install();
		jQuery(document).on('amcn_forum.initialize', function(){
			jQuery(".janrain-engage-comments:not(.init)").addClass('init').each(function() {
				jQuery(this).arktanArticleComments({
					showCounters: true
				});
			});
			jQuery("#show-activity:not(.init)").addClass('init').each(function() {
				jQuery(this).arktanSocialStream();
			});
			jQuery(".janrain-comment-counter:not(.init)").addClass('init').each(function(){
				jQuery(this).arktanSocialCounter();
			});
		});

	},


	onCaptureValidationComplete: function(result) {
		(function ($){

			// for collecting newsletter data
			var mso = $('.capture_cableProvider.capture_select').val();
			var elements = _.filter(
				jQuery('.capture-newsletters').find('input:checked'),
				function(input) {
					return $(input).prop('name').match(/^optIn/);
				}
			);
			var newsletters = _.map(elements, function(element){
				return $(element).val();
			});

			var leanplum_ids = _.map(elements, function(element){
				return $('#leanplumId_' + element.name).text();
			});

			_amcn_janrain.newsletters_info = {
				'mso': mso,
				'leanplum_ids': leanplum_ids,
				'newsletters': newsletters
			};

		})(jQuery);
	},


	onCaptureEmailVerificationSuccess: function(res, callback) {
		// on Verification is successful, automatically login.
		_amcn_janrain.onLogin(res);
	},

	_mayExtendSession: function(result, callback) {
		// check for if backplane session exists
		var backplaneCacheExpires = localStorage.getItem('backplaneCacheExpires');
		var display_name = _amcn_janrain.getSessionInfo().display_name;

		// backplane session exists, elongate user session
		if(backplaneCacheExpires && Date.parse(backplaneCacheExpires) > Date.parse(Date())) {

			if (!_amcn_janrain._checkLocalStorageJanrainSession()) {

				_amcn_janrain._ajax(
					"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.session.extend",
					{ 'display_name': display_name },
					function(res) {
						if(res.status === 20000) {
							janrain.capture.ui.createCaptureSession(res.data.access_token);
							_amcn_janrain.trackCaptureEvent('session', 'extend:success');
						}
						else {
							_amcn_janrain.trackCaptureEvent('session', 'extend:fail:' + res.status);
							_amcn_janrain.reload_page_on_logout = false;
							janrain.capture.ui.endCaptureSession();
						}
						if(callback) {
							callback();
						}
					}
				);
			}
			else if(result && result.status === 'error' && result.statusMessage === 'invalidAccessToken') {
				_amcn_janrain._ajax(
					"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.session.extend",
					{ 'display_name': display_name },
					function(res) {
						if(res.status === 20000) {
							janrain.capture.ui.createCaptureSession(res.data.access_token);
							_amcn_janrain.trackCaptureEvent('session', 'extend:success');
						}
						else {
							_amcn_janrain.trackCaptureEvent('session', 'extend:fail:' + res.status);
							_amcn_janrain.reload_page_on_logout = false;
							janrain.capture.ui.endCaptureSession();
						}
						if(callback) {
							callback();
						}
					}
				);
			}
			else {
				if(callback)
					callback();
			}
		}

		// backplane session do not exist but huid does
		else if(typeof jQuery.cookie(_amcn_janrain.cookie_names.huid) !== 'undefined' && jQuery.cookie(_amcn_janrain.cookie_names.huid) !== null) {
			_amcn_janrain._ajax(
				"https://" + _amcn_janrain.api_domain + "/api/user/v1/capture.session.extend",
				{ 'display_name': display_name },
				function(res) {
					if(res.status === 20000) {
						janrain.capture.ui.createCaptureSession(res.data.access_token);
						_amcn_janrain.trackCaptureEvent('session', 'extend:success');
					}
					else {
						_amcn_janrain.trackCaptureEvent('session', 'extend:fail:' + res.status);
						_amcn_janrain.reload_page_on_logout = false;
							janrain.capture.ui.endCaptureSession();
					}
					if(callback) {
						callback();
					}
				}
			);
		}


		// backplane session doesn not exists
		else {
			// but janrain session does, then kill janrain session to avoid getting out of
			if (_amcn_janrain._checkLocalStorageJanrainSession()) {
				// janrain.capture.ui.endCaptureSession();
			}
			if(callback)
				callback();
		}




	},



	/**
	 * Triggers events so it can be sniffed by _ca.
	 * @param  {[type]} action [description]
	 * @param  {[type]} label  [description]
	 * @param  {[type]} data   [description]
	 * @return {[type]}        [description]
	 */
	trackCaptureEvent: function(action, label, data) {
		try {

			if(action === null || action.length === 0)
				throw new Exception("Invalid Value for action. ");

			// janrain sreen event
			jQuery(document).trigger('amcn_event', {
				event_name: 'user:profile',
				event_action: action.toLowerCase(),
				event_label: (label || '').toLowerCase(),
				"data": data || {}
			});
		}
		catch(t) {
			console.log(t);
		}
	},



	reloadURL: function(onLogin) {
		var url = location.href.split('#');
		var url_parts = url[0].split('?');
		var params = [];
		if(url_parts.length > 1) {
			var params = _.map(url_parts[1].split("&"), function(e) {
				var kv = e.split('=');
				if(kv.length === 2) {
					return {
						k: kv[0],
						v: kv[1]
					};
				}
				else
					return { k: e };
			});
		}
		params = _.filter(params, function(e) {
			return e !== null
				&& e.k !== 'onLogin'
				&& e.k !== 'screenToRender'
				&& e.k !== 'verification_code';
		});
		params = _.map(params, function(e) {
			return e.k && e.v ? e.k + "=" + e.v : e.k;
		});
		if(onLogin === true)
			params.push('onLogin=true');

		return params.length > 0 ? url_parts[0] + "?" + params.join("&") :  url_parts[0];
	},


	/**
	 * Executes Janrain script when ready
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	ready: function(callback) {
		if(_amcn_janrain.session_ready) {
			// send data with callback`
			callback(_amcn_janrain.session_info);
		}
		else {
			// return data
			jQuery(document).on('amcn.onJanrainReady', function(event, vars) {
				callback(vars);
			});
		}
	}
});


function reminderRemoved(){
	alert('Your reminder has been removed.');
	//_amcn_janrain._renderReminders;
}

// run on ready
jQuery(function(){
	_amcn_janrain.ready(function(res) {
		console.log("READY!", res);

		jQuery(document).on('click', '.remove', function (event) {

			event.preventDefault();

			var remind_me_date = jQuery(this).attr('data-reminder-date');
			var remind_me_tribune = jQuery(this).attr('data-tribune-id');
			var remind_me_tz = jQuery(this).attr('data-reminder-tz');

			try {
				_amcn_janrain.removeReminderProgram(remind_me_tribune, remind_me_date, remind_me_tz, reminderRemoved);
				jQuery(this).parents('.reminder').hide();
			} catch(e) {
				console.log(e.message);
			}

		});

	});
	_amcn_janrain.init();
});





// This function is called by the Capture Widget when it has completred loading
// itself and all other dependencies. This function is required, and must call
// janrain.capture.ui.start() for the Widget to initialize correctly.
function janrainCaptureWidgetOnLoad() {
	var implFuncs = janrainExampleImplementationFunctions(); // Located below.

	/*==== CUSTOM ONLOAD CODE START ==========================================*\
	||  Any javascript that needs to be run before screens are rendered but   ||
	||  after the Widget is loaded should go between this comment and "CUSTOM ||
	||  ONLOAD CODE END" below.                                               ||
	\*                                                                        */

	/*--
		SCREEN TO RENDER:
		This setting defines which screen to render. We've set it to the result
		of implFuncs.getParameterByName() so that if you pass in a parameter
		in your URL called 'screenToRender' and provide a valid screen name,
		that screen will be shown when the Widget loads.
																			--*/
	janrain.settings.capture.screenToRender = implFuncs.getParameterByName('screenToRender');



	/*--
		EVENT HANDLING:

		Event Documentation:
		https://developers.janrain.com/reference/javascript-api/registration-js-api/events/
	--*/
	janrain.events.onModalClose.addHandler(_amcn_janrain.onModalClose);

	janrain.events.onCaptureScreenShow.addHandler(_amcn_janrain.onCaptureScreenShow);
	janrain.events.onCaptureRenderComplete.addHandler(_amcn_janrain.onCaptureRenderComplete);
	janrain.events.onCaptureSaveSuccess.addHandler(_amcn_janrain.hideResendLink);
	janrain.events.onCaptureInvalidToken.addHandler(function(result){
		console.log('&&&&&&&&&&&&&&&  onCaptureInvalidToken!', result);
	});
	janrain.events.onCaptureExpiredToken.addHandler(function(result){
		console.log('&&&&&&&&&&&&&&&  onCaptureExpiredToken!', result);
	});
	janrain.events.onCaptureAccessDenied.addHandler(function(result){
		console.log('&&&&&&&&&&&&&&&  onCaptureAccessDenied!', result);
	});
	janrain.events.onCaptureError.addHandler(function(result) {
		console.log('', result);
	});


	/*--
		NAVIGATION EVENTS:
		These event handlers are used for navigating the example implementation
		that exists on our servers for testing/demo/sample purposes. It is not
		required for your implementation, but can be modified to suit your
		needs. These event handlers are provided as an example.
																			--*/
	janrain.events.onCaptureSessionFound.addHandler(_amcn_janrain.onChangeSession);
	janrain.events.onCaptureSessionCreated.addHandler(_amcn_janrain.onCaptureSessionCreated);
	janrain.events.onCaptureSessionNotFound.addHandler(_amcn_janrain.onChangeSession);
	janrain.events.onCaptureRegistrationSuccess.addHandler(_amcn_janrain.onCaptureRegistrationSuccess);
	janrain.events.onCaptureLoginSuccess.addHandler(_amcn_janrain.onLogin);
	janrain.events.onCaptureSessionEnded.addHandler(_amcn_janrain.onLogout);
	janrain.events.onCaptureAccountDeactivateSuccess.addHandler(_amcn_janrain.onCaptureAccountDeactivateSuccess);
	janrain.events.onCaptureLoginFailed.addHandler(_amcn_janrain.onCaptureLoginFailed);
	janrain.events.onCaptureBackplaneReady.addHandler(_amcn_janrain.onCaptureBackplaneReady);
	janrain.events.onCaptureBackplaneReady.addHandler(_amcn_janrain.onCaptureBackplaneReady);
	janrain.events.onCaptureSaveFailed.addHandler(_amcn_janrain.onCaptureSaveFailed);
	janrain.events.onCaptureValidationComplete.addHandler(_amcn_janrain.onCaptureValidationComplete);
	janrain.events.onCaptureEmailVerificationSuccess.addHandler(_amcn_janrain.onCaptureEmailVerificationSuccess);

	// janrain.events.onCaptureRegistrationStart.addHandler();
	// janrain.events.onCaptureRegistrationSuccess.addHandler();

	/*--
		SHOW EVENTS:
		Uncomment this line to show events in your browser's console. You must
		include janrain-utils.js to run this function.
																			--*/
	janrainUtilityFunctions().showEvents();








	/*                                                                        *\
	|| *** CUSTOM ONLOAD CODE END ***                                         ||
	\*========================================================================*/

	// This should be the last line in janrainCaptureWidgetOnLoad()
    if (localStorage.getItem("janrainCaptureToken") && Date.parse(localStorage.getItem("janrainCaptureToken_Expires")) > Date.parse(Date())) {
        janrain.capture.ui.start();
    }
    else {
    	_amcn_janrain._mayExtendSession(null, function(){
    		janrain.capture.ui.start();
    	});
	}


}


// Reference implementation navigation.
function janrainExampleImplementationFunctions() {


	function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function handleDeactivatedAccountLogin(result) {
		if (result.statusMessage == "accountDeactivated") {
			janrain.capture.ui.renderScreen('accountDeactivated');
		}
	}
	function handleAccountDeactivation(result) {
		alert("handleAccountDeactivation");
		if(result.status == "success") {
			document.getElementById("editProfile").style.display = 'none';
//			janrain.capture.ui.modal.close();
			janrain.capture.ui.endCaptureSession();
			janrain.capture.ui.renderScreen('accountDeactivated');
		}
	}
	return {

		getParameterByName: getParameterByName,
		handleDeactivatedAccountLogin: handleDeactivatedAccountLogin,
		handleAccountDeactivation: handleAccountDeactivation
	};
}(jQuery);
