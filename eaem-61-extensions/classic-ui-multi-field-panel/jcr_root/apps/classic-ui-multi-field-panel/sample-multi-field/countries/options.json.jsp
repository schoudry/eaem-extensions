<%@ page contentType="application/json" %>
<%@ page import="java.util.Map" %>
<%@ page import="com.day.cq.commons.TidyJSONWriter" %>
<%@ page import="java.util.LinkedHashMap" %>

<%
    Map<String, String> options = new LinkedHashMap<String, String>();

    options.put("INDIA", "India");
    options.put("USA", "United States");
    options.put("CHINA", "China");

    TidyJSONWriter w = new TidyJSONWriter(out);

    w.setTidy(true);
    w.array();

    for (Map.Entry<String, String> e: options.entrySet()) {
        w.object();

        w.key("value").value(e.getKey());
        w.key("text").value(e.getValue());

        w.endObject();
    }

    w.endArray();
%>