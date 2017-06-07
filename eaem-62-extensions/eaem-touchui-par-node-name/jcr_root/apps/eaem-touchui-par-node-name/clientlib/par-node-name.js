(function(){
    var PREFIX = "eaem_",
        PostRequest = Granite.author.persistence.PostRequest,
        prepareCreateParagraph = PostRequest.prototype.prepareCreateParagraph;

    PostRequest.prototype.prepareCreateParagraph = function(config){
        config.nameHint = getNameHint(config.resourceType);

        return prepareCreateParagraph.call(this, config);
    };

    function getNameHint(resType){
        return (PREFIX + resType.substring(resType.lastIndexOf('/') + 1));

        //var nameHint = PREFIX + resType.substring(resType.lastIndexOf('/') + 1);
        //return _.camelCase(nameHint); AEM includes lodash 2.4.1, camelCase is available in 3.0.0
    }
}());