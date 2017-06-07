(function() {
    if (typeof window.ExperienceAEM == "undefined") {
        window.ExperienceAEM = {};
    }

    var tooltip = null;

    ExperienceAEM.textOnly = function(event){
        if(!tooltip){
            tooltip = new CUI.Tooltip({
                type: "error",
                target: event.target,
                content: "No spaces allowed",
                visible:false,
                arrow: "left",
                interactive: false
            });
        }

        if(event.which === 32){
            tooltip.show();
            event.preventDefault();
        }else{
            tooltip.hide();
        }
    }
}());