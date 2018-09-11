/**
 * Requires jQuery 1.7.1 or Up
 */
var _amcn_dfp = {

	/* store config */
	cfg: _dfp_config,

	/* assign correlator */
	correlator: new Date().getTime() + "_" + Math.floor((Math.random()*1000000000000)+1),

	/* scor value */
	scor: Math.floor((Math.random()*1000000000000)+1),


	/* list of refreshable slots */
	refreshable_slots: [],

	/* flag to see if there is an insertable ads already */
	has_insertable: false,

	/* Create Render queue and html checker to minimize the number of request made to render the content */
	render_queue: [],
	last_render: false,
	last_html: false,
	interval: 1000,
	initial_render: true,

	/* create random values for element ids */
	create_rand: function(length) {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for(var i=0; i < length; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	},


	/**
	 * Queue Rendering Functions
	 */
	render: function() {
		_amcn_dfp.render_queue.push(true);
		_amcn_dfp._render();
	},

	/**
	 * Render Diplsay Ads. Renders at most _amcn_dfp.interval rate.
	 */
	_render: function() {

		// nothing in the queue
		if(_amcn_dfp.render_queue.length === 0)
			return;

		// stagger, to avoid too many executions
		var current_time = new Date().getTime();
		_amcn_dfp.last_render = _amcn_dfp.last_render || current_time + _amcn_dfp.interval;
		if(current_time - _amcn_dfp.last_render < _amcn_dfp.interval) {
			setTimeout(function() {
				_amcn_dfp._render();
			}, _amcn_dfp.interval);
			return;
		}


		_amcn_dfp.last_render = current_time;
		(function($){

			if(!_amcn_dfp.last_html || _amcn_dfp.last_html != $('body').html()) {
				var cfg = _amcn_dfp.cfg;
				// used for "more" ads
				var refresh_on_render = [];
				cfg.count = cfg.count || {};
				var ads = $('.amcn-dfp:visible').not(function(index, e){
					var s = $(this).data('state');
					return s === 'initializing' || s === 'rendered';
				});

				var hasCompanion = $('.platform-container').length > 0;
				googletag.cmd.push(function() {
					$(ads).each(function(i, ad){
						try {
							$(this).data('state', 'initializing');

							// get position and counter for the ad. check if this is
							// a logo from prefix
							var pos = $(this).data('position');
							pos = pos.indexOf('logo') === 0 ? 'logo' : pos;

							// retrieve definition
							var def = cfg.positions[pos];

							// check how many of the same position name exists
							var count = cfg.count[$(this).data('position')] || 0;

							// generate unique id for ad element and specify
							var eid = 'ad_' + $(this).data('position') + '_' + count + '___' + _amcn_dfp.create_rand(32);
							while($("#" + eid).length !== 0)
								eid = 'ad_' + $(this).data('position') + '_' + count + '___' + _amcn_dfp.create_rand(32);
							$(this).attr('id', eid);

							// define position name
							var pos_name = $(this).data('position') + (count === 0 ? '' : '_' + count);

							// queue up ads
							var videos = $('.brightcove-video-template')
							var slot = null;

							var default_size = def.sizes['1000'];
							var mapping = googletag.sizeMapping()
								.addSize([1000, 0], def.sizes[1000])
								.addSize([768, 0], def.sizes[768])
								.addSize([640, 0], def.sizes[640])
								.addSize([0, 0], def.sizes[0])
								.build();

                            if (pos === 'top') {
                                slot = googletag.defineSlot(cfg.ad_unit_path, default_size, $(this).attr('id'))
                                    .addService(googletag.pubads())
                                    .defineSizeMapping(mapping)
                                    .setCollapseEmptyDiv(true, true)
                                    .setTargeting("pos", pos_name);

                                console.log('   >>>>>>amcn-dfp-manager top<<<<<<', pos_name, cfg.ad_unit_path, def);

                            } else if (pos === 'outofpage') {
								slot = googletag.defineOutOfPageSlot(cfg.ad_unit_path, $(this).attr('id'))
									.addService(googletag.pubads())
									.setCollapseEmptyDiv(true, true)
									.setTargeting("pos", pos_name);
								
								console.log('   >>>>>>amcn-dfp-manager outofpage<<<<<<', pos_name, cfg.ad_unit_path, def);
							}
							else if(pos === 'companion' && hasCompanion) {
								slot = googletag.defineSlot(cfg.ad_unit_path, default_size, $(this).attr('id'))
									.addService(googletag.companionAds())
									.addService(googletag.pubads())
									.defineSizeMapping(mapping)	
									.setTargeting("pos", pos_name);

								console.log('   >>>>>>amcn-dfp-manager companion hasCompanion<<<<<<', pos_name, cfg.ad_unit_path, def);
							}
							else if(hasCompanion) {
								slot = googletag.defineSlot(cfg.ad_unit_path, default_size, $(this).attr('id'))
									.addService(googletag.pubads())
									.defineSizeMapping(mapping)
									.setTargeting("pos", pos_name);
								
								console.log('   >>>>>>amcn-dfp-manager non companion ad on page with companion<<<<<<', pos_name, cfg.ad_unit_path, def);
							}
							else {
								slot = googletag.defineSlot(cfg.ad_unit_path, default_size, $(this).attr('id'))
									.addService(googletag.pubads())
									.defineSizeMapping(mapping)
									.setCollapseEmptyDiv(true)
									.setTargeting("pos", pos_name);

								console.log('   >>>>>>amcn-dfp-manager default<<<<<<', pos_name, cfg.ad_unit_path, def);
							}

							// increment ad stats
							cfg.count[$(this).data('position')] = ++count;

							// cue display ads to be refreshable, if need be
							if($(this).data('refreshable') === 'yes' && slot)
								_amcn_dfp.refreshable_slots.push(slot);

							if(!_amcn_dfp.initial_render && slot)
								refresh_on_render.push(slot);

						}
						catch(t) {
							console.log(t);
						}
					});

					// assign defined values
					googletag.pubads().setTargeting("s1", cfg.s1);
					googletag.pubads().setTargeting("s2", cfg.s2);
					googletag.pubads().setTargeting("s3", cfg.s3);
					googletag.pubads().setTargeting("pid", cfg.pid);
					googletag.pubads().setTargeting("show", cfg.show);
					googletag.pubads().setTargeting("ctype", cfg.ctype);
					if(typeof cfg.adTest !== 'undefined' || cfg.adTest)
						googletag.pubads().setTargeting("test", cfg.adTest);
					googletag.pubads().setTargeting("site", cfg.site);

					// for videoads
					try {
						if(hasCompanion) {
							var video_id = $('.platform-container').data('media-id');
							if(video_id && video_id.length > 0) {
								googletag.pubads().setVideoContent(video_id, cfg.cmsid);
							}
							else {
								googletag.pubads().enableVideoAds();
							}
							if(window.console) {
								console.log('enableVideoAds, setVideoContent(video_id, cfg.cmsid)=(' + video_id + "," + cfg.cmsid + ")");
							}
						}
						else {
							googletag.pubads().enableSingleRequest();
						}
					}
					catch(t) {
						console.log(t);
					}

					googletag.enableServices();
				});

				// finished rendering
				var refresh = [];
				googletag.cmd.push(function() {
					$.each(ads, function() {
						googletag.display($(this).attr('id'));
						$(this).data('state', 'rendered').attr('data-state', 'rendered');
					});
				});

				// refresh, if this is loaded post initial load.
				if(!_amcn_dfp.initial_render && refresh_on_render.length > 0) {
					googletag.pubads().refresh(refresh_on_render);
				}

				_amcn_dfp.last_html = $('body').html();
				_amcn_dfp.initial_render = false;
				if(window.console)
					console.log('%c rendered', 'background-color:orange; color:#FFF');
			}
		})(jQuery);

		// execute callback method
		_amcn_dfp.render_queue = _amcn_dfp.render_queue.length > 1 ? [true] : [];
	},

	/**
	 * Refresh existing ad frames.
	 */
	refresh: function() {
		try {
			googletag.pubads().refresh(_amcn_dfp.refreshable_slots);
			if(window.console)
				console.log('refreshable_slots', _amcn_dfp.refreshable_slots);
		}
		catch(t) {
			console.log('error: ', t);
		}
	},



	/**
	 * @param selector selector of the element to target
	 */
	show_insertable: function(selector) {
		if(!_amcn_dfp.has_insertable) {
			$('<div class="amcn-dfp advertisement insert" data-refreshable="yes" data-position="insert" data-state="new"></div>').appendTo(selector);
			_amcn_dfp.render();
			_amcn_dfp.has_insertable = true;
		}
		else {
			// append the already existing (but detached) ad unit to the selector
			$(_amcn_dfp.insertAd).appendTo(selector);
			_amcn_dfp.refresh();
		}
	},
	/**
	 * Remves inserted Element
	 */
	hide_insertable: function() {
		// detach and store the ad
		_amcn_dfp.insertAd = $('.amcn-dfp.insert').detach();
	},


	/**
	 * Register
	 */
	register: function() {
		(function($){

			// register renderer
			_amcn_dfp.render();
			$('body').bind('DOMSubtreeModified', function(){
				_amcn_dfp.render();
			});

			_amcn_dfp._registerEventHandlers();
		})(jQuery);
	},


	_registerEventHandlers: function() {
		// register event handlers. specifically, ad load
		try  {
			if(googletag.pubads) {
				googletag.pubads().addEventListener('slotRenderEnded', function(event) {
					jQuery(document).trigger('DFP.slotRenderEnded', [event]);
				});
			}
			else {
				setTimeout(function(){
					_amcn_dfp._registerEventHandlers();
				}, 500);
			}
		}
		catch(t) {
			setTimeout(function(){
				_amcn_dfp._registerEventHandlers();
			}, 500);
			if(window.console)
				console.log(t);
		}
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
	}

};