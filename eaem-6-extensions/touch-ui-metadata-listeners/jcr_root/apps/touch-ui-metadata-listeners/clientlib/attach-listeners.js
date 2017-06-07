(function(document, $) {
    "use strict";

    var SCHEMA_EDITOR_PATH = "/apps/dam/content/schemaeditors";
    var QUERY_BUILDER = "/bin/querybuilder.json";
    var NODE_LISTENERS = "listeners";
    var SEARCH_TEXT_IN_LISTENERS = "function";

    function PredicateBuilder(defaults) {
        this.params = $.extend({}, defaults);
        this.numPredicates = 0;
    }

    PredicateBuilder.prototype = {
        fullText: function(value, relPath) {
            if (!value) {
                return this;
            }

            this.params[this.numPredicates + '_fulltext'] = value;

            if (relPath) {
                this.params[this.numPredicates + '_fulltext.relPath'] = relPath;
            }

            this.numPredicates++;

            return this;
        },

        prop: function(name, value) {
            if (name && value) {
                this.params[this.numPredicates + '_property'] = name;

                if($.isArray(value)) {
                    var that = this;

                    $.each(value, function(i, item) {
                        that.params[that.numPredicates + '_property.' + i + '_value'] = item;
                    });
                }else{
                    this.params[this.numPredicates + '_property.value'] = value;
                }

                this.numPredicates++;
            }

            return this;
        },

        http: function(){
            var builder = this;

            return $.ajax({
                method: 'GET',
                url: QUERY_BUILDER,
                data: builder.params
            });
        }
    };

    var attachListeners = function(hits){
        if(!$.isArray(hits)){
            return;
        }

        var $ele;

        $.each(hits, function(i, hit){
            $ele = $("[name='" + hit["name"] + "']");

            $.each(hit.listeners, function(key, value){
                if(key == "jcr:primaryType"){
                    return;
                }

                try{
                    $ele.on(key, eval("(" + value+ ")" ) );
                }catch(err){
                    console.log("Error attaching listener : " + key + " - " + value);
                }
            })
        });
    };

    $(document).on("foundation-contentloaded", function(e) {
        var $editables = $(".foundation-field-edit");

        if($editables.length == 0 ){
            return;
        }

        var builder = new PredicateBuilder({
            'path': SCHEMA_EDITOR_PATH,
            'p.hits': 'full',
            'p.nodedepth': 2,
            'p.limit': 100
        });

        var values = [];

        $editables.find("input").each(function(i, value){
            values.push($(value).attr("name"));
        });

        builder.prop("name", values).fullText(SEARCH_TEXT_IN_LISTENERS, NODE_LISTENERS)
                .http().done(function(resp) {
                    attachListeners(resp.hits);
                });
    });
})(document, Granite.$);
