<%@page session="false"
        import="com.adobe.granite.ui.components.ComponentHelper,
                com.adobe.granite.ui.components.Config,
                org.apache.sling.api.resource.Resource,
                org.apache.sling.api.resource.ValueMap,
                com.adobe.granite.ui.components.rendercondition.RenderCondition,
                com.adobe.granite.ui.components.rendercondition.SimpleRenderCondition,
                javax.jcr.Node,
                com.day.cq.dam.commons.util.UIHelper,
                com.day.cq.dam.api.DamConstants" %>
<%@ page import="javax.jcr.Session" %>
<%@ page import="javax.jcr.query.QueryManager" %>
<%@ page import="javax.jcr.query.Query" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="javax.jcr.NodeIterator" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.2" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>

<sling:defineObjects/>
<cq:defineObjects/>

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

    Iterator<Resource> itr = contentRes.listChildren();
    StringBuilder strBuilder = new StringBuilder();

    strBuilder.append("//element(*, nt:unstructured)[");

    while(itr.hasNext()){
        strBuilder.append("@sling:resource = '").append(itr.next().getPath()).append("' or");
    }

    String queryStmt = strBuilder.toString();

    queryStmt = queryStmt.substring(0, queryStmt.lastIndexOf("or")) + "]";

    Session session = resourceResolver.adaptTo(Session.class);
    QueryManager qm = session.getWorkspace().getQueryManager();

    Query query = qm.createQuery(queryStmt, Query.XPATH);

    NodeIterator results = query.execute().getNodes();

    boolean showMove = results.hasNext();

    if(showMove){
%>
        <sling:include path="/libs/dam/gui/coral/components/commons/renderconditions/mainasset"/>
<%
    }else{
        request.setAttribute(RenderCondition.class.getName(), new SimpleRenderCondition(false));
    }
%>