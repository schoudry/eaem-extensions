(function(document) {

    document.addEventListener("DOMContentLoaded", function(event) {
        const imsSubmitButton = document.getElementById("eaem-ims-submit-button");

        if (!imsSubmitButton) {
            return;
        }

        document.body.classList.add("coral--dark");

        imsSubmitButton.addEventListener("click", function() {
            document.location.replace(this.dataset.imsUrl);
        });
    })
})(document);