(function ($, $document) {
    var NEW_CF_URL = "/mnt/overlay/dam/cfm/admin/content/v2/createfragment.html",
        WIZARD_HEADER = '.foundation-layout-wizard2-title',
        DEFAULT_HEADER = "New Content Fragment",
        FOUNDATION_WIZARD_STEP_CHANGE = "foundation-wizard-stepchange";

    if(!isNewCFPage()){
        return;
    }

    $document.on(FOUNDATION_WIZARD_STEP_CHANGE, changeWizardTitle);

    function changeWizardTitle(event, prev, current){
        var stepNumber = getWizardStepNumber();

        if(stepNumber == 1){
            $(".foundation-wizard").find(WIZARD_HEADER).html(DEFAULT_HEADER);
            return;
        }

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

    function isNewCFPage() {
        return (window.location.pathname.indexOf(NEW_CF_URL) === 0);
    }

}(jQuery, jQuery(document)));    