(function ($, $document) {
    const FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        SEARCH_TOOL_BAR_SEL = ".search-scrollable",
        NESTED_CHECKBOX_LIST_SEL = '.dam-nestedcheckboxlist-item';

    let initialized = false, liveFilteringHandler;

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        if(initialized){
            return;
        }

        initialized = true;

        $(SEARCH_TOOL_BAR_SEL).append( getSearchButton() );

        pauseLiveFiltering();

        //resetFormSearchAdapter();
    });

    function pauseLiveFiltering(){
        liveFilteringHandler = getChangeHandler();

        $document.off('change', NESTED_CHECKBOX_LIST_SEL);

        $document.on('change', NESTED_CHECKBOX_LIST_SEL, function( eve ) { });
    }

    function getChangeHandler(){
        const handlers = $._data(document, "events")["change"];

        return _.reject(handlers, function(handler){
            return (handler.selector != NESTED_CHECKBOX_LIST_SEL );
        })[0].handler;
    }

    function getSearchButton(){
        return '<div style="text-align: center; margin: 15px 0 10px 0"><button is="coral-button" icon="search" iconsize="S">Search</button></div>'
    }
})(jQuery, jQuery(document));