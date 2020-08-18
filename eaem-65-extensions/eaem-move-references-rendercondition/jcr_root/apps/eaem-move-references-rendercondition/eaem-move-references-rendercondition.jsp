<%@page session="false"
        import="com.adobe.granite.ui.components.ComponentHelper,
                com.adobe.granite.ui.components.Config,
                org.apache.sling.api.resource.Resource,
                org.apache.sling.api.resource.ValueMap,
                com.adobe.granite.ui.components.rendercondition.RenderCondition,
                com.adobe.granite.ui.components.rendercondition.SimpleRenderCondition,
                javax.jcr.Node,
                com.day.cq.dam.commons.util.UIHelper,
                com.day.cq.dam.api.DamConstants"%>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.2" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>

<sling:defineObjects />
<cq:defineObjects />

<%

ComponentHelper cmp = new ComponentHelper(pageContext);
Config cfg = cmp.getConfig();
String path = cmp.getExpressionHelper().getString(cfg.get("path", String.class));
Resource contentRes = null;

if (path != null) {
    contentRes = slingRequest.getResourceResolver().getResource(path);
} else {
    contentRes = UIHelper.getCurrentSuffixResource(slingRequest);
}

if (contentRes == null) {
    return;
}

%>