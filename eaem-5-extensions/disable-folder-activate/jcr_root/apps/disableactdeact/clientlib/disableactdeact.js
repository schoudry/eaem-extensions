CQ.Ext.ns("MyClientLib");

MyClientLib.SiteAdmin = {
    SA_GRID: "cq-siteadmin-grid",
    SA_TREE: "cq-siteadmin-tree",
    ACTIVATE_BUT: "Activate",
    DEACTIVATE_BUT: "Deactivate",

    disableMenu: function(grid){
        var menu = grid.contextMenu;

        if(!menu || (menu.mouseOverAdded == true)){
            return;
        }

        menu.mouseOverAdded = true;

        var actActivate = menu.find("text", this.ACTIVATE_BUT);
        var actDeactivate = menu.find("text", this.DEACTIVATE_BUT);

        if(actActivate.length == 0 || actDeactivate.length == 0){
            return;
        }

        var disable = this.disableFn(grid);

        //when the menu was first created on user selecting a folder, show event was already fired
        //so trick user by setting disabled class,
        //later on menu mouseover the Activate,Deactivate menu items are actually disabled
        if(disable === true){
            actActivate[0].addClass("x-item-disabled");
            actDeactivate[0].addClass("x-item-disabled");
        }

        var menuDisableFn = function(){
            var disable = this.disableFn(grid);

            CQ.Ext.each([actActivate[0], actDeactivate[0]], function(but){
                but.setDisabled(disable);

                if(disable === false){
                    but.removeClass("x-item-disabled");
                }else{
                    but.addClass("x-item-disabled");
                }
            });
        };

        menu.on('mouseover', menuDisableFn, this);
        menu.on('show', menuDisableFn, this);
    },

    disableFn: function(sGrid){
        var disable = false;

        CQ.Ext.each(sGrid.getSelectionModel().getSelections(), function(row){
            if(!disable && (row.data["type"] == "sling:OrderedFolder")){
                disable = true;
            }
        });

        return disable;
    },

    disableFolderActivateDeactivate: function(grid){
        var toolBar = grid.getTopToolbar();
        var actBut = toolBar.find("text", this.ACTIVATE_BUT);
        var deActBut = toolBar.find("text", this.DEACTIVATE_BUT);

        var tree = CQ.Ext.getCmp(this.SA_TREE);

        var toggleButtons = function(disable){
            actBut[0].setDisabled(disable);
            deActBut[0].setDisabled(disable);
        };

        grid.on('rowcontextmenu',function(grid, index, e){
            this.disableMenu(grid);
            toggleButtons(this.disableFn(grid));
        }, this);

        grid.on('rowclick',function(){
            toggleButtons(this.disableFn(grid));
        }, this);

        tree.on('selectionchange', function(t, nodePath){
            var node = t.getSelectionModel().getSelectedNode();
            toggleButtons(node.attributes["type"] == "sling:OrderedFolder");
        });
    }
};

(function(){
    if(window.location.pathname == "/siteadmin"){
        var INTERVAL = setInterval(function(){
            var s = MyClientLib.SiteAdmin;
            var grid = CQ.Ext.getCmp(s.SA_GRID);

            if(grid){
                clearInterval(INTERVAL);
                s.disableFolderActivateDeactivate(grid);
            }
        }, 250);
    }
})();