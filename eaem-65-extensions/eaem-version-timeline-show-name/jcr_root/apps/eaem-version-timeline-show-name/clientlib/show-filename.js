(function($, $document) {
    var TIME_LINE_EVENT_CSS = ".cq-common-admin-timeline-event",
        EAEM_VERSION_NAME = "eaem-version-name";

    $document.on("foundation-contentloaded.foundation", ".cq-common-admin-timeline-events", modifyVersionDisplay);

    function modifyVersionDisplay(){
        var $timelineEvents = $(TIME_LINE_EVENT_CSS), $section,
            $main, $comment, versionNum;

        var versionNames = loadVersionNames();

        _.each($timelineEvents, function(section){
            $section = $(section);

            versionNum = $section.data("preview");

            if(!_.isEmpty(versionNum)){
                versionNum = versionNum.substring(0,versionNum.indexOf("/jcr:frozenNode"));
                versionNum = versionNum.substring(versionNum.lastIndexOf("/") + 1);
            }

            $main = $section.find(".main");

            if(_.isEmpty($main)) {
                return;
            }

            if(!_.isEmpty(versionNames[versionNum]) && _.isEmpty($section.find("." + EAEM_VERSION_NAME))){
                $( "<div class='" + EAEM_VERSION_NAME + "'>" + versionNames[versionNum] + "</div>" ).insertBefore( $main );
            }
        });
    }

    function loadVersionNames(){
        var $events = $(TIME_LINE_EVENT_CSS), versionNames = {}, path;

        _.each($events, function(event){
            if(!path && !_.isEmpty($(event).data("preview"))){
                path = $(event).data("preview");
            }
        });

        if(_.isEmpty(path)){
            return versionNames;
        }

        path = path.substring(0,path.indexOf("/jcr:frozenNode"));

        path = path.substring(0,path.lastIndexOf("/")) + ".3.json";

        $.ajax( {url : path, async: false}).done(function(data){
            if(_.isEmpty(data)){
                return;
            }

            _.each(data, function(value, key){
                if(key.startsWith("jcr:") || key.startsWith("crx:")){
                    return;
                }

                var cqName = nestedPluck(value, "jcr:frozenNode/jcr:content/cq:name");

                if(_.isEmpty(cqName)){
                    return;
                }

                versionNames[key] = cqName;
            });
        });

        return versionNames;
    }

    function nestedPluck(object, key) {
        if (!_.isObject(object) || _.isEmpty(object) || _.isEmpty(key)) {
            return [];
        }

        if (key.indexOf("/") === -1) {
            return object[key];
        }

        var nestedKeys = _.reject(key.split("/"), function(token) {
            return token.trim() === "";
        }), nestedObjectOrValue = object;

        _.each(nestedKeys, function(nKey) {
            if(_.isUndefined(nestedObjectOrValue)){
                return;
            }

            if(_.isUndefined(nestedObjectOrValue[nKey])){
                nestedObjectOrValue = undefined;
                return;
            }

            nestedObjectOrValue = nestedObjectOrValue[nKey];
        });

        return nestedObjectOrValue;
    }
})(jQuery, jQuery(document));