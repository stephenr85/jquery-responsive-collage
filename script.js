(function($){

    $.fn.collage = function(opts){
        var o = $.extend({}, typeof opts === 'object' ? opts : {}, $.fn.collage.defaults);

        this.each(function(){
            var $wrap = $(this),
                showTimeout,
                methods = {
                    show:function(item){
                        clearInterval(showTimeout);

                        var $item = $(item),
                            $prev = $item.siblings('.showing').first(),
                            itemSelector = '.'+ o.itemClass;

                        $prev.addClass(o.hidingClass);
                        $item.addClass(o.showingClass);
                        $item.removeClass(o.hidingClass);
                        $prev.removeClass(o.showingClass);



                        console.log('Showing ' + ($item.prevAll(itemSelector).length+1) + ' of ' + ($item.siblings(itemSelector).length+1))

                    },
                    next:function(){
                        var $items = $wrap.children('.'+o.itemClass),
                            $next = $items.filter('.showing').next('.'+ o.itemClass);
                        methods.show($next.length ? $next : $items.first());
                    },
                    prev:function(){
                        methods.show($wrap.children('.'+o.itemClass).filter('~ .showing,:last').first());
                    }

                };

            methods.next();

            $wrap.on('transitioned webkitTransitionEnd', '.showing.'+o.itemClass, function(evt){

                if(evt.originalEvent.propertyName === 'color'){
                    console.log(this, evt);
                    showTimeout = setTimeout(function(){
                        methods.next();
                    }, o.showTime);
                }
            });

        });

        return this;
    };



    $.fn.collage.defaults = {
        itemClass:'collage-set',
        overlappingClasses:true,
        showingClass:'showing',
        hidingClass:'hiding',
        showTime:4000,
        watchProperty:'color'
    };

})(jQuery);


