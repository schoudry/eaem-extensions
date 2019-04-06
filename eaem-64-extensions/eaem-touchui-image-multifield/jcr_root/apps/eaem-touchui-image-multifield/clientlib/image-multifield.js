(function ($, $document) {
    var registry = $(window).adaptTo("foundation-registry"),
        adapters = registry.get("foundation.adapters");

    var fuAdapter = _.reject(adapters, function(adapter){
        return ((adapter.type !== "foundation-field") || (adapter.selector !== "coral-fileupload.cq-FileUpload"));
    });

    if(_.isEmpty(fuAdapter)){
        return;
    }

    fuAdapter = fuAdapter[0];

    var orignFn = fuAdapter.adapter;

    fuAdapter.adapter = function(el) {
        return Object.assign(orignFn.call(el), {
            getName: function () {
                return el.name;
            },
            setName: function(name) {
                var prefix = name.substr(0, name.lastIndexOf(el.name));

                el.name = name;

                $("input[type='hidden'][data-cq-fileupload-parameter]", el).each(function(i, el) {
                    if ($(el).data("data-cq-fileupload-parameter") !== "filemovefrom") {
                        this.setAttribute("name", prefix + this.getAttribute("name"));
                    }
                });
            }
        });
    };
}(jQuery, jQuery(document)));