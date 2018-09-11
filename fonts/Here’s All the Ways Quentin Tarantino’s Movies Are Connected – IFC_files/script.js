// Cache purge

// Immediate load
(function($) {

	llnwpg_addToCacheList = function(href) {
		if (!window.llnwpg_cacheList)
			llnwpg_cacheList = [];
		if ($.inArray(href, llnwpg_cacheList) < 0)
			llnwpg_cacheList.push(href);
	}

	llnwpg_addToCacheList(location.href);

	llnwpg_addToCacheListCB = function(callback) {
		if (!window.llnwpg_cacheListCB)
			llnwpg_cacheListCB = [];
		llnwpg_cacheListCB.push(callback);
	}

	llnwpg_addToCacheListPreCB = function(callback) {
		if (!window.llnwpg_cacheListPreCB)
			llnwpg_cacheListPreCB = [];
		llnwpg_cacheListPreCB.push(callback);
	}

	llnwpg_purge = function(s) {

		if (window.llnwpg_cacheListPreCB) $.each(llnwpg_cacheListPreCB, function() {
			if (typeof this == 'function')
				this();
		});

		var dparms = {
			'llnwpg-action': 'purge',
			url: llnwpg_cacheList.join(','),
			pw: s
		};

		// Additional argument is an e-mail address
		if (arguments.length > 1)
			dparms['email']	= arguments[1];

		var callback = function(response) {
			if (!response.error) {
				if (window.console)
					console.log(response);

				if (window.llnwpg_cacheListCB) $.each(llnwpg_cacheListCB, function() {
					if (typeof this == 'function')
						this(response);
				});

				if (!window.llnwpg_cacheListCB || window.llnwpg_cacheListCB.length == 0)
					alert('Purge batch '+response.id+' being processed');
			}
			else {
				alert('Purge failed: '+response.message);
			}
		};

		$.ajax({
			url: '/',
			data: dparms,
			dataType: 'json',
			error: function (request, status, error) {
				var o = $.parseJSON(request.responseText);
				if (typeof o != 'object')
					o = {message: 'Bad response: '+request.responseText};
				o.error = true;
				if (o.message)
					o.message = ""+error+"\n\n"+o.message;
				else
					o.message = ""+error;
				callback(o);
			},
			success: callback
		});
	}

})(jQuery);
