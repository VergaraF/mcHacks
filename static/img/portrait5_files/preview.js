var preview = {
    loaded : false,
    interval : false,
    closeInterval : false,
    pageX: null,
    pageY: null,
    currentMediaId: null,
    startLook: null, 
    nude_warning_img: '/images/search/nude_restrictions.png',
    isNormal: function(html_obj) {
        if (html_obj.attr('data-dynamic_preview') || (typeof MyConfig !== 'undefined' && MyConfig.previewType == 'dynamic')) return false;
        return true
    },
    clear : function() {
        $("#preview").remove();
        //if(preview.interval) clearTimeout(preview.interval);
    },
    appendNormalContent : function(obj) {
        // Get image informations
        var ori_src = obj.attr('data-preview');
        var small_src = obj.children(':first-child').attr('src');
        var title = obj.children(':first-child').attr('alt');
        var description = obj.attr('data-description');
        var width = obj.attr('data-width');
        var height = obj.attr('data-height');
        var media_id = obj.attr('data-id');
        var seed = 'id_' + media_id;
        var rate_element = obj.parents('.imageview_frame').siblings('.preview_back_info').find('.average_rating_box');
        // support for square previews
        if(rate_element.length < 1)
            var rate_element = obj.parent().siblings('.imageview_bottom_square').find('.average_rating_box');
        var average_rating = rate_element.attr('data-average_rating');
        var rates_count = rate_element.attr('data-rates_count')

        if (preview.isImageOk(ori_src) || ori_src == preview.nude_warning_img) small_src = ori_src
        var result = {
            width : width,
            height : height,
            seed : seed,
            small_src : small_src,
            title : title,
            description : description,
            average_rating : average_rating,
            rates_count : rates_count,
            media_id : media_id
        };

        $("#searchResultPreviewTemplate").tmpl(result).appendTo("body");
        if ('rating' in $('#rate_preview_' + media_id)) $('#rate_preview_' + media_id).rating('load');
        // Set the preview image src
        if (!preview.isImageOk(ori_src)) {
            obj.parent().find('*').css('cursor', 'progress');
            var img = new Image();
            img.src = ori_src;
            img.onload = function () {
                obj.parent().find('*').css('cursor', '');
                $("#preview").find('.' + seed).attr('src', ori_src);
                $("#preview").show();
            }
        }
        else {
            $("#preview").show();
            //$("#preview").delay(30).fadeIn(170);
        }
        //return preview width
        return parseInt(width) + 52;
    },
    appendDynamicContent : function(html_obj) {
        var title = html_obj.attr('data-title');
        var type = html_obj.attr('data-type');
        var description = html_obj.attr('data-description');
        var item_id = html_obj.attr('data-id');
        var link = html_obj.attr('href');
        var media_count = html_obj.attr('data-media_count');
        var search_data = APP.parseBeautifulUrl(link.substr(8));
        var seed = 'id_' + item_id;
        var result = {
            link : link,
            seed : seed,
            type : type,
            id : item_id,
            width : 300,
            description : description,
            media_id : item_id,
            dynamic_preview : true
        };
        $("#searchResultPreviewTemplate").tmpl(result).appendTo("body");

        $.manageAjax.add('model_previews', {
            url: '/search/async_dynamicPreviews',
            data: search_data,
            success: function (json) {
                var images = '';
                for (i in json.data.result){
                    var result = json.data.result[i];
                    var link = '/image/'+ result.media_url;
                    var src = result.public_path
                    images += '<a href="'+link+'" title="Click to view image" class="'+(result.blurred?'blurred':'')+'">' +
                        '<img src ="'+src+'" style="float:left;width:100px;height:100px;" width="100" height="100" />' +
                        '</a>';
                }
                images += '<br style="clear:both;" />';

                var container = $("#preview").find('.' + seed)
                container.html(images)
                container.siblings('h1').html(title)
                var count = parseInt(json.data.count),
                    link = '<a href="'+ $('#preview').find('.full_result_link').attr('href') + '">';
                link += 'View ' + (count > 1 ? 'all ' + count + ' images' : count + ' image') + '</a>'
                container.siblings('h2').html(link);
                if (json.data.has_nude)
                    $('<div style="margin-top: 3px;">Note: nude previews have been blurred. <br /><a href="javascript:void(0);" class="trigger_safe_mode">Turn Off Safe Mode</a></div>')
                        .insertAfter(container.siblings('h2'));
                preview.positionDynamic(html_obj);
            }
        });
    },
    loadNormal : function(html_obj) {
        // Calculate the preview's position
        var x = 0;
        var y = x;
        if (html_obj.parents('.imageview_wrap').length > 0) {
            x = html_obj.parents('.imageview_wrap').offset().left;
            y = html_obj.parents('.imageview_wrap').offset().top;
        } else if (html_obj.parents('.imageview_square').length > 0) {
            x = html_obj.parents('.imageview_square').offset().left;
            y = html_obj.parents('.imageview_square').offset().top;
        }
        else {
            x = html_obj.offset().left;
            y = html_obj.offset().top;
        }
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var previewBoxHeight = html_obj.height();
        var previewBoxWidth = html_obj.width();
        var topSpace = y - $(window).scrollTop();
        var topSpaceScroll = y - $(window).scrollTop() - 80;
        var bottomSpace = windowHeight - (previewBoxHeight + topSpace);
        //Append Preview to body also returns width of preview derived from image width
        var pictureWidth = preview.appendNormalContent(html_obj)
        if(typeof pictureWidth !== 'number') pictureWidth = $('#preview').width() + 20;
        var pictureHeight = $('#preview').height() + 20;
        // Conditions for 'square' images (montaged images)
        if (typeof myApp != 'undefined'
            && typeof(myApp.pageData.image_view)!="undefined"
            && myApp.pageData.image_view == "square") {
            var squaredX = html_obj.children('img').width() + 20;
            previewBoxHeight = html_obj.children('img').height();
            bottomSpace = windowHeight - (previewBoxHeight + topSpace);
            var picturePos1 = (y - 9) - ((pictureHeight - previewBoxHeight) / 2);
            var picturePos2 = ((pictureHeight - previewBoxHeight) / 2) + 9;
            if ((windowWidth - x) < (pictureWidth + squaredX - 10) && (x > (pictureWidth + 20))) {
                // PICTURES SHOWN TO THE LEFT OF THE PICTURE
                y = picturePos1;
                x = x - pictureWidth;
            } else {
                // PICTURES SHOWN TO THE RIGHT OF THE PICTURE
                y = picturePos1;
                x = x + squaredX;
            }
        }
        else {
            var picturePos1 = (y - 9) - ((pictureHeight - previewBoxHeight) / 2);
            var picturePos2 = ((pictureHeight - previewBoxHeight) / 2) + 9;
            if ((windowWidth - x) < (pictureWidth + previewBoxWidth + 20) && (x > (pictureWidth + 20))) {
                // PICTURES SHOWN TO THE LEFT OF THE PICTURE
                y = picturePos1;
                x = x - pictureWidth;
            } else {
                // PICTURES SHOWN TO THE RIGHT OF THE PICTURE
                y = picturePos1;
                x = x + previewBoxWidth + 10;
            }
        }
        // PICTURES SHOWN IN BOTTOM WITHOUT SPACE
        if (bottomSpace < picturePos2)
            y = y - (picturePos2 - bottomSpace);
        // PICTURES SHOWN IN TOP WITHOUT SPACE
        if (topSpaceScroll < picturePos2)
            y = y + (picturePos2 - topSpaceScroll);
        //$("#preview").css("top", y + "px").css("left", x + "px").delay(50).show(0);
        $("#preview").css("top", y + "px").css("left", x + "px");
    },
    loadDynamic : function(html_obj) {
        preview.appendDynamicContent(html_obj);
        // Calculate the preview's position
        preview.positionDynamic(html_obj);
    },
    positionDynamic : function(html_obj) {
        $("#preview").fadeIn(300);
        // Calculate the preview's position
        var x = 0;
        var y = x;
        if (html_obj.parents('.imageview_wrap').length > 0) {
            x = html_obj.parents('.imageview_wrap').offset().left;
            y = html_obj.parents('.imageview_wrap').offset().top;
        } else if (html_obj.parents('.imageview_square').length > 0) {
            x = html_obj.parents('.imageview_square').offset().left;
            y = html_obj.parents('.imageview_square').offset().top;
        } else {
            x = html_obj.offset().left;
            y = html_obj.offset().top;
        }
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var previewBoxHeight = 184;
        var previewBoxWidth = 160;
        var topSpace = y - $(window).scrollTop();
        var topSpaceScroll = y - $(window).scrollTop() - 80;
        var bottomSpace = windowHeight - (previewBoxHeight + topSpace);
        pictureWidth = $('#preview').width() + 20;
        var pictureHeight = $('#preview').height() + 20;
        var picturePos1 = (y - 9) - ((pictureHeight - previewBoxHeight) / 2);
        var picturePos2 = ((pictureHeight - previewBoxHeight) / 2) + 9;
        if ((windowWidth - x) < (pictureWidth + previewBoxWidth + 20) && (x > (pictureWidth + 20))) {
            // PICTURES SHOWN TO THE LEFT OF THE PICTURE
            y = picturePos1;
            x = x - pictureWidth + 10;
        } else {
            // PICTURES SHOWN TO THE RIGHT OF THE PICTURE
            y = picturePos1;
            x = x + previewBoxWidth;
        }
        // PICTURES SHOWN IN BOTTOM WITHOUT SPACE
        if (bottomSpace < picturePos2)
            y = y - (picturePos2 - bottomSpace);
        // PICTURES SHOWN IN TOP WITHOUT SPACE
        if (topSpaceScroll < picturePos2)
            y = y + (picturePos2 - topSpaceScroll);
        $("#preview").css("top", y + "px").css("left", x + "px");
    },
    load : function() {
        $(document).mousemove(function(e) {
            preview.pageX = e.pageX
            preview.pageY = e.pageY
        })

        $(document.body).on('mouseenter', "div.previews div.preview .inner2, .imageview_square", function() {
            var $this = $(this), html_obj = $(this).find('a.preview');
            if (preview.closeInterval)
                clearTimeout(preview.closeInterval);

            preview.clear();
            if(preview.isNormal(html_obj))
                preview.loadNormal(html_obj);
            else
                preview.loadDynamic(html_obj);
            
            if(html_obj.data('type')=='media'){
            	preview.current_media_id = html_obj.data('id');
            	preview.startLook = (new Date()).getTime();
                if ($('div.previews.search_result_new').length > 0 && !$this.next().is('.suggestions')) {
                    var limit = Math.ceil(($this.width()-14)/49)
                    $.post('/media/get_preview_details?media_id='+html_obj.data('id')+'&limit='+limit,
                        function(resp) {
                            $("#searchPreviewSuggestionsTemplate").tmpl({sections:resp.sections}).insertAfter($this);
                        });
                }
            }

        });
        
        $(document.body).on('mouseleave', "div.previews div.preview .inner2, .imageview_square", function() {
            var html_obj = $(this).find('a.preview');
            if (preview.isNormal(html_obj))
                preview.clear();
            else
                preview.closeInterval = setTimeout(function(){preview.clear()}, 400);

            if(window.location.pathname=='/search' && html_obj.data('type')=='media' && preview.current_media_id==html_obj.data('id')){ 
                time = (new Date()).getTime() - preview.startLook;
                var urlParams = APP.parseBeautifulUrl(location.hash);
                var query = '';
                if(typeof(urlParams.search)!='undefined') query = urlParams.search;
                if(time>300){
                    $.ajax({
                        url: '/media/preview/' + html_obj.data('id'),
                        data: {preview_time: time, query: query}
                    });
                }
            }

        });
        

        $(document.body).on('mouseenter', "#preview", function() {
                if (preview.closeInterval)
                    clearTimeout(preview.closeInterval);
        });
                
        $(document.body).on('mouseleave', "#preview", function() {
            preview.clear();
        });
        
    },
    isImageOk : function(src) {
        var img = new Image();
        img.src = src;
        if (img.complete) return true;
        if (typeof img.naturalWidth != undefined && img.naturalWidth == 0) return false;
        return true;
    }
};

$('body').on('overflowchanged', function() {
    if (myApp.pageData.image_view == 'collage')
        fixCollagePreviewEnds();
    else if (myApp.pageData.image_view != 'small' && myApp.pageData.image_view != 'square') {
        montage.refresh();
    }
});

var montage = {
    settings: {
        max_height: 250,
        gutter: 10
    },
    _rowDiff: 0,
    refresh: function ($containers) {
        if (!$containers) $containers = $('div.previews');

        $containers.each(function(){
            var width = !$(this).data('width') ? $(this).width() : $(this).data('width');
            montage.arrange($(this), width);
        });
    },

    arrange: function ($container, cw) {
        var tw = 0, row = [];
        //clean up
        $container.find('div.preview').removeClass('last-in-row').css('margin-right', '')
            .find('.inner').css('height', '').css('width', '')
            .find('img').css('height', '').css('width', '').css('max-height', '');
        $container.find('div.preview').each(function() {
            var data = $(this).find('a').data();
            var height = data.height, width = data.width;
            if (height > montage.settings.max_height) {
                width = parseFloat((montage.settings.max_height / height * width).toFixed(2));
                height = montage.settings.max_height;
            }
            $(this).data('height', height).data('width', width);
            tw += width + montage.settings.gutter;
            row.push($(this).get());
            if (tw > cw) {
                montage._rowDiff = tw - cw;
                montage.resizeRow(row);
                tw = 0; row = [];
            }
        });
        //last row
        montage._rowDiff = 0;
        if (tw > 0) montage.resizeRow(row);
        //fix overlappting
        montage._compensateLapping($container);
    },

    resizeRow: function(items) {
        var i, j, loop_height = false, resizable = [], heights = [], h_objs = {};
        for (i in items) {
            var $item = $(items[i]),
                height = $item.data('height');

            if ($.inArray(height, heights) == -1) {
                heights.push(height);
                h_objs[height] = [$item.get()];
            }
            else {
                h_objs[height].push($item.get());
            }
        }

        $item.addClass('last-in-row');
        heights.sort(function(a, b){return b - a;});
        for (j in heights) {
            j = parseInt(j);
            resizable = resizable.concat(h_objs[heights[j]]);
            if (loop_height) {
                $(h_objs[heights[j]]).each(function(){
                    montage._set($(this), $(this).data('width'), loop_height);
                });
            } else
                loop_height = montage._resize(resizable, heights[j+1]);
        }

    },

    _resize: function (objs, stop_height) {
        var loop = false, sum_area = 0, row_diff = 0;
        $(objs).each(function() {
            sum_area += parseInt($(this).data('height') * $(this).data('width'));
        });

        $(objs).each(function() {
            var height = $(this).data('height'),
                width = $(this).data('width'),
                area = height * width,
                new_width = width - (area / sum_area * montage._rowDiff),
                new_height = new_width * (height / width);

            if (stop_height && new_height < stop_height) {
                new_height = stop_height;
                new_width = stop_height * width / height;
                row_diff += width - new_width;
            }
            else loop = new_height;

            montage._set($(this), new_width, new_height);
        });

        montage._rowDiff -= row_diff;
        return loop;
    },

    _round: function (val) {
        var new_val = val < 0 ? -val : val;
        new_val = new_val < parseFloat(Math.floor(new_val) + '.49') ? Math.floor(new_val) : Math.ceil(new_val);
        new_val = val < 0 ? -new_val : new_val;
        return new_val;
    },

    _compensateLapping: function ($container) {
        var $lastItems = $container.find('div.preview.last-in-row');
        $lastItems.each(function() {
            var $items = $(this).prevUntil('div.preview.last-in-row').addBack(),
                objs = $items.get(),
                length = objs.length,
                $last = $(objs[length-1]),
                $cont = $('div.previews'),
                diff = parseFloat((($cont.offset().left+$cont.width()-10) - ($last.offset().left+$last.width())).toFixed(3)),
                abs_diff = Math.abs(diff), skip = ((length>abs_diff)?Math.ceil(length/abs_diff)-1:1)  ;

            if (diff && abs_diff <= montage.settings.gutter) {
                var loop = true, i = 0, adjustment = diff > 0 ? -1 : 1;
                do {
                    if ((adjustment == -1 && diff < 1) || (adjustment == 1 && diff > -1))
                        adjustment = diff*-1;
                    var mr = parseInt($(objs[i]).css('margin-right'));
                    if (mr < 5) loop=false;
                    $(objs[i]).css('margin-right', (mr-adjustment) + 'px');
                    diff += adjustment;
                    i += skip;
                    if (i >= length) i = 0;
                    if (parseInt(diff) == 0) loop=false;
                }
                while(loop);
            }
        });
    },

    _set: function ($obj, new_width, new_height) {
        new_width = montage._round(new_width);
        new_height = montage._round(new_height);
        var old_height = $obj.data('height');
        $obj.data('width', new_width).data('height', new_height)
            .find('.inner').css('height', new_height+'px').css('width', new_width+'px');

        if (old_height && old_height > new_height)
            $obj.find('img').css('height', new_height+'px').css('width', '100%');
        else
            $obj.find('img').css('max-height', new_height+'px');
    }
};

window.prev_hidden_previews = {};
function fixCollagePreviewEnds() {
    var $container = $('.previews');
    $container.each(function() {
        $(this).find('a.filler').remove();
        $(this).find('span+span').remove();
        var width = $(this).width(),
            $items = $(this).find('>a,>div'),
            count = $items.length;
        if (count > 0) {
            var per_row = Math.floor(width/322),
                last_row = count%per_row,
                fill = per_row-last_row;
            if (last_row > 1 && last_row < per_row) {
                var filler = ' <span></span><a class="filler"><div class="preview collage"></div></a>';
                $(this).append(new Array(fill+1).join(filler));
            }
        }
    });
}

function trimPreviews() {
    $('div.previews').each(function(){
        var $container = $(this).removeClass('justify_last'),
            $items = $container.find('div.preview').show();

        if ($items.length < 1) return false;

        var $next_link = $container.find('.preview.next_link'),
            $last_item = $container.find('div.preview:last'),
            container_offset = $container.offset(),
            last_item_offset = $last_item.offset(),
            getLastRow = function() {
                var last_items = [], li_top = 0;
                $($items.get().reverse()).each(function() {
                    if (li_top > $(this).offset().top && li_top > 0)
                        return false;

                    li_top = $(this).offset().top;
                    last_items.push(this);
                });
                return last_items;
            },
            $last_items = $(getLastRow());

        if ($last_items.length > 9 || (((last_item_offset.left - container_offset.left) + $last_item.width())
                > ($container.width() * 0.6))) {
            $container.addClass('justify_last');
            $last_items.find('.inner').css('padding-right', '');
        }
        else {
            if ($next_link.length > 0) {
                var $bottom_rows = $last_items.not('.next_link').hide(),
                    $top_line = $($last_items.get(-1)).prev().prev(), loop = 0;

                if(!$top_line.length) return;
                while ($top_line.offset().top != $next_link.offset().top) {
                    $top_line = $top_line.hide().prev().prev();
                    loop++;
                    if (loop > 20) break;
                }

                $container.addClass('justify_last');
                window.hidden_previews = $items.filter(':hidden').length;
                $container.data('hidden_previews', hidden_previews);
            }
            else
                $last_items.find('.inner').css('padding-right', '35px');
        }
    });
}

/*function scaleWindow() {return false;
    window.hidden_previews = 0;
    var $container = $('div.previews'),
        min_margin = 10,
        parent_w_i = $container.parent().width() - 5,
        items = [],
        c_width = 0,
        parent_w = 30,
        max_margin = 30;

    $container.each(function() {
        max_margin = $(this).data('max_margin') ? parseInt($(this).data('max_margin')) : 30;
        parent_w = $(this).data('max_width') ? parseInt($(this).data('max_width')) : parent_w_i;

        if ($(this).find('div.storage').length < 1) {
            $(this).append('<div class="storage" style="display:none;"></div>');
        }
        else {
            $(this).find('div.storage div.preview').insertBefore($(this).find('div.preview.next_link'))
        }
        resize($(this).find('div.preview'), $(this));
        //last line
        new_line($(this));
    });

    if (typeof Search !== 'undefined') {
        Search.cacheRequests();
    }

    function resize($objs, $container) {
        $objs.removeClass('newline').removeClass('last_item');
        $objs.each(function() {
            var item_width = getWidth($(this));

            if( (c_width + item_width + ((items.length-1) * min_margin) ) > parent_w)
                new_line($container, this, item_width);
            else
                incr_line(this, item_width);
        });
    }

    function new_line($container, item, item_width) {
        if(items.length) {
            var index = items.length - 1,
                margin = (parent_w - c_width) / index;
            var max_space = $container.data('max_space') ? $container.data('max_space') : 60;
            if(margin > max_space) {
                margin = max_margin;
                if ($container.find('div.preview.next_link').length > 0) {
                    reset();
                    if(Boolean($container.data('no_chop'))!=true) chopperFix($container);
                    return;
                }
            }

            $(items[0]).addClass('newline');
            //$(items).css('margin-right', margin);
            $(items).css('margin-right', (margin/14).toFixed(4) + 'em'); // em's more accurate on chrome
            $(items[index]).css('margin-right', '0').addClass('last_item');
            max_margin = margin > max_margin ? margin : max_margin;
        }
        reset();
        if(item) incr_line(item, item_width);
    }

    function incr_line(item, item_width) {
        items.push(item);
        c_width += item_width;
    }

    function getWidth($obj) {
        var width = parseInt($obj.data('width'));
        if(isNaN(width))
            width = $obj.width();

        return width;
    }

    // reset data containers
    function reset() {
        items = [];
        c_width = 0;
    }

    function chopperFix($container) {
        var chopped = 0,
            lr_width = 0,
            margined_width = 0,
            ac_width = 0,
            acceptables = [],
            removables = [],
            $next = $container.find('div.preview.next_link'),
            $last_rows = $next.prevUntil('div.preview.newline').prev().andSelf();

        $last_rows.each(function() {
            var wid = getWidth($(this));
            lr_width += wid + min_margin;
            if(lr_width + 148 <= parent_w) {
                margined_width = lr_width;
                ac_width += wid;
                acceptables.push(this);
            }
            else removables.push(this);
        });


        $(removables).appendTo($next.next('div.storage'));
        $(acceptables).css('margin-right', (parent_w - ac_width - 148) / acceptables.length);
    }

}*/