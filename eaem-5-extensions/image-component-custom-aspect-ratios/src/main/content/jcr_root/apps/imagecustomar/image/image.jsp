<%@include file="/libs/foundation/global.jsp" %>
<%@ page import="com.day.cq.wcm.foundation.Image,
                 java.io.PrintWriter" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Map" %>

<cq:includeClientLib js="mycomponent.imagear"/>

<%
    try {
        Resource res = null;

        if (currentNode.hasProperty("imageReference")) {
            res = resource;
        }

        if (res == null) {
%>
            Configure Image
<%
        } else {
            PropertyIterator itr = currentNode.getProperties();
            Property prop = null; String text = "";
            Map<String, String> aMap = new HashMap<String, String>();

            while(itr.hasNext()){
                prop = itr.nextProperty();

                if(prop.getName().endsWith("AspectRatio")){
                    text = prop.getName();

                    if(currentNode.hasProperty(prop.getName() + "Text")){
                        text = currentNode.getProperty(prop.getName() + "Text").getString();
                    }

                    aMap.put(prop.getName(), text);
                }
            }

            Image img = null; String src = null;

            if(aMap.isEmpty()){
%>
                Cropped Images with custom aspect ratios not available
<%
            }else{
                for(Map.Entry entry : aMap.entrySet()){
                    img = new Image(res);
                    img.setItemName(Image.PN_REFERENCE, "imageReference");
                    img.setSuffix(entry.getKey() + ".jpg");
                    img.setSelector("img");

                    src = img.getSrc();
%>
                    <br><br><b><%=entry.getValue()%></b><br><br>
                    <img src='<%=src%>'/>
<%
                }
            }
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>
