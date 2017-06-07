(function ($, $document) {
    // cq-damadmin-admin-actions-share-activator
    // defined here /libs/dam/gui/content/commons/sidepanels/search/items/searchpanel/result/header/items/selection/items/editasset
    var SHARE_ACTIVATOR = "cq-damadmin-admin-actions-share-activator",
        BUTTON_HTML_URL = "/apps/eaem-assets-action-bar-start-workflow/button/model.html",
        added = false;

    $document.on("foundation-mode-change", function(e, mode){
        if(added || (mode !== "selection") ){
            return;
        }

        added = true;

        $.ajax(BUTTON_HTML_URL).done(addButton);
    });

    function addButton(html){
        var $eActivator = $("." + SHARE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $startWorkflow = $(html).css("margin-left", "20px").insertBefore( $eActivator );

		//$startWorkflow.adaptTo('foundation-field');
		
        CUI.Select.init($startWorkflow, $document);

        var cuiSelect = $startWorkflow.data("select");

        cuiSelect.on('coral-select:change', handleSelect);
    }

    function handleSelect(){
        var selection = this._getSelection();

        if(_.isEmpty(selection)){
            return;
        }

        var wSelect = this, model = selection.value,
            wTitle = $(selection).html(),
            paths = [], $items = $(".foundation-collection").find(".foundation-selections-item");

        $items.each(function(index, item) {
            paths.push($(item).data("foundation-collection-item-id"));
        });

        function startWorkflow(){
            var data = [{name: "_charset_", value: "utf-8"},
                {name: ":status", value: "browser"},
                {name: "payloadType", value: "JCR_PATH"},
                {name: "model", value: model}];

            _.each(paths, function(path){
                data.push( { name: "payload", value: path} )
            });

            $.ajax( { url: "/etc/workflow/instances" , type: "post", data: data}).done(function(){
                showMessage("Success", "Workflow initiated");
                wSelect.clear();
            })
        }

        showConfirmation("Workflow", "Run workflow '" + wTitle + "' on selected items?", startWorkflow);
    }

    function showMessage(title, message){
        $(window).adaptTo('foundation-ui').prompt(title, message, "notice", [{
            primary: true,
            text: Granite.I18n.get('OK')
        }]);
    }

    function showConfirmation(title, message, handler){
        var cancel = {
            text: Granite.I18n.get('Cancel')
        };

        var ok = {
            text: Granite.I18n.get('OK'),
            primary: true,
            handler: handler
        };

        $(window).adaptTo('foundation-ui').prompt(title, message, 'warning', [cancel, ok ]);
    }
})(jQuery, jQuery(document));