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
            path: properties.path,
            name: properties.product,
            text: properties.text
        };

        log.info("----" + product.text);
 
        company.products.push(product);
  
        addProduct(products, (currIndex + 1));
    }
 
    return prodPromise.promise;
} );