(function () {
    if (window.location.pathname !== "/tagging") {
        return;
    }

    registerShowRefsAlert();

    //the query to find tag references (pages and assets)
    //Exact match: SELECT * from [nt:base] AS t WHERE NAME(t) = 'jcr:content' AND CONTAINS(t.[cq:tags], 'experience-aem:english/us')
    var CHECK_TAGS_SQL_2_QUERY = "SELECT * from [nt:base] AS t WHERE NAME(t) = 'jcr:content' " +
                                    "AND CONTAINS(t.*, 'PLACEHOLDER')";

    function registerShowRefsAlert(){
        var tagAdmin = CQ.tagging.TagAdmin,
            deleteTagFn = tagAdmin.deleteTag;

        //override ootb function to inject the logic showing references alert
        tagAdmin.deleteTag = function(){
            var tagPath = tagAdmin.getSelectedTag();

            if (tagPath == null) {
                return;
            }

            tagPath = tagPath.substring( this.tagsBasePath.length + 1);

            var tagInfo = CQ.tagging.parseTag(tagPath, true),
                query = encodeURIComponent(CHECK_TAGS_SQL_2_QUERY.replace("PLACEHOLDER", tagInfo.getTagID()));

            //you may want to replace this crxde lite call with a servlet returning query results
            query = "/crx/de/query.jsp?type=JCR-SQL2&showResults=true&stmt=" + query;

            //"this" here is tagadmin object, passed as context
            $.ajax( { url: query, context: this } ).done(showAlert);
        };

        function showAlert(data){
            if(_.isEmpty(data) || _.isEmpty(data.results)){
                deleteTagFn.call(this);
                return;
            }

            var message = "Selected tag is referenced. Click 'yes' to proceed deleting, 'no' to cancel the operation.<br><br>";

            _.each(data.results, function(result){
                message = message + result.path + "<br>";
            });

            CQ.Ext.Msg.show({
                "title": "Delete Tag",
                "msg": message,
                "buttons": CQ.Ext.Msg.YESNO,
                "icon": CQ.Ext.MessageBox.QUESTION,
                "fn": function (btnId) {
                    if (btnId == "yes") {
                        this.postTagCommand("deleteTag", tagAdmin.getSelectedTag());
                    }
                },
                "scope": this
            });
        }
    }
}());