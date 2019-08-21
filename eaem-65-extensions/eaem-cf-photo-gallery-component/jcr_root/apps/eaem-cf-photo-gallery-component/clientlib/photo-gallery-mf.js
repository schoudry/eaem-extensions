(function($, $document) {
    var CF_MODEL_URL = "/mnt/overlay/dam/cfm/models/editor/content/editor.html",
        MF_RES_TYPE = "granite/ui/components/coral/foundation/form/multifield",
        EAEM_SUB_TYPE_PHOTO_GALLERY = "EAEM_PHOTO_GALLERY",
        EAEM_SUB_TYPE_PHOTO_GALLERY_LABEL = "Photo Gallery",
        MF_SELECTOR = "coral-multifield",
        EAEM_SUB_TYPE_CB_SUFFIX = "EaemSubType";

    if(isModelEditor()){
        extendModelEditor();
    }else{
        window.Dam.CFM.Core.registerReadyHandler(extendAutoCompletes);
    }

    function extendAutoCompletes(){
        $(MF_SELECTOR).on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, addImageCard);
        });

        $(MF_SELECTOR).on("coral-collection:remove", removeImageCard);

        function addImageCard(mfItem){
            var $imageReference = $(mfItem).find("foundation-autocomplete");

            if(_.isEmpty($imageReference)){
                return;
            }

            if(!_.isEmpty($imageReference.val())){
                showImage.call($imageReference[0]);
            }else{
                $imageReference.on("change", showImage);
            }
        }

        function showImage(){
            var $imageReference = $(this),
                imageUrl = this.value,
                $mfContent = $imageReference.closest("coral-multifield-item-content");

            $mfContent.find("coral-card").remove();

            if(_.isEmpty(this.value)){
                return;
            }

            var fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            imageUrl = imageUrl + "/_jcr_content/renditions/cq5dam.thumbnail.319.319.png";

            $(getCardContent(imageUrl, fileName)).appendTo($mfContent);
        }

        function removeImageCard(event){
            var $mfItem = $(event.detail.item);

            $mfItem.find("coral-card").remove();
        }
    }

    function getCardContent(imageUrl, fileName){
        return '<coral-card fixedwidth assetwidth="200" assetheight="200">' +
                    '<coral-card-asset><img src="' + imageUrl + '"></coral-card-asset>' +
                    '<coral-card-content>' +
                        '<coral-card-title>' + fileName + '</coral-card-title>' +
                    '</coral-card-content>' +
                '</coral-card>'

    }

    function extendModelEditor(){
        $document.on("click", "#form-fields > li", addSubTypeCheckBox);

        $document.on("change", "coral-select", handleCoralSelectInModel);
    }

    function handleCoralSelectInModel(){
        var $select = $(this);

        if(this.value != MF_RES_TYPE){
            getPhotoGalleryCheckBox($select).remove();
            return;
        }

        var cbName = $select.attr("name") + EAEM_SUB_TYPE_CB_SUFFIX;

        $(getSubtypeHtml(cbName)).appendTo($select.closest(".coral-Form-fieldwrapper"));
    }

    function addSubTypeCheckBox(){
        var $fieldProperties = $("#" + $(this).data("id") + "-properties"),
            $multiFieldsConfig = $fieldProperties.find("input[value='" + MF_RES_TYPE + "']"),
            $mField, cbName, $cb, url;

        _.each($multiFieldsConfig, function(mField){
            $mField = $(mField);

            cbName = $mField.attr("name") + EAEM_SUB_TYPE_CB_SUFFIX;

            if(!_.isEmpty(getPhotoGalleryCheckBox($mField))){
                return;
            }

            $cb = $(getSubtypeHtml(cbName)).appendTo($mField.closest(".coral-Form-fieldwrapper"));

            url = $mField.closest("form").attr("action") + "/jcr:content/model/cq:dialog/"
                        + mField.name.substring(0, mField.name.lastIndexOf("/")) + ".json";

            enablePhotoGalleryCheckBox(cbName, $cb, url);
        });
    }

    function enablePhotoGalleryCheckBox(cbName, $cb, url){
        $.ajax({url: url, async: false}).done(function (data) {
            if (_.isEmpty(data[cbName.substring(cbName.lastIndexOf("/") + 1)])) {
                return;
            }

            $cb[0].checked = true;
        });
    }

    function getPhotoGalleryCheckBox($mField){
        var cbName = $mField.attr("name") + EAEM_SUB_TYPE_CB_SUFFIX;

        return $mField.closest(".coral-Form-fieldwrapper").find("[name='" + cbName + "']");
    }

    function getSubtypeHtml(cbName){
        return '<coral-checkbox class="coral-Form-field" name="' + cbName + '" value="' + EAEM_SUB_TYPE_PHOTO_GALLERY + '">' +
                    EAEM_SUB_TYPE_PHOTO_GALLERY_LABEL +
                '</coral-checkbox>';
    }

    function isModelEditor(){
        return window.location.pathname.startsWith(CF_MODEL_URL);
    }
})(jQuery, jQuery(document));