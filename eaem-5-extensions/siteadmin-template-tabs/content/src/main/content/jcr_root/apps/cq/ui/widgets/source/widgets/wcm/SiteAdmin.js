
CQ.Ext.ns("MyClientLib")

MyClientLib.SiteAdmin = {
    SA_TABPANEL: "cq-siteadmin-tabpanel",

    getGrid: function(config){
        var store = new CQ.Ext.data.Store({
            baseParams: {
                "type": "cq:Page",
                "path": "/content",
                "orderby": "path",
                "p.hitwriter": "full",
                "p.nodedepth": "4",
                "1_property": "jcr:content/cq:template",
                "1_property.operation": "like",
                "1_property.value": config.path,
                "p.limit": "15",
                "p.offset": "0"
            },
            proxy: new CQ.Ext.data.HttpProxy({
                "autoLoad":false,
                url: "/bin/querybuilder.json",
                method: 'GET'
            }),
            reader: new CQ.Ext.data.JsonReader({
                root: 'hits',
                fields: [
                    {   name: 'title',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    },
                    {name: 'path', mapping: 'jcr:path'},
                    {name: 'published',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    },
                    {name: 'modified',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    },
                    {name: 'modifiedBy',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    },
                    {name: 'created',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    },
                    {name: 'createdBy',
                        convert:function(v,record){
                            return CQ.shared.XSS.getXSSValue(record["jcr:content"]["jcr:title"]);
                        }
                    }
                ]
            })
        });

        store.load();

        return new CQ.Ext.grid.GridPanel({
            store: store,
            id: config.gridId,
            colModel: new CQ.Ext.grid.ColumnModel({
                defaults: {
                    width: 200,
                    sortable: true
                },
                columns: [
                    {id: 'title', header: 'Title', dataIndex: 'title'},
                    {id: 'name', header: 'Name', dataIndex: 'path'},
                    {id: 'published', header: 'Published', dataIndex: 'published'},
                    {id: 'modified', header: 'Modified', dataIndex: 'modified'},
                    {id: 'modifiedBy', header: 'Modified By', dataIndex: 'modifiedBy'},
                    {id: 'created', header: 'Created', dataIndex: 'created'},
                    {id: 'createdBy', header: 'Created By', dataIndex: 'createdBy'}
                ]
            }),
            sm: new CQ.Ext.grid.RowSelectionModel(),
            frame: false,
            height: 800,
            style: "margin:0 0 0 2px"
        });
    },

    addTemplateTabs: function(tabpanel){
        var t = this;

        $.ajax({
            url: '/bin/mycomponents/siteadmin/templates',
            dataType: "json",
            success: function(data){
                if(!data || data.length == 0){
                    return;
                }

                var gridId;

                CQ.Ext.each(data.data.reverse(), function(template){
                    var gridId = template.id.substr(template.id.lastIndexOf("/") + 1);
                    gridId = "template-tabs-grid-" + gridId;

                    tabpanel.add({
                        xtype: "panel",
                        tabTip: template.id,
                        title: template.name,
                        items: [ t.getGrid( {
                            gridId : gridId, path : template.id
                        }) ]
                    });
                });

                tabpanel.doLayout();
            }
        });
    }
};

CQ.shared.HTTP.get("/libs/cq/ui/widgets/source/widgets/wcm/SiteAdmin.js");

(function(){
    if(window.location.pathname == "/siteadmin"){
        var SA_INTERVAL = setInterval(function(){
            var S = MyClientLib.SiteAdmin;
            var tabpanel = CQ.Ext.getCmp(S.SA_TABPANEL);

            if(tabpanel){
                clearInterval(SA_INTERVAL);
                S.addTemplateTabs(tabpanel);
            }
        });
    }
})();