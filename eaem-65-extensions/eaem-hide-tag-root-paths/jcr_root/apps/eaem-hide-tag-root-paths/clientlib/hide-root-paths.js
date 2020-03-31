(function($, $document) {
    var HIDE_TAGS_WITH_PREFIX = "we-retail",
        HIDE_LEVELS = 2;

    $document.on("foundation-contentloaded", hideRootPaths);

    function hideRootPaths(){
        var $autoCompletes = $("foundation-autocomplete");

        if(_.isEmpty($autoCompletes)){
            return;
        }

        _.each($autoCompletes, function(autoComplete){
            if(autoComplete.eaemExtended){
                return;
            }

            extendDisplay(autoComplete);

            extendPicker(autoComplete);

            autoComplete.eaemExtended = true;
        });
    }

    function extendPicker(autoComplete){
        $(autoComplete).on("change", function(){
            extendDisplay(this);
        })
    }

    function extendDisplay(autoComplete){
        var $autoComplete = $(autoComplete),
            $tags = $autoComplete.find("coral-tag");

        _.each($tags, function(tag){
            var $tag = $(tag), tagDisplayValue,
                $tagLabel = $tag.find("coral-tag-label");

            if(!$tag.attr("value").trim().startsWith(HIDE_TAGS_WITH_PREFIX)){
                return;
            }

            tagDisplayValue = _.isEmpty($tagLabel) ? $tag.html() : $tagLabel.html();

            if(_.isEmpty($tagLabel)){
                $tag.html(cutLevels(tagDisplayValue));
            }else{
                $tagLabel.html(cutLevels(tagDisplayValue));
            }
        });
    }

    function cutLevels(tagValue){
        var tagRetValue = tagValue;

        for (var index = 0 ; index < HIDE_LEVELS; index++){
            if(index == 0){
                tagRetValue = tagRetValue.substring(tagRetValue.indexOf(":") + 1);
            }else if(tagRetValue.includes("/")){
                tagRetValue = tagRetValue.substring(tagRetValue.indexOf("/") + 1);
            }

            tagRetValue = tagRetValue.trim();
        }

        return tagRetValue;
    }
}(jQuery, jQuery(document)));