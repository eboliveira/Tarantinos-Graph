(function( $ ) {
	$(function() {
		$('img').each(function(index, el) {
			if( $(el).data('image-type') === 'gif' ) {
				var wrap_el = '';
				if( $(el).parent( 'picture' ).length > 0 ) {
					wrap_el = $(el).parent( 'picture' );
				} else {
					wrap_el = $(el);
				}
				wrap_el.wrap('<div class="ifc-gif-wrap"><div class="ifc-gif-image" style="padding-top:' + $(el).data('image-ratio') + '%"></div></div>');
			}
		});
	});
})(jQuery);