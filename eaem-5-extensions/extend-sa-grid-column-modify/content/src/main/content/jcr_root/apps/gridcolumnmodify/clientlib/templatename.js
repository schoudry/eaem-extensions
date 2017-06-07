CQ.Ext.ns("MyClientLib");

MyClientLib.SearchPanel = {
    templatesStore: null,
    SA_SEARCH_PANEL_GRID: "cq-siteadminsearchpanel-grid",

    setTemplateName: function(grid){
        //read the templates when siteadmin is loaded in browser
        if(!this.templatesStore){
            this.templatesStore = new CQ.Ext.data.Store({
                proxy: new CQ.Ext.data.HttpProxy({
                    "autoLoad":false,
                    url: "/bin/mycomponents/templates.json",
                    method: 'GET'
                }),
                reader: new CQ.Ext.data.JsonReader({
                    root: 'data',
                    fields: [
                        {name: 'id', mapping: 'id'},
                        {name: 'name', mapping: 'name'}
                    ]
                })
            });

            this.templatesStore.load();
        }

        //get the template column
        var tColumn = grid.getColumnModel().getColumnById("template");
        var store = this.templatesStore;

        if(tColumn){
            tColumn.renderer = function(v, params, record) {
                var template = store.getById(v);

                //set the path as tooltip
                params.attr = ' ext:qtip="'  + v + '"';

                //return template name
                return template ? template.data.name : v;
            };
        }

        grid.doLayout();
    }
};

(function(){
    var s = MyClientLib.SearchPanel;

    if(window.location.pathname == "/siteadmin"){
        var SA_INTERVAL = setInterval(function(){
            var grid = CQ.Ext.getCmp(s.SA_SEARCH_PANEL_GRID);

            if(grid){
                clearInterval(SA_INTERVAL);
                s.setTemplateName(grid);
            }
        }, 250);
    }
})();