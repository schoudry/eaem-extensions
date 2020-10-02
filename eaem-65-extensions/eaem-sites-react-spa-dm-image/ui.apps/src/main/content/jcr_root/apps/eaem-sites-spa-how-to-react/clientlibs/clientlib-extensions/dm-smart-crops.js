(function ($, $document) {
    var DM_FILE_REF = "[name='./fileReference']",
        CROPS_MF = "[data-granite-coral-multifield-name='./crops']",
        SMART_CROPS_URL = "/apps/eaem-sites-spa-how-to-react/smart-crop-renditions/renditions.html",
        dynRenditions = {};

    $document.on('dialog-ready', loadSmartCrops);

    function loadSmartCrops() {
        var dialogPath;

        try {
            dialogPath = Granite.author.DialogFrame.currentDialog.editable.slingPath;
        } catch (err) {
            console.log("Error getting dialog path...", err);
        }

        if (!dialogPath) {
            return;
        }

        dialogPath = dialogPath.substring(0, dialogPath.lastIndexOf(".json"));

        $.ajax(dialogPath + ".2.json").done(handleCropsMF);
    }

    function handleCropsMF(dialogData) {
        var $cropsMF = $(CROPS_MF),
            mfName = $cropsMF.attr("data-granite-coral-multifield-name"),
            selectData = dialogData[mfName.substr(2)];

        $cropsMF.find("coral-select").each(function (index, cropSelect) {
            var $cropSelect = $(cropSelect), selUrl,
                name = $cropSelect.attr("name");

            name = name.substring(mfName.length + 1);
            name = name.substring(0,name.indexOf("/"));

            if(selectData[name]){
                selUrl = selectData[name]["url"];
            }

            loadCropsInSelect($cropSelect, selUrl);
        });

        $(CROPS_MF).on("change", function () {
            var multifield = this;

            _.defer(function () {
                var justAddedItem = multifield.items.last(),
                    $cropSelect = $(justAddedItem).find("coral-select");

                loadCropsInSelect($cropSelect);
            });
        });
    }

    function getCoralSelectItem(text, value, selected) {
        return '<coral-select-item value="' + value + '" ' + selected + '>' + text + '</coral-select-item>';
    }

    function loadCropsInSelect($cropSelect, selectedValue) {
        var $fileRef = $(DM_FILE_REF),
            fileRef = $fileRef.val();

        if ( !fileRef || ($cropSelect[0].items.length > 1)) {
            return;
        }

        if (_.isEmpty(dynRenditions)) {
            $.ajax({url: SMART_CROPS_URL + fileRef, async: false}).done(function (renditions) {
                dynRenditions = renditions;
                addInSelect();
            });
        } else {
            addInSelect();
        }

        function addInSelect() {
            _.each(dynRenditions, function (rendition) {
                $cropSelect.append(getCoralSelectItem(rendition.name, rendition.url,
                    ((selectedValue == rendition.url) ? "selected" : "")));
            });
        }
    }
}(jQuery, jQuery(document)));