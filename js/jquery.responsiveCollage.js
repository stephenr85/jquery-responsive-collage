(function($){
	var testStyle = document.createElement('div').style;
	$.support.cssTransitions = (('transition' in testStyle) || ('MozTransition' in testStyle) || ('WebkitTransition' in testStyle) || ('OTransition' in testStyle)) && (document.documentMode === undefined || document.documentMode > 8);

	/**
	* @class Collage
	* @constructor
	* @param {String|DomNode|jQuery} el Anything you can pass into jQuery.
	* @param {Object} options 
	*/

    var Collage = function(el, options){
        this.element = $(el);
        this.options = $.extend({}, this.options, options);
    };

    Collage.prototype = {

        options:{
            play:true,
            repeat:true,
            loop:true,
			isLegacy: !$.support.cssTransitions,
			legacy:function($next, $prev, index, prevIndex){
				var I = this;
				clearTimeout(I.showTimeout);
				$next.stop().animate({
					opacity:1
				}, function(){
					I.showTimeout = setTimeout(function(){
						if(I.option('play')) 
							I.next();
					}, I.option('showTime'));
				});
				$prev.stop().animate({
					opacity:0
				});
			},
            itemSelector:'ul:first > li',
            overlappingClasses:true,
            showingClass:'showing',
            hidingClass:'hiding',
            showTime:6000,
            watchProperty:'color',
            generateItemButtons:true,
			itemButtonsContainer: null,
            nextButton:false,
            prevButton:false,
            pauseButton:false,
            playButton:false,
			isTouch: !!('ontouchstart' in window || navigator.msMaxTouchPoints)
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
                    btns = $.map(this.items(), $.proxy(genItemBtnFn, I)),
                    $btnWrap = $(o.itemButtonsContainer);
             
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

            if(this.options.playButton){
                var $playBtn = $(this.options.playButton);
                $playBtn.on('click', function(evt){
                    evt.preventDefault();
                    I.play();
                });
            }

            if(this.options.pauseButton){
                var $pauseButton = $(this.options.pauseButton);
                $pauseButton.on('click', function(evt){
                    evt.preventDefault();
                    I.pause();
                });
            }

            if(this.options.prevButton){
                var $prevButton = $(this.options.prevButton);
                $prevButton.on('click', function(evt){
                    evt.preventDefault();
                    I.prev();
                });
            }

            if(this.options.nextButton){
                var $nextButton = $(this.options.nextButton);
                $nextButton.on('click', function(evt){
                    evt.preventDefault();
                    I.next();
                });
            }

			//Add some touch stuff			
			var diff = function(one, two){
					return Math.max(one,two) - Math.min(one,two);
				},
				getTouchPos = function(evt){
					if(o.isTouch){
						return {
							x: evt.originalEvent.touches[0].pageX,
							y: evt.originalEvent.touches[0].pageY
						};
					}else{
						return {
							x: evt.pageX,
							y: evt.pageY
						};
					}		
				};
				
			I.element.on('mousedown touchstart', function(startEvent){
				//alert(o.isTouch);
				if(!o.isTouch){
					startEvent.preventDefault();
				}
				var touchStart = $.extend({}, getTouchPos(startEvent)),
					wasDrag = false;
					
				touchStart.time = $.now();				
				$(this).one('click', function(evt){
					if(wasDrag){
						evt.preventDefault();	
					}
				});
				$(document).one('mouseup touchend', function(endEvent){
					if(endEvent.timeStamp - startEvent.timeStamp < 85){
						//Not a drag
						return;	
					}else{
						wasDrag = true;
						if(!o.isTouch) endEvent.preventDefault();	
					}
					var touchEnd = $.extend({}, getTouchPos(endEvent)),
						xDiff = diff(touchStart.x, touchEnd.x) || 1,
						yDiff = diff(touchStart.y, touchEnd.y) || 1; //Just in case they're really good at swiping, we don't want to divide by zero.
					
					if(xDiff > 50 && xDiff / yDiff >= 2){
						var direction = touchStart.x - touchEnd.x > 0 ? 'next' : 'prev';
						I[direction]();
					}
				});
			});
			/*
			
			$(document).on('mousemove touchmove', function(evt){
//					evt.preventDefault();
				if(touchEnd.complete === true){
					return;	
				}
				
				if(I.options.isTouch){
					touchEnd.x = evt.originalEvent.touches[0].pageX;
					touchEnd.y = evt.originalEvent.touches[0].pageY;
				}else{
					touchEnd.x = evt.pageX;
					touchEnd.y = evt.pageY;
				}
				touchEnd.time = $.now();
				if(touchEnd.time - touchStart.time < 750){
					evt.preventDefault();
				}
			});
			
			*/
			
			
			
			//Watch for transition events to progress the sequence
            this.element.on('transitioned webkitTransitionEnd', '.'+o.showingClass, function(evt){
				if(evt.originalEvent.propertyName === o.watchProperty){
                    clearTimeout(I.showTimeout);
					I.showTimeout = setTimeout(function(){
                        if(I.options.play){
                            I.next();
                        }
                    }, o.showTime);
                }
            });

			if(o.isLegacy){
				this.items().css({
					opacity: 0,
					visibility:'visible'
				});	
			}

            this.next();
        },

        show:function(item){
            clearTimeout(this.showTimeout);

            var o = this.options,
                $items = this.items(),
				$item = typeof item === 'number' ? $items.eq(item) : $(item),
                $prev = $items.filter('.'+o.showingClass).not($item.get(0)).first(),
                index = $.inArray($item.get(0), $items),
                prevIndex = $prev.length ? $.inArray($prev.get(0), $items) : -1,
				removeClassRegExp = new RegExp("\\s*("+o.showingClass+"|"+o.hidingClass+")-\\d+", 'g');
				
            this.element.attr('class', (this.element.attr('class')||'').replace(removeClassRegExp, ''));
            this.element.addClass(o.showingClass+'-'+(index+1));
            
            $item.addClass(o.showingClass);
            $item.removeClass(o.hidingClass);
			
			if($prev.length){
				this.element.addClass(o.hidingClass+'-'+(prevIndex+1));			
				$prev.addClass(o.hidingClass);
				$prev.removeClass(o.showingClass);
			}

            if(this.btns){
                var $btns = this.btns.children('a'),
                    $btn = $btns.eq(index);

                $btns.removeClass(o.showingClass);
                $btn.addClass(o.showingClass).remove(o.hidingClass);
            }
			
			if(o.isLegacy){
				o.legacy.call(this, $item, $prev, index, prevIndex);	
			}
			
            this.element.trigger('change', $item, $prev, index, prevIndex);

        },

        next:function(){
            var $items = this.items(),
                $next = $items.eq(this.index() + 1);
            if(!$next.length && this.options.repeat){
                $next = $items.first();
            }
            if($next.length){
                this.show($next);
            }
        },

        prev:function(){
            var $items = this.items(),
                $prev = $items.eq(this.index() - 1);
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
                this.show(this.items().filter('.'+this.options.showingClass));
            }
        },

        items:function(){
            return this.element.find(this.options.itemSelector);
        },

        index:function(){
            var $items = this.items(),
				$active = $items.filter('.'+this.options.showingClass);
            return $active.length ? $.inArray($active.get(0), $items) : -1;
        },

        total:function(){
            return this.items().length;
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
                $el.data('responsiveCollage', collage);
                collage.init();
            }
            if(typeof opts === 'string' && typeof collage[opts] === 'function'){
                result = collage[opts].apply(collage, [].slice.call(arguments, 1));
            }
        });
        return result;
    };

    $.fn.responsiveCollage.defaults = Collage.prototype.options;


})(jQuery);

