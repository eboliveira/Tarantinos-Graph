function StopWatch() {

}
StopWatch.prototype = {

	// set values
	starttime: null,
	pausedDuration: null,
	pausedAt: null,
	is_paused: false,

	/**
	 * Start stopwatch
	 */
	start: function() {
		if(this.is_paused)
			this.pausedDuration += (new Date().getTime() - this.pausedAt);
		else if(!this.starttime)
			this.pausedDuration = 0;

		console.log('pausedDuration, ', this.pausedDuration);

		// set start time
		this.starttime = this.starttime || new Date().getTime();

		// reset pasedAt;
		this.pausedAt = null;
		this.is_paused = false;
	},

	/**
	 * Stop stopwatch
	 */
	stop: function() {
		this.is_paused = true;
		this.pausedAt = new Date().getTime();
	},

	/**
	 * @return ellapsed time
	 */
	getEllapsed: function() {
		if(this.pausedAt)
			return this.pausedAt - this.starttime - this.pausedDuration;
		else
			return new Date().getTime() - this.starttime - this.pausedDuration;
	},

	/**
	 * Return Prettified HMS
	 */
	getEllapsedHMS: function() {
		// calculate, and output a pretty clock
		var sec = Math.round(this.getEllapsed()/1000);
		var h = Math.floor(sec / 3600);
		var m = Math.floor((sec - (h * 3600))/60);
		var s = sec - (h * 3600) - (m * 60);
		var hms = [h,m,s];
		for(var i=0; i<hms.length; i++) {
			hms[i] = (hms[i] < 10 ? "0" : "") + hms[i];
		}
		return hms.join(":");
	},

	/**
	 * Reset Stopwatch
	 */
	reset: function() {
		this.starttime = this.pausedDuration = this.pausedAt = null; 
	}

}