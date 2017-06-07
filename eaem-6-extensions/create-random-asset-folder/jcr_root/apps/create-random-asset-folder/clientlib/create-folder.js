(function (document, $) {
    "use strict";

    var CREATE_FOLDER_ACTIVATOR = ".cq-damadmin-admin-actions-createfolder-activator";
    var UNIQUE_FOLDER_ELEMENT_ID = "experience-aem-unique-folder-create";

    //code picked up from the internet
    var getUniqueFolderName = function(){
        var d = new Date().getTime();

        return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    var createFolder = function(parentPath) {
        var options = {
            "./jcr:primaryType": "sling:OrderedFolder",
            "./jcr:content/jcr:primaryType": "nt:unstructured",
            "_charset_": "utf-8"
        };

        return $.ajax({
            url: parentPath + "/" + getUniqueFolderName(),
            data: options,
            type: 'POST'
        });
    };

    $(document).on("foundation-contentloaded", function(e){
        if($("#" + UNIQUE_FOLDER_ELEMENT_ID).length > 0 ){
            return;
        }

        var $cFolder = $(CREATE_FOLDER_ACTIVATOR);

        if($cFolder.length == 0){
            return;
        }

        $cFolder.after($($cFolder[0].outerHTML).attr("id", UNIQUE_FOLDER_ELEMENT_ID)
            .css("opacity", ".5").removeAttr("href").attr("title", "Create Unique Folder").click(function(){
                var parentPath = $(".foundation-content-path").data("foundationContentPath");

                createFolder(parentPath).done(function(){
                    $(".foundation-content").adaptTo("foundation-content").refresh();
                });
            }));
    })
})(document, Granite.$);
