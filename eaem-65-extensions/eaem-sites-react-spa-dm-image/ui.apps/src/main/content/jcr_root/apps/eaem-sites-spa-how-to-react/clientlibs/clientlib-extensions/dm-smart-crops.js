(function($, $document){
    var DM_FILE_REF = "[name='./fileReference']",
        CROP_SELECT = "[name='./crop']",
        CROPS_MF = "[data-granite-coral-multifield-name='./crops']",
        SMART_CROPS_URL = "/apps/eaem-sites-spa-how-to-react/smart-crop-renditions/renditions.html",
        dynRenditions = {};

    $document.on('dialog-ready', loadSmartCrops);

    function loadSmartCrops(){
        $(CROPS_MF).on("change", function(){
            var multifield = this;

            _.defer(function(){
                var justAddedItem = multifield.items.last(),
                    $cropSelect = $(justAddedItem).find("coral-select");

                loadCropsInSelect($cropSelect);
            });
        });
    }

    function getCoralSelectItem(text, value, selected){
        return '<coral-select-item value="' + value + '" ' + selected + '>' + text + '</coral-select-item>';
    }

    function loadCropsInSelect($cropSelect, selectedValue){
        var $fileRef = $(DM_FILE_REF),
            fileRef = $fileRef.val();

        if(!fileRef){
            return;
        }

        if(_.isEmpty(dynRenditions)){
            $.ajax(SMART_CROPS_URL + fileRef).done(function(renditions){
                dynRenditions = renditions;
                addInSelect();
            });
        }else{
            addInSelect();
        }

        function addInSelect(){
            _.each(dynRenditions,function(rendition){
                $cropSelect.append(getCoralSelectItem(rendition.name, rendition.url,
                    ((selectedValue == rendition.name) ? "selected" : "")));
            });
        }
    }
}(jQuery, jQuery(document)));