(function ($, $document) {
    var WIZARD_URL = "/apps/eaem-sample-wizard/eaem-3-step-wizard.html",
        SUFFIX = "suffix",
        EAEM_ASSETS_PATH = "eaemAssetsPath",
        EAEM_SELECTED_ASSETS = "eaemSelectedAssets";

    $document.on("foundation-contentloaded", moveToStep2IfSuffixAvailable);

    $document.on("foundation-wizard-stepchange", handleSteps);

    function moveToStep2IfSuffixAvailable(){
        var $wizard = $(".foundation-wizard");

        if(_.isEmpty($wizard)){
            return;
        }

        var suffix = $wizard.data(SUFFIX);

        if(_.isEmpty(suffix)){
            return;
        }

        var wizardApi = $wizard.adaptTo("foundation-wizard");
        wizardApi.next();
    }

    function getStepNumber(){
        var $wizard = $(".foundation-wizard"),
            currentStep = $wizard.find(".foundation-wizard-step-active"),
            wizardApi = $wizard.adaptTo("foundation-wizard");

        return wizardApi.getPrevSteps(currentStep).length + 1;
    }

    function isSecondStep(){
        return (getStepNumber() === 2);
    }

    function isThirdStep(){
        return (getStepNumber() === 3);
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

    function addSelectedAssetsToForm(){
        var $form = $("form"), assetPaths = [],
            eaemSelectedAssets = $("[name=" + EAEM_SELECTED_ASSETS + "]");

        if(_.isEmpty(eaemSelectedAssets)){
            eaemSelectedAssets = $('<input />').attr('type', 'hidden')
                .attr('name', EAEM_SELECTED_ASSETS)
                .appendTo($form);
        }

        $(".foundation-selections-item").each(function(index, asset){
            assetPaths.push($(asset).data("foundation-collection-item-id"));
        });

        eaemSelectedAssets.val(assetPaths.join(","));
    }

    function redirectTo(url){
        var ui = $(window).adaptTo("foundation-ui");

        ui.wait($("form"));

        window.location = url;
    }
}(jQuery, jQuery(document)));