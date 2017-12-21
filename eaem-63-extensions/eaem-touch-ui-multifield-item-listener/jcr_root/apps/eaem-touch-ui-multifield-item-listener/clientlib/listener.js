(function ($, $document) {
    var PAGE_PROPS_PATH = "/mnt/overlay/wcm/core/content/sites/properties.html",
        CORAL_MF_NAME = "data-granite-coral-multifield-name",
        CORAL_MF_NAME_VANITY = "./sling:vanityPath", listenerAttached = false;

    if(window.location.pathname.indexOf(PAGE_PROPS_PATH) !== 0){
        return;
    }

    $document.on("foundation-contentloaded", addListenerToVanityMF);

    function addListenerToVanityMF(){
        var $vanityMF = $("[" + CORAL_MF_NAME + "='" + CORAL_MF_NAME_VANITY + "']");

        if(listenerAttached || _.isEmpty($vanityMF)){
            return;
        }

        listenerAttached = true;

        $vanityMF[0].on('change', function(){
            var $mf = $(this), $text = $mf.find("[type=text]:last");

            $text.focusout(function(){
                $(this).css("background-color", "#AAA");
            })
        });

        console.log($vanityMF);
    }
}(jQuery, jQuery(document)));