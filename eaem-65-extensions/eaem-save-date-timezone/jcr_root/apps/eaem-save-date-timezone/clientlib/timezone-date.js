(function($, CUI, $document){
    var EAEM_SAVE_IN_UTC = "eaem-save-in-utc";

    $document.on("foundation-contentloaded", handleDatePickers);

    function handleDatePickers(){
        var $datePickers = $("coral-datepicker");

        if(_.isEmpty($datePickers)){
            return;
        }


        _.each($datePickers, function(datePicker){
            var $datePicker = $(datePicker);

            if(!$datePicker.data(EAEM_SAVE_IN_UTC)){
                return;
            }

            $datePicker.on("change", setTimeZone);

            setTimeZone.call(datePicker);
        });
    }

    function setTimeZone(){
        var datePicker = this, $datePicker = $(this),
            $timeZone = $datePicker.nextAll(".granite-datepicker-timezone");

        if(!datePicker.value){
            $timeZone.attr("hidden", "hidden");
            return;
        }

        var toUTC = new Date(datePicker.value).toISOString(),
            message = "Date shown in your timezone, but saved in UTC as " + toUTC;

        $datePicker.find("[name^='./']").val(toUTC);

        $timeZone.removeAttr("hidden");

        $timeZone.find("span").html(message);
    }

}(jQuery, window.CUI,jQuery(document)));