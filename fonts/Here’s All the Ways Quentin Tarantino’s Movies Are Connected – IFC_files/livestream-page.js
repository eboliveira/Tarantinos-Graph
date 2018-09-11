// stream - schedule functions
function lsPageSchedule(livestreamFeed, ls_page_date){
	var tribuneParse = JSON.parse(livestreamFeed);
	var scheduleItem, currentDate, currentTime, currentItem, currentIndex, nextItem;
		
	// set date value from the service returned date
	currentDate = ls_page_date;
	currentTime = currentDate.getTime();
	// iterate through all the schedule items
	jQuery('.stream-schedule').each(function(index){

		// check for diffs before updating
		if(currentTime > parseInt(jQuery(this).find('.stream-schedule-item').attr('data-item-expires'))){
			console.log('updating');
			// iterate through all items in schedule
			jQuery.each(tribuneParse, function(index){
				scheduleItem = this;

				// check for item that starts before the current time, and ends after (this is the current item)
				if(currentTime > scheduleItem.start_time && currentTime < scheduleItem.end_time){
					currentItem = scheduleItem;
					currentIndex = index;
				}
			});

			// retrieve next item
			nextItem = tribuneParse[currentIndex + 1];

			// update CURRENT item
			updateScheduleItem(currentItem, jQuery(this).find('.stream-schedule-item.current-item'));

			// update NEXT if it exists
			if(jQuery(this).find('.stream-schedule-item.next-item').length){
				console.log('next found');
				updateScheduleItem(nextItem, jQuery(this).find('.stream-schedule-item.next-item'))
			}
			else{
				console.log('no next');
			}
		}
		else{
			console.log('not updating');
		}
	});
}

// updates html for schedule item
function updateScheduleItem(scheduleItem, itemContainer){
	var localStart, localTZ, localStartHour, localStartMinutes, localStartHourOutput;

	// update the expiration time for this content
	jQuery(itemContainer).attr('data-item-expires', scheduleItem.end_time);

	// update the image thumbnail if it exists
	if(scheduleItem.thumbnail){
		jQuery(itemContainer).find('.stream-schedule-image').html('<a href="/livestream"><div class="img-container"><img src="'+scheduleItem.thumbnail+'" /></div></a>');
		jQuery(itemContainer).find('.stream-schedule-image').removeClass('empty');
	}
	else{
		// replace it with placeholder
		jQuery(itemContainer).find('.stream-schedule-image').html('<a href="/livestream"><div class="img-container"><img src="/wp-content/themes/amc/plugins/amc-stream-schedule/assets/img/livestream-replacement-1.png" /></div></a>');
		jQuery(itemContainer).find('.stream-schedule-image').removeClass('empty');
	}

	// replace each line individually - using this in multiple contexts
	jQuery(itemContainer).find('.stream-title').html('<a href="/schedule?featured=' + scheduleItem['title'].replace(/[\s]/g, '-').toLowerCase() + '">' + scheduleItem.title + '</a>');
	jQuery(itemContainer).find('.stream-episode-title').html(scheduleItem.episode_title);
	jQuery(itemContainer).find('.stream-description').html(scheduleItem.description);
	jQuery(itemContainer).find('.stream-differs').html(scheduleItem.differs);


	// @todo - rating/cc
	jQuery(itemContainer).find('.stream-rating').html( scheduleItem.rating+''+scheduleItem.cc_enabled );


	console.log('--------------------------');

	// start time in ET
	localStart = new Date(scheduleItem.start_time);

	console.log('local Start date = '+ localStart);

	// Timezone offset
	localTZ = localStart.getTimezoneOffset() / 60;

	// Start Time in UTC - full date object 
	utcStart = new Date(scheduleItem.start_time);
	betterUTC = utcStart.setHours(utcStart.getHours() + localTZ);

	// User's Time
	userDate = new Date();
	userTZ = userDate.getTimezoneOffset() * 60000;

	timeDifference = betterUTC - userTZ;

	betterUserDate = new Date(timeDifference);

	localStartHour = betterUserDate.getHours();


	localZeroMinutes = ('0' + localStart.getMinutes()).slice(-2);

	// localStartHour = localStart.getUTCHours() - localTZ;

	console.log('local start hour: '+localStartHour);
	localStartMinutes = localZeroMinutes > 0 ? ':'+localZeroMinutes : ':00';

	console.log('local start minutes: '+localStartMinutes);
	// calculate from 24 hour time, add AM/PM
	if(localStartHour == 0 || localStartHour == 00){
		localStartHourOutput = '12'+localStartMinutes+'am';
	}
	else if(localStartHour > 12){
		localStartHourOutput = (localStartHour - 12)+localStartMinutes+'pm';
	}
	else if(localStartHour == 12){
		localStartHourOutput = localStartHour+localStartMinutes+'pm';
	}
	else if( 0 < localStartHour && localStartHour < 12){
		localStartHourOutput = localStartHour+localStartMinutes+'am';
	} 
	// fallback
	else{
		localStartHourOutput = localStartHour;
	}
	// update
	jQuery(itemContainer).find('.stream-time').html(localStartHourOutput);
}