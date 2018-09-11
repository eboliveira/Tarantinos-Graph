var _amcn_tribune = {

	url: '//dev.tribune.services.amcnets.com/AMC/OnAir/JSON',

	//
	time_zones: {
		ET: 'America/New_York',
		CT: 'America/Chicago',
		MT: 'America/Denver',
		WT: 'America/Los_Angeles',
	},
	// bc=
	broadcast: {
		EAST:'east',
		WEST: 'west'
	},

	//
	_default: {
		'tz': 'America/New_York'
	},


	/**
	 * Set Query Parameter
	 * @param {[type]} key   [description]
	 * @param {[type]} value [description]
	 */
	qp: function(key, value) {
		_amcn_tribune._default[key] = value;
		return _amcn_tribune;
	},


	/**
	 *
	 * @param  {[type]}   title    [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	get_by_show: function(title, callback) {
		_amcn_tribune.get({ 'title': title }, callback);
		return _amcn_tribune;
	},

	/**
	 * [get_by_tmsid description]
	 * @param  {[type]}   tmsid    [description]
	 * @param  {[type]}   related  [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	get_by_tmsid: function(tmsid, related, callback) {
		_amcn_tribune.get({ 'tmsid': tmsid }, callback);
		return _amcn_tribune;
	},

	/**
	 * [get_by_genre description]
	 * @param  {[type]}   genre    [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	get_by_genre: function(genre, callback) {
		_amcn_tribune.get({ 'genre': genre }, callback);
		return _amcn_tribune;
	},



	get: function(data, callback) {
		data = jQuery.extend(_amcn_tribune._default, data);
		jQuery.ajax({
			'url': _amcn_tribune.url,
			'cache': true,
			'success': callback,
			'dataType': 'json',
			'data': data
		});
		return _amcn_tribune;
	}

};