(function ($, $document) {
    var DM_VIDEO_FIELD = "./eaemDMVideo";

    $document.on('dialog-ready', handleVideoField);

    function handleVideoField(){
        var $videoField = $("foundation-autocomplete[name='" + DM_VIDEO_FIELD + "']");

        $videoField.on("change", function(event){
            var selVideoPath = event.target.value;

            if(_.isEmpty(selVideoPath)){
                return;
            }
        });
    }
}(jQuery, jQuery(document)));