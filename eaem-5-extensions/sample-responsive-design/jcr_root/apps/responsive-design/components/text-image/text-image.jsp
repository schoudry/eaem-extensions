<%@ page import="com.day.cq.commons.Doctype,
    com.day.cq.wcm.api.WCMMode,
    com.day.cq.wcm.api.components.DropTarget,
    com.day.cq.wcm.foundation.Image" %>
<%-- In real time copy global.jsp to your /apps project --%>
<%@include file="/libs/foundation/global.jsp"%>
<%
    Image image = new Image(resource, "image");

    if (image.hasContent() || WCMMode.fromRequest(request) == WCMMode.EDIT) {
        image.loadStyleData(currentStyle);
        if (!currentDesign.equals(resourceDesign)) {
            image.setSuffix(currentDesign.getId());
        }
        image.addCssClass(DropTarget.CSS_CLASS_PREFIX + "image");
        image.setSelector(".img");
        image.setDoctype(Doctype.fromRequest(request));
%>

<div>
    <% image.draw(out); %>
    <span>
            <cq:text property="text" tagClass="text"/>
    </span>
</div>
<%
    }
%>

