CQ.Ext.ns("MyClientLib");

MyClientLib.Sidekick = {
    SK_TAB_PANEL: "cq-sk-tabpanel",
    TAGADMIN_TREE_ID: "myclientlib-cq-tagadmin-tree",
    TAGS: "TAGS",

    addTagsPanel: function (sk) {
        var CONTEXTS = CQ.wcm.Sidekick.CONTEXTS;

        if (($.inArray(this.TAGS, CONTEXTS) != -1) || sk.panels[this.TAGS]) {
            return;
        }

        CONTEXTS.push(this.TAGS);

        var tabPanel = sk.findById(this.SK_TAB_PANEL);

        var treeLoader = new CQ.Ext.tree.TreeLoader({
            dataUrl: "/bin/mycomponents/sidekick/tags",
            requestMethod: "GET",
            baseParams: {
                page: sk.getPath()
            },
            listeners: {
                beforeload: function (tl, node) {
                    this.baseParams.tag = "/" + node.attributes.name;
                }
            }
        });

        var treeRoot = new CQ.Ext.tree.AsyncTreeNode({
            name: "etc/tags",
            text: CQ.I18n.getMessage("Tags"),
            expanded: true
        });

        var tree = new CQ.Ext.tree.TreePanel({
            "id": this.TAGADMIN_TREE_ID,
            "margins": "5 0 5 5",
            "width": 200,
            "animate": true,
            "loader": treeLoader,
            "root": treeRoot,
            "rootVisible": false,
            "tbar": [
                {
                    "iconCls": "cq-siteadmin-refresh",
                    "handler": function () {
                        CQ.Ext.getCmp(MyClientLib.Sidekick.TAGADMIN_TREE_ID).getRootNode().reload();
                    },
                    "tooltip": {
                        "text": CQ.I18n.getMessage("Refresh the tree")
                    }
                }
            ],
            listeners: {
                checkchange: function (cNode, checked) {
                    var tagTree = CQ.Ext.getCmp(MyClientLib.Sidekick.TAGADMIN_TREE_ID);
                    var tag = cNode.attributes.name;

                    //to create something like geometrixx-media:entertainment/music
                    tag = tag.substr("etc/tags".length + 1);
                    tag = tag.substr(0, tag.indexOf("/")) + ":" + tag.substr(tag.indexOf("/") + 1);

                    var data = { "./cq:tags@TypeHint": "String[]", "./cq:tags@Patch": "true",
                        "./cq:tags": (checked ? "+" : "-") + tag };

                    $.ajax({
                        url: sk.getPath() + "/jcr:content",
                        dataType: "json",
                        data: data,
                        success: function (rdata) {
                            var pNodes = [];
                            var pNode = cNode.parentNode;

                            while (true) {
                                if (pNode.attributes.name == "etc/tags") {
                                    break;
                                }

                                pNodes.push(pNode);
                                pNode = pNode.parentNode;
                            }

                            var dec = pNodes.length - 1;

                            var callBack = function (rNode) {
                                if (dec < 0) {
                                    return;
                                }

                                var toRefresh;

                                CQ.Ext.each(rNode.childNodes, function (child) {
                                    if (!toRefresh && (child.attributes.name == pNodes[dec].attributes.name)) {
                                        toRefresh = child;
                                    }
                                });

                                if (toRefresh) {
                                    dec--;
                                    toRefresh.reload(callBack);
                                }
                            };

                            tagTree.getRootNode().reload(callBack);
                        },
                        type: 'POST'
                    });
                }
            }
        });

        sk.panels[this.TAGS] = new CQ.Ext.Panel({
            "border": false,
            //"autoScroll": true,
            "layout": "fit",
            items: [tree],
            "id": "cq-sk-tab-" + this.TAGS
        });

        tabPanel.add({
            "tabTip": "Tags",
            "iconCls": "cq-sidekick-tab cq-cft-tab-icon full",
            "items": sk.panels[this.TAGS],
            "layout": "fit"
        });

        sk.doLayout();
    }
};

(function () {
    if (window.location.pathname.indexOf("/cf") == 0 || window.location.pathname.indexOf("/content") == 0) {
        var s = MyClientLib.Sidekick;

        var SK_INTERVAL = setInterval(function () {
            var sk = CQ.WCM.getSidekick();

            if (sk && sk.findById(s.SK_TAB_PANEL)) {
                clearInterval(SK_INTERVAL);
                s.addTagsPanel(sk);
            }
        }, 250);
    }
})();
