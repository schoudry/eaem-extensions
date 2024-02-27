(function ($, $document) {
    const FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        SEARCH_TOOL_BAR_SEL = ".search-scrollable",
        FOUNDATION_FORM_SEL = 'form.foundation-form';

    let initialized = false, liveFilteringHandler;

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        if(initialized){
            return;
        }

        initialized = true;

        liveFilteringHandler = getSubmitHandler();

        setTimeout(pauseLiveFiltering, 2000);

        const $searchButton = $(getSearchButton()).appendTo(SEARCH_TOOL_BAR_SEL);

        $searchButton.click(doSearch);
    });

    function doSearch(){
        resumeLiveFiltering();

        $(FOUNDATION_FORM_SEL).submit();

        pauseLiveFiltering();
    }

    function resumeLiveFiltering(){
        $document.off('submit', FOUNDATION_FORM_SEL);
        $document.on('submit', FOUNDATION_FORM_SEL, liveFilteringHandler);
    }

    function pauseLiveFiltering(){
        $document.off('submit', FOUNDATION_FORM_SEL);
        $document.on('submit', FOUNDATION_FORM_SEL, function(e) { e.preventDefault() });
    }

    function getSubmitHandler(){
        const handlers = $._data(document, "events")["submit"];

        return _.reject(handlers, function(handler){
            return (handler.selector != FOUNDATION_FORM_SEL );
        })[0].handler;
    }

    function getSearchButton(){
        return '<div style="text-align: center; margin: 15px 0 10px 0"><button is="coral-button" icon="search" iconsize="S">' +
                'Search' +
            '</button></div>';
    }
})(jQuery, jQuery(document));