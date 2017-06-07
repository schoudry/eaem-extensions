$(document).on('cui-contentloaded.data-api', function (e) {
    var $tagsWidget = $('[data-metaType=tags]');
    var $selectList = $tagsWidget.find('.js-coral-Autocomplete-selectList');

    $selectList.html($selectList.find("li").sort(function(a, b) {
        a = $(a).text();
        b = $(b).text();

        //this piece was copied from underscore.js sortBy
        if (a > b || a === void 0){
            return 1;
        }else if (a < b || b === void 0){
            return -1;
        }

        return 1;
    }));
});
