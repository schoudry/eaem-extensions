<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="com.adobe.granite.ui.components.Value" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%--include ootb multifield--%>
<sling:include resourceType="/libs/granite/ui/components/foundation/form/multifield"/>

<%!
    private final Logger mLog = LoggerFactory.getLogger(this.getClass());
%>

<%
    Config mCfg = cmp.getConfig();

    Resource mField = mCfg.getChild("field");

    if (mField == null) {
        mLog.warn("Field node doesn't exist");
        return;
    }

    ValueMap mVM = mField.adaptTo(ValueMap.class);

    String mName = mVM.get("name", "");

    if ("".equals(mName)) {
        mLog.warn("name property doesn't exist on field node");
        return;
    }

    Value mValue = ((ComponentHelper) cmp).getValue();

    //get the values added in multifield
    String[] mItems = mValue.get(mName, String[].class);
%>

<script>
    (function () {
        //function to add values into multifield widgets. The values are stored in CRX by collectDataFromFields() as json
        //eg. {"page":"English","path":"/content/geometrixx/en"}
        var addDataInFields = function () {
            var mValues = [ <%= StringUtils.join(mValue.get(mName, String[].class), ",") %> ],
                    mName = '<%=mName%>',
                    $fieldSets = $("[class='coral-Form-fieldset'][data-name='" + mName + "']");

            var record, $fields, $field, name;

            $fieldSets.each(function (i, fieldSet) {
                $fields = $(fieldSet).find("[name]");

                record = mValues[i];

                if (!record) {
                    return;
                }

                $fields.each(function (j, field) {
                    $field = $(field);

                    name = $field.attr("name");

                    if (!name) {
                        return;
                    }

                    //strip ./
                    if (name.indexOf("./") == 0) {
                        name = name.substring(2);
                    }

                    $field.val(record[name]);
                });
            });
        };

        //collect data from widgets in multifield and POST them to CRX as JSON
        var collectDataFromFields = function(){
            $(document).on("click", ".cq-dialog-submit", function () {
                var $form = $(this).closest("form.foundation-form"), mName = '<%=mName%>';

                //get all the input fields of multifield
                var $fieldSets = $("[class='coral-Form-fieldset'][data-name='" + mName + "']");

                var record, $fields, $field, name;

                $fieldSets.each(function (i, fieldSet) {
                    $fields = $(fieldSet).find("[name]");

                    record = {};

                    $fields.each(function (j, field) {
                        $field = $(field);

                        name = $field.attr("name");

                        if (!name) {
                            return;
                        }

                        //strip ./
                        if (name.indexOf("./") == 0) {
                            name = name.substring(2);
                        }

                        record[name] = $field.val();

                        //remove the field, so that individual values are not POSTed
                        $field.remove();
                    });

                    if ($.isEmptyObject(record)) {
                        return;
                    }

                    //add the record JSON in a hidden field as string
                    $('<input />').attr('type', 'hidden')
                            .attr('name', mName)
                            .attr('value', JSON.stringify(record))
                            .appendTo($form);
                });
            });
        };

        $(document).ready(function () {
            addDataInFields();
            collectDataFromFields();
        });
    })();
</script>
