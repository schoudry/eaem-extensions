(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded";

    $document.on(FOUNDATION_CONTENT_LOADED, showDate);

    function showDate(event){
        var $times = $("td > time"), $time, datetime;

        _.each($times, function(time){
            $time = $(time);

            datetime = $time.attr("datetime");

            if(_.isEmpty(datetime)){
                return;
            }

            $time.html((new Date(parseFloat(datetime))).toLocaleString());
        })
    }
})(jQuery, jQuery(document));