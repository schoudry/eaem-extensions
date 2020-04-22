(function ($, $document) {
    var DEFAULT_RENDITION = "Destination-Storycard-1305x555", initialized = false;

    $document.on("foundation-contentloaded", showDefaultRendition);

    function showDefaultRendition(){
        if(!isAssetDetailsPage() || initialized){
            return;
        }

        var fileName = window.location.pathname;

        if(_.isEmpty(fileName)){
            return;
        }

        $('.smartcrop-renditions .each-rendition').each(function(e){
            initialized = true;

            var $smartRend = $(this), rendName;

            if ($smartRend.data("assetNotProcessed")){
                return;
            }

            rendName = $smartRend.find(".col1presetname").html();

            if(rendName.trim() !== DEFAULT_RENDITION){
                return;
            }

            $smartRend.click();
        });
    }

    function isAssetDetailsPage(){
        return window.location.pathname.startsWith("/assetdetails.html");
    }
}(jQuery, jQuery(document)));