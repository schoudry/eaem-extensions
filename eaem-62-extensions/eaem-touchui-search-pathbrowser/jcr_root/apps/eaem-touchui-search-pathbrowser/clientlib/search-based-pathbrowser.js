(function(){
    var EAEM_PREFIX = "eaem.granite.ui.search.pathBrowser",
        ROOT_PATH = "rootPath",
        QUERY_PARAMS = "queryparameters", // somehow queryParameters is read as queryparameters
        QUERY = "/bin/querybuilder.json?";

    //executed when user initiates search in pathbrowser by typing in a keyword
    function searchBasedAutocompleteCallback(){
        return{
            name: EAEM_PREFIX + '.autocompletecallback',
            handler: autoCompleteHandler
        };

        function autoCompleteHandler(searchTerm){
            var self = this, deferred = $.Deferred();

            if(_.isEmpty(searchTerm)){
                return;
            }

            var searchParams = getSearchParameters(self, searchTerm);

            self.optionLoader(searchParams, callback);

            function callback(results){
                if(_.isEmpty(results)){
                    deferred.resolve([]);
                    return;
                }

                self.options.options = results;
                deferred.resolve(_.range(results.length));
            }

            return deferred.promise();
        }

        function getSearchParameters(widget,searchTerm){
            var searchParams = {
                fulltext: searchTerm
            };

            var path  = widget.$element.data(ROOT_PATH), tokens,
                queryParams = widget.$element.data(QUERY_PARAMS);

            if(!_.isEmpty(path)){
                searchParams.path = path;
            }

            if(!_.isEmpty(queryParams)){
                queryParams = queryParams.split(" ");

                _.each(queryParams, function(param, index){
                    tokens = param.split("=");
                    searchParams[ (index + 1) + "_property" ] = tokens[0];
                    searchParams[ (index + 1) + "_property.value" ] = tokens[1];
                })
            }

            return searchParams;
        }
    }

    CUI.PathBrowser.register('autocompleteCallback', searchBasedAutocompleteCallback());

    //the option loader for requesting query results
    function searchBasedOptionLoader() {
        return {
            name: EAEM_PREFIX + ".optionLoader",
            handler: optionLoaderHandler
        };

        function optionLoaderHandler(searchParams, callback) {
            var query = QUERY;

            _.each(searchParams, function(value, key){
                query = query + key + "=" + value + "&";
            });

            query = query.substring(0, query.length - 1);

            console.log("EAEM - Search query - " + query);

            $.get(query).done(handler);

            function handler(data){
                var results = [];

                if(!_.isEmpty(data.hits)){
                    results = _.pluck(data.hits, "path");
                }

                if (callback){
                    callback(results);
                }
            }

            return false;
        }
    }

    CUI.PathBrowser.register('optionLoader', searchBasedOptionLoader());

    //option renderer for creating the option html
    function searchBasedOptionRenderer() {
        return {
            name: EAEM_PREFIX + ".optionRenderer",
            handler: optionRendererHandler
        };

        function optionRendererHandler(iterator, index) {
            var value = this.options.options[index];

            return $('<li class="coral-SelectList-item coral-SelectList-item--option" data-value="'
                + value + '">' + value + '</li>');
        }
    }

    CUI.PathBrowser.register('optionRenderer', searchBasedOptionRenderer());
}());