var amcnAdobeUI = {
	built: false,
	amcnMvpdEndpoint: '/api/mvpds/v1/get.mvpds?device=web',

	getMvpdConfig: function(async){
		var $ = jQuery.noConflict(),
			mvpds;

		// Perform GET to grab network MVPD API config synchronously
		$.ajax({
			url: this.amcnMvpdEndpoint,
			async: async
		}).done(function(data){
			mvpds = data;
		});

		return mvpds;
	},

	// generate an auth area which shows Adobe Pass logged in status
	buildAuthenticated: function(){
		var $ = jQuery.noConflict();

		var output = '<div class="mvpd-authentication-area">' +
						'<div id="login"></div>' +
						'<div class="provider-image"></div>' +
					'</div>';
		$('.amcn-login-panel .adobe').html(output);
	},

	displayAuthenticated: function(){
		var $ = jQuery.noConflict();

		$('.img-placeholder .login').hide();
		$('.img-placeholder .loading').show();

		// set login area
		$('body, .amcn-login-panel').addClass('adobe-logged-in').removeClass('adobe-logged-out');
		$('.amcn-login-panel .dropdown .adobe #login').html('<a href="#" class="mvpd-logout">Log Out</a>');
	},

	displayProvider: function(){
		var $ = jQuery.noConflict();

		// set provider logo
		var authenticatedWith;
		if(typeof amcnAdobePass !== "undefined"){
			authenticatedWith = amcnAdobePass.authenticatedWith;
		}
		else{
			authenticatedWith = amcnPlatform.module.auth.getAuth();
		}
	    $('.amcn-login-panel .item .adobe .provider-image').html(this.buildProviderLogo(authenticatedWith));
	},

	buildProviderLogo:function(provider){
		var $ = jQuery.noConflict(),
			mvpdConfig = this.getMvpdConfig(false),
			imgSrc;
		var html = '';
		var mso_link = '';

		$.each(mvpdConfig.data, function(k, v){

			if(v.shortname === provider){
				imgSrc = v.logo.bg_dark.height_40px;

				if(v.scenario === 'pickerOrNav'){
					imgSrc = v.logo.nav.height_40px;
				}

				if(v.weblink_url.website !== undefined && v.weblink_url.website.length > 0){
					mso_link = v.weblink_url.website;
				}

				return false;
			}
		});

		if(mso_link !== ''){
			html += '<a href="'+mso_link+'" target="_blank"><img src="'+imgSrc+'" /></a>';
		}else{
			html += '<img src="'+imgSrc+'" />';
		}

		return html;
	},

	displayNotAuthenticated: function(){
		var $ = jQuery.noConflict();

		$('.img-placeholder .loading').hide();
		$('.img-placeholder .login').show();
		$('body, .amcn-login-panel').removeClass('adobe-logged-in').addClass('adobe-logged-out');
		$('.amcn-login-panel .item .adobe #login, .amcn-login-panel .dropdown .adobe #login').html('<a href="#" class="mvpd-login">Sign in for Full Episodes</a>');
	},

	displayProviderDialog: function(){
		// display by referencing the Janrain display to keep consistant
		_amcn_janrain.showMVPDScreen(true);
	},


	/**
	 * Compare our MVPD list against the Adobe provider list.
	 * If a match is found then save the array index of the MVPD from the provider list
	 * into our MVPD list object for ease of reference
	 *
	 * @param mvpds array Array of our MVPD objects
	 * @param providers Array of Adobe providers
	 * @return array Our MVPD list with amtched provider references
	 */
	getProviderMatch: function(mvpds, providers){
		var $ = jQuery.noConflict();

		$.each(mvpds, function(k, v){
			$.each(providers, function(k2, v2){
				if(v.shortname === v2.ID){
					mvpds[k].providerMatch = k2;
					return false;
				}
			});
		});

		return mvpds;
	},

	buildProviderDialog: function(providers){
		if (window.console) {
			console.log('Providers ', providers);
		}

		var $ = jQuery.noConflict(),
			$mvpdConfig = undefined,
			$chosenContainer = $('#janrainModal #provider-wrapper .provider-list'),
			lastAuth;

		// Perform GET to grab network MVPD API config synchronously
		$mvpdConfig = this.getMvpdConfig(false);

		// Instance of MVPD list already built, exit out
		if(this.built){
			//$chosenContainer.chosen({disable_search: true});

			//init more providers list
			this.toggleMoreProviders();

			console.log('Provider list already complete');

			return;
		}

		// MVPD API config not found, exit out
		if('undefined' === typeof $mvpdConfig){
			$('.capture_box').html('<p>An error occured. Please try to log in again later.</p>');
			console.log('MVPD config file not found');
			return;
		}

		// Find the same MVPD from the Adobe provider list and save the index
		$mvpdConfig = this.getProviderMatch($mvpdConfig.data, providers);

		lastAuth = window.lastAuthenticatedWith;



		$.each($mvpdConfig, function(k, v) {
			if(('undefined' !== typeof v.providerMatch) && (v.shortname === providers[v.providerMatch].ID)){

				var imgSrc = v.logo.bg_dark.height_60px;

				if(v.scenario === 'pickerOrNav'){
					imgSrc = v.logo.picker.height_60px;
				}


				// Featured list
				if(v.preferred_provider){
					$('#provider-wrapper #promoted-provider-wrapper').append('<div style="display: inline-block;" data-mvpd-shortname="'+ v.shortname +'" class="mvpd_option" onclick="setTimeout( function() { if(navigator.userAgent.match(/iPad/i)){ae.setRequestor(amcnMVPDConfig.network, syncacoreRequestOptions);};createCookie(amcnPlatformConfig.network + \'-tve-authn-clicked\', \'' + v.shortname + '\', 7); ae.setSelectedProvider(\'' + v.shortname + '\'); }, 100);"><img src="' + imgSrc + '"></div>');
				}

				// Picker
				$('#more-providers #provider-list').append('<li class="mvpd_option" data-mvpd-shortname="'+ v.shortname +'" value="' + v.shortname + '" onclick="setTimeout( function() { if(navigator.userAgent.match(/iPad/i)){ae.setRequestor(amcnMVPDConfig.network, syncacoreRequestOptions);};createCookie(amcnPlatformConfig.network + \'-tve-authn-clicked\', \'' + v.shortname + '\', 7); ae.setSelectedProvider(\'' + v.shortname + '\'); }, 100);">' + v.display_name + '</li>');


			}
		});

		//init more providers list
		this.toggleMoreProviders();

		this.built = true;


	},

	toggleMoreProviders: function(){

		var $ = jQuery.noConflict()

		//show more providers toggle
		$('.see-more-providers').click(function(){

			//hide featured picker
			$('#janrainModal .capture_header h1.title').html('More Providers');
			$('#janrainModal #featured-providers').hide();

			//show more mvpds
			$('#janrainModal #more-providers').addClass('active');
			//trigger live search
			$('#janrainModal #provider-search').fastLiveFilter('#janrainModal #provider-list');
		});

	}
};

var syncacoreRequestOptions = { "mvpdConfig":{ "asu_auth-gateway_net":{ "iFrameRequired":false }, "auth_armstrongmywire_com":{ "iFrameRequired":false }, "auth_atlanticbb_net":{ "iFrameRequired":false }, "auth_cableone_net":{ "iFrameRequired":false }, "auth_centurylink_net":{ "iFrameRequired":false }, "auth_hawaiiantel_net":{ "iFrameRequired":false }, "auth_metrocast_net":{ "iFrameRequired":false }, "auth_surewest_net":{ "iFrameRequired":false }, "auth_truvista_net":{ "iFrameRequired":false }, "burlington_auth-gateway_net":{ "iFrameRequired":false }, "clickcabletv_auth-gateway_net":{ "iFrameRequired":false }, "consolidated_auth-gateway_net":{ "iFrameRequired":false }, "enventis_auth-gateway_net":{ "iFrameRequired":false }, "epb_auth-gateway_net":{ "iFrameRequired":false }, "gci_auth-gateway_net":{ "iFrameRequired":false }, "googlefiber_auth-gateway_net":{ "iFrameRequired":false }, "gta_auth-gateway_net":{ "iFrameRequired":false }, "gvtc_auth-gateway_net":{ "iFrameRequired":false }, "hargray_auth-gateway_net":{ "iFrameRequired":false }, "hometelecom_auth-gateway_net":{ "iFrameRequired":false }, "hometowncable_auth-gateway_net":{ "iFrameRequired":false }, "hotwirecommunications_auth-gateway_net":{ "iFrameRequired":false }, "knology_auth-gateway_net":{ "iFrameRequired":false }, "longlines_auth-gateway_net":{ "iFrameRequired":false }, "morrisbroadband_auth-gateway_net":{ "iFrameRequired":false }, "msauth_midco_net":{ "iFrameRequired":false }, "myrtu_auth-gateway_net":{ "iFrameRequired":false }, "nextech_auth-gateway_net":{ "iFrameRequired":false }, "nwcable_auth-gateway_net":{ "iFrameRequired":false }, "openband_auth-gateway_net":{ "iFrameRequired":false }, "serviceelectric_auth-gateway_net":{ "iFrameRequired":false }, "tds_auth-gateway_net":{ "iFrameRequired":false }, "telus_auth-gateway_net":{ "iFrameRequired":false }, "www_websso_mybrctv_com":{ "iFrameRequired":false }, "sony_auth-gateway_net":{ "iFrameRequired":false } } };

// click handlers for login/logout
jQuery(document).ready(function($){
	$('.amcn-login-panel').on('click', '.mvpd-login', function(e){
		e.preventDefault();
		_amcn_janrain.showMVPDScreen(true);
	});

	$('.amcn-login-panel').on('click', '.mvpd-logout', function(e){
		e.preventDefault();
		if(typeof amcnAdobePass !== "undefined"){
			amcnAdobePass.logout();
		}
		else{
			amcnPlatform.module.auth.logout();
		}
	});

	$('.close-button, #login-overlay').on('click', function(){
		// display
		$('#login-overlay').fadeOut('fast');
		$('#login-form').fadeOut('fast');
	});
});
