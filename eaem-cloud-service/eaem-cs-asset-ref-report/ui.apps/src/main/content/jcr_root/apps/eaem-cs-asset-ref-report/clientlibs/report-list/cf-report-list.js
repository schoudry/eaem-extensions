(function ($, $document) {
    "use strict";

    var _ = window._,
        initialized = false,
        REPORT_TYPE_DETAIL = "Experience AEM Content Fragments Usage Report",
        REPORT_LIST_PAGE = "/mnt/overlay/dam/gui/content/reports/reportlist.html";

    if (!isReportListPage()) {
        return;
    }

    init();

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        $(document).one("foundation-contentloaded", function(e){
            $("[value='null']").html(REPORT_TYPE_DETAIL);
        });
    }

    function isReportListPage() {
        return (window.location.pathname.indexOf(REPORT_LIST_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));
