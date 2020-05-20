<%@ include file="/libs/granite/ui/global.jsp" %>

<ui:includeClientLib categories="lodash" />

<%
    String defaultKeyword = "face";
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel">Search</label>
    <input is="coral-textfield" class="coral-Form-field" placeholder="<%= defaultKeyword %>"
           value="<%= defaultKeyword %>"
           onchange="window.EAEM_EMOJI.showEmojis(this.value)">
</div>

<div class="coral-Form-fieldwrapper" id="eaem-emojis">
</div>

<script>
    (function($){
        if(window.EAEM_EMOJI){
            return;
        }

        window.EAEM_EMOJI = {
            URL: "https://emoji-api.com/emojis?access_key=bcbd6980f7392ceda8914932404927e9b198486e&search=",

            showEmojis: function(keyword){
                $.ajax(this.URL + keyword).done(handler);

                function handler(data){
                    var $emojis = $("#eaem-emojis"), html = "";

                    _.each(data, function(emoji){
                        html = html + getEmojiHtml(emoji["character"]);
                    });

                    $emojis.html(html);
                }

                function getEmojiHtml(character){
                    return "<span style='cursor:pointer'>" + character + "</span>";
                }
            }
        };

        window.EAEM_EMOJI.showEmojis("<%=defaultKeyword%>");
    }(jQuery));
</script>