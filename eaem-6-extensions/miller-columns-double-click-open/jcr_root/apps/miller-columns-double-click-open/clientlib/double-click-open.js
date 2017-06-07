(function(document, Granite, $) {
    "use strict";

    //.cq-siteadmin-admin-childpages defined in libs/wcm/core/content/sites/jcr:content/body/content/header/items/selection/items/open
    var TARGET_CHILD_PAGES = ".cq-siteadmin-admin-childpages";

    $(document).on("click", ".foundation-layout-control", function(e) {
        var control = $(this);
        var config = control.data("foundationLayoutControl");

        if (config.action !== "switch" || config.target !== TARGET_CHILD_PAGES) {
            return;
        }

        var $target = $(config.target);

        $target.on("foundation-layout-perform", function(){
            alert("hello");
        });

    });

    $(document).on("foundation-layout-perform", ".foundation-layout-control", function(e) {
        debugger;
    });
})(document, Granite, Granite.$);
