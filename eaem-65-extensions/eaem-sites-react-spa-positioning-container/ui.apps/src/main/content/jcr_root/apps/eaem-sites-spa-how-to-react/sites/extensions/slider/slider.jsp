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
    attrs.add("min", cfg.get("min", Double.class));
    attrs.add("max", cfg.get("max", Double.class));
    attrs.add("step", cfg.get("step", String.class));

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>
    <coral-slider style="width:100%; margin: 0" <%= attrs.build() %>></coral-slider>
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" class="coral3-Tooltip" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
<div style="text-align: right; width: 100%; margin: 0 0 15px 0">
    <span style="width: 50px; margin-right: 10px">50%</span>
</div>