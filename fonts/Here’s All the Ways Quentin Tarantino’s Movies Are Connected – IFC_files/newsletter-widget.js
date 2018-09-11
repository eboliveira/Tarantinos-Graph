(function($){


	$(function() {

		// bassistance jQuery validate config
		setInterval(function(){
			init_newsletter_widget("#fancybox-inner .newsletter-widget-form:not(.init)");
			init_newsletter_widget("#content .newsletter-widget-form");
			init_newsletter_widget("#content .newsletter-single-widget-form");
			init_newsletter_widget(".single-simpleinterstitials .newsletter-widget-form");
		}, 500);
	});


	function init_newsletter_widget(form_selector) {
		if($(form_selector).length > 0 && !$(form_selector).hasClass('init')) {
			var _messages = {
				'uemail': {
					required: '- Please enter a valid email address.<br/>',
					email : '- Please enter a valid email address.<br/>'
				},
				'mso' : {
					required : '- Cable provider is a required field.<br/>'
				}
			};
			var _rules = {
				'uemail' : {
					required : true,
					email : true
				},
				'mso' : {
					required : true
				}
			};

			if($(form_selector).find('.zip_postal').length > 0) {
				_messages['zip_postal'] = { required: '- Zip code is a required field.<br/>' };
				_rules['zip_postal'] = {
					required: true,
					minlength: 5,
					maxlength: 6
				};
			}

			$(form_selector).validate({
				errorLabelContainer : '.error-msg',
				messages: _messages,
				rules : _rules,
				submitHandler: function(form) {
					var progressClass = 'newsletter-widget-module-in-progress';
					var completeClass = 'newsletter-widget-module-complete';

					var f = $(form);
					var widget = f.parents('.newsletter-widget');
					widget.addClass(progressClass);

					// dynamically creating email field. uemail name is used because it conflicts
					// with reserved term in the jquery-validate
					var cloned = f.find('#uemail').clone();
					f.find("#email").remove();
					$('<input type="hidden" name="email" id="email"></input>').val(f.find("#uemail").val()).appendTo(f);
					
					// fetch query params
					var params = f.serialize();
					
					// diusable inputs
					f.find('input, select').attr('disabled','disabled');

					// append callbacks
					$.post(f.attr('action') + "?callback=?", params, function(json) {
						if(json.success) {
							widget.removeClass(progressClass).addClass(completeClass).find('.complete-success').show();
							var ul = widget.find('.complete-success ul');
							widget.find('form .newsletter').each(function(i,v){
								$('<li></li>').text($(v).data('label')).appendTo(ul);
							});
							widget.find('.complete-success .message-element').each(function(){
								var msg = $(this).data('message');
								$(this).html(msg);
							});
							widget.find('.form-box').remove();
						}
						else {
							widget.removeClass(progressClass).find('.complete-fail').show();
							widget.find('.complete-fail .message-element').each(function(){
								var msg = $(this).data('message');
								$(this).html(msg);
							});
							widget.find('.form-box').remove();
						}
					}, "json");

				}
			});

			var e = $(form_selector).find('.ga_source');
			var val = e.val();
			e.val('generic_' + val);
			if(window.self === window.top ) {
				$(form_selector).find('.url').val(location.href);
				var classes = $('body').attr('class').split(/\s+/);
				$.each(classes, function(i, c) {
					if(c.match('^show-')) {
						e.val(c.substr(5) + '_' + val);
					}
				});
			} else {
				$(form_selector).find('.url').val(parent.location.href);
			}
			$(form_selector).addClass('init');
		}
	}




})(jQuery);