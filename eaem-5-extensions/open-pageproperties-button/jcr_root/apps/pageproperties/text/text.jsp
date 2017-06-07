<%@include file="/libs/foundation/global.jsp"%>

<cq:text property="text"/>

<br>

<input type=button onClick="openPagePropertiesDialog()" value="Open Page Properties"/>

<br>

<script>
    function openPagePropertiesDialog(){
        var sk = CQ.WCM.getSidekick();

        if(!sk){
            alert("Sidekick not available, is the sidekick fully loaded on page?");
            return;
        }

        var pageTab = sk.findById("cq-sk-tab-PAGE");

        var openDialog = function(){
            var pagePropsButton = pageTab.findBy(function(comp){
                return comp["text"] == "Page Properties...";
            }, pageTab);

            pagePropsButton[0].handler.call(sk);
        };

        if(!pageTab){
            var toggle = sk.tools["toggle"];
            toggle.dom.click();

            var SK_INTERVAL = setInterval(function(){
                pageTab = sk.findById("cq-sk-tab-PAGE");

                if(pageTab){
                    clearInterval(SK_INTERVAL);
                    openDialog();
                }
            }, 250);
        }else{
            openDialog();
        }
    }
</script>

