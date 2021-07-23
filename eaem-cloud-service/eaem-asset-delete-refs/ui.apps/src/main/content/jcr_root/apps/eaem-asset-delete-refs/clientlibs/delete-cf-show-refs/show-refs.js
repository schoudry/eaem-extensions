(function ($, $document) {
    "use strict";

    var _ = window._;

    $document.on("foundation-contentloaded", function(e) {
        var deleteActivator = ".cq-damadmin-admin-actions-delete-activator";

        $document.off("click", deleteActivator).on("click", deleteActivator, function(e) {
            e.preventDefault();
            e.stopPropagation();

            showReferences.call(this);
        });
    });

    function showReferences(){
        var selectedItems = $(".foundation-selections-item"),
            paths = [];

        selectedItems.each(function() {
            paths.push($(this).get(0).getAttribute("data-foundation-collection-item-id"));
        });

        var AssetReferences = Dam.AssetReferences;

        var refsPromise = AssetReferences.fetchFromPaths(paths, AssetReferences.REF_MODE.ALL);

        refsPromise.then(function(references) {
            var fui = $(window).adaptTo("foundation-ui"),
                options = [{
                    id: "DELETE",
                    variant: "warning",
                    text: "Delete"
                },
                {
                    id: "CANCEL",
                    text: "Cancel"
                }];

            var message = "Are you sure?";

            if(!_.isEmpty(references.localRefs)){
                message = "Asset referenced in following paths. Are you sure?<BR><BR>" + references.localRefs.join("<BR>");
            }else if(references.activations.found){
                message = "Asset was published. Are you sure?";
            }

            fui.prompt("Delete", message, "error", options, function (actionId) {
                if (actionId === "DELETE") {
                    deleteAsset(paths);
                }
            });
        });
    }

    function deleteAsset(paths){
        var data = {
            path: paths,
            cmd: "deletePage",
            force: true,
            "_charset_": "utf-8"
        };

        $.ajax({
            url: "/bin/wcmcommand", //"/bin/asynccommand",
            type: "post",
            data: data,
            success: function() {
                var collection = document.querySelector(".cq-damadmin-admin-childpages"),
                    pageId = collection.getAttribute("data-foundation-collection-id");

                $(collection).adaptTo("foundation-collection").load(pageId);
            },
            error: function(response) {
                showAlert("Error deleting asset", "Error");
            }
        });
    }

    function showAlert(message, title, type, callback) {
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "Ok",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";
        type = type || "warning";

        fui.prompt(title, message, type, options, callback);
    }
}(jQuery, jQuery(document)));