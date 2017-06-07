(function ($, $document) {
    var DOWNLOAD_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        TEXT = "Save as PDF",
        CREATE_PDF_URL = "/bin/eaem/createpdf?assetPaths=",
        added = false;

    $document.on("foundation-mode-change", addButton);

    function addButton(e, mode){
        if(added || (mode !== "selection") ){
            return;
        }

        added = true;

        var $cFolder = $("." + DOWNLOAD_ACTIVATOR);

        if ($cFolder.length == 0) {
            return;
        }

        var $downloadPdf = $cFolder.after($($cFolder[0].outerHTML));

        $downloadPdf.attr("title", TEXT)
            .removeClass(DOWNLOAD_ACTIVATOR)
            .removeAttr("href")
            .click(downloadPDF)
            .find("span").html(TEXT);

        $document.on("foundation-selections-change", ".foundation-collection", function() {
            var $selectedItems = $(".foundation-selections-item");

            if($selectedItems.length > 0){
                $downloadPdf.removeAttr("hidden");
            }
        });

        function downloadPDF() {
            var $items = $(".foundation-selections-item"),
                assetPaths = [];

            $items.each(function () {
                assetPaths.push($(this).data("path"));
            });

            window.open(CREATE_PDF_URL + assetPaths.join(","), "_blank");
        }
    }
})(jQuery, jQuery(document));