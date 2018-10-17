(function ($, $document) {
    "use strict";

    var REVIEW_TASK_PAYLOAD_PAGE = "/mnt/overlay/cq/core/content/projects/showtasks/reviewtd/payload.html",
        DELETE_BUTTON = "/apps/eaem-touchui-delete-in-review-task/ui/delete-button.html",
        COMMAND_URL = Granite.HTTP.externalize("/bin/wcmcommand"),
        TD_ACTION_BAR = ".review-taskdetail-action-bar",
        $deleteButton = null;

    if(!isReviewTaskPayloadPage()){
        return;
    }

	$document.on("foundation-selections-change", addDelete);

    function addDelete(event){
        var $collection = $(event.target),
            selectApi = $collection.adaptTo("foundation-selections");

        if(!_.isEmpty($deleteButton)){
            ( (selectApi.count() == 0) ? $deleteButton.hide() : $deleteButton.show());
            return;
        }

        $.ajax(DELETE_BUTTON).done(function(html){
            var $titleBar = $(TD_ACTION_BAR).find("betty-titlebar-primary");

            $deleteButton = $(html).appendTo($titleBar).click(deleteAction);

            $deleteButton.hide();
        });
    }

    function deleteAction(){
        var $collection = $(".foundation-collection"),
            $items = $collection.find(".foundation-selections-item"),
            paths = [];

        $items.each(function(index, item) {
            paths.push($(item).data("foundation-collection-item-id"));
        });

        if(_.isEmpty(paths)){
            return;
        }

        var data = {
            _charset_: "UTF-8",
            cmd: "deletePage",
            path: paths,
            force: true
        };

        $.post(COMMAND_URL, data).done(function(){
            $(".foundation-content").adaptTo("foundation-content").refresh();

            showAlert("Selected assets deleted", "Delete");

            $deleteButton = null;
        });
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "warning", options, callback);
    }

    function isReviewTaskPayloadPage() {
        return (window.location.pathname.indexOf(REVIEW_TASK_PAYLOAD_PAGE) >= 0);
    }
})(jQuery, jQuery(document));
