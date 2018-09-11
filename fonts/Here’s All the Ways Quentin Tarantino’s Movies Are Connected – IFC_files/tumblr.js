(function($){

	var _tumblr_index = 0;
	var _tumblr_size = 15;
	var _tumblr_processing = false;
	function _renderTumblr(start) {
		if(_tumblr_processing)
			return;

		_tumblr_processing = true;
		$('.tumblr-more a:visible').fadeTo(0, 0.5);

		var width = Math.floor(980/3);
		var api_url = '//' + $('.tumblr-posts').data('account') + '.tumblr.com/api/read/json?callback=?';
		
		$.getJSON(api_url, { 'start': start, 'num': _tumblr_size }, function(json) {
			
			//
			var count = 0;
			$.each(json.posts, function(i, p) {
				var url = p["url-with-slug"];
				var text = $(p["photo-caption"]).text();
				try {
					var $a = $('<a target="_blank"><img></img></a>')
						.attr('href', url)
						.attr('title', text)
						.css({'display':'block', 'padding':'5px', 'width':'313px'});
					$a.find('img').attr('src', p["photo-url-1280"]).attr('alt', text).css({'width':'300px'});
					$a.hide();
					$('<div class="post"></div>').append($a).appendTo('.tumblr-posts');
					
				}
				catch(t) {
					if(window.console)
						console.log("no photo?", t, p);
				}
				count++;
			});

			var container = document.querySelector('.tumblr-posts');
			if(container) {
				imagesLoaded( container, function() {
					$('.tumblr-posts').find('a').fadeTo('fast', 1.0);
					$('.tumblr-more a').fadeTo(0, count <= _tumblr_size ? 1.0 : 0.0);

					var msnry = new Masonry(container, {
						// options
						columnWidth: 323,
						itemSelector: '.post'
					});

					// reset state
					_tumblr_processing = false;
					_tumblr_index++;

					$('.tumblr-more').show();
				});
			}
		});
	}
	$('.tumblr-more a').on('click', function(e){
		e.preventDefault();
		_renderTumblr(_tumblr_index *  _tumblr_size);
		return false;
	});

	if($('.tumblr-more a').length > 0) 
		_renderTumblr(0);
	
})(jQuery);