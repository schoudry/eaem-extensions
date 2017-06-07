(function ($, $document) {
    //the query to find tag references (pages and assets)
    var CHECK_TAGS_SQL_2_QUERY = "SELECT * from [nt:base] AS t WHERE ISDESCENDANTNODE([/content]) AND ( ",
        DELETE_TAG_ACTIVATOR = ".cq-tagging-touch-actions-deletetag-activator";

    $document.on('foundation-contentloaded', function() {
        registerShowRefsAlert();
    });

    function registerShowRefsAlert(){
        $(DELETE_TAG_ACTIVATOR).click(clickHandler);
    }

    function clickHandler(event){
        var $selectedItems = $(".foundation-selections-item"),
            query = CHECK_TAGS_SQL_2_QUERY, tagId,
            path, paths = [];

        $selectedItems.each(function(index, item) {
            path = $(item).data("foundation-collection-item-id");

            paths.push(path);

            tagId = getTagIDFromPath(path);

            query = query + "t.[cq:tags] = '" + tagId + "'";

            if(index < ($selectedItems.length - 1)){
                query = query + " OR ";
            }
        });

        query = query + " )";

        //you may want to replace this crxde lite call with a servlet returning query results
        query = "/crx/de/query.jsp?type=JCR-SQL2&showResults=true&stmt=" + query;

        $.ajax( { url: query, async: false } ).done(function(data){
            showAlert(data, paths, event);
        });
    }

    function showAlert(data, paths, event){
        if(_.isEmpty(data) || _.isEmpty(data.results)){
            return;
        }

        event.stopPropagation();

        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "NO"
            },{
                id: "YES",
                text: "YES",
                primary: true
            }];

        function callback(actionId){
            if (actionId != "YES") {
                return;
            }

            deleteTags(paths).done(handler);

            function handler(){
                $(".foundation-content").adaptTo("foundation-content").refresh();

                var fui = $(window).adaptTo("foundation-ui"),
                    options = [{
                        text: "OK"
                    }];

                fui.prompt("Success", "Tag(s) deleted successfully", "default", options);
            }
        }

        var message = "Selected tag(s) are referenced. Click 'yes' to proceed deleting, 'no' to cancel the operation.<br><br>";

        _.each(data.results, function(result){
            message = message + result.path + "<br>";
        });

        fui.prompt("Delete Tag", message, "default", options, callback);
    }

    function getTagIDFromPath(tagPath){
        return tagPath.substring("/etc/tags".length + 1).replace("/", ":");
    }

    function deleteTags(paths) {
        return $.ajax({
            url: "/bin/tagcommand",
            type: "post",
            data: {
                cmd: "deleteTag",
                path: paths,
                "_charset_": "utf-8"
            }
        });
    }
}(jQuery, jQuery(document)));