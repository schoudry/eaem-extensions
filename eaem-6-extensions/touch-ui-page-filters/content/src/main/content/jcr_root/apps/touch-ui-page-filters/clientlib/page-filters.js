(function (document, $, assetFinder) {
    var TEMPLATE_SELECT_ID = "experience-aem-filter-template";
    var c$templateSelect = null;

    //id assetfinder-filter and class .assetfilter.type are defined in
    ///libs/wcm/core/content/editor/jcr:content/sidepanels/edit/items/assetsTab/items/filterPanel/items/views/items/search/items/searchpanel
    var $assetFinderFilter = $('#assetfinder-filter');
    var $assetFinderType = $assetFinderFilter.find(".assetfilter.type");

    var addTemplateSelect = function () {
        var templateMarkup = '<span class="coral-Select" data-init="select" id="' + TEMPLATE_SELECT_ID + '">' +
            '<button type="button" class="coral-Select-button coral-MinimalButton">' +
            '<span class="coral-Select-button-text">Select</span>' +
            '</button>' +
            '<select class="coral-Select-select">' +
            '<option value="ALL">Of All Templates</option>' +
            '</select>' +
            '</span>';

        var $optionTemplate = $('<script type="text/x-jquery-tmpl">' +
                                    '<option value="${id}">${name}</option>' +
                                '</script>').appendTo($assetFinderType);

        var promise = $.ajax({
            type: 'GET',
            url: "/bin/experience-aem/touch-ui/page-filters/templates"
        });

        promise.done(function (data) {
            $("<div/>").appendTo($assetFinderType).append($(templateMarkup));

            $optionTemplate.tmpl(data).appendTo("#" + TEMPLATE_SELECT_ID + " .coral-Select-select");

            c$templateSelect = new CUI.Select({
                element: "#" + TEMPLATE_SELECT_ID,
                visible: true
            });

            c$templateSelect.hide();
        });

        promise.fail(function(){
            alert("error");
        });

        $assetFinderType.find("select").on('change', function (event) {
            var type = $(event.target).find("option:selected").val();

            if (type == "Pages") {
                c$templateSelect.show();
            }else{
                c$templateSelect.hide();
            }
        });
    };

    var pagesController = assetFinder.registry["Pages"];
    var loadAssets = pagesController.loadAssets;

    $.extend(pagesController, {
        loadAssets: function(query, lowerLimit, upperLimit){
            var template = c$templateSelect.getValue();

            if(template && ( template != "ALL")){
                query = '"jcr:content/sling:resourceType":"' + template + '" ' + query;
            }

            return loadAssets.call(this, query, lowerLimit, upperLimit);
        }
    });

    addTemplateSelect();
}(document, jQuery, Granite.author.ui.assetFinder));