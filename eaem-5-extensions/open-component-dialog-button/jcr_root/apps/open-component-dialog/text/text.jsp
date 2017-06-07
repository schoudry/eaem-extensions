<%@include file="/libs/foundation/global.jsp"%>

<br>

<cq:text property="text"/>

<br><br>

<input type=button onClick="openComponentPropertiesDialog('<%= currentNode.getPath() %>')" value="Open Component Dialog"/>

<br><br>

<script>
    function openComponentPropertiesDialog(path){
        var editRollOver = CQ.utils.WCM.getEditables()[path];
        CQ.wcm.EditBase.showDialog(editRollOver, CQ.wcm.EditBase.EDIT);
    }
</script>