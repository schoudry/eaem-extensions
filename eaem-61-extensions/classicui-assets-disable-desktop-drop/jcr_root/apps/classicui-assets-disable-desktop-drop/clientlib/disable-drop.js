(function () {
    if (window.location.pathname !== "/damadmin") {
        return;
    }

    //id set in /libs/wcm/core/content/damadmin
    var DAM_ADMIN_ID = "cq-damadmin";

    function handleDrops() {
        var damAdmin = CQ.Ext.getCmp(DAM_ADMIN_ID);

        damAdmin.html5UploadFiles = function (files) {
            CQ.Ext.Msg.alert("Drop Error", "Drop from desktop disabled");
        }
    }

    var INTERVAL = setInterval(function () {
        var grid = CQ.Ext.getCmp(DAM_ADMIN_ID + "-grid");

        if (!grid) {
            return;
        }

        clearInterval(INTERVAL);

        try {
            handleDrops();
        } catch (err) {
            console.log("error executing drag drop disable extension");
        }
    }, 250);
})();