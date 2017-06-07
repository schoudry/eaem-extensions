(function(document, $, page) {
    document.on("ready", function() {
        var trigger = $('#pageinfo-trigger');

        trigger.on('click', function(){
            var INTERVAL = setInterval(function(){
                var classicUI = $(".pageinfo-pageactions .classicui-switcher");

                if(classicUI && classicUI.length > 0){
                    clearInterval(INTERVAL);

                    var createChildPage = "<li class='coral-List-item experience-aem-create-child-page'>" +
                        "<i class='coral-Icon coral-Icon--add coral-Icon--sizeS' title='Create Child Page'></i>" +
                        "Create Child Page</li>";

                    $("ul.pageinfo-pageactions").append(createChildPage);

                    document.fipo('tap', 'click', ".experience-aem-create-child-page", function () {
                        window.location = Granite.HTTP.externalize("/libs/wcm/core/content/sites/createpagewizard.html" + page.path);
                    });
                }
            });
        });

    });
})(jQuery(document), Granite.$, Granite.author.page);