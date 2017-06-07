(function ($, $document) {
    var CREATE_PAGE_WIZARD_URL = "/mnt/overlay/wcm/core/content/sites/createpagewizard.html",
        TAGS_FIELD = "./cq:tags";

    if(window.location.pathname.indexOf(CREATE_PAGE_WIZARD_URL) !== 0){
        return;
    }

    $document.on("foundation-contentloaded", function(){
        var $tagsPicker = $("[data-property-path='" + TAGS_FIELD + "']");

        if(_.isEmpty($tagsPicker)){
            return;
        }

        var $tagsTextField = $tagsPicker.find("input:text"),
            cuiPathBrowser = $tagsPicker.data("pathBrowser");

        cuiPathBrowser.$picker.on("coral-pathbrowser-picker-confirm.tagspicker", triggerChange);

        cuiPathBrowser.dropdownList.on("selected.tagspicker", triggerChange);

        $document.on("click", ".coral-TagList-tag-removeButton", triggerChange);

        function triggerChange(){
            setTimeout(function(){
                $tagsTextField.trigger("change");
            }, 250);
        }
    });

    $.validator.register({
        selector: ".js-cq-TagsPickerField input:text",

        validate: function ($textField) {
            var $tagsPicker = $textField.closest(".js-cq-TagsPickerField"),
                $tagList = $tagsPicker.parent().find(".coral-TagList");

            $tagsPicker.prev("label").html("Tags *");

            if ($tagList.find(".coral-TagList-tag").length <= 0) {
                return "Please fill out this field";
            }
        }
    });
}(jQuery, jQuery(document)));