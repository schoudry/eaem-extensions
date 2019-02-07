(function ($, $document, gAuthor) {
    var SITES_CONSOLE_URL = "/sites.html";

    $(registerDblClickForContentTree);

    function registerDblClickForContentTree(){
        if(!isSitesConsole()){
            return;
        }

        var tree = $(".shell-collectionpage-tree").first(),
            treeEl = tree[0];

        if (!treeEl) {
            return;
        }

        tree.on("change", function(event) {
            tree.find("[class^=fnd-Cell-text]").each(registerDblClick);
        });

        function registerDblClick(index, element){
            var $element = $(element);

            if($element.data("eaemRegistered") == "true" ){
                return;
            }

            $element.on("dblclick", function(event){
                window.open("/editor.html" + treeEl.selectedItem.id + ".html", "_blank");
            });

            $element.data("eaem-registered", "true");
        }
    }

    function isSitesConsole() {
        return (window.location.pathname.indexOf(SITES_CONSOLE_URL) >= 0);
    }

}(jQuery, jQuery(document), Granite.author));