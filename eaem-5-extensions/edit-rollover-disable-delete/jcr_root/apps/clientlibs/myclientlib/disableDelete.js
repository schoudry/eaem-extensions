CQ.Ext.ns("MyClientLib");

MyClientLib.EditRollover = CQ.Ext.extend(CQ.wcm.EditRollover, {
    handleContextMenu: function(e){
        MyClientLib.EditRollover.superclass.handleContextMenu.call(this, e);

        var component = this.element.linkedEditComponent;

        if (!component || !component.menuComponent) {
            return;
        }

        var menu = component.menuComponent;
        var dTargeting = menu.find('text', "Disable targeting");

        //if Disable targeting menu option doesn't exist, donot disable Delete
        if(!dTargeting || dTargeting.length == 0){
            return;
        }

        var del = menu.find('text', "Delete");

        if(del && del.length > 0){
            del[0].setDisabled(true);
        }
    }
});

CQ.Ext.reg("editrollover", MyClientLib.EditRollover);