<%@ include file="/libs/granite/ui/global.jsp" %>

<ui:includeClientLib categories="lodash" />

<%
    String defaultKeyword = "face";
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel">Search</label>
    <input is="coral-textfield" class="coral-Form-field" placeholder="<%= defaultKeyword %>"
           id="eaem-emoji-input"
           value="<%= defaultKeyword %>">
</div>

<div class="coral-Form-fieldwrapper" id="eaem-emojis">
</div>

<script>
    (function($){
        var URL = "https://emoji-api.com/emojis?access_key=bcbd6980f7392ceda8914932404927e9b198486e&search=";

        function showEmojis(keyword) {
            $.ajax(URL + keyword).done(handler);

            function handler(data) {
                var $emojis = $("#eaem-emojis"), html = "";

                _.each(data, function (emoji) {
                    html = html + getEmojiHtml(emoji["character"]);
                });

                $emojis.html(html);
            }

            function getEmojiHtml(character) {
                return "<span style='cursor:pointer'>" + character + "</span>";
            }
        }

        function addListener(){
            $("form").on("submit", function(){
                showEmojis($("#eaem-emoji-input").val());
                return false;
            });
        }

        showEmojis("<%=defaultKeyword%>");

        addListener();
    }(jQuery));
</script>