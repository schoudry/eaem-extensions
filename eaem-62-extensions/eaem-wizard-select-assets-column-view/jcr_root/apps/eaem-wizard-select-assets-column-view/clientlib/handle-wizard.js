(function ($, $document) {
    var WIZARD_URL = "/apps/eaem-wizard-select-assets-column-view/eaem-3-step-wizard.html",
        COLUMN_VIEW = "coral-columnview",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_WIZARD_STEPCHANGE = "foundation-wizard-stepchange",
        FOUNDATION_WIZARD = "foundation-wizard",
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        FOUNDATION_SELECTIONS_ITEM = "foundation-selections-item",
        FOUNDATION_COLLECTION = ".foundation-collection",
        FOUNDATION_COLLECTION_ITEM_ID = "foundation-collection-item-id",
        CORAL_COLUMN_VIEW_LOAD_ITEMS = 'coral-columnview:loaditems',
        CORAL_COLUMNVIEW_ITEM = "coral-columnview-item",
        SELECTION_MODE = "selectionmode",
        SUFFIX = "suffix",
        TABLES_DIV = "eaem-column-view-selections",
        TABLES_IN_ROW = 5,
        EAEM_ASSETS_PATH = "eaemAssetsPath",
        EAEM_SELECTED_ASSETS = "eaemSelectedAssets";

    var selectedAssets = {}, $sfContainer,
        tableWidth = (($(window).width() / TABLES_IN_ROW) - 5),
        itemTpl = Handlebars.compile(getItemTemplate()),
        sectionTpl = Handlebars.compile(getSectionTemplate());

    $document.on(FOUNDATION_CONTENT_LOADED, ifSuffixAvailableBuildUIMoveToStep2);

    $document.on(FOUNDATION_WIZARD_STEPCHANGE, handleSteps);

    function ifSuffixAvailableBuildUIMoveToStep2(){
        var $wizard = $("." + FOUNDATION_WIZARD);

        if(_.isEmpty($wizard)){
            return;
        }

        var suffix = $wizard.data(SUFFIX);

        if(_.isEmpty(suffix)){
            return;
        }

        var $columnView = $(COLUMN_VIEW);

        if(_.isEmpty($columnView)){
            return;
        }

        createSelectedAssetsUI($columnView);

        registerListeners($columnView);

        $wizard.adaptTo(FOUNDATION_WIZARD).next();
    }

    function handleSteps(event, nextStep, currentStep){
        if(_.isUndefined(currentStep)){
            return;
        }

        var $eaemAssetsPath = $("[name=" + EAEM_ASSETS_PATH + "]");

        if(isSecondStep() && !_.isEmpty($eaemAssetsPath.val())){
            $(nextStep).hide();
            redirectTo(WIZARD_URL + $eaemAssetsPath.val());
        }else if(isThirdStep()){
            addSelectedAssetsToForm();
        }
    }

    function registerListeners($columnView){
        $document.on(FOUNDATION_SELECTIONS_CHANGE, FOUNDATION_COLLECTION, collectAssets);

        $columnView.on(CORAL_COLUMN_VIEW_LOAD_ITEMS, listenerOnLoadedItems);
    }

    function addSelectedAssetsToForm(){
        if(_.isEmpty(selectedAssets)){
            return;
        }

        var $form = $("form"),
            $selectedAssets = $("[name=" + EAEM_SELECTED_ASSETS + "]");

        if(_.isEmpty($selectedAssets)){
            $selectedAssets = $('<input />').attr('type', 'hidden')
                .attr('name', EAEM_SELECTED_ASSETS)
                .appendTo($form);
        }

        var assetPaths = Object.keys(selectedAssets);

        $selectedAssets.val(assetPaths.join(","));

        if(_.isEmpty(assetPaths)){
            disableWizardNext();
        }else{
            enableWizardNext();
        }
    }

    function createSelectedAssetsUI($columnView){
        var height = $(window).height() - 350;

        $columnView.height(height).attr(SELECTION_MODE, Coral.ColumnView.selectionMode.SINGLE);

        $sfContainer = $("<div/>").appendTo($columnView.parent());

        addHeader($sfContainer);

        addNoSelFilesDiv($sfContainer);
    }

    function collectAssets(){
        var $asset, path;

        $("." + FOUNDATION_SELECTIONS_ITEM).each(function(index, asset){
            $asset = $(asset);

            path = $asset.data(FOUNDATION_COLLECTION_ITEM_ID);

            if(selectedAssets.hasOwnProperty(path)){
                return;
            }

            if(!isAsset($asset)){
                $asset.removeAttr("selected").removeClass(FOUNDATION_SELECTIONS_ITEM);
                return;
            }

            selectedAssets[path] = {
                path: path,
                thumbnail: $asset.find("coral-columnview-item-thumbnail > img").attr("src"),
                text: $asset.data("item-title")
            };
        });

        buildTable(selectedAssets, $sfContainer);
    }

    function buildTable(selectedAssets, $container) {
        if(_.isEmpty(selectedAssets)){
            addNoSelFilesDiv($sfContainer);
            return;
        }

        enableWizardNext();

        var itemHtml = "", index = 0,
            rowsInTable = getNoOfRowsInEachTable(selectedAssets),
            $tablesDiv = getTablesDiv();

        _.each(selectedAssets, function(itemData){
            itemHtml = itemHtml + itemTpl(itemData);

            if( (++index % rowsInTable) !== 0 ){
                return;
            }

            addToSection($tablesDiv, itemHtml);

            itemHtml = "";

            index = 0;
        });

        if(itemHtml){
            addToSection($tablesDiv, itemHtml);
        }

        $container.find("#" + TABLES_DIV).remove();

        $tablesDiv.appendTo($container);

        handleSelections($tablesDiv);
    }

    function handleSelections($tablesDiv){
        _.defer(function(){
            $tablesDiv.find("coral-checkbox").click().on('change', handleChecks);
        });

        function handleChecks(){
            var path = $(this).closest("tr").data("path");

            delete selectedAssets[path];

            buildTable(selectedAssets, $sfContainer);
        }
    }

    function addToSection($tablesDiv, itemHtml){
        var sectionHtml = sectionTpl({
            width: tableWidth + "px",
            itemHtml: itemHtml
        });

        $(sectionHtml).appendTo($tablesDiv);
    }

    function listenerOnLoadedItems(){
        $(CORAL_COLUMNVIEW_ITEM).click(ignoreFolderSelections);
    }

    function ignoreFolderSelections(){
        var $item = $(this);

        if(isAsset($item)){
            return;
        }

        _.defer(function(){
            $item.removeAttr("selected");
        });
    }

    function getNoOfRowsInEachTable(selectedAssets){
        return Math.ceil(Object.keys(selectedAssets).length / TABLES_IN_ROW);
    }

    function addHeader($container) {
        var html =  "<div style='text-align:center; padding: 5px; background-color: rgba(0,0,0,0.05)'>" +
                        "<h3>Selected Files</h3>" +
                    "</div>";

        return $(html).appendTo($container);
    }

    function addNoSelFilesDiv($container) {
        $container.find("#" + TABLES_DIV).remove();

        disableWizardNext();

        var html =  "<div style='text-align:center' id='" + TABLES_DIV + "'>" +
                        "<h4>No files have been added." +
                        "To add files, select the file by clicking on file thumnbnail</h4>" +
                    "</div>";

        return $(html).appendTo($container);
    }

    function getItemTemplate() {
        return '<tr is="coral-tr" data-path="{{path}}">' +
                    '<td is="coral-td" coral-tr-select></td>' +
                    '<td is="coral-td">' +
                        '<img src="{{thumbnail}}" class="image">' +
                    '</td>' +
                    '<td is="coral-td">{{text}}</td>' +
                '</tr>'
    }

    function getSectionTemplate(){
        return '<coral-table selectionmode="row" multiple style="display:inline-block" >' +
                    '<table is="coral-table-inner" style="width: {{width}}; overflow: hidden">' +
                        '<colgroup>' +
                            '<col is="coral-col" fixedwidth>' +
                            '<col is="coral-col" fixedwidth>' +
                            '<col is="coral-col" sortable alignment="left">' +
                        '</colgroup>' +
                        '<tbody is="coral-tbody">' +
                            '{{{itemHtml}}}' +
                        '</tbody>' +
                    '</table>' +
                '</coral-table>'
    }

    function isAsset($item){
        return ($item.data("item-type") === "asset");
    }

    function getTablesDiv(){
        return $("<div id='" + TABLES_DIV + "'></div>");
    }

    function disableWizardNext(){
        toggleWizard(false);
    }

    function enableWizardNext(){
        toggleWizard(true);
    }

    function toggleWizard(isEnable){
        var $wizard = $("." + FOUNDATION_WIZARD);

        if(_.isEmpty($wizard)){
            return;
        }

        var wizardApi = $wizard.adaptTo(FOUNDATION_WIZARD);
        wizardApi.toggleNext(isEnable);
    }

    function getStepNumber(){
        var $wizard = $("." + FOUNDATION_WIZARD),
            currentStep = $wizard.find(".foundation-wizard-step-active"),
            wizardApi = $wizard.adaptTo(FOUNDATION_WIZARD);

        return wizardApi.getPrevSteps(currentStep).length + 1;
    }

    function isSecondStep(){
        return (getStepNumber() === 2);
    }

    function isThirdStep(){
        return (getStepNumber() === 3);
    }

    function redirectTo(url){
        var ui = $(window).adaptTo("foundation-ui");

        ui.wait($("form"));

        window.location = url;
    }
}(jQuery, jQuery(document)));