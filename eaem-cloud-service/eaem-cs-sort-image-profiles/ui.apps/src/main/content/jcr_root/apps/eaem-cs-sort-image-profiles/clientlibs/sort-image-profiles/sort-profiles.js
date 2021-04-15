(function ($, $document) {
    "use strict";
    var IMAGE_PROFILE_SEL = "[name='./jcr:content/imageProfile']";

    $document.on("foundation-contentloaded", sortImageProfiles);

    function sortImageProfiles(){
        var $imageProfileSelect = $(IMAGE_PROFILE_SEL);

        if(_.isEmpty($imageProfileSelect)){
            return;
        }

        var items = $imageProfileSelect[0].items;

        console.log(items);
    }

}(jQuery, jQuery(document)));