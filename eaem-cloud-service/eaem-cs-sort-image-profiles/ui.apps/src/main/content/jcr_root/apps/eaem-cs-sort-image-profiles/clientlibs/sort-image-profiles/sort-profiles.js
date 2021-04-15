(function ($, $document) {
    "use strict";
    var IMAGE_PROFILE_SEL = "[name='./jcr:content/imageProfile']";

    $document.on("foundation-contentloaded", sortImageProfiles);

    function sortImageProfiles(){
        var $imageProfileSelect = $(IMAGE_PROFILE_SEL);

        if(_.isEmpty($imageProfileSelect)){
            return;
        }

        var selectItems = $imageProfileSelect[0].items,
            values = selectItems.getAll(),
            noneValue = values[0];

        values.sort(function (a, b) {
            var nameA = a.textContent.toUpperCase();
            var nameB = b.textContent.toUpperCase();

            return ((nameA < nameB) ? -1 : ((nameA > nameB)  ? 1 : 0));
        });

        selectItems.clear();

        selectItems.add(noneValue);

        _.each(values, function(value){
            if(value.textContent === "None"){
                return;
            }

            selectItems.add(value);
        });
    }

}(jQuery, jQuery(document)));