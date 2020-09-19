(function ($) {
    $(document).ready(function() {
        const eaemCarousel = $('.eaem-carousel-slick');
        function isEmpty(el) {
            return !$.trim(el.html());
        }
    
        eaemCarousel.each(function(i) {
            $(this).attr('id', 'eaem-slick-id-' + i);
            const eaemCarouselId = $(this).attr('id');
    
            $('#' + eaemCarouselId).slick();
        });
    });
})(jQuery);
