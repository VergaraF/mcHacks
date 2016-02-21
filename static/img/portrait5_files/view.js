var ImageView = {
    selectedLicense: null,
    selectedResolution: null,
    selectedItem: null,
    $customWidth: null,
    $customHeight: null,
    orgWidth: null,
    orgHeight: null,
    lc_auto_maximized: 0,
    init: function() {
        $('#show_extra_license').click(this.showExtraLicenses)
        $('#show_less_options').click(this.showLessOptions)
        $('#action_btn').click(this.doAction)
        $('#licenses_box .fReplacedRadio').click(this.selectLicense)
        $('#add_to_cart').click(this.addToCart)
        $(document.body).on('keyup', '#custom_width', this.changeCustomWidth)
        $(document.body).on('keyup', '#custom_height', this.changeCustomHeight)
        $(document.body).on('change', '#unit_type_select', this.changeUnit)
        $('#resolutions_list').on('mouseover', 'li.label', this.showSizeHint)
        this.selectedLicense = APPINIT.selected_license
        this.orgWidth = parseInt(APPINIT.org_width)
        this.orgHeight = parseInt(APPINIT.org_height)
        this.renderPrices()
        $('.license_info').on('click', this.showLicenseInfo)
        if (!APPINIT.userId && APPINIT.credit_bonus) {
            var img = new Image()
            img.src = '/images/imageview/price_tooltip.png'
            $(document).on('mouseenter', '.price_frame', this.showPriceTooltip)
        }
        //Cache zoom image so it opens faster when clicked
        if (APPINIT.cache_zoom) {
            setTimeout(function() {
                var img = new Image();
                img.src = APPINIT.cache_zoom;
            }, 4000)
        }
        //Cache tooltip background
        var si, sizes = [2,3,4,5,6,10];
        for (si in sizes) {
            var size = sizes[si],
            img = new Image();
            img.src = '/images/imageview/hint_res_'+size+'.jpg';
        }
        img = new Image();
        img.src = '/images/imageview/hint_custom_res.jpg';

        if (APPINIT.is_nude) {
            ga('send', 'event', 'nude content', 'image view opened', APPINIT.media_id)
        }
        //---end cache tooltip background
    },
    showPriceTooltip: function() {
        var options = {
            maxwidth: 500,
            top_offset: 0,
            left_offset: -250,
            arrow: 'right-10px'
        }
        var tooltip = $('#price_tooltip').tmpl({bonus: APPINIT.credit_bonus})
        new Tooltip(this, tooltip.html(), options);
    },
    showLicenseInfo: function() {
        PopupMgr.popStart('contract', $(this).closest('.fReplacedRadio').attr('id'));
    },
    showExtraLicenses: function(e) {
        e.preventDefault()
        $('.additional_license').removeClass('additional_license')
        $(this).hide()
        $('#show_less_options').show()
    },
    showLessOptions: function(e) {
        e.preventDefault()
        $(this).hide()
        var $rows = $('#licenses_box').find('li')
        $rows.addClass('additional_license')
        $rows.first().removeClass('additional_license')
        $rows.filter('.selected').removeClass('additional_license')
        $('#show_extra_license').show()
    },
    selectLicense: function() {
        $('#licenses_box > li.label').removeClass('selected')
        $(this).closest('li.label').addClass('selected')
        ImageView.selectedLicense = $(this).data('value')
        if (ImageView.selectedLicense == 'l.sens') {
            ImageView.setSelectedItem()
            ImageView.updateActionBtnName()
            $('.imageview_sizechoose').hide()
        }
        else $('.imageview_sizechoose').show()
        ImageView.renderPrices()
    },
    changeCustomWidth: function() {
        ImageView.changeCustomSize(ImageView.$customWidth, ImageView.$customHeight);
    },
    changeCustomHeight: function() {
        ImageView.changeCustomSize(ImageView.$customHeight, ImageView.$customWidth);
    },
    changeCustomSize: function($changed_input, $calculated_input) {
        $calculated_input.val('')
        var $unit = $('#unit_type_select'),
            unit_type = $unit.val().substr(0, 2),
            unit_val = parseInt($unit.val().substr(2)),
            width = parseFloat(this.$customWidth.val()),
            height = parseFloat(this.$customHeight.val())

        var calc_val, ratio = this.orgHeight / this.orgWidth
        if (width > 0 || height > 0) {
            if (width > 0) height = calc_val = ratio * width
            else width = calc_val = height / ratio
            var count = (unit_type == 'px') ? 0 : 2
            $calculated_input.val(parseFloat(calc_val).toFixed(count))
        }
        this.selectedItem.width = Math.round(width * unit_val)
        this.selectedItem.height = Math.round(height * unit_val)

        this.validateCustomRes()
        this.updateCustomResPrice()
        this.updateActionBtnName()
    },
    changeUnit: function() {
        var unit = $('#unit_type_select').val().substr(0, 2)
        if (unit == 'in') unit = 'inches'
        ImageView.$customWidth.val('Width, ' + unit)
        ImageView.$customWidth.attr('data-defaultext', 'Width, ' + unit)
        ImageView.$customHeight.val('Height, ' + unit)
        ImageView.$customHeight.attr('data-defaultext', 'Height, ' + unit)
        ImageView.selectedItem.width = ImageView.selectedItem.height = 0
        ImageView.validateCustomRes()
    },
    validateCustomRes: function() {
        var is_valid = true, msg = '', pixels_res = ''

        if (!this.selectedItem.width || !this.selectedItem.width) {
            if (this.$customWidth.val() != this.$customWidth.attr('data-defaultext') &&
                this.$customHeight.val() != this.$customHeight.attr('data-defaultext')) {
                msg = 'The size is invalid'
                is_valid = false
            }
        }
        else {
            pixels_res = 'Result in pixels: ' + this.selectedItem.width + 'x' + this.selectedItem.height
            var new_size = this.selectedItem.width * this.selectedItem.height,
                org_size = this.orgWidth * this.orgHeight
            if (new_size > org_size) {
                var upscale_percentage = Math.ceil(new_size / org_size * 100 - 100)
                if (upscale_percentage > 30) {
                    is_valid = false
                    pixels_res = ''
                    msg = 'Upsizing is not available. Please choose lower size.'
                }
                else msg = 'Upsized by ' + upscale_percentage + '% (acceptable)'
            }
        }

        $('#result_in_px').html(pixels_res)
        $('.opt_custom_size_err').html(msg)
        if (is_valid) this.enableActionBtn()
        else this.disableActionBtn()
    },
    enableActionBtn: function() {
        $('#action_btn').removeClass('btn_disabled')
    },
    disableActionBtn: function() {
        $('#action_btn').addClass('btn_disabled')
    },
    showSizeHint: function(e) {
        var id = $(this).find('input').attr('id'),
        height_in = $(this).find('input').attr('data-height_in'),
        html = '<div class="size_hint" style="position:relative;text-align: center;">',
        getImg = function() {
            var replacer = APPINIT.org_width > APPINIT.org_height ? '-box_175_175' : '-fit_148_148',
            img = $('#main_image').attr('src').replace('-fit_400_400', replacer);
            return img;
        },
        sizes = {
            res_2: {h2:'A4 / Standard Letter', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*9.88)+'px; top:86px; left:56px;border-right:2px solid #EDF3F5; border-bottom:2px solid #EDF3F5;', top:0, arrow:8},
            res_3: {h2:'A4 / Standard Letter', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*9.88)+'px; max-width:71px; top:86px; left:56px;border-right:4px solid #EDF3F5; border-bottom:4px solid #EDF3F5;', top:-35, arrow:43},
            res_4: {h2:'A4 / Standard Letter', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*9.88)+'px; max-width:71px; top:86px; left:56px;border-right:4px solid #EDF3F5; border-bottom:4px solid #EDF3F5;', top:-70, arrow:78},
            res_5: {h2:'A2 / Tabloid / Poster', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*7.52)+'px; max-width:109px; top:85px; left:39px;border-right:5px solid #F4F4F4; border-bottom:5px solid #F4F4F4;', top:-105, arrow:113},
            res_6: {h2:'A2 / Tabloid / Poster', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*7.52)+'px; max-width:109px; top:85px; left:39px;border-right:5px solid #F4F4F4; border-bottom:5px solid #F4F4F4;', top:-140, arrow:148},
            res_10: {h2:'A2 / Tabloid / Poster', h3:'This is the actual size on print:', img_style:'max-height:'+(height_in*7.52)+'px; max-width:109px; top:85px; left:39px;border-right:5px solid #F4F4F4; border-bottom:5px solid #F4F4F4;', top:-175, arrow:183},
            custom_res: {h2:'Specify your size:', h3:'Poster, Billboard, Canvas, etc.', img_style:'', top:-210, arrow:218}
        },
        size = sizes[id];

        html += '<h2 style="font-size: 16px; margin:0"><strong>' + size.h2 + '</strong></h2>';
        html += '<h3 style="font-size: 12px; margin:0 0 20px;"><strong>' + size.h3 + '</strong></h3>';
        html += '<img style="margin-bottom: 20px" src="/images/imageview/hint_' + id + '.jpg" />';
        html += id == 'custom_res' ? '' : '<img src="' + getImg() + '" style="position:absolute; box-sizing:initial; ' + size.img_style + '" />';

        html += '</div>';
        Tooltip(this, html, {maxwidth:200, width:200, left_offset:-400, top_offset:size.top, arrow:'right-'+size.arrow, purgatory: 0});
    },
    renderPrices: function() {
        var $section = $('#resolutions_list')
        $section.html('')
        var prices = APPINIT.prices[this.selectedLicense]
        for (var key in prices) {
            var item = prices[key]
            if (!item.is_custom) {
                var $row = $('#resolution_item').tmpl(item).appendTo('#resolutions_list')
                if (item.is_selected) this.selectResolution($row)
            }
            else {
                $('#custom_size').tmpl(item).appendTo('#resolutions_list')
                this.$customWidth = $('#custom_width')
                this.$customHeight = $('#custom_height')
            }
        }
        $section.find('input:radio').formReplacer()
        $section.find('.fReplacedRadio').click(function() {
            ImageView.selectResolution($(this).closest('li.label'))
        })
    },
    selectResolution: function($el) {
        $('#resolutions_list li.label').removeClass('selected')
        $el.addClass('selected')
        ImageView.selectedResolution = $el.find('input:radio').val()
        ImageView.setSelectedItem()
        ImageView.enableActionBtn()
        if (this.selectedItem.is_custom) {
            ImageView.validateCustomRes()
            ImageView.updateCustomResPrice()
        }
        ImageView.updateActionBtnName()
    },
    updateActionBtnName: function() {
        var name
        switch(this.selectedItem.action) {
            case 'download':
            case 'purchase':
                name = 'Download'
                break
            case 'add_to_cart':
                name = 'Add to cart'
                break
            case 'sensitive_request':
                name = 'Send request'
                break
        }
        $('#action_btn').html(name)
    },
    setSelectedItem: function() {
        if (this.selectedLicense == 'l.sens')
            this.selectedItem = {action: 'sensitive_request'}
        else
            this.selectedItem = APPINIT.prices[this.selectedLicense][this.selectedResolution]
    },
    updateCustomResPrice: function() {
        var prices = APPINIT.prices[this.selectedItem.license]
        var resolution = this.selectedItem.width * this.selectedItem.height
        var prev_res = 0, prev_key = null, item, item_res
        for (var key in prices) {
            if (key != 'custom_res') item = prices[key]
            else item = prices[prev_key]

            item_res = item.width * item.height
            if (key == 'custom_res' || resolution <= item_res && resolution > prev_res) {
                this.selectedItem.res_id = item.res_id
                this.selectedItem.price = item.price
                this.selectedItem.old_price = item.old_price
                this.selectedItem.action = item.action
                if (item.action == 'download')
                    this.selectedItem.order_item = item.order_item
                break;
            }
            prev_res = item_res
            prev_key = key
        }
        var $row = $('#custom_res_row')
        if (this.selectedItem.price == this.selectedItem.old_price) $row.find('.old_price').hide()
        else $row.find('.old_price').show()
        $row.find('.price').html(this.selectedItem.price)
        $row.find('.old_price').html(this.selectedItem.old_price)
    },
    doAction: function(e) {
        if ($('#action_btn').hasClass('btn_disabled')) return
        switch(ImageView.selectedItem.action) {
            case 'download':
                ImageView.download()
                break
            case 'purchase':
                ImageView.purchase()
                break
            case 'add_to_cart':
                config = ImageView.getConfig()
                cart.addItem(config, e)
                break
            case 'sensitive_request':
                ImageView.requestSensitive()
                break
        }
    },
    download: function() {
        if (parseInt(this.selectedItem.width) == 0 || parseInt(this.selectedItem.height) == 0) {
            alert('Please correct image size');
            return
        }
        var res = this.selectedItem.width + '/' + this.selectedItem.height
        location.href = '/media_x/download/' + this.selectedItem.order_item + '/' + res
    },
    purchase: function() {
        var data = ImageView.getConfig().custom
        data.type = APPINIT.image_type
        var callback = function(resp) {
            if (resp.nude_with_bonus) {
                PopupMgr.popStart('nude_with_bonus');
                return;
            }
            if (resp.status != 0) {
                alert(resp.msg)
                return
            }
            location.href = '/checkout/receipt/' + resp.order_id
        }
        $.post('/checkout_x/acquire_image', data, callback)
    },
    addToCart: function(e) {
        e.preventDefault()
        cart.addItem(ImageView.getConfig(), e)
    },
    requestSensitive: function() {
        if (typeof(LC_API)!=='undefined' && LC_API.chat_window_minimized() && !ImageView.lc_auto_maximized) {
            ImageView.lc_auto_maximized = 1;
            LC_API.open_chat_window();
        } else {
            ImageView.lc_auto_maximized = 0;
            PopupMgr.popStart('sensivity_request');            
        }        
    },
    getConfig: function() {
        var config = {
            type: 1,
            preview: $('#main_image').attr('src'),
            custom: {
                fkey: APPINIT.media_id,
                license: this.selectedItem.license,
                resolution_id: this.selectedItem.res_id
            }
        }
        if (this.selectedItem.is_custom) {
            config['custom']['resolution'] = [this.selectedItem.width, this.selectedItem.height]
            config['custom']['is_custom_res'] = true
        }
        return config
    }
}

$(document).ready(function() {
    ImageView.init()
    preview.load()
    trimPreviews();
    new Ya.share({
            l10n: 'en',
            element: 'ya_share1',
            elementStyle: {
                'type': 'link',
                'quickServices': ['facebook', 'twitter', 'gplus', 'pinterest']
            },
            //image: APPINIT.image_url, //facebook don't like it :)
            popupStyle: {
                blocks: {
                    'Share with friends': ['vkontakte', 'linkedin', 'lj', 'friendfeed' ]
                }
            },
            serviceSpecific: {
                pinterest: {
                    image: APPINIT.image_url
                },
                vkontakte: {
                    image: APPINIT.image_url
                }
            }          
    });

})