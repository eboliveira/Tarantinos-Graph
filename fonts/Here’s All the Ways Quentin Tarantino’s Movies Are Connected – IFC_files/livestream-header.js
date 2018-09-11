// set a date based on the service timestamp
function liveTime(res){
	livestreamServiceDate = new Date(res.data.timestamp * 1000);

	// run the initialization of the schedule based on the service time  
	livestream(livestreamFeed, livestreamServiceDate);
	lsPageSchedule(livestreamFeed, livestreamServiceDate);

	// check for updates every 15 seconds
	setInterval(function(){
		// increment the time by 15
		livestreamServiceDate = new Date(livestreamServiceDate.getTime()+15000);
		console.log(livestreamServiceDate);
		livestream(livestreamFeed, livestreamServiceDate);
		lsPageSchedule(livestreamFeed, livestreamServiceDate);
	}, 15000);
}

// stream - schedule functions
function livestream(livestreamFeed, livestreamServiceDate){

	var livestreamParse = JSON.parse(livestreamFeed);
	var headerItem, currentDate, currentTime, currentIndex;
		
	// set date value from the service returned date
	currentDate = livestreamServiceDate;
	currentTime = currentDate.getTime();

	// check for diffs before updating
	if(currentTime > parseInt(jQuery('.primary-nav').find('.watch-nav').attr('data-item-expires'))){
		// iterate through all items in schedule
		jQuery.each(livestreamParse, function(index){
			headerItem = this;

			// check for item that starts before the current time, and ends after (this is the current item)
			if(currentTime > headerItem.start_time && currentTime < headerItem.end_time){
				updateLiveStreamHeader(headerItem);
				currentIndex = index;
			}
		});
		
	} else{
		console.log('not updating');
	}

}

// updates html for schedule item
function updateLiveStreamHeader(headerItem){
	var localStart, localTZ, localStartHour, localStartMinutes, localStartHourOutput;

	// update the expiration time for this content
	jQuery('.watch-nav').attr('data-item-expires', headerItem.end_time);

	var liveTitle;

	if(headerItem.genre == 'consumer'){
		liveTitle = 'Paid Programming';
	} else {
		liveTitle = headerItem.title;
	}


	// start time in ET
	localStart = new Date(headerItem.start_time);
	// Timezone offset
	localTZ = localStart.getTimezoneOffset() / 60;

	// Start Time in UTC - full date object 
	utcStart = new Date(headerItem.start_time);
	betterUTC = utcStart.setHours(utcStart.getHours() + localTZ);

	// User's Time
	userDate = new Date();
	userTZ = userDate.getTimezoneOffset() * 60000;
	timeDifference = betterUTC - userTZ;
	betterUserDate = new Date(timeDifference);
	localStartHour = betterUserDate.getHours();
	localZeroMinutes = ('0' + localStart.getMinutes()).slice(-2);
	localStartMinutes = localZeroMinutes > 0 ? ':'+localZeroMinutes : ':00';

	// calculate from 24 hour time, add AM/PM
	if(localStartHour == 0 || localStartHour == 00){
		localStartHourOutput = '12'+localStartMinutes;
	} else if(localStartHour > 12){
		localStartHourOutput = (localStartHour - 12)+localStartMinutes;
	} else if(localStartHour == 12){
		localStartHourOutput = localStartHour+localStartMinutes;
	} else if( 0 < localStartHour && localStartHour < 12){
		localStartHourOutput = localStartHour+localStartMinutes;
	} else{
		localStartHourOutput = localStartHour;
	}


	// END time in ET
	localEnd = new Date(headerItem.end_time);
	// Timezone offset
	localEndTZ = localEnd.getTimezoneOffset() / 60;

	// Start Time in UTC - full date object 
	utcEnd = new Date(headerItem.end_time);
	betterEndUTC = utcEnd.setHours(utcEnd.getHours() + localEndTZ);

	// User's Time
	userEndDate = new Date();
	userEndTZ = userEndDate.getTimezoneOffset() * 60000;
	endTimeDifference = betterEndUTC - userEndTZ;
	endUserDate = new Date(endTimeDifference);
	localEndHour = endUserDate.getHours();
	localZeroMinutes = ('0' + localEnd.getMinutes()).slice(-2);
	localEndMinutes = localZeroMinutes > 0 ? ':'+localZeroMinutes : ':00';

	// calculate from 24 hour time, add AM/PM
	if(localEndHour == 0 || localEndHour == 00){
		localEndHourOutput = '-12'+localEndMinutes+'a';
	} else if(localEndHour > 12){
		localEndHourOutput = '-'+(localEndHour - 12)+localEndMinutes+'p';
	} else if(localEndHour == 12){
		localEndHourOutput = '-'+localEndHour+localEndMinutes+'p';
	} else if( 0 < localEndHour && localEndHour < 12){
		localEndHourOutput = '-'+localEndHour+localEndMinutes+'a';
	} else{
		localEndHourOutput = '-'+localEndHour;
	}

	// Season and Episode (if available)
	var liveSeason;
	var liveEpisode;

	liveSeason = headerItem.season;
	liveEpisode = headerItem.episode;

	if( ( liveSeason !== '' && liveSeason !== 0 ) && (liveEpisode !== '' && liveEpisode !== 0 ) ){
		liveSeasonEpisode = 'S'+liveSeason +', EP '+liveEpisode;
	} else {
		liveSeasonEpisode = '';
	}


	// replace each line individually - using this in multiple contexts
	jQuery('.watch-nav').find('#ls-title').html(liveTitle);
	jQuery('.watch-nav').find('#ls-episode').html(headerItem.episode_title);
	jQuery('.watch-nav').find('#ls-airing-start').html(localStartHourOutput);
	jQuery('.watch-nav').find('#ls-airing-end').html(localEndHourOutput);
	jQuery('.watch-nav').find('#ls-season').html(liveSeasonEpisode);

	console.log('*******headerItem********');
	console.log(headerItem);

}