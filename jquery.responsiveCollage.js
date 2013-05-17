(function($){


    var Collage = function(el, options){
        this.element = $(el);
        this.options = $.extend({}, this.options, options);
    };

    Collage.prototype = {

        options:{
            play:true,
            repeat:true,
            loop:true,
            itemClass:'collage-item',
            overlappingClasses:true,
            showingClass:'showing',
            hidingClass:'hiding',
            showTime:4000,
            watchProperty:'color',
            generateItemButtons:true
        },
        option:function(key, value){
            if(arguments.length === 1 && typeof key === 'string'){
                return this.options[key];
            }else if(arguments.length > 1){
                this.options[key] = value;
                return this;
            }
        },

        init:function(){
            var I = this,
                o = this.options;



            if(this.options.generateItemButtons){
                var genItemBtnFn = typeof o.generateItemButtons === 'function' ? o.generateItemButtons : function(item, i){
                        return '<a class="collage-item-btn generated"><span>'+(i+1)+'</span></a>';
                    },
                    btns = $.map(this.element.children('.'+o.itemClass), $.proxy(genItemBtnFn, I)),
                    $btnWrap;
                if((o.generateItemButtons instanceof $) || (typeof o.generateItemButtons === 'string')){
                    $btnWrap = $(o.generateItemButtons);
                }
                if(!$btnWrap || !$btnWrap.length){
                    $btnWrap = $('<div class="collage-item-btns"/>').appendTo(this.element);
                }
                $btnWrap.append(btns.join(''));

                this.btns = $btnWrap;

                this.btns.on('click', '.collage-item-btn', function(evt){
                    evt.preventDefault();
                    var index = $(this).prevAll('.collage-item-btn').length;
                    I.show(index);
                });
            }

            this.element.on('transitioned webkitTransitionEnd', '.showing.'+o.itemClass, function(evt){
                if(evt.originalEvent.propertyName === 'color'){
                    I.showTimeout = setTimeout(function(){
                        if(I.options.play){
                            I.next();
                        }
                    }, o.showTime);
                }
            });



            this.next();
        },

        show:function(item){
            clearInterval(this.showTimeout);

            var o = this.options,
                $item = typeof item === 'number' ? this.element.children('.'+o.itemClass).eq(item) : $(item),
                $prev = $item.siblings('.showing').first(),
                itemSelector = '.'+ o.itemClass,
                index = $item.prevAll(itemSelector).length,
                prevIndex = $prev.prevAll(itemSelector).length;

            this.element.attr('class', (this.element.attr('class')||'').replace(/\s*(showing|hiding)-\d+/, ''));
            this.element.addClass('showing-'+(index+1));
            this.element.addClass('hiding-'+(prevIndex+1));

            $prev.addClass(o.hidingClass);
            $item.addClass(o.showingClass);
            $item.removeClass(o.hidingClass);
            $prev.removeClass(o.showingClass);

            if(this.btns){
                var $btns = this.btns.children('a'),
                    $btn = $btns.eq(index);

                $btns.removeClass(o.showingClass);
                $btn.addClass(o.showingClass).remove(o.hidingClass);
            }


        },

        next:function(){
            var $items = this.items(),
                $next = $items.filter('.showing').next('.'+ this.options.itemClass);
            if(!$next.length && this.options.repeat){
                $next = $items.first();
            }
            if($next.length){
                this.show($next);
            }
        },

        prev:function(){
            var $items = this.items(),
                $prev = $items.filter('.showing').prev('.'+ this.options.itemClass);
            if(!$prev.length && this.options.loop){
                $prev = $items.last();
            }
            if($prev.length){
                this.show($prev);
            }
        },

        pause:function(){
            this.options.play = false;
            clearTimeout(I.showTimeout);
        },

        play:function(){
            this.options.play = true;
            if(!I.showTimeout){
                //Recall show on the current item
                this.show(this.items().filter('.showing'));
            }
        },

        items:function(){
            return this.element.children('.'+this.options.itemClass);
        }

    };

    $.fn.responsiveCollage = function(opts){
        var result = this;
        this.each(function(){
            var $el = $(this),
                o = typeof opts === 'object' ? opts : null,
                collage = $el.data('responsiveCollage');
            if(!collage){
                collage = new Collage(this, o);
                collage.init();
                $el.data('responsiveCollage', collage);
            }
            if(typeof opts === 'string' && typeof nav[opts] === 'function'){
                result = nav[opts].apply(nav, [].slice.call(arguments, 1));
            }
        });
        return result;
    };

    $.fn.responsiveCollage.defaults = Collage.prototype.options;


})(jQuery);


