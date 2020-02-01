(function($, CUI, $document){
    var EAEM_OFFSET = "eaem-offset",
        EAEM_OFFSET_MESSAGE = "eaem-offset-message";

    $document.on("foundation-contentloaded", handleDatePickers);

    function handleDatePickers(){
        var $datePickers = $("coral-datepicker");

        if(_.isEmpty($datePickers)){
            return;
        }


        _.each($datePickers, function(datePicker){
            var $datePicker = $(datePicker);

            if(!$datePicker.data(EAEM_OFFSET)){
                return;
            }

            if(datePicker.valueFormat !== "YYYY-MM-DD[T]HH:mm:ss.SSSZ"){
                return;
            }

            $datePicker.on("change", setOffset);

            setOffset.call(datePicker);
        });
    }

    function setOffset(){
        var datePicker = this, $datePicker = $(this),
            offset = $datePicker.data(EAEM_OFFSET),
            $timeZone = $datePicker.nextAll(".granite-datepicker-timezone");

        if(!datePicker.value){
            $timeZone.attr("hidden", "hidden");
            return;
        }

        var value = datePicker.value;

        if(value.endsWith("Z")){
            value = value.substring(0, value.indexOf("Z"));
        }else{
            value = value.substring(0, value.lastIndexOf("-"));
        }

        value = value + offset;

        var toUTC = new Date(datePicker.value).toISOString(),
            message = $datePicker.data(EAEM_OFFSET_MESSAGE);


        message = message || "Date shown (and saved) is offset to " + $datePicker.data(EAEM_OFFSET) + " relative to your timezone";

        $datePicker.find("[name^='./']").val(value);

        $timeZone.removeAttr("hidden");

        $timeZone.find("span").html(message);
    }

}(jQuery, window.CUI,jQuery(document)));