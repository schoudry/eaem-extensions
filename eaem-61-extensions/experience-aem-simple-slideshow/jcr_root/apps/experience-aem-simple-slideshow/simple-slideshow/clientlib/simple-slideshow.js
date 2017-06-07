/*
 Based on http://jonraasch.com/blog/a-simple-jquery-slideshow
*/

$(function() {
    var slideSwitch = function() {
        var shows = $('.experience-aem-simple-slideshow');

        if(!shows || (shows.length === 0) ){
            return;
        }

        $.each(shows, function(index, show){
            var showImagesActive = $(show).find('.active'), nextImage;

            if ( showImagesActive.length === 0 ){
                showImagesActive = $(show).find('.show-pic:last');
            }

            nextImage =  showImagesActive.next().length ? showImagesActive.next()
                                : $(show).find('.show-pic:first');

            showImagesActive.addClass('last-active');

            nextImage.css({ opacity: 0.0 } ).addClass('active')
                .animate({opacity: 1.0}, 1000, function() {
                    showImagesActive.removeClass('last-active');
                    showImagesActive.removeClass('active');
                });
        });
    };
    setInterval(slideSwitch, 3000);
});
