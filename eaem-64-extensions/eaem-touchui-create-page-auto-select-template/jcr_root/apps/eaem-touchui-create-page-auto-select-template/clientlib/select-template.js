(function ($, $document) {
    var CREATE_PAGE_WIZARD_URL = "/mnt/overlay/wcm/core/content/sites/createpagewizard.html",
        DEFAULT_HEADER = "Create Page",
        WIZARD_HEADER = '.foundation-layout-wizard2-title';

    if(!isCreatePageWizard()){
        return;
    }

    $document.on("foundation-contentloaded", autoSelectTemplate);

    function autoSelectTemplate(){
        var stepNumber = getWizardStepNumber();

        if(stepNumber == 1){
            selectTheOneTemplate();
        }else if(stepNumber == 2){
            setSelectedTemplateInTitle();
        }
    }

    function selectTheOneTemplate(){
        var $cards = $("coral-masonry-item");

        if($cards.length != 1){
            return;
        }

        selectTemplate($cards[0]);

        var wizardApi = $(".foundation-wizard").adaptTo("foundation-wizard");

        wizardApi.next();
    }

    function setSelectedTemplateInTitle(){
        var $selected = $("coral-masonry-item.is-selected"),
            title = DEFAULT_HEADER + " of type '" + $selected.find("coral-card-title").html() + "'";

        $(".foundation-wizard").find(WIZARD_HEADER).html(title);
    }

    function getWizardStepNumber(){
        var $wizard = $(".foundation-wizard"),
            currentStep = $wizard.find(".foundation-wizard-step-active"),
            wizardApi = $wizard.adaptTo("foundation-wizard");

        return wizardApi.getPrevSteps(currentStep).length + 1;
    }

    function selectTemplate(template){
        var $collection = $("coral-masonry");

        var selectApi = $collection.adaptTo("foundation-selections");

        selectApi.select(template)
    }

    function isCreatePageWizard() {
        return (window.location.pathname.indexOf(CREATE_PAGE_WIZARD_URL) >= 0);
    }
}(jQuery, jQuery(document)));