$pdk.ready(function(){
    $pdk.controller.addEventListener('OnShowCard', ifcCounter, '*');
});

var ifcCounter = function(response){
    advance = true;

    var secondsUntilNext = 10;
    if (window.location.href.indexOf("advance=off") > -1) {
        advance = false;
    }

    // set active class to end card
    if(response.data.card == 'endCard'){
        console.log(' %%%%% IFC OnShowCard endCard %%%%% ');

        var nextLink = jQuery('.pdk-endcard-primary a');
        if(nextLink.length){
            // add the countdown field
            var nextText = jQuery('.pdk-endcard-primary .related-item-thumbnail').prepend('<h4 class="nextCountdown"></h4 >');

            // initiate timecheck
            var interval = setInterval(timeCheck, 1000);

            // clear the countdown on any click event
            window.addEventListener('click', function(){
                clearInterval(interval);
                jQuery('.nextCountdown').html('');
            });

            function timeCheck(){
                if(secondsUntilNext > 0){
                    var seconds = (secondsUntilNext > 1) ? 'seconds' : 'second';
                    // update the counter
                    jQuery('.nextCountdown').html(secondsUntilNext);
                    // decrease timer
                    secondsUntilNext--;
                }
                else{
                    if( advance === true ){
                        // end interval
                        clearInterval(interval);

                        // auto advance cookie
                        document.cookie="video_auto_advance="+window.location.href;

                        // navigate
                        window.location.href = jQuery('.pdk-endcard-primary a').attr('href');
                    }
                }
            }
        }
    }
};
