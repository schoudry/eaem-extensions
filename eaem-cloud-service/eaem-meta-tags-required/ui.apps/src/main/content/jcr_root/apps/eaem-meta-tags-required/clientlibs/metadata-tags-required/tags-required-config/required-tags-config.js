(function($, $document) {
    var TAG_FIELD_RES_TYPE = "cq/gui/components/coral/common/form/tagfield",
        RULES_PANEL = "#field-rules",
        REQUIRED_CASCADING = "/granite:data/requiredCascading",
        F_CONTENT_PATH = "foundation-content-path",
        REQUIRED_CHECKBOX_CSS = "eaem-dam-required";

    $document.on("foundation-contentloaded", init);

    function init(){
        $document.on("click", ".form-fields > li", function(e) {
            e.stopPropagation();
            e.preventDefault();

            addTagsRequiredConfig(this);
        });
    }

    function addTagsRequiredConfig(field){
        var $tagsCheck = $(field).find("[value='" + TAG_FIELD_RES_TYPE + "']"),
            $rulesPanel = $(RULES_PANEL);

        if(_.isEmpty($tagsCheck) || !_.isEmpty($rulesPanel.find("." + REQUIRED_CHECKBOX_CSS))){
            return;
        }

        var $tagsReadonlyConfig = $(field).find("coral-checkbox[name$='/readOnly']");

        if(_.isEmpty($tagsReadonlyConfig)){
            return;
        }

        var configName = $tagsReadonlyConfig.attr("name"),
            reqConfigName = configName.substring(0, configName.lastIndexOf("/")) + REQUIRED_CASCADING,
            nodeName = configName.substring(0, configName.lastIndexOf("/"));

        $tagsReadonlyConfig = $rulesPanel.find("coral-checkbox[name='" + configName + "']");

        nodeName = nodeName.substring(nodeName.lastIndexOf("/") + 1);

        $(getRequiredCheckbox(reqConfigName, isRequiredSet(nodeName))).insertAfter($tagsReadonlyConfig);
    }

    function isRequiredSet(nodeName){
        var schemaPath = $("." + F_CONTENT_PATH).data(F_CONTENT_PATH),
            isRequired = false;

        if(!schemaPath){
            return isRequired;
        }

        schemaPath = "/bin/querybuilder.json?p.hits=full&p.nodedepth=2&path=" + schemaPath + "&nodename=" + nodeName;

        $.ajax({url : schemaPath, async: false}).done(function(data){
            if(!data || _.isEmpty(data.hits)){
                return;
            }

            isRequired = (data.hits[0]["granite:data"]["requiredCascading"] == "always");
        });

        return isRequired;
    }

    function getRequiredCheckbox(configName, checked){
        return  '<coral-checkbox class="coral-Form-field ' + REQUIRED_CHECKBOX_CSS + '" name="'
                    + configName + '" ' + (checked ? 'checked' : ' ') + ' value="always">Required</coral-checkbox>'
                + '<input type="hidden" name="' + configName + '@Delete" value="true">';
    }
}(jQuery, jQuery(document)));