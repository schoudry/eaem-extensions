<%@include file="/libs/foundation/global.jsp" %>

<cq:defineObjects/>

<cq:includeClientLib categories="samples.fileupload"/>

<div class="header">
    <b>This is my header</b>
</div>

<div class="content">
    <b>This is my content area</b>

    <div class="content_area">
        <cq:include path="par" resourceType="foundation/components/parsys"/>
    </div>
</div>

<div class="footer">
    <b>This is my footer</b>
</div>

<div id="files" class="files"></div>

<span>Add files...</span>

<input id="fileupload" type="file" name="files[]" multiple>

<script>
    $(document).ready(function(){
        $('#fileupload').fileupload({
            url: "/content/dam/Product/Factories/CI/IBLU/SeasonOne/StyleOne/SampleOne.createasset.html?file=Desert.jpg",
            dataType: 'json',
            done: function (e, data) {
                $.each(data.result.files, function (index, file) {
                    $('<p/>').text(file.name).appendTo('#files');
                });
            }
        })
    })

</script>