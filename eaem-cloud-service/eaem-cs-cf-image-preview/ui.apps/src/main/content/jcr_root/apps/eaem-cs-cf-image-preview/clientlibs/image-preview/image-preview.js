(function ($, $document) {
    "use strict";

    var _ = window._,
        initialized = false,
        EDITOR_PAGE = "/editor.html",
        FRAGMENT_EDITOR_PAGE = "/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html",
        IMAGE_REF_SELECTOR = "foundation-autocomplete",
        MF_SELECTOR = "coral-multifield",
        IMAGE_PREVIEW_CARD = "eaem-image-preview-card";

    if (!isFragmentEditorPage()) {
        return;
    }

    init();

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        window.Dam.CFM.Core.registerReadyHandler(extendFragmentEditor);
    }

    function extendFragmentEditor(){
        addImagePreviews();

        addImagePreviewsInMF();
    }

    function addImagePreviewsInMF(){
        $(MF_SELECTOR).each(function(index, mField){
            Coral.commons.ready(mField, addImageCard);
        });

        $(MF_SELECTOR).on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, handleMFAdd);
        });

        function handleMFAdd(mfItem){
            $(mfItem).find("foundation-autocomplete").on("change", showImageInMF);
        }

        function addImageCard(mField){
            var $multiField = $(mField);

            _.each($multiField[0].items.getAll(), function(mfItem) {
                var $content = $(mfItem.content),
                    $imgReference = $content.find("foundation-autocomplete");

                $imgReference.on("change", showImageInMF);

                showImageInMF.call($imgReference[0]);
            });
        }

        function showImageInMF(){
            var $imageField = $(this),
                $fieldWrapper = $imageField.closest("coral-multifield-item"),
                imageUrl = this.value,
                fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            imageUrl = imageUrl + "/_jcr_content/renditions/cq5dam.thumbnail.319.319.png";

            if($fieldWrapper.find("." + IMAGE_PREVIEW_CARD).length > 0){
                $fieldWrapper.find("." + IMAGE_PREVIEW_CARD).remove();
            }

            $.ajax(imageUrl).done(function(){
                $(getCardContent(imageUrl, fileName)).appendTo($fieldWrapper);
            });
        }
    }

    function getCardContent(imageUrl, fileName){
        return  '<div class="' + IMAGE_PREVIEW_CARD + '">' +
            '<coral-card fixedwidth assetwidth="200" assetheight="200">' +
            '<coral-card-asset><img src="' + imageUrl + '"></coral-card-asset>' +
            '<coral-card-content>' +
            '<coral-card-title>' + fileName + '</coral-card-title>' +
            '</coral-card-content>' +
            '</coral-card>' +
            '</div>';
    }

    function addImagePreviews(){
        $(IMAGE_REF_SELECTOR).each(function(index, imageField){
            Coral.commons.ready(imageField, function(){
                showImage.call(imageField);
                $(imageField).on("change", showImage);
            });
        });

        function showImage(){
            var $imageField = $(this),
                $fieldWrapper = $imageField.parent(),
                imageUrl = this.value,
                fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);

            if(!$fieldWrapper.hasClass("coral-Form-fieldwrapper")){
                return;
            }

            if($fieldWrapper.find("." + IMAGE_PREVIEW_CARD).length > 0){
                $fieldWrapper.find("." + IMAGE_PREVIEW_CARD).remove();
            }

            imageUrl = imageUrl + "/_jcr_content/renditions/cq5dam.thumbnail.319.319.png";

            $.ajax(imageUrl).done(function(){
                $(getCardContent(imageUrl, fileName)).appendTo($fieldWrapper);
            });
        }
    }

    function isFragmentEditorPage() {
        return (window.location.pathname.indexOf(FRAGMENT_EDITOR_PAGE) >= 0)
                || (window.location.pathname.indexOf(EDITOR_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));
