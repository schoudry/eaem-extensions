(function ($, $document) {
    $document.on("foundation-contentloaded", () => {
        const registry = $(window).adaptTo("foundation-registry");

        registry.register("foundation.validation.validator", {
            selector: '[data-foundation-validation=urls.validation]',
            validate: validateURL
        });
    });

    const validateURL = (el) => {
        let errorMessage = '',
            url = el.value;
        try {
            if(!url.startsWith("/content")){
                new URL(url);
            }
        } catch (err) {
            errorMessage = 'URL must follow the format “https://www.example.com”';
        }
        return errorMessage;
    }
}(jQuery, jQuery(document)));