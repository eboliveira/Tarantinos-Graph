var _amcn_forum = {


	profiles: {},
	profiles_checking: [],

	templates: {
		forum_post: '<section class="post-content">'
						+ '<header class="entry-header">'
							+ '<a class="post-link"><h2 class="post-title"></h2></a>'
						+ '</header>'
						+ '<section class="entry-content">'
							+ '<div class="entry-text"></div>'
						+ '</section>'
						+ '<footer>'
							+ '<div class="join"><a class="post-link"><span class="icon-comment"></span>Join the Conversation <span class="counter-wrapper">(<span class="counter"></span>)</span></a></div>'
							+ '<div class="entry-meta">'
								+ '<p class="posted_by">Posted by <a class="author"></a></p>'
								+ '<p class="time"></p>'
							+ '</div>'
						+ '</footer>'
					+ '</section>'
	},

	onReady: function() {
		(function($){

			//
			// for rendering TALK Forum Your Comment Widget
			//
			try {
				var uinfo = _amcn_janrain.getSessionInfo();
				if(uinfo) {
					if(!uinfo.email_verified) {
						var $e = $(".janrain-engage-create-thread-form:not(.initialized)").parent()
						$e.html(
							"<p class='verifyEmail'>You must <a class='action'>verify your email</a> before you can create forum topic on the site.</p>"
						);
						$e.find('a.action').on("click", function(){
							// bug? Janrain seems to requier two calls to trigger this renderings.
							janrain.capture.ui.renderScreen('verifyEmail');
							janrain.capture.ui.renderScreen('verifyEmail');
						});
					}
					else {
						$(".janrain-engage-create-thread-form:not(.initialized)").on('submit', function(evt) {
							evt.preventDefault();
							var data = {
								'title': $(this).find('[name=title]').val().trim(),
								'body': $(this).find('[name=body]').val().trim(),
								'topic': $(this).find('[name=topic]').val(),
								'isOpenThread': $(this).find('[name=isOpenThread]:checked').val(),
								'uid': _amcn_janrain.getSessionInfo().uid,
							};
							if(data.body.length > 0 && data.title.length > 0) {
								$(this).find('input, textarea').prop( "disabled", true);
								$(this).addClass('status-in-progress');
								var $my = $(this);
								$.getJSON('https://' + _amcn_janrain.api_domain + '/api/user/v1/engage.create.forumthread', data, function(res) {
									$(this).removeClass('status-complete');
									if(res.success)
										$my.parent().find('.on-complete .fail').remove();
									else
										$my.parent().find('.on-complete .success').remove();
									$my.parent().find('.on-complete').show();
									$my.remove();
								});
							}
							else {
								$(this).find(".errors").text("You must enter both title and post.");
							}
						}).addClass("initialized").show();
					}
				}
				else {
					$(".janrain-engage-create-thread-form:not(.initialized)").remove();
				}
			}
			catch(t) {
				console.log(t);
			}


			// render single, if it exists
			if(typeof forum_single !== 'undefined' && forum_single) {

				forum_single['uid'] = forum_single.userID;
				var $tmpl = _amcn_forum.create_post(forum_single);
				$('.forum-single-wrapper').html($tmpl);
			}


			$(document).trigger("amcn_forum.initialize");
		})(jQuery);
	},


	init: function() {
		(function($){

			// render events
			var events = [
				"Submit.onRender",
				"Submit.onExpand",
				"User.onInvalidate"
			];
			_.each(events, function(evt){
				Arktan.Broadcast.subscribe(evt, _amcn_forum._init_event_listeners);
			});


			var tracking_events = [
				'Submit.onPostComplete',
				'Stream.Plugins.Like.onLikeComplete',
				'Stream.onMoreButtonPress',
				'internal.Item.onChildrenExpand'
			];
			_.each(tracking_events, function(evt){
				Arktan.Broadcast.subscribe(evt, function(topic, data, contextId){

					var label =  '';
					switch(topic) {
						case 'Submit.onPostComplete':
							label = data.inReplyTo.id ? 'reply' : 'root';
							break;
						case 'Stream.onMoreButtonPress':
							var count = $("body").data(md5(topic));
							count = count || 0;
							label = count = count.length === 0 ? 1 : parseInt(count);
							$("body").data(md5(topic), count++);
							break;
						default:
							break;
					}
					$(document).trigger('amcn_event', {
						event_name: 'user:engage',
						event_action: topic,
						event_label: label,
						"data": {
							'topic': topic,
							'data': data,
							'contextId': contextId
						}
					});
				});
			});


			Arktan.Broadcast.subscribe("Stream.onRender", function(topic, data, contextId) {
				jQuery(document).trigger('Arktan.Stream.onRender', data);
			});


			Arktan.Broadcast.subscribe("Counter.update", function(topic, data, contextId) {
				jQuery(document).trigger('Arktan.Counter.update', data);
			});



			Arktan.Broadcast.subscribe("Stream.Item.onRender", function(topic, data, contextId) {


				// for user activie
				if($(data.target).parents('.user-activity').length > 0) {

					// catch and try to parse JSON content
					try {
						var item_content = JSON.parse(data.item.data.object.title);
						var target = $(data.item.target);
						target.find('.note_title').text(item_content.body);
						target.find('.echo-item-textEllipses, .echo-item-textToggleTruncated').remove();
						target.find('.echo-item-from a')
							.prop('href', item_content.url)
							.text($('<div>' + item_content.title + "</div>").text());
					}
					catch(t) {}

				}

				// hiding
				if($(data.target).hasClass('talk-forum-posts')) {
					try {
						var content = jQuery.parseJSON(data.item.data.object.title);
						var $post = $(data.item.target);
						var clazz = 'thread-' + md5(content.url);

						content.uid = content.uinfo.uid;
						content.streamID = data.streamID;

						var $tmpl = _amcn_forum.create_post(content);
						$tmpl.addClass(clazz);
						// $post.children().hide();
						$post.html($tmpl);

						// to hide elements that are not in templates
						if($(data.target).hasClass('open-threads') && $("style#" + clazz).length === 0) {
							$("<style type='text/css'>.regular-threads ." + clazz + " { display:none; }</style>")
								.prop("id", clazz)
								.appendTo("head");
						}
					}
					catch(t) {
						console.log(t);
					}
				}

				if($(data.target).parents('.janrain-engage-comments').length > 0) {
					var $post = $(data.item.target);
					var uinfo = _amcn_janrain.getSessionInfo();

					// signed in my not verified an email address
					if(uinfo && !uinfo.email_verified) {
						_amcn_forum._render_on_email_unverified(topic, data, contextId);
					}
					// not signed in at all
					else if(!uinfo){
						$post.find('.echo-item-control').remove();
					}

				}


				$(data.target).parent().show();
			});
			_amcn_janrain.ready(_amcn_forum.onReady);




		})(jQuery);
	},

	_init_event_listeners: function(topic, data, contextId) {
		var uinfo = _amcn_janrain.getSessionInfo();
		// signed in my not verified an email address
		if(uinfo && !uinfo.email_verified) {
			_amcn_forum._render_on_email_unverified(topic, data, contextId);
		}
		// not signed in at all
		else if(!uinfo){
			_amcn_forum._render_on_no_auth(topic, data, contextId);
		}
	},

	_render_on_email_unverified: function(topic, data, contextId) {
		(function($){
			if(topic === 'Stream.Item.onRender') {
				var $post = $(data.item.target);
				$post.find('.echo-item-control').remove();
			}
			else if(topic === 'Submit.onRender' || topic === "Submit.onExpand") {
				$(data.target).html($("<p class='verifyEmail'>You must <a class='action'>verify your email</a> before commenting on the site.</p>"));
				$(data.target).find('a.action').on("click", function(){
					// bug? Janrain seems to requier two calls to trigger this renderings.
					janrain.capture.ui.renderScreen('verifyEmail');
					janrain.capture.ui.renderScreen('verifyEmail');
				});
			}
		})(jQuery);
	},

	_render_on_no_auth: function(topic, data, contextId) {
		(function($){
			if(topic === 'Stream.Item.onRender') {
				var $post = $(data.item.target);
				$post.find('.echo-item-control').remove();
			}
			else if(['Submit.onRender', "Submit.onExpand"].indexOf(topic) !== -1) {
				var $e = $("<div class='engage-comment-holder'>You must be <a class='login'>signed in</a> to comment on the site.</div>");
				$e.on("click", function(){
					janrain.capture.ui.renderScreen('signIn');
					evt.preventDefault();
				});
				$(data.target).replaceWith($e);
			}
		})(jQuery);
	},


	create_post: function(data) {
		try {
			var $tmpl = jQuery(_amcn_forum.templates.forum_post);
			$tmpl.find('.post-link').prop('href', data.url);
			$tmpl.find('.post-title').html(data.title);
			$tmpl.find('.entry-text').html(data.body);

			if(typeof data.datetime === 'number' ) {
				var date = new Date(data.datetime * 1000);
				$tmpl.find('.time').text(
					date.getFullYear()
					+ "-" + _amcn_forum.pad(date.getMonth()+1, '0', 2)
					+ "-" + _amcn_forum.pad(date.getDate(), '0', 2)
					+ " " + _amcn_forum.pad(date.getHours(), '0', 2)
					+ ":" + _amcn_forum.pad(date.getMinutes(), '0', 2)
				);
			}

			// for counters
			// consoo.elog(data);
			// $tmpl.find('.counter').prop('id', );
			var eid = 'counter-' + md5(data.streamID);
			var $c = $tmpl.find('.counter').prop('id', eid);
			if(typeof data.url !== 'undefined' && data.url.match(/^http/)) {
				$c
					.data('domain',_amcn_janrain.engage_domain)
					.data('url', data.url)
					.data('appkey', Arktan.settings.appkey)
					.arktanSocialCounter();
			}
			else {
				$tmpl.find('.counter-wrapper').remove();
			}


			// for rednering profiles
			var my_uid = data.uid || data.uinfo.uid;
			if(data.uid in _amcn_forum.profiles ) {
				$tmpl.find('.author')
					.prop('href', "https://" + _amcn_janrain.api_domain + "/users/" + data.uid)
					.text(_amcn_forum.profiles[data.uid]);
			}
			else if(_amcn_forum.profiles_checking.indexOf(data.uid) === -1) {
				_amcn_forum.profiles_checking.push(my_uid);
				_amcn_janrain.getUserByUID(my_uid, function(res){
					jQuery(".user-" + my_uid).text(res.data.displayName);
					jQuery(".user-" + my_uid).prop("href", '/users/' + my_uid);
					_amcn_forum.profiles[data.uid] = res.data.displayName;
				});
			}
			$tmpl.find('.author').addClass("user-" + my_uid);



			return $tmpl;
		}
		catch(t) {
			console.log(t);
		}
	},


	pad: function(str, c, length) {
		str = "" + str;
		c = "" + c;
		while(str.length < length)
			str = c + str;

		return str;
	}


};

_amcn_forum.init();
