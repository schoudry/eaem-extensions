(function ($, $document) {
    var EDITOR_LOADED_EVENT = "cq-editor-loaded",
        QUERY = "/bin/querybuilder.json?type=nt:unstructured&path=/content&p.limit=-1&nodename=";

    $document.on(EDITOR_LOADED_EVENT, extendMSMOpenDialog);

    function extendMSMOpenDialog(){
        if(!Granite.author || !Granite.author.MsmAuthoringHelper){
            console.log("Experience AEM - Granite.author.MsmAuthoringHelper not available");
            return;
        }

        var _origFn = Granite.author.MsmAuthoringHelper.openRolloutDialog;

        Granite.author.MsmAuthoringHelper.openRolloutDialog = function(dialogSource){
            _origFn.call(this, dialogSource);

            var dialog = Granite.author.DialogFrame.currentDialog,
                _onReady = dialog.onReady;

            dialog.onReady = function(){
                _onReady.call(this);

                if(_.isEmpty(getSelectedComponentPath())){
                    return;
                }

                getComponentRolloutData();
            }
        }
    }

    function getComponentRolloutData(){
        var compName = getSelectedComponentPath();

        compName = compName.substring(compName.lastIndexOf("/") + 1);

        $.ajax(QUERY + compName).done(addComponentDataColumn);
    }

    function addComponentDataColumn(compData){
        if(!compData || (compData.results <= 0) ){
            return;
        }

        var results = {};

        _.each(compData.hits, function(hit){
            results[hit["path"]] = hit["lastModified"];
        });

        var $rolloutDialog = $(".msm-rollout-dialog"),
            $modifiedDiv = $rolloutDialog.find("header").find(".modified"),
            $componentDiv = $($modifiedDiv[0].outerHTML).html("Component Modified").css("width","20%");

        $modifiedDiv.html("Page Modified").css("width","20%").before($componentDiv);

        var compPath = getSelectedComponentPath(),
            $articles = $rolloutDialog.find(".live-copy-list-items article");

        compPath = compPath.substring(compPath.indexOf("/jcr:content"));

        $articles.each(function(index, article){
            var $article = $(article),
                $pageMod = $article.find(".modified"),
                lastModified = results[$article.data("path") + compPath];

            if(!lastModified){
                return;
            }

            lastModified = new Date(lastModified);

            var $componentMod = $($pageMod[0].outerHTML).css("width","20%"),
                $dateField = $componentMod.attr("title", "Component Modification Data").find(".date");

            $dateField.html(lastModified.toDateString()).attr("data-timestamp", lastModified.getMilliseconds());

            $pageMod.css("width","20%").before($componentMod);
        })
    }

    function getSelectedComponentPath(){
        var selEditables = MSM.MSMCommons.getSelection(),
            selComps = [];

        $.each(selEditables, function(index, editable) {
            selComps.push(editable.path);
        });

        return ( (selComps.length == 1) ? selComps[0] : "");
    }
}(jQuery, jQuery(document)));