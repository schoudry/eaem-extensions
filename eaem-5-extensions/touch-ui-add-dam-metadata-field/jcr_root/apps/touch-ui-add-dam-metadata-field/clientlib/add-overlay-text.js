(function(document, Granite, $) {
    "use strict";

    var ns = ".foundation-form";

    $(document).on("foundation-mode-change" + ns, function(e, mode, group) {
        if(group !== "cq-damadmin-admin-bulkproperties"){
            return;
        }

        if (mode !== "edit" && mode !== "default"){
            return;
        }

        //the id is defined here /libs/dam/gui/content/assets/metadataeditor/items/content
        var form = $("#assetpropertiesform");

        var overlayTextField = $(form).find("[name='./jcr:content/metadata/overlayText']");

        //field already added
        if(overlayTextField && overlayTextField.length > 0){
            return;
        }

        var assetPath = $(form).attr("action");
        assetPath = assetPath.substring(0, assetPath.lastIndexOf(".html"));

        $.ajax({
            url: assetPath + "/jcr:content/metadata.json",
            dataType: "json",
            success: function(data){
                var value = data["overlayText"];

                if(!value){
                    value = "";
                }

                overlayTextField = "<div class='grid-1'>" +
                                        "<label>" +
                                            "<span>Overlay Text</span>" +
                                            "<span class='foundation-field-editable'>" +
                                            "<span class='foundation-field-readonly'>" + value + "</span>" +
                                            "<input type='text' size=54 name='./jcr:content/metadata/overlayText' value='" + value + "' class='foundation-field-edit' />" +
                                            "</span>" +
                                        "</label>" +
                                    "</div>";

                var asset = $(form).find(".assets-metadata-view");
                asset.append(overlayTextField);
            }
        });
    });
})(document, Granite, Granite.$);