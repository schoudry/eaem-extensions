CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.PathFieldWithSearch = CQ.Ext.extend(CQ.form.PathField, {
    // the tree creation was copied from /libs/cq/ui/widgets/source/widgets/BrowseDialog.js
    getTreePanel: function(){
        var treeRootConfig = CQ.Util.applyDefaults(this.treeRoot, {
            name: "content",
            text: CQ.I18n.getMessage("Site"),
            draggable: false,
            singleClickExpand: true,
            expanded:true
        });

        var treeLoaderConfig = CQ.Util.applyDefaults(this.treeLoader, {
            dataUrl: CQ.HTTP.externalize("/bin/tree/ext.json"),
            requestMethod:"GET",
            baseParams: {
                predicate: "hierarchy",
                _charset_: "utf-8"
            },
            baseAttrs: {
                "singleClickExpand":true
            },
            listeners: {
                beforeload: function(loader, node){
                    this.baseParams.path = node.getPath();
                }
            }
        });

        return this.browseDialog.treePanel = new CQ.Ext.tree.TreePanel({
            region:"west",
            lines: CQ.themes.BrowseDialog.TREE_LINES,
            bodyBorder: CQ.themes.BrowseDialog.TREE_BORDER,
            bodyStyle: CQ.themes.BrowseDialog.TREE_STYLE,
            height: "100%",
            width: 250,
            autoScroll: true,
            containerScroll: true,
            root: new CQ.Ext.tree.AsyncTreeNode(treeRootConfig),
            loader: new CQ.Ext.tree.TreeLoader(treeLoaderConfig),
            defaults: {
                "draggable": false
            }
        });
    },

    getSearchPanel: function(){
        var reader = new CQ.Ext.data.JsonReader({
            id: "path",
            root: "hits",
            fields: [ "path", "title" ]
        });

        //querybuilder servlet returns the search results
        var searchStore = new CQ.Ext.data.Store({
            proxy:    new CQ.Ext.data.HttpProxy({
                url: "/bin/querybuilder.json"
            }),
            baseParams: {
                "p.limit": "100",
                "p.offset": "0",
                "type": "cq:Page"
            },
            reader:   reader,
            autoLoad: false
        });

        var searchTemplate = new CQ.Ext.XTemplate(
            '<tpl for=".">',
            '<div class="search-result">{title} - {path}</div>',
            '</tpl>'
        );

        this.browseDialog.searchResultsView = new CQ.Ext.DataView({
            id: "pathfield-browsedialog-searchpanel",
            store: searchStore,
            tpl: searchTemplate,
            itemSelector: "div.search-result",
            selectedClass: "search-result-selected",
            singleSelect: true,
            style: { margin: "8px 0 0 0" }
        });

        this.browseDialog.searchField = new CQ.Ext.form.TextField({
            width: "220",
            hideLabel: true,
            enableKeyEvents: true,
            listeners:{
                keypress: function(t,e){
                    //initiate search on enter
                    if (e.getKey() == e.ENTER) {
                        searchStore.reload( { params: { fulltext: t.getValue() } } );
                    }
                }
            }
        });

        var button = {
            xtype: "button",
            text: "Search",
            width: 60,
            tooltip: 'Search',
            style: { margin: "0 0 0 10px" },
            handler: (function () {
                searchStore.reload( { params: { fulltext: this.browseDialog.searchField.getValue() } } );
            }).createDelegate(this)
        };

        return new CQ.Ext.Panel({
            region: "center",
            border: false,
            layout: "form",
            autoScroll:true,
            items: [ {
                        xtype: 'panel', layout: 'hbox', border: false,
                        items: [this.browseDialog.searchField, button]
                    }, this.browseDialog.searchResultsView ]
        });
    },

    initComponent : function(){
        ExperienceAEM.PathFieldWithSearch.superclass.initComponent.call(this);

        this.on("dialogopen", function(){
            var bd = this.browseDialog;

            if(bd.searchField == null){
                //remove the existing tree and add a new tree panel; couldn't successfully move the existing tree
                //to new panel with search results, so remove and add new
                bd.remove(this.browseDialog.treePanel, true);

                var items = new CQ.Ext.Panel({
                    border:false,
                    layout: "border",
                    defaults: {
                        bodyStyle: 'padding:15px'
                    },
                    items: [ this.getTreePanel(), this.getSearchPanel()]
                });

                bd.setWidth(600);
                bd.add(items);

                bd.loadAndShowPath(this.getValue());
            }else{
                bd.searchField.setValue("");
                bd.searchResultsView.getStore().removeAll();
            }
        });

        this.on('dialogselect', function(){
            var searchView = this.browseDialog.searchResultsView;

            if(searchView && searchView.getSelectedRecords().length > 0){
                this.setValue(searchView.getSelectedRecords()[0].get("path"));
            }
        });
    }
});

CQ.Ext.reg("pathfieldwithsearch", ExperienceAEM.PathFieldWithSearch);