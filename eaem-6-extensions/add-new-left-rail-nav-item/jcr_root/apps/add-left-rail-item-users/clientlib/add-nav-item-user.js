(function(document, Granite, $) {
    "use strict";

    $(document).on("ready", function() {
        //id of left rail nav is added by CQ here /libs/cq/core/content/nav
        var pRoot = $("nav[data-coral-columnview-id=root]");
        pRoot.first().append("<a class='coral-ColumnView-item' href='/libs/granite/security/content/useradmin.html'>Users</a>")
    });
})(document, Granite, Granite.$);