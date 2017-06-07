(function () {
    if (window.location.pathname !== "/damadmin") {
        return;
    }

    //id set in /libs/wcm/core/content/damadmin
    var DAM_ADMIN_ID = "cq-damadmin";
    var CREATE_FILE_ICON = "cq-damadmin-create-file-icon";
    var PROP_ALLOWED_FILE_SIZE_BYTES = "allowedFileSizeBytes";

    var getRange = function (afsb) {
        var isRange = afsb.indexOf("[") !== -1, min, max;

        if (isRange) {
            afsb = afsb.replace("[", "").replace("]", "");

            min = parseInt(afsb.substring(0, afsb.lastIndexOf("-")), 10);
            max = parseInt(afsb.substring(afsb.lastIndexOf("-") + 1), 10);
        } else {
            min = 0;
            max = parseInt(afsb, 10);
        }

        return [ min, max ];
    };

    var getOverLimitFiles = function (afsb, files) {
        var range = getRange(afsb);
        var min = range[0], max = range[1];

        var message = "", overLimit = [];

        for (var i = 0; i < files.length; i++) {
            if (files[i].size > max) {
                message = message + "File " + files[i].name
                    + " size must be less than " + max + " bytes (" + (max / 1024) + " kb)" + "<br>";
                overLimit.push(files[i].name);
            } else if (files[i].size < min) {
                message = message + "File " + files[i].name
                    + " size must be greater than " + min + " bytes (" + (min / 1024) + " kb)" + "<br>";
                overLimit.push(files[i].name);
            }
        }

        return {
            message: message,
            files: overLimit
        }
    };

    var addFileSizeHandler = function (button) {
        var attach = function (uploadWin, afsb) {
            uploadWin.on('fileselected', function (uploadField, files) {
                var overLimit = getOverLimitFiles(afsb, files);

                if (overLimit.files.length == 0) {
                    return;
                }

                CQ.Ext.Msg.alert("Error", overLimit.message, function () {
                    var uploadFields = uploadWin.findByType("html5fileuploadfield");

                    for (var i = 0; i < uploadFields.length; i++) {
                        if (!uploadFields[i].file) {
                            continue;
                        }

                        if (overLimit.files.indexOf(uploadFields[i].file.name) != -1) {
                            uploadWin.onFileRemoved(uploadFields[i].file.name);
                            uploadFields[i].clearFile();
                        }
                    }
                });
            });
        };

        button.on("click", function () {
            var wMgr = CQ.Ext.WindowMgr, uWin;

            var W_INTERVAL = setInterval(function () {
                try {
                    wMgr.each(function (win) {
                        if (win.xtype !== "html5uploaddialog") {
                            return;
                        }

                        clearInterval(W_INTERVAL);

                        //make sure you get the last (active) upload dialog window, if there are multiple
                        uWin = win;
                    });

                    CQ.Ext.Ajax.request({
                        url: uWin.displayPath + ".json",
                        success: function (response) {
                            var obj = $.parseJSON(response.responseText);

                            if (!obj[PROP_ALLOWED_FILE_SIZE_BYTES]) {
                                return;
                            }

                            attach(uWin, obj[PROP_ALLOWED_FILE_SIZE_BYTES].trim());
                        }
                    });
                } catch (err) {
                }
            }, 250);
        });
    };

    var addToNewButton = function (grid) {
        var toolBar = grid.getTopToolbar();

        var newMenu = toolBar.findBy(function (comp) {
            return comp["iconCls"] == CREATE_FILE_ICON;
        }, toolBar);

        if (!newMenu || newMenu.length == 0) {
            return;
        }

        addFileSizeHandler(newMenu[0]);

        var newFileButton = newMenu[0].menu.findBy(function (comp) {
            return comp["iconCls"] == CREATE_FILE_ICON;
        }, toolBar);

        if (!newFileButton || newFileButton.length == 0) {
            return;
        }

        addFileSizeHandler(newFileButton[0]);
    };

    var handleDrops = function () {
        var damAdmin = CQ.Ext.getCmp(DAM_ADMIN_ID);

        var handle = function (response, files) {
            var obj = $.parseJSON(response.responseText);

            if (!obj[PROP_ALLOWED_FILE_SIZE_BYTES]) {
                return;
            }

            var overLimit = getOverLimitFiles(obj[PROP_ALLOWED_FILE_SIZE_BYTES].trim(), files);

            if (overLimit.files.length == 0) {
                CQ.wcm.SiteAdmin.prototype.html5UploadFiles.call(damAdmin, files);
                return;
            }

            overLimit.message = overLimit.message + "<br>No Files are uploaded";

            CQ.Ext.Msg.alert("Drop Error", overLimit.message);
        };

        damAdmin.html5UploadFiles = function (files) {
            var path = damAdmin.treePathEncoded;

            if (!path) {
                return;
            }

            CQ.Ext.Ajax.request({
                url: path + ".json",
                success: function (response) {
                    try {
                        handle(response, files);
                    } catch (e) {
                        console.log("error executing drop limit extension");
                    }
                }
            });
        };

    };

    var INTERVAL = setInterval(function () {
        var grid = CQ.Ext.getCmp(DAM_ADMIN_ID + "-grid");

        if (!grid) {
            return;
        }

        clearInterval(INTERVAL);

        try {
            addToNewButton(grid);

            handleDrops();
        } catch (err) {
            console.log("error executing upload limit extension");
        }

    }, 250);

})();