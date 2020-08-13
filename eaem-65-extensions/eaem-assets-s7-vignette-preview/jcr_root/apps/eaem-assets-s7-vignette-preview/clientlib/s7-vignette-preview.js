(function ($, $document) {
    var PREVIEW_IMG = "#eaem-assets-preview-colorization-img";

    $document.on("foundation-contentloaded", init);

    function init(){
        var $url =  $("[name='./url']");

        $url.change(changePreview);
    }

    function changePreview(){
        var url = this.value;

        if(_.isEmpty(url)){
            return;
        }

        $(PREVIEW_IMG).attr("src", url);
    }
}(jQuery, jQuery(document)));