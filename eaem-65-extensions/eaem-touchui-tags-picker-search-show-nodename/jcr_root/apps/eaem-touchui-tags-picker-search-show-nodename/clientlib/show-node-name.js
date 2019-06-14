(function($, $document) {
    var TAGS_FIELD = "cq:tags",
        extended = false;

    $document.on("foundation-contentloaded", handleTagsPicker);

    function handleTagsPicker(){
        if(extended){
            return;
        }

        var $tagsField = $("foundation-autocomplete[name$='" + TAGS_FIELD + "']");

        if(_.isEmpty($tagsField)){
            return;
        }

        extended = true;

        extendPickerSearchResults();
    }

    function extendPickerSearchResults(){
        var registry = $(window).adaptTo("foundation-registry"),
            otbHander = getSearchResultsHander();

        registry.register("foundation.form.response.ui.success", {
            name: "granite.pickerdialog.search.result",
            handler: function(formEl, config, data, textStatus, xhr, parsedResponse) {
                otbHander.handler.call(this, formEl, config, data, textStatus, xhr, parsedResponse);

                var $content = $("#granite-pickerdialog-search-result-content"),
                    $item, itemId;

                $content.find("coral-masonry-item").each(function(index, item){
                    $item = $(item);

                    itemId = $item.data("foundationCollectionItemId");

                    $item.find("coral-card-content").append(getCardPropertyHtml(itemId));
                })
            }
        });
    }

    function getCardPropertyHtml(content){
        return '<coral-card-propertylist>' +
                    '<coral-card-property>' + content + '</coral-card-property>' +
               '</coral-card-propertylist>';
    }

    function getSearchResultsHander(){
        var registry = $(window).adaptTo("foundation-registry");

        return _.reject(registry.get("foundation.form.response.ui.success"), function(obj){
            return (obj.name != "granite.pickerdialog.search.result");
        })[0];
    }
})(jQuery, jQuery(document));