(function (document, $) {
    "use strict";

    var SITE_ADMIN_TREE = "/bin/wcm/siteadmin/tree.json";

    $(document).on("foundation-contentloaded", function(e){
        var addSubFoldersToTooltip = function(data){
            var subFolders = [];

            $.each(data, function(i, f) {
                subFolders.push(f["text"]);
            });

            if(subFolders.length == 0){
                subFolders.push("No Sub Folders");
            }

            return "<div style='display: block;'>" +
                "<span style='font-family:adobe-clean; font-weight: bold'>" + subFolders.join("<BR>") + "</span></div>";
        };

        var getSubFolders = function (folderPath) {
            return $.ajax({
                url: SITE_ADMIN_TREE,
                data: { path: folderPath },
                dataType: "json",
                async: false,
                type: 'GET'
            });
        };

        var assets = $("article.foundation-collection-item");

        assets.each(function(index, card){
            var $card = $(card);

            $card.one('mouseenter', function () {
                var $this = $(this);

                var tooltip = new CUI.Tooltip({
                    type: "info",
                    target: $(card),
                    content: (function(){
                        var html;

                        getSubFolders($this.data("path")).done( function(data){
                            html = addSubFoldersToTooltip(data);
                        });

                        return html;
                    })(),
                    arrow: "left",
                    interactive: true
                });
            });
        });
    });
})(document, Granite.$);
