(function ($, $document) {
    const FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        SEARCH_TOOL_BAR_SEL = ".search-scrollable";

    let initialized = false, formAdapterOrignFn;

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        if(initialized){
            return;
        }

        initialized = true;

        $(SEARCH_TOOL_BAR_SEL).append( getSearchButton() );

        //pauseLiveFiltering();

        //resetFormSearchAdapter();
    });

    function pauseLiveFiltering(){
        const registry = $(window).adaptTo("foundation-registry"),
            adapters = registry.get("foundation.adapters");

        let formAdapter = _.reject(adapters, function(adapter){
            return ((adapter.type !== "foundation-form") || (adapter.selector !== "form.foundation-form"));
        });

        if(_.isEmpty(formAdapter)){
            return;
        }

        formAdapter = formAdapter[0];

        formAdapterOrignFn = formAdapter.adapter;

        formAdapter.adapter = function (el) {
            const formAdapterOrigObj = formAdapterOrignFn.call(el);

            return Object.assign(formAdapterOrigObj, {
                submitAsync: function() {
                    return { done : function() {} };
                }
            });
        }
    }

    function resetFormSearchAdapter(){
        const registry = $(window).adaptTo("foundation-registry"),
            adapters = registry.get("foundation.adapters");

        let formAdapter = _.reject(adapters, function(adapter){
            return ((adapter.type !== "foundation-form") || (adapter.selector !== "form.foundation-form"));
        });

        if(_.isEmpty(formAdapter)){
            return;
        }

        formAdapter = formAdapter[0];

        formAdapter.adapter = formAdapterOrignFn;

        console.log("override execute resetting");
    }

    function getSearchButton(){
        return '<div style="text-align: center; margin: 15px 0 10px 0"><button is="coral-button" icon="search" iconsize="S">Search</button></div>'
    }
})(jQuery, jQuery(document));