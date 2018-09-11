(function($){
	$(function() {
		$("input.newsletter").change(function() {
			$(this).siblings('input').prop('checked', $(this).prop('checked'));
		});
		
		// extending jQuery validator to check for arrach of checkbox elements.
		$.validator.addMethod(
			"requireArray",
			function(value, element, params) {
				var name = $(element).attr('name');
				var foundValue = false;
				$(element).parents('form').find('input[name="' + name + '"]').each(function(){
					if(($(this).val() != null || $(this).val().trim() != "") && $(this).is(':checked')) {
						foundValue = true;
						return false;
					}
				});
				return foundValue;
			},
			$.format("Please enter at least one value")
		);

		// bassistance jQuery validate config

		setInterval(function(){
			var form_selector = '.newsletter-full-widget-form:not(.init)';
			if($(form_selector).length > 0) {
				
				var _messages = {
					uemail: {
						required: '- Please enter a valid email address.<br/>',
						email : '- Please enter a valid email address.<br/>'
					},
					mso : {
						required : '- Cable provider is a required field.<br/>'
					},
					"newsletters[]" : {
						requireArray : '- Please select at least one newsletter.'
					}
				};
				var _rules = { 
					uemail : {
						required : true,
						email : true
					},
					mso : {
						required : true
					},
					"newsletters[]" : {
						requireArray : true
					}
				};



				if($('.newsletter-full-widget-form').find('.zip_postal').length > 0) {
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

						var progressClass = 'newsletter-full-widget-module-in-progress';
						var completeClass = 'newsletter-full-widget-module-complete';

						var f = $(form);
						var widget = f.parents('.newsletter-full-widget-module');
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
						$.post(f.attr('action') + "?jsoncallback=?", params, function(json) {

							if(json.success) {
								widget.removeClass(progressClass).addClass(completeClass).find('.complete-success').show();
								var ul = widget.find('.complete-success ul');
								widget.find('form .newsletter').each(function(i,v){
									if($(this).is(':checked')) {
										var li = $('<li></li>').text($(this).data('label'));					
										ul.append(li);
									}
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


						return false;

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
		}, 500);
	});
})(jQuery);