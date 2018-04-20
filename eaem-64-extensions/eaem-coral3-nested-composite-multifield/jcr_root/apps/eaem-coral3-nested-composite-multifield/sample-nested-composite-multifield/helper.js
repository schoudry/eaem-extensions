"use strict";

use( ["/libs/wcm/foundation/components/utils/ResourceUtils.js","/libs/sightly/js/3rd-party/q.js" ], function(ResourceUtils, Q){
    var prodPromise = Q.defer(), company = {},
        productsPath = granite.resource.path + "/products";

    company.products = undefined;

    ResourceUtils.getResource(productsPath)
            .then(function (prodParent) {
                return prodParent.getChildren();
            })
            .then(function(products) {
                addProduct(products, 0);
            });

    function addProduct(products, currIndex){
        if(!company.products){
            company.products = [];
        }

        if (currIndex >= products.length) {
            prodPromise.resolve(company);
            return;
        }

        var productRes = products[currIndex],
            properties = productRes.properties;

        var product = {
            path: productRes.path,
            name: properties["product"]
        };

        ResourceUtils.getResource(productRes.path + "/components")
            .then(function (compParent) {
                return compParent.getChildren();
            })
            .then(function(components) {
                addComponent(product, components, 0);
            });

        company.products.push(product);

        addProduct(products, (currIndex + 1));
    }

    function addComponent(product, components, currIndex){
        if(!product.components){
            product.components = [];
        }

        if (currIndex >= components.length) {
            return;
        }

        var compRes = components[currIndex],
            properties = compRes.properties;

        var component = {
            path: compRes.path,
            name: properties.component,
            compPath: properties.compPath,
            size: properties.size
        };

        product.components.push(component);

        addComponent(product, components, (currIndex + 1));
    }

    return prodPromise.promise;
} );