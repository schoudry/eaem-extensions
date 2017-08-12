(function(){
    if(typeof EAEM === "undefined"){
        EAEM = {};
    }

    EAEM.showProductName = function(fields){
        return Object.values(fields)[0];
    }
}());

(function ($, $document, gAuthor) {
    var labelCreators = {},
        CORAL_MULTIFIELD = "coral-multifield",
        CORAL_MULTIFIELD_ITEM = "coral-multifield-item",
        CORAL_MULTIFIELD_ITEM_CONTENT = "coral-multifield-item-content",
        EAEM_SHOW_ON_COLLAPSE = "eaem-show-on-collapse",
        RS_MULTIFIELD = "granite/ui/components/coral/foundation/form/multifield";

    $document.on("dialog-ready", addCollapsers);

    function addCollapsers(){
        var $multifields = $(CORAL_MULTIFIELD).css("padding-right", "2.5rem");

        if(_.isEmpty($multifields)){
            return;
        }

        $multifields.find(CORAL_MULTIFIELD_ITEM).each(handler);

        $multifields.on('change', function(){
            $multifields.find(CORAL_MULTIFIELD_ITEM).each(handler);
        });

        loadShowSummaryCreatorFunctions();

        addExpandCollapseAll($multifields);


        function handler(){
            var $mfItem = $(this);

            if(!_.isEmpty($mfItem.find("[icon=accordionUp]"))){
                return;
            }

            addAccordionIcons($mfItem);

            addSummarySection($mfItem);
        }
    }

    function addSummarySection($mfItem){
        var $summarySection = $("<div/>").insertAfter($mfItem.find(CORAL_MULTIFIELD_ITEM_CONTENT))
            .addClass("coral-Well").css("cursor", "pointer").hide();

        $summarySection.click(function(){
            $mfItem.find("[icon='accordionDown']").click();
        });
    }

    function addExpandCollapseAll($multifields){
        var $mfAdd, expandAll, collapseAll;

        $multifields.find("[coral-multifield-add]").each(handler);

        function handler(){
            $mfAdd = $(this);

            expandAll = new Coral.Button().set({
                variant: 'secondary',
                innerText: "Expand All"
            });

            expandAll.$.css("margin-left", "10px").click(function(){
                event.preventDefault();
                $(this).closest(CORAL_MULTIFIELD).find("[icon='accordionDown']").click();
            });

            collapseAll = new Coral.Button().set({
                variant: 'secondary',
                innerText: "Collapse All"
            });

            collapseAll.$.css("margin-left", "10px").click(function(){
                event.preventDefault();
                $(this).closest(CORAL_MULTIFIELD).find("[icon='accordionUp']").click();
            });

            $mfAdd.after(expandAll).after(collapseAll);
        }
    }

    function loadShowSummaryCreatorFunctions(){
        var editable = gAuthor.DialogFrame.currentDialog.editable;

        if(!editable){
            return;
        }

        $.ajax(editable.config.dialog + ".infinity.json").done(fillLabelCreatorFns);

        function fillLabelCreatorFns(obj){
            if(!_.isObject(obj) || _.isEmpty(obj)){
                return;
            }

            _.each(obj, function(value){
                if(value["sling:resourceType"] === RS_MULTIFIELD){
                    if(!_.isEmpty(value.field) && !_.isEmpty(value.field.name)) {
                        labelCreators[value.field.name] = value[EAEM_SHOW_ON_COLLAPSE];
                    }
                }else{
                    if(_.isObject(value) && !_.isEmpty(value)){
                        fillLabelCreatorFns(value);
                    }
                }
            });
        }
    }

    function addAccordionIcons($mfItem){
        var up = new Coral.Button().set({
            variant: "quiet",
            icon: "accordionUp",
            title: "Collapse"
        });

        up.setAttribute('style', 'position:absolute; top: 0; right: -2.175rem');
        up.$.on('click', handler);

        $mfItem.append(up);

        var down = new Coral.Button().set({
            variant: "quiet",
            icon: "accordionDown",
            title: "Expand"
        });

        down.setAttribute('style', 'position:absolute; top: 0; right: -2.175rem');
        down.$.on('click', handler).hide();

        $mfItem.append(down);

        function handler(event){
            event.preventDefault();

            var mfName = $(this).closest(CORAL_MULTIFIELD).attr("data-granite-coral-multifield-name"),
                $mfItem = $(this).closest(CORAL_MULTIFIELD_ITEM),
                $summarySection = $mfItem.children("div");

            $summarySection.html(getSummary($mfItem, mfName));

            adjustUI.call(this, $summarySection);
        }

        function adjustUI($summarySection){
            var icon = $(this).find("coral-icon").attr("icon"),
                $content = $mfItem.find(CORAL_MULTIFIELD_ITEM_CONTENT);

            if(icon == "accordionUp"){
                if($summarySection.css("display") !== "none"){
                    return;
                }

                $summarySection.show();

                $content.slideToggle( "fast", function() {
                    $content.hide();
                });

                up.$.hide();
                down.$.show();
            }else{
                if($summarySection.css("display") === "none"){
                    return;
                }

                $summarySection.hide();

                $content.slideToggle( "fast", function() {
                    $content.show();
                });

                up.$.show();
                down.$.hide();
            }
        }
    }

    function getSummary($mfItem, mfName){
        var summary = "Click to expand";

        try{
            if(labelCreators[mfName]){
                var fields = {};

                $mfItem.find("input").each(function(){
                    var $input = $(this);
                    fields[$input.attr("name")] = $input.val();
                });

                summary = eval(labelCreators[mfName])(fields);
            }
        }catch(err){}

        if(!summary){
            summary = "Click to expand";
        }

        return summary;
    }
}(jQuery, jQuery(document), Granite.author));