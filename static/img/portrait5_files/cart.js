/**
* Javascript that will govern the cart on the pages
* @author Slavic Dragovtev [slavic@madhazelnut.com]
*/
var cart = {
    // data type conversion from media domain to cartItem domain
    typeMap: {
        'media' : 1,
        'model' : 100,
        'shoot' : 101
    },
    
    // settings
    element: null,  // holds the jquery element for wrapper
    contentElement: null,  // holds the jquery element for cart content
    itemBoxElement: null,   //container for the actual items
    zidx: {
        draggedItem: 126,
        normalCart: 119,
        priorityCart: 121
    },
    state: 0,   // 0:uninitialized, 1:closed, 2:open
    lock: 0,    // a lock for various operations (addItem etc.)
    eBunny: 0,  // easter bunny data
    id: null,
    autoCloseTimeout: 7000,
    autoCloseInterval: null, //holds autoclose interval id
    srv: {
        init: "/cart_x/init",
        getContent: "/cart_x/get_content",
        "delete": "/cart_x/delete",
        addItem: "/cart_x/add_item",
        deleteItem: "/cart_x/delete_item",
        findSimilar: "/cart_x/find_similar"
    },
    poofRemoveSettings: {
        frameDuration: 90,
        resources: [
            "/images/poof/poof-1.png",
            "/images/poof/poof-2.png",
            "/images/poof/poof-3.png",
            "/images/poof/poof-4.png",
            "/images/poof/poof-5.png"
        ]
    },
    // this here will store the last dragged item information
    draggedConfig: {
        type: null,     // a scope resolution for the added item
        custom: {}   // identifier for the added item, within its own scope plus other data
    },
    
    init: function(){
        this.element = $('#cart')
        this.contentElement = $('#cart').find('[data-iui="content"]')
        this.initContent()
        this.precachePoofRemove()
        this.contentElement.css('z-index',cart.zidx.normalCart)
        if(typeof APPINIT.cartAutocloseTimeout!='undefined') cart.autoCloseTimeout = APPINIT.cartAutocloseTimeout
    },
    initButton: function(extraTrigger){
        this.element.hover(
            function(){
                $(this).addClass('hover');
            },
            function(){
                $(this).removeClass('hover');
            }
        );
        cart.triggerElement = $('#cart-button')
        if(extraTrigger) cart.triggerElement = $(cart.triggerElement).add(extraTrigger)
        cart.triggerElement.unbind('click');
        cart.triggerElement.click(cart.toggleCart)
    },
    /**
    * Initiates the cart's html
    */
    initContent: function(){
        cart.server('init',{id:cart.id},function(resp){
            cart.setMarkup(resp.html)
            cart.setCheckout(resp.num_items, resp.id)
            cart.id = resp.id
            if(cart.state==0) ++cart.state;
            // make the close button also work for closing
            cart.initButton($('#cart').find('[data-iui="close"]'))
            // drag and drop needs to be initialized after content is present. so does the following
            cart.initAddToCart()
            cart.itemBoxElement = cart.contentElement.find('[data-iui="items"]')
            cart.initToolbar()
        })
        // make the delte buttons work for items
        $('body').on('click', '#cart .fnc-remove', cart.deleteItem);
    },
    /**
    * Inits the toolbar (CRUD + cart selectors etc.)
    */
    initToolbar: function(){
        // rename button
        cart.contentElement.find('[data-iui="rename_cart"]').click(function(){
            PopupMgr.popStart('cart_x/rename_popup',cart.id,cart.renamePopupCallback)
            return false;
        })
        // share button
        cart.contentElement.find('[data-iui="share_cart"]').click(function(){
            PopupMgr.popStart('cart_x/share_popup',cart.id)
            return false;
        })
        // delete button
        cart.contentElement.find('[data-iui="delete_cart"]').click(function(){
            if(!confirm("Are you sure about this?")) return false;
            cart.server("delete",{id: cart.id},function(resp){
                cart.id = null
                cart.init.call(cart)
            })
            return false;
        })
        // new cart button
        cart.contentElement.find('[data-iui="create_cart"]').click(function(){
            PopupMgr.popStart('cart_create',false,cart.createPopupCallback)
            return false;
        })
        // checkout button
        $('#checkout').click(function(){window.location.href="/checkout/"+cart.id;})
        // cart selector: bring list
        $("#lightbox_folder_select").click(function(){
            var $list = $("#cart-list").toggle(),
                height = $(window).scrollTop() + $(window).height() - $list.offset().top - 1
            $list.height(height)
        });
        // cart selector: actual
        $('#cart-list').find('li').click(cart.selectCart)
        // Ai mode starts with Find Similar button
        $('#find-similar').click(cart.findSimilar)
        cart.contentElement.find('[data-iui="transfer"]').click(cart.transferPopup)
    },
    initDragNDrop: function(scope){
        // drag in
        if(typeof scope == "undefined") scope = $('#body')
        scope.find('.fnc-cdrag').draggable({
            appendTo: "body",
            containment: "document",
            cursor: "move",
            cursorAt: { top: 0, left: 0 },
            helper: function( event ) {
                return $( '<img style="width:49px;height:49px;" src="'+event.target.src+'" id="cart-drag-object" class="dragImage_whiteborder" />' );
            },
            start: function(event,ui){
                cart.dgBackground(1)
                cart.open(true)
                if(typeof ImageView != 'undefined' && $(event.target).data('is_main')){
                    cart.draggedConfig = ImageView.getConfig()
                } else {
                    // load the config into cart's slot
                    if( $(event.target).attr('data-type') ){
                        cart.draggedConfig.type = cart.typeMap[$(event.target).attr('data-type')]
                    } else {
                        cart.draggedConfig.type = cart.ITEM_TYPE_IMAGE
                    }
                    cart.draggedConfig.custom.fkey = $(event.target).attr('data-id')
                }
                // expand the container of the cart a little so it's possible to have some slack in the drop
                $('#cart-hght-container').css('height',188);
            },
            stop: function(event,ui){
                cart.dgBackground(0);
                cart.setAutoClose()
                // revert the original height that was modified upon drag start
                $('#cart-hght-container').css('height',188);
            },
            zIndex: cart.zidx.draggedItem,
            distance: 20
        })
        cart.contentElement.find('.droppable').droppable({
            drop: function(event){
                cart.addItem(cart.draggedConfig,event)
            }
        })
        // drag out
        cart.initDragOut(cart.contentElement.find('.fnc-cundrag'))
    },
    initDragOut: function(obj){
        obj.draggable({
            appendTo: "body",
            containment: "document",
            cursor: "move",
            cursorAt: { top: 0, left: 0 },
            helper: function( event ) {
                return $( '<img style="width:49px;height:49px;" src="'+event.target.src+'" id="cart-drag-object" class="dragImage_whiteborder" />' );
            },
            start: function(event,ui){
                cart.open(true)
            },
            stop: function(event,ui){
                cart.setAutoClose()
                cart.deleteItem.call(event.target,event)
            },
            zIndex: cart.zidx.draggedItem,
            distance: 20
        })
    },
    initAddToCart: function(scope){
        if(typeof scope == "undefined") scope = $('#body')
        // "Buttonic" add
        scope.on('click', '.fnc_toggle_cart', function(e) {
            e.preventDefault();
            if ($(this).is('.imageview_add')) {
                if (APPINIT.dragToCartHint) cart.dragToCartHint();
                cart.addItem({type: cart.typeMap[$(this).attr('data-type')],
                    custom: {fkey: $(this).attr('data-id')},
                    preview: $(this).attr('data-preview')} ,e);
            }
            else if($(this).is('.imageview_remove')) {
                cart.deleteItem.apply($(this), [e]);
            }
        });
        // d&g add
        cart.initDragNDrop(scope)
    },
    toggleCart: function(){
        if(cart.state==0) return false;   //not allowed to do operations in this state
        if(cart.state==2){
            cart.close()
        } else {
            cart.open()
        }
        return false;
    },
    /**
    * Makes it so cart content is fixed in page
    */
    maintainPosition: function(maxScroll){
        if($(this).scrollTop() > maxScroll){
            cart.contentElement.css('position','fixed').css('top',85)
        } else {
            cart.contentElement.css('position','absolute').css('top','0')
        }
    },
    open: function(noAutoClose){
        cart.state = 2;
        cart.element.show()
        cart.triggerElement.addClass('active');
        // clear any pending autocloses
        clearInterval(cart.autoCloseInterval)
        if(typeof noAutoClose == 'undefined'){
            cart.setAutoClose()
        }
        //if(noAutoClose)
        $('#main_menu').css('borderBottomRightRadius', 0);
    },
    /**
    * param autoclose if set, means it was called by the autocloser
    */
    close: function(autoclose){
        //remove pending autocloses
        clearInterval(cart.autoCloseInterval)
        if(autoclose){
            // do not close if user's still hovering upon it
            if(cart.element.is('.hover')) {
                //remove pending autocloses
                clearInterval(cart.autoCloseInterval)
                cart.setAutoClose()
                return ;
            }
        }
        cart.state = 1;
        if(autoclose){
            cart.element.fadeOut(300);
            $(document).trigger('cart_autoclose');
        }
        else { cart.element.hide(); }
        //deactivate menu item
        cart.triggerElement.removeClass('active');
        $('#main_menu').css('borderBottomRightRadius', 5);
    },
    setAutoClose: function(){
        if(typeof cart.autoCloseInterval != 'undefined' && cart.autoCloseInterval>0){
            clearInterval(cart.autoCloseInterval)
        }
        cart.autoCloseInterval = setTimeout(function(){
            cart.close(true)
        },cart.autoCloseTimeout)
    },
    /**
    * handles all server requests
    */
    server: function(request,data,callback){
        var url = cart.srv[request]
        if(data.id){
            url+= '/' + data.id
        }
        $.ajax({
            'url': url,
            'data': data,
            success: function(resp){
                if(resp.status!=0){
                	if(resp.status==4 && (typeof(qbaka)!='undefined')){
                		qbaka.report(resp.msg);
                	}
                	return cart.showError(resp)
                }

                callback(resp)
                return true;
            }
        })
    },
    showError: function(resp){
        myJgrowl(resp.msg);
        cart.lock = 0;
    },
    /**
    * Set cart markup
    */
    setMarkup: function(html){
        cart.contentElement.html(html)
    },
    /**
    * Set Checkout menu item
    */
    setCheckout: function(num, id){
        var right = 253;
        if (typeof(id)!='undefined') $('#checkout_link').attr('href', '/checkout/' + id);        
        if (num > 0) {
            $('#checkout_link span').text('(' + num + ')');
            var str = num + '';
            var num_digits = str.length;
            right = 273 + (num_digits - 1)*8;
        } else {            
            $('#checkout_link span').text('');
        }
        $('.you_menu').css('right', right + 'px');
    },
    /**
    * Starts a fade layer so it's nicer to move the drag and drop object around
    */
    dgBackground: function(on){
        if(on){
            cart.startFade()
            cart.bringUp()
        } else {
            cart.killFade()
            cart.bringDown()
        }
    },
    startFade: function(){
        if($('#fade').length==0) {
            $('body').append('<div id="fade"></div>');
        }
        $('#fade').show()
    },
    killFade: function(){
        $('#fade').hide()
    },
    /**
    * shows the "drop here" sign and raises the z-index
    */
    bringUp: function(){
        cart.element.find('[data-iui="drophere"]').show()
        cart.contentElement.css('z-index',cart.zidx.priorityCart)
    },
    bringDown: function(){
        cart.element.find('[data-iui="drophere"]').hide()
        cart.contentElement.css('z-index',cart.zidx.normalCart)
    },
    /**
    * Shows an animation of an item being added to the cart
    */
    _animAdd: function(config,event,callback){
        var preview;
        if(config.preview){
            preview = $('<img style="width:49px;height:49px;" src="' + config.preview + '"  class="dragImage_whiteborder">')
        } else {
            preview = $(event.target).clone()
        }
        $('body').append(preview)
        $(preview).css('position','absolute')
        var targetCoords = cart.itemBoxElement.offset()
        $(preview).css({
            "top": event.pageY,
            "left": event.pageX,
            'z-index': cart.zidx.draggedItem
        })
        $(preview).animate({
            "top": targetCoords.top,
            "left": targetCoords.left
        },{
            duration: 350,
            complete: function(){
                $(preview).remove()
                callback(config)
            }
        })
    },
    addItem: function(config,e){
        if(cart.state == 0) return ;
        cart.open()
        if(config.preview){
            cart._animAdd(config,e,cart._addItemDo)
        } else {
            cart._addItemDo(config)
        }
    },
    _addItemDo: function(config){
        if(cart.lock){
            cart.eBunny ++
            if(cart.eBunny >= 3) cart.easterBunny()
            return ;
        }
        // disable cart for further operations until this one finishes
        cart.lock = 1
        var data = $.extend(config,{"id":cart.id})
        cart.server('addItem',data,function(resp){
            cart.push(resp.html,resp.replaced)
            cart.updateTotal(resp.total)
            if (config.type ==1) {
                var media_id = config.custom.fkey;
                $('.fnc_toggle_cart[data-id="'+media_id+'"]').html('Remove from Lightbox (Cart)')
                    .removeClass('imageview_add').addClass('imageview_remove').attr('cart-item-id', resp.item_id);
            }
        })
    },
    deleteItem: function(e){
        if(e.type != 'dragstop') e.preventDefault();
        var $this = $(this),
            itemId = $(this).attr('cart-item-id') ? $(this).attr('cart-item-id') : $(this).attr('data-id');
        cart.server('deleteItem',{'id':cart.id,'item_id':itemId},function(resp){
            cart.poofRemove(resp.item_id)
            cart.updateTotal(resp.total)
            $this.html('Add to Lightbox (Cart)').removeClass('imageview_remove').addClass('imageview_add');
        })

    },
    /**
    * Will visually add an item to the cart. If the replaced parameter is supplied,
    * it will simply replace
    */
    push: function(html,replaced){
        var obj = $(html)
        if(replaced){
            cart.poofRemove(replaced,function(){
                cart.itemBoxElement.prepend(obj)
                cart.lock = 0
            })
            cart.initDragOut(obj)
            return ;
        }
        cart.itemBoxElement.prepend(obj)
        cart.initDragOut(obj)
        cart.lock = 0
    },
    updateTotal: function(total){
        cart.contentElement.find('[data-iui="price"]').html(total.price)
        cart.contentElement.find('[data-iui="count"]').html(total.count)
        cart.setCheckout(total.num_items);
    },
    /**
    * will remove an item from the list with a poof effect
    * stage parameter is only to be used internally for recursion
    */
    poofRemove: function(id,callback,stage){
        if($("#cart-item-"+id).length==0) return ;
        var sett = cart.poofRemoveSettings
        if(typeof stage == "undefined"){
            stage = 0;
            $("#cart-item-"+id).html('<img src="" alt="" />')
        }
        var img = $("#cart-item-"+id).find('img')
        img.attr('src',sett.resources[stage])
        if(stage<sett.resources.length){
            setTimeout(function(){cart.poofRemove(id,callback,stage+1);},sett.frameDuration)
        } else {
            $("#cart-item-"+id).remove()
            if(typeof callback != "undefined") callback()
        }
    },
    precachePoofRemove: function(){
        for(var res in cart.poofRemoveSettings.resources){
            var img = new Image(49,49)
            img.src = cart.poofRemoveSettings.resources[res]
        }
    },
    renamePopupCallback: function(popElem){
        popElem.find('form').ajaxForm({
            beforeSubmit: function(){
                PopupMgr.showError()
            },
            success: function(resp){
                if(resp.status!=0) return PopupMgr.showError(resp.msg)
                cart.id = resp.cart.id
                cart.init.call(cart)
                PopupMgr.popKill()
            }
        })
        popElem.find('form').find('[data-iui="cancel"]').click(PopupMgr.popKill)
    },
    createPopupCallback: function(popElem){
        popElem.find('form').ajaxForm({
            beforeSubmit: function(){
                PopupMgr.showError()
            },
            success: function(resp){
                if(resp.status!=0) return PopupMgr.showError(resp.msg)
                cart.id = resp.id
                cart.init.call(cart)
                PopupMgr.popKill()
            }
        })
        popElem.find('form').find('[data-iui="cancel"]').click(PopupMgr.popKill)        
    },
    // selects a new cart (initiating it)
    selectCart: function(){
        cart.id = $(this).attr('data-id')
        cart.init()
    },
    /**
     *Handler for "Find similar" button on the AI carts
    */
    findSimilar: function(){
        cart.server('findSimilar',{id:cart.id},function(resp){
            var imgIds = resp.images
            window.location.href = '/search#images:' + imgIds
            cart.itemBoxElement.empty()
        })
    },
    transferPopup: function(){
        PopupMgr.popStart('cart_x/transfer_popup',cart.id)
        return false;
    },
    easterBunny: function(){
        cart.state = 0
        cart.contentElement.effect('explode',{easing: 'easeOutExpo',pieces: 18},600,function(){
            cart.contentElement.show()
            cart.close()
        })
        cart.eBunny = 0
    },
    dragToCartHint: function() {
        cart.element.find('[data-iui="drag_hint"]').show();
        setTimeout(function(){$('#preview').remove();}, 800);
        setTimeout(function(){cart.element.find('[data-iui="drag_hint"]').hide();}, 9000);
        APPINIT.dragToCartHint = 0;
        var new_val = isNaN(APPINIT.userPreferences.cart_drag_hint) ? 1
            : parseInt(APPINIT.userPreferences.cart_drag_hint) + 1;
        $.post('/profile/async_savepref', {cart_drag_hint: new_val});
    }
}

$(document).ready(function() {
    cart.init();
});