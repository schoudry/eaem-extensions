<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"
        import="org.apache.commons.lang3.StringUtils,
                  com.adobe.granite.ui.components.AttrBuilder,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Field,
                  com.adobe.granite.ui.components.Tag" %>
<%
    Config cfg = cmp.getConfig();

    ValueMap vm = slingRequest.getResource().getValueMap();

    String name = cfg.get("name", String.class);

    Tag tag = cmp.consumeTag();

    AttrBuilder attrs = tag.getAttrs();
    cmp.populateCommonAttrs(attrs);

    attrs.add("name", name);
    attrs.add("value", vm.get("value", String.class));

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>
    <coral-icon icon="chevronDoubleLeft" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronLeft" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronRight" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronDoubleRight" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronUp" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronDown" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon icon="chevronUpDown" size="Xl" style="padding: 25px"></coral-icon>
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" class="coral3-Tooltip" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
