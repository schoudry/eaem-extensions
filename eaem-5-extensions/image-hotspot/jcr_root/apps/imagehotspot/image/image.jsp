<%@include file="/libs/foundation/global.jsp" %>
<%@ page import="com.day.cq.wcm.foundation.Image,
                 java.io.PrintWriter" %>
<%@ page import="com.day.cq.wcm.foundation.ImageMap" %>

<%
    try {
        Resource res = null;

        if (currentNode.hasProperty("fileReference")) {
            res = resource;
        }

        if (res == null) {
%>
            Configure Image
<%
        } else {
            Image img = new Image(res);
            img.setItemName(Image.PN_REFERENCE, "fileReference");
            img.setSelector("img");

            String mapDefinition = properties.get(Image.PN_IMAGE_MAP, "");
            ImageMap imageMap = ImageMap.fromString(mapDefinition);

            String map = imageMap.draw("someid");
            String src = img.getSrc();

%>
        <div id="textOnImage">
            <img src='<%=src%>'/>
        </div>

        <script>
            $(function(){
                var circles = TextSpots.getCircles('<%=map%>');
                TextSpots.addHotSpots("textOnImage", circles);
            });
        </script>

<%
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>

