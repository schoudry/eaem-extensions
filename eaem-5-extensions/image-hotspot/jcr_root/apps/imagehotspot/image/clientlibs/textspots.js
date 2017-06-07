var TextSpots = {
    Spot: function(coords, title){
        coords = coords.split(",");

        //only circles are supported
        if(!coords || coords.length !== 3){
            return;
        }

        this.left = parseInt(coords[0]) + parseInt(coords[2]);
        this.top = parseInt(coords[1]) + parseInt(coords[2]);
        this.title = title;
    },

    getCircles: function(html){
        var obj = $.parseHTML(html);
        var spots = [];

        if(!obj || (obj.length == 0)){
            return;
        }

        $.each(obj[0].childNodes, $.proxy(function(i, v){
            spots.push(new this.Spot(v.coords, v.title));
        }, this));

        return spots;
    },

    addHotSpots: function(id, circles){
        var imageDiv = $("#" + id);
        var pos = imageDiv.position();

        $.each(circles, function(i, c){
            imageDiv.append($("<div>" + c.title + "</div>").addClass("spotText").css("top", ( c.top + pos.top ) + "px").css("left", ( c.left + pos.left ) + "px"));
        });
    }
};
