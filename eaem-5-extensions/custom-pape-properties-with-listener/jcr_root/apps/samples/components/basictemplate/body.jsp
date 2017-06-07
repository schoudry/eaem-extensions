<%@include file="/libs/foundation/global.jsp" %>

<cq:defineObjects/>

<%
    //properties is an implicit object defined in cq taglib and made available
    //with tag declaration <cq:defineObjects/>
    String myTitle = String.valueOf(properties.get("title"));
    pageContext.setAttribute("myTitle", myTitle);
%>
<br><br>
<b><i>${myTitle}</i></b> message was added in SideKick -> Page tab -> Custom Page Properties

<script type="text/javascript">
    var myTitleFn = function(dialog){
        alert("Please enter your welcome message in '" + dialog.title + "'");
    }
</script>
