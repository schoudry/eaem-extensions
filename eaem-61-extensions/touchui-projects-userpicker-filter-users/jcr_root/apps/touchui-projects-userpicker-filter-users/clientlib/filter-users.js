(function($, $document) {
    "use strict";

    //set in /libs/cq/core/content/projects/properties/jcr:content/body/content/content/items/properties/items/right/items/memberpicker/items/userpicker
    var PROJECTS_USER_PICKER = "#collection-settings-userpicker";

    $document.on('cui-contentloaded.data-api', function () {
        var P_INTERVAL = setInterval(function(){
            var cuiPicker = $(PROJECTS_USER_PICKER).data("autocomplete");

            if(cuiPicker){
                clearInterval(P_INTERVAL);
                addFilter(cuiPicker);
            }
        }, 250);
    });

    function addFilter(cuiPicker){
        var type = cuiPicker._selectListWidget.get('type');

        if(type !== "dynamic"){
            return;
        }

        var options = cuiPicker._selectListWidget.options;

        options.loadData = extendLoadDataFn(cuiPicker._selectListWidget);
    }

    function extendLoadDataFn(selWidget){
        var loadDataFn = selWidget.options.loadData;

        return function (start, end) {
            var promise = loadDataFn.call(this, start, end);

            promise.done(filter);

            return promise;
        };

        //filter out non geometrixx users
        function filter(){
            selWidget.filter(function (value) {
                return value && (value.indexOf("geometrixx") > 0);
            });
        }
    }
})(jQuery, jQuery(document));