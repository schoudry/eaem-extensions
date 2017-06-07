<%@ page import="com.day.cq.wcm.foundation.Image" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="org.apache.sling.commons.json.JSONException" %>
<%@ page import="com.day.cq.wcm.api.WCMMode" %>
<%@ page import="java.util.Iterator" %>
<%@include file="/libs/foundation/global.jsp"%>

<%!
    public static class SlideShowImage extends Image{
        private String titleText;
        private String descText;

        public String getDescText() {
            return descText;
        }

        public void setDescText(String descText) {
            this.descText = descText;
        }

        public String getTitleText() {
            return titleText;
        }

        public void setTitleText(String titleText) {
            this.titleText = titleText;
        }

        public SlideShowImage(Resource resource) {
            super(resource);
        }
    }

    public static List<SlideShowImage> getImages(Resource resource, String name) {
        List<SlideShowImage> images = new ArrayList<SlideShowImage>();
        Resource imagesResource = resource.getChild(name);

        if (imagesResource == null) {
            return images;
        }

        ValueMap map = imagesResource.adaptTo(ValueMap.class);
        String order = map.get("order", String.class);

        if (order == null) {
            return images;
        }

        JSONArray array; ValueMap vMap;

        try {
            array = new JSONArray(order);
        } catch (JSONException e) {
            array = new JSONArray();
        }

        for (int i = 0; i < array.length(); i++) {
            String imageResourceName;

            try {
                imageResourceName = array.getString(i);
            } catch (JSONException e) {
                imageResourceName = null;
            }

            if (imageResourceName != null) {
                Resource imageResource = imagesResource.getChild(imageResourceName);

                if (imageResource != null) {
                    Iterator childImagesItr = imageResource.listChildren();

                    while(childImagesItr.hasNext()){
                        Resource childImage = (Resource)childImagesItr.next();
                        SlideShowImage img = new SlideShowImage(childImage);
                        img.setItemName(Image.PN_REFERENCE, "imageReference");
                        img.setSelector("img");
                        img.setAlt(childImage.getName());

                        vMap = imageResource.adaptTo(ValueMap.class);
                        img.setTitleText(vMap.get("titleText", String.class));
                        img.setDescText(vMap.get("descText", String.class));

                        images.add(img);
                    }
                }
            }
        }

        return images;
    }

%>
<%
    pageContext.setAttribute("images", getImages(resource, "images"));
%>
<cq:includeClientLib categories="experience-aem.components"/>
<c:choose>
    <c:when test="${empty images}">
        <%
            if(WCMMode.fromRequest(request) != WCMMode.PREVIEW){
        %>
                <BR>Add images using component dialog<BR><BR>
        <%
            }
        %>
    </c:when>
    <c:otherwise>
        <div style="height: 530px; width: 700px;">
            <div class="experience-aem-simple-slideshow">
                <c:forEach var="image" varStatus="status" items="${images}">
                    <div class="show-pic ${status.first ? 'active' : ''}">
                        <img src="${image.src}" alt="${image.alt}" height="530px" width="700px"/>
                        <div class="overlayText">
                            <span class="overlayTitle">${image.titleText}</span>
                            <div class="overlayDesc">${image.descText}</div>
                        </div>
                    </div>
                </c:forEach>
            </div>
        </div>
    </c:otherwise>
</c:choose>