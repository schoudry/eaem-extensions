(function ($, $document) {
    const PAGE_PROPERTIES_URL = "/mnt/overlay/wcm/core/content/sites/properties.html",
        DATA_MF_NAME = "data-granite-coral-multifield-name",
        VANITY_URL_MF_NAME = "./sling:vanityPath",
        VANITYS_LIST_URL = "/libs/granite/dispatcher/content/vanityUrls.html";

    if (!isPagePropertiesPage()) {
        return;
    }

    $document.on("foundation-contentloaded", () => {
        const $multifield = $("[" + DATA_MF_NAME + "='" + VANITY_URL_MF_NAME + "']");

        const existingVanities = $multifield[0]._items.getAll().reduce((curr, next) => {
            let vanity = next.querySelector("[name]").value

            if (vanity && !vanity.startsWith("/")) {
                vanity = "/" + vanity;
            }

            return [...curr, vanity];
        }, []);

        let vanities = [];

        $.ajax({url: VANITYS_LIST_URL, async: false}).done((data) => {
            vanities = data.split("\n").reduce((curr, next) => existingVanities.includes(next) ? curr : [...curr, next], []);
        });

        const registry = $(window).adaptTo("foundation-registry");

        registry.register("foundation.validation.validator", {
            selector: "#" + $multifield.attr("id"),
            validate: () => validateMF($multifield[0], vanities)
        });
    });

    const validateMF = (multifield, siteVanities) => {
        const items = multifield._items;

        if (items.length === 0) {
            return "";
        }

        const duplicates = items.getAll().reduce((curr, next) => {
            let vanity = next.querySelector("[name]").value

            if (vanity && !vanity.startsWith("/")) {
                vanity = "/" + vanity;
            }

            return vanity && siteVanities.includes(vanity) ? [...curr, vanity] : curr;
        }, []);

        return (duplicates.length > 0 ? `Vanity urls ${duplicates.join(',')} exist in other pages` : "");
    }

    function isPagePropertiesPage() {
        return (window.location.pathname.indexOf(PAGE_PROPERTIES_URL) === 0);
    }
}(jQuery, jQuery(document)));