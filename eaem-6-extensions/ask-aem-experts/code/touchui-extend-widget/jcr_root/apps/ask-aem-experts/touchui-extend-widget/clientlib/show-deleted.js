(function () {
    var CONFIRM_DELETE_TAG_LIST = new Class({
        extend: CUI.TagList,

        removeItem: function (item) {
            this.superClass.removeItem.call(this, item);

            var fui = $(window).adaptTo("foundation-ui");

            fui.alert("Delete", "Deleted - " + item, "notice");
        }
    });

    CUI.Widget.registry.register("taglist", CONFIRM_DELETE_TAG_LIST);
}());