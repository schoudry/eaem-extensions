(function ($, $document) {
    var DM_VIDEO_FIELD = "./eaemDMVideo",
        ENCODE_SELECT = "./eaemDMEncode",
        DM_VIDEO_RENDS_URL = "/apps/eaem-sites-spa-dm-video-container/video-dyn-renditions/content.html";

    $document.on('dialog-ready', handleVideoField);

    function handleVideoField(){
        var $videoField = $("foundation-autocomplete[name='" + DM_VIDEO_FIELD + "']");

        if(_.isEmpty($videoField)){
            return;
        }

        setSelectedEncode($videoField.val());

        $videoField.on("change", addEncodes);
    }

    function addEncodes(event){
        var $encodeField = $("coral-select[name='" + ENCODE_SELECT + "']"),
            selVideoPath = event.target.value;

        if(_.isEmpty(selVideoPath) || _.isEmpty($encodeField)){
            return;
        }

        $encodeField.find("coral-select-item").not("[value='NONE']").remove();

        loadEncodesInSelect(selVideoPath);
    }

    function getCoralSelectItem(text, value, selected){
        return '<coral-select-item value="' + value + '" ' + selected + '>' + text + '</coral-select-item>';
    }

    function loadEncodesInSelect(videoPath, selectedValue){
        var $encodeField = $("coral-select[name='" + ENCODE_SELECT + "']");

        $.ajax(DM_VIDEO_RENDS_URL + videoPath).done(function(renditions){
            _.each(renditions,function(rendition){
                $encodeField.append(getCoralSelectItem(rendition.name, rendition.name,
                                        ((selectedValue == rendition.name) ? "selected" : "")));
            });
        });
    }

    function setSelectedEncode(selVideoPath){
        if(!selVideoPath){
            return;
        }

        var dialogPath;

        try{
            dialogPath = Granite.author.DialogFrame.currentDialog.editable.slingPath;
        }catch(err){
            console.log("Error getting dialog path...", err);
        }

        if(!dialogPath){
            return;
        }

        $.ajax(dialogPath).done(function(data){
            var dmEncode = data[ENCODE_SELECT.substr(2)];

            if(!dmEncode){
                return;
            }

            loadEncodesInSelect(selVideoPath, dmEncode);
        })

    }
}(jQuery, jQuery(document)));