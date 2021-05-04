<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"
        import="com.adobe.granite.ui.components.AttrBuilder,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Tag" %>
<%
    Config cfg = cmp.getConfig();

    String CONFIG_RES = "/conf/global/settings/dam/eaem-dam-config";
    Resource configRes = resourceResolver.getResource(CONFIG_RES);

    String name = cfg.get("name", String.class);
    String value = "";

    if(configRes != null){
        value = configRes.getValueMap().get(name, String.class);
    }

    if(value == null){
        value = cfg.get("defaultValue", String.class);;
    }

    Tag tag = cmp.consumeTag();

    AttrBuilder attrs = tag.getAttrs();
    cmp.populateCommonAttrs(attrs);

    attrs.add("name", name);

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>
    <input is="coral-textfield" name="<%=name%>" value="<%=value%>" style="width: 100%;">
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" class="coral3-Tooltip" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
