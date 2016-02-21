/* 
* Structure of this document:
*   - onload init block
*   - utility functions
*   - init functins
*
* Main on load function. Should be.
*/

/**
* Constants
*/
var IE_TEXT_TO_PASS_TIMEOUT = 1;    // used by custom text-to-pass input type transformation code

$(document).ready(function(){
    setupAjaxDefaults();
    passwordRecovery.setup();
    initMiscHelpers();
    if(APPINIT.userId) initActivityLogger();
    gadgetLoader = new PI_GadgetLoader(APPINIT.gadgets); gadgetLoader.load();
    setupPopups();
    notify();
    setupHints();
    inlineEditing();

    if(typeof(APPINIT.is_staff)!='undefined' && APPINIT.is_staff) 
        staff_notification.init(APPINIT.userId);

    user.init();
    livechat.init();

})

// -----------------------------------
// Utility functions
// -----------------------------------

/**
* Customized jGrowl notifications
*/
function myJgrowl(text, image, extra_options) {
    var content = '', container_id = 'notice_jGrowl',
    options = $.extend({}, {
        life: 7000,
        queue: false,
        preserve: true,
        closeTemplate: '',
        closerTemplate: ''
    }, extra_options);
    if(typeof image === 'undefined' && text != 'close') image = 'info';
    if (image) {
        if (image.substring(image.length-4, image.length-3) == '.')
            content += '<img src="' + image + '" class="jGrowl-image" width="49" height="49" alt="Image" />';
        else content += '<img src="/images/jgrowl/' + image + '.png" class="jGrowl-icon" width="30" height="30" alt="Icon" />';
        content +=  '<span class="jGrowl-text">' + text + '</span>';
    }
    else content = text;
    $('#' + container_id).jGrowl(content, options);
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&;').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

/**
* Returns true if the val corresponds to email syntax
*/
function isEmail(val){
    var expression = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return expression.test(val);
}

/**
* Will return the closest multiple of 5
* 
* @param int $value
*/
function step5(value){
    var r = value / 5;
    var rounded = Math.round(r) * 5;
    return rounded;
}


function gaTrackPageView(dynx_itemid, dynx_pagetype, page){
    if (typeof(ga) != 'function') return;
    ga('set', 'dimension1', dynx_itemid);
    ga('set', 'dimension2', dynx_pagetype);
    if (typeof(page)!='undefined') ga('set', 'page', page);
    ga('send', 'pageview'); 
}

/**
* Wrapper for user-related functionality like
* - credits update
*/
var user = {
    
    init: function(){
        $('body').on('click', '#btn_send_confirmation_email', function(event){
            user.sendConfirmationEmail();
            return false;
        }); 

        $('body').on('click', '#btn_set_new_confirmation_email', function(event){
            user.setNewConfirmationEmail();
            return false;
        });          
    },    
    /**
    * Update in-page credits
    */
    updateCredits: function(credits){
        var elem = $('#a1').add($('#a2')).find('[data-iui="credit_balance"]')
        //console.log(elem,credits)
        user.htmlRenew(elem,credits);
    },
    /**
    * Update in-page achievement credit ratio
    */
    updateAchievementRatio: function(data){
        var elem = $('#achievement_ratio')
        user.htmlRenew(elem,Math.round(data.ratio*100) + '%')
        $('.achievement_ratio5').removeClass().addClass('achievement_ratio5 fl progress66 progress66_' + step5(data.ratio*100))
    },
    /**
    * Fades an html string into another one
    */
    htmlRenew: function(elem,data){
        $(elem).html(data)
        $(elem).fadeIn()
    },
    /**
    * Aggregator for all updaters
    */
    updateAll: function(data){
        for(var i in data){
            switch(i){
                case 'credits':
                    user.updateCredits(data[i])
                    break;
                case 'achievements':
                    user.updateAchievementRatio(data[i])
                    break;
            }
        }
    },
    
    sendConfirmationEmail : function(){
        $.ajax({
            url: '/authentication/send_confirmation',
            type: 'GET',
            success: function(data){ 
                if (data.status != 0){
                    myJgrowl(data.msg); 
                    return;
                }                
                $('#popup_verify_email .popup_verify_email').html(data.html);
            }
        });
    },
    
    setNewConfirmationEmail : function(){
        var email = $('#new_confirmation_email').val();
        $('#new_confirmation_email').removeClass('error');
        $.ajax({
            url: '/authentication/set_new_confirmation_email',
            data: {email: email},
            success: function(data){ 
                if (data.status != 0){
                    myJgrowl(data.msg);
                    if (data.status==6) $('#new_confirmation_email').addClass('error');
                    return;
                }
                PopupMgr.popKill();
                myJgrowl(data.msg);
            }
        });        
    }
    
}

/*Javascript Application utility base object with DATABASE stored preference data
* SAMPLE APP CONFIG VARIABLES
*    var MyConfig = {
*        prefVar:   'models',      // Application / DB preference variable name. It is advised to give it a unique name
*    }
*/
var APP =
{
    DBData:     {},
    pageData:   {},
    serverData: {},
    tempData:   {},
    config:     {},
    prefURL:    '/profile/async_savepref',  // URL of DB preference API,
    
    /*
     * Initialize the app abject
     * EXAMPLE USAGE:
     * myApp = APP.constructor(MyConfig);
     */     
    constructor: function (MyConfig) {
        this.config = MyConfig;
        
        if(!this.config) alert('please pass the app configuration variables. See main.js for an example');
        
        if(APPINIT.userPreferences.search_settings && APPINIT.userPreferences.search_settings[this.config.prefVar])
            this.DBData = APPINIT.userPreferences.search_settings[this.config.prefVar];
        
        this.serverData = APPINIT.searchData;
        this.pageData = $.extend(true, {}, this.DBData, this.serverData);
        return this;
    },

    /*
     * Update database stored preference variable
     * 
     * EXAMPLE USAGE:
     * myApp.updatePref('lastname');              //deleted the index
     * myApp.updatePref('firstname', 'SOLOMON');  //created or updated the index plus value
     */
    updatePref: function (index, value, option) {
        if(option == 'reset') this.DBData = {};
        else if(option == 'refresh');
        else {
            if( ! value || value == 0 || value == '')
                delete this.DBData[index];
            else
            this.DBData[index] = value;
        }
        var postData = {search_settings:{}};
        if (index == 'adult' && value) postData.search_settings.adult = value;
        postData.search_settings[this.config.prefVar] = (countProperties(this.DBData) > 0) ? this.DBData : '';
        $.post(this.prefURL, postData);
    },
    
    //Utility functions from here on
    underscoreToText: function (str, capitalise) {
        str = str.replace('_', ' ');
        return capitalise ? this.capitalise(str, capitalise) : str;
    },
    capitalise: function(str, type) {
        if(type == 'firstonly')
            return str.charAt(0).toUpperCase() + str.substring(1);
        else
            return str.replace( /(^|\s)([a-z])/g , function(m,p1,p2){return p1+p2.toUpperCase();} );
    },
    truncate: function(str, limit, extra) {
        if(!str) return '';
        if(!limit) limit = 17;
        if(!extra) extra = "...";
        if(str.length <= limit) return str;
        str = str.trim().substring(0, limit).split(" ").slice(0, -1).join(" ") + extra;
        return str;
    },
    objToBeautifulUrl: function(data) {
        var urlstr = '';
        var search = '';
        
        obj = $.extend(true, {}, data);

        if(obj['image_view'] && obj['image_view'] == this.tempData['image_view']) delete obj['image_view'];
        else delete this.tempData['image_view'];
        if(obj['sort_order'] && obj['sort_order'] == this.tempData['sort_order']) delete obj['sort_order'];
        else delete this.tempData['sort_order'];
        if(obj['page'] && obj['page'] == 1) delete obj['page'];
        if(obj['limit'] && obj['limit'] == this.tempData['limit']) delete obj['limit'];
        else delete this.tempData['limit'];

        if(obj['search'] && obj['search'] != '') {
            search = '/';
            search += obj['search'].replace(/[_|\s\/]+/g, '-');
            delete obj['search'];
            delete obj['images'];
        }
        //preventing similar search if there're others filter fields
        if(obj['images'] && obj['images'] != '') {
            $.each(obj, function(ind, val) {
               var exceptions = ['images', 'limit', 'image_view', 'sort_order', 'page', 'adult']
               if (exceptions.indexOf(ind) == -1) {
                   delete obj['images'];
                   return false;
               }
            });
        }

        $.each(obj, function(ind, val){
            val = (typeof(val) == 'string' && val.length > 0) ? val.replace(/-/g, '\\-') : val;
            var str = '/'+ind+':'+val;
            urlstr += str.replace(/[_|\s]+/g, '-');
        });
        
        searchurlstr = search+urlstr;
        return searchurlstr.substr(1);
    },
    parseBeautifulUrl: function(hash) {        
        if (hash.substr(0, 1) == '#') hash = hash.substr(1);

        var segments = hash.split('/');        
        if ((segments[0].indexOf(':') == -1) && (segments[0] != '')) segments[0] = 'search:' + segments[0];

        var urlParams = {};
        for (i in segments) {
            var data = segments[i].split(':');
            if (typeof data[0] != 'undefined' && typeof data[1] != 'undefined') {
                var index = data[0].replace(/-/g, '_');
                var value = data[1].replace(/\\-/g, '|');
                value = value.replace(/-/g, ' ');
                value = value.replace(/\|/g, '-');
                
                urlParams[index] = value; 
            }
        }

        return urlParams;
    },
    updateBreadcrumb: function() {
        var br_data = $.extend(true, {}, this.pageData);
        
        $.each(br_data, function(ind, val) {
            if(ind == 'limit' || ind == 'image_view' || ind == 'sort_order' || ind == 'page' || val == '' || val == 0)
            delete br_data[ind];
        });
        
        $('.search_breadcrumb').remove();

        var breadcrumb_lists = '';
        var count = countProperties(br_data);
        var thix = this;
        $.each(br_data, function(aa, bb) {
            try{
                var breadcrumb = '';
                var instance = SearchMarkers.getInstance(aa);
                breadcrumb = instance.getBreadcrumb();
            }
            catch(e){/*console.log(e)*/}
            
            if(breadcrumb == '')
                breadcrumb_lists += thix.underscoreToText(aa, true) + ': ' + thix.underscoreToText(bb, true) + '<br>';
            else breadcrumb_lists += breadcrumb + '<br>';
        });

        if(count > 1) {
            $('<li class="search_breadcrumb"><div style="cursor: pointer; text-align:left;" data-ttip="'+breadcrumb_lists+'"><a herf="#">('+count+' Conditions)</a></div></li>').insertBefore('.referral_link');
        }
        else if(count > 0)
            $('<li class="search_breadcrumb"><a herf="#">'+breadcrumb_lists+'</a></li>').insertBefore('.referral_link');
    }
}

/**
* Object that shows a popup with password recovery procedure
*/
var passwordRecovery = {
    'state': 0,         // just a check for the submit button
    'setup': function(){
        var defaultValue = 'Email';
        $(document.body).on('click', '#password_recovery [data-field="email"]',function(){
            if(this.value == defaultValue) this.value = '';
        })
        $(document.body).on('blur', '#password_recovery [data-field="email"]',function(){
            if(this.value == '') this.value = defaultValue;
        })
        $(document.body).on('keyup', '#password_recovery [data-field="email"]',function(){
            if(isEmail(this.value)){
                $.ajax({
                    'url': '/authentication/checkemail',
                    'data': {
                        'email': this.value
                    },
                    'success': function(response){
                        if(response.status==1){
                            passwordRecovery.arm();
                        } else {
                            passwordRecovery.unarm();
                        }
                    }
                })
            } else {
                passwordRecovery.unarm();
            }
        })
        $(document.body).on('click', '#password_recovery .btn_medium',function(){
            if(passwordRecovery.state==1) {
                $.ajax({
                    'url': '/authentication/async_recovery_request',
                    'data': {
                        'email': $('#password_recovery [data-field="email"]').val()
                    },
                    'success': function(response){
                        if(response.status==0){
                            $('#popup .feedback').removeClass('message_error').addClass('message_success').html(response.msg)
                        } else {
                            $('#popup .feedback').removeClass('message_success').addClass('message_error').html(response.msg)
                        }
                    }
                });
            } else {
                $('#popup .feedback').removeClass('message_success').addClass('message_error').html("This is not a good email or we don't have you in our records")
            }
        })
    },
    'arm': function(){
        passwordRecovery.state = 1;
        $('#password_recovery [data-field="email"]').removeClass('blank, valid, error').addClass('valid')
    },
    'unarm': function(){
        passwordRecovery.state = 0;
        $('#password_recovery [data-field="email"]').removeClass('blank, valid, error').addClass('error')
    }
}

/**
* Gadget loaders will collect all gadgets and load them upon document load
*/
function PI_GadgetLoader(data){
    this.gadgets = (typeof data == 'undefined')? [] : data.slice(0);   // copy the gadta rather than reference it
}
PI_GadgetLoader.prototype.load = function(){
    for(var g in this.gadgets){
        var gadgetId = this.gadgets[g].id
        //save APPINIT.gadgets array index
        $('[data-gadget=' + gadgetId + ']').attr('data-gadget_index', g)
        //only load gadgets that are not collapsed
        if(!$('[data-gadget=' + gadgetId + ']').hasClass('collapsed'))
            this.loadSingle(this.gadgets[g].url, this.gadgets[g].data);
        delete this.gadgets[g];
    }
}
PI_GadgetLoader.prototype.loadSingle = function(url, data){
    $.ajax({
        url: url,
        data: data,
        success: function(response){
            $('[data-gadget=' + response.gadgetId + '] .content').html(response.html)
        }
    })
}
PI_GadgetLoader.prototype.add = function(gadget){
    this.gadgets.push(gadget);
}
var gadgetLoader;

var PopupMgr = {
    _cancelled: false,
    _isOpen: false,
    /**
    * Summons a PopupManager popup.
    * 
    * popID identifier of the popup (used to send to a server endpoint); can be split by slash character to indicate controller/action
    * popParam data to send to server
    * callback routine to execute when popup is done creating
    * content optional content data (if set avoids sendign to server side for fetch)
    */
    popStart: function(popID, popParam, callback, content){
    	PopupMgr._isOpen = true;
        PopupMgr._cancelled = false;    // reset cancel flag
        // create the popup container if none exists yet
        if(!document.getElementById('popup')){
            var cont = document.createElement('div')
            cont.id = 'popup'
            $('body').append(cont);
        }
        var data = {id: popID};
        if (typeof popParam != 'undefined' && popParam!=false)
            data.param = popParam;
        $('#popup').html('<span class="popup_loading_state"></span>');
        if(popID.indexOf('/')!=-1){
            var url = "/" + popID;
        } else {
            var url = '/popup/serve';
        }
        if (!content) {
            $.ajax({
                "url": url,
                data: data,
                success: function(response){
                    if(response.status!=0){
                        PopupMgr.popKill()
                        return myJgrowl(response.msg,'error')
                    }
                    PopupMgr.popDo(response.html, callback);
                }
            })
        } else {
            PopupMgr.popDo(content, callback);
        }
        //Fade in Background
        if($('#fade').length == 0)
            $('body').append('<div id="fade"></div>'); //Add the fade layer to bottom of the body tag.
        $('#fade').css({'filter' : 'alpha(opacity=65)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=65)'}) is used to fix the IE Bug on fading transparencies
    },
    popDo: function(html, callback){
        if(PopupMgr._cancelled) return ;
        $('#popup').html(html);
        if (callback) callback($('#popup'));

        $('#popup').find('.popup_block_overflow').prepend('<a href="#" class="close" title="Close"></a>');
        //Define margin for center alignment (vertical horizontal)
        var popMargTop = (($('#popup').children('.popup_block').height()) / 2) + 13; // 13 = Extra padding + border
        var popMargLeft = (($('#popup').children('.popup_block').width()) / 2) + 13; // 13 = Extra padding + border
        //Apply Margin to Popup
        $('#popup').children('.popup_block').css({
            'margin-top' : -popMargTop,
            'margin-left' : -popMargLeft
        });
        //Fade in the Popup and add close button
        $('#popup').fadeIn();
    },
    popKill: function(callback){
        $('#popup').trigger('popClosed');
        $('#fade, .popup_block, .popup_loading_state').fadeOut(function() {
            $('#fade, a.close, .popup_loading_state').remove()
            if(callback && typeof callback == "function") {
                callback()
                callback = null
            }
        });
        PopupMgr._cancelled = true  // prevent popup form callback-forming if it has been cancelled
        PopupMgr._isOpen = false;
    },
    /**
     * Displays an error in the popup's error section, or erases the error if no argument
    */
    showError: function(msg){
        if(typeof msg == "undefined") msg = ""
        $('#popup').find('[data-iui="feedback"]').html(msg)
    },
    
    isOpen: function(){
    	return PopupMgr._isOpen;
    }
}

// -----------------------------------
// Init functions
// -----------------------------------
var activityLogger;
function initActivityLogger(){
     activityLogger = new PI_ActivityLogger({
        serverUrl:'/stats/log_activity',
        frequency:APPINIT.aLogger.frequency,
        maxRuntime:APPINIT.aLogger.defaultMaxRuntime
    });
}

/**
* This will bind a popup handler to all corresponding elements (having a data-popup attribute)
*/
function setupPopups(){
    $(document.body).on('click', '[data-popup]', function(e) {
        e.preventDefault();
        var popID = $(this).attr('data-popup'); //Get Popup Name
        var popParam = $(this).attr('data-poparam');
        var callback = $(this).attr('data-callback');
        PopupMgr.popStart(popID, popParam, callback);
        return false
    })
    // Lightbox/popup closing function
    $(document.body).on('click', '#popup a.close, #fade', function(){
        PopupMgr.popKill()
        return false
    });

    $('#bonus_popover').hover(
        function() { 
            $('#bonus_popover .popover_sub').slideToggle(200).css('borderTopLeftRadius',0);
            $('.top_menu_login_profile').css('borderBottomLeftRadius',0).css('borderBottomRightRadius',0);
        },
        function() { 
            $('#bonus_popover .popover_sub').hide().css('borderTopLeftRadius',5);
            $('.top_menu_login_profile').css('borderBottomLeftRadius',5).css('borderBottomRightRadius',5);
        }
    );
}

/**
* Set some defaults to jquery.ajax method for quicker calls
*/
function setupAjaxDefaults(){
    $.ajaxSetup({
        type: 'POST',
        error: function(jqXHR, textStatus, errorThrown){
            if(jqXHR.status==403 && !APPINIT.userId){
                Authenticate.showPopup(errorThrown)
            }
        },
        dataType: 'json'
    });
}

/**
* This is a function that sets up various hover effects, global tools, popups etc.
*/
function initMiscHelpers(){
    if ($("#gadgets").length) {
        $("#gadgets").sortable({
            axis: "y",
            handle: '.header, .sidebar_whiteborderbox_headder_facebook, .sidebar_whiteborderbox_headder_twitter',
            opacity: 0.6,
            update: function () {saveGadgetState();}
        })
    }

    // Opens up a new window for any element with class new-window
    $('.new-window').bind('click', function(){
        window.open($(this).attr('data-winpopup'), '_blank','height=500,width=1000,location=no,menubar=yes');
        return false;
    })

    // Opens up register frame
    $('#top_menu_reg').bind('click', function(){
//        Authenticate.showPopup()
    })

    // jQuery frame settings
    /*$('#jGrowl_frame').hover(function() {
        $('#jGrowl_settings').stop().animate({ opacity: 'show' });
    }, function() {
        $('#jGrowl_settings').stop().animate({ opacity: 'hide' });
    });*/

    // Custom checkboxes, radiobuttons and select buttons
    $(':checkbox.replacer_checkbox').formReplacer();
    $(':radio.replacer_radiobutton').formReplacer();
    $('select.replacer_select').formReplacer();

    // Make inputs with a default value (label inside) behave
    $(document.body).on('focus', '[data-defaultext]',function(){
        if($(this).val() == $(this).attr('data-defaultext')){
            $(this).val('');
            if($(this).attr('data-defaultype')=='password') {
                $(this).hide()
                var newContent = $('<input name="" type="password" />')
                $(this).after(newContent)
                newContent.attr('name',$(this).attr('name'))
                $(this).attr('name','')
                newContent.addClass($(this).attr('class'))
                var originalContent = $(this)
                newContent.blur(function(){
                    if($(this).val() == ''){
                        originalContent.show()
                        originalContent.attr('name',$(this).attr('name'))
                        $(this).remove()
                    }
                })
                setTimeout(function() { newContent.focus(); }, IE_TEXT_TO_PASS_TIMEOUT); // gues why? starts with IE.
            }
        } 
    })
    $(document.body).on('blur', '[data-defaultext]',function(){
        if($(this).val() == ''){
            $(this).val($(this).attr('data-defaultext'));
        }
    })

    // Tooltips
    attachTooltip('[data-ttip]');


    //Make buttons to behave like a link
    $(document).on('click', '.btn_link', function(e) {
        e.preventDefault()
        location.href = $(this).data('url')
    })

    // go to the link or open popup if user isn't authenticated
    $('.show_auth_popup').click(function() {
        var url = $(this).attr('data-url')
        var goToUrl = function() {
            location.href = url
        }
        if (!APPINIT.userId) {
            var msg = $(this).attr('data-msg')
            Authenticate.showPopup(msg)
            Authenticate.authCallback = goToUrl
        }
        else goToUrl()
        return false
    });

    //preload register popup images for non logged-in users
    var cache_img_files =  [];
    if(!APPINIT.userId) {
        cache_img_files = [
            '/images/signup/bg.png',
            '/images/signup/close_icon.png',
            '/images/signup/social_icons.png',
            '/images/social/yahoo.png',
            '/images/social/google.png',
            '/images/social/aol.png',
            '/images/social/linkedin.png',
            '/images/btns/btn_standard.png',
            '/images/icons/sprite07.png'
        ];
    }
    //tooltip files
    cache_img_files.push('/images/site/tooltip_bg.png');
    cache_img_files.push('/images/site/tooltip_arrow.png');

    for(ind in cache_img_files) {
        var image = new Image();
        image.src = cache_img_files[ind];
    }
    
    // generic content toggle mostly for admin functions
    $('.webelements_cp .webelements_toggle').add('.webelements_cp h3').click(function(){
        $(this).parents('.webelements_cp').find('.webelements_acc').toggle();
        $(this).parents('.webelements_cp').find('.webelements_toggle').toggleClass("webelements_toggle_in");
        $(this).parents('.webelements_cp').find('.webelements_head h3').toggleClass('big')
    })
}

function attachTooltip(elem, default_text){

    $(document.body).on('mouseenter', elem,function(){attachTooltipEvent(this, default_text)});
}

function attachTooltipEvent(elem, default_text){
    var text;
    var maxwidth = $(elem).attr('data-ttipw');
    if(!default_text) text = $(elem).attr('data-ttip');
    else text = default_text;
    if (maxwidth){
        var options = {
            'maxwidth': maxwidth
        }
        new Tooltip(elem,text,options)
    } else {
        new Tooltip(elem,text)
    }
}

//save the current state of gadgets
function saveGadgetState() {
    var page = $("#gadgets").attr('data-page');
    var order = $("#gadgets").sortable("toArray");
    var param = {gadgets:{}};
    var final_order = [];
    var prefix = 'gadget_';
    
    for(i in order) {
        var collapse = $("#"+order[i]).find('div.gadget').is('.collapsed') ? 1 : 0;
        final_order.push(order[i].substr(prefix.length)+'_'+collapse);
    }
    param.gadgets[page] = final_order.join();
    $.post('/profile/async_savepref', param);
}

// Use this to get the length of an object
function countProperties(obj) {
    var count = 0;
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }
    return count;
}

/**
* used to get the bubble messages to the user
*/
function notify() {
    var render_popup = APPINIT.render_popup;

    var popup_id = false;
    var content = false;
    if (render_popup) {
        if (typeof(render_popup.id)!='undefined') {
            popup_id = render_popup.id;
            content = render_popup.content;
        } else {
            popup_id = render_popup;
        }
    }

    if (content) {
        PopupMgr.popStart(popup_id, false, false, content);
    } else if (popup_id) {
        if (render_popup=='authenticate') Authenticate.showPopup('', 2);
        else PopupMgr.popStart(popup_id);
    } 

    if(!APPINIT.notifications) return ;
    for(var i=0; i<APPINIT.notifications.length; i++){
        myJgrowl(APPINIT.notifications[i].message,APPINIT.notifications[i].mood);
    }
}
/**
* Checks if user has the jGrowl hints enabled
*/
function hintsEnabled(){
    return $('#jqrowl_hints_settings').is(':checked');
}
/**
* Checks if user has the jGrowl hints enabled
*/
function setupHints(){
    $('.fReplacedCheckbox#jqrowl_hints_settings').on('click', function(){
        var postData = {};
        postData['hint'] = $(this).is('.selected') ? '1' : '';
        $.post('/profile_x/save_notification_hint', postData);
    });
}

function midTruncate (fullStr, strLen, separator) {
    if (fullStr.length <= strLen) return fullStr;
    
    separator = separator || '...';
    
    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);
    
    return fullStr.substr(0, frontChars) +
           separator +
           fullStr.substr(fullStr.length - backChars);
};

/**
* for hover effect on inline editing
*/
function inlineEditing () {
    $('.edit, .edit_area').hover(function() {$(this).addClass('hover')},function() {$(this).removeClass('hover')});
    $('.edit, .edit_area').click(function() {$(this).removeClass('hover')});
};

function refreshCaptcha(id,link){
    $("#" + id).attr('src',link + '?a=' + new Date().getTime())
    return false
}

/**
* Compatible push state. ("Don't do anything if you can't do it" style)
*/
function pushStateCmpt(state2,title,url)
{
    if (!(window.history && window.history.pushState)) return false;
    window.history.pushState(state2,title,url)
}


// NEW DESIGN

/**
* Makes an element immune to scrolling past a certain point
* 
* @param elem the element to apply the actions to
* @param pos the hold position
*/
function vHoldAt(elem,pos,callback) {

    var initialPos = elem.offset().top
    var delta = initialPos - pos
    $(window).bind('scroll',function() {
        var curScroll = $(this).scrollTop()
        if (curScroll > delta && !elem.data('vfixed')) {
            elem.addClass('vfixed')
            elem.data('vfixed',1)
            elem.css('top', pos)
            if (callback) callback(true)
        } else if(curScroll <= delta && elem.data('vfixed')) {
            elem.removeClass('vfixed')
            elem.data('vfixed',0)
            elem.css('top', '')
            if (callback) callback(false)
        }
    });
}

//menu slide down effect
$(document).ready(function() {
    //init fixed menu menu
    var elem = $('#top-nav')
//    vHoldAt(elem,30, function(state){
//        if (state) {
//            $('#account_bar').addClass('fixed');
//        } else {
//            $('#account_bar').removeClass('fixed');
//        }
//    })

    $('#main_menu > ul > li ul.lvl1').each(function(){
    	if($(this).css('display')=='none') $(this).hide();
    });
    //main menu drop-down effect
    main_menu.init();

    //Textbox effect
//    var default_width = $('#main_menu div.search').width(),
//        default_tb_width = $('#main_search_top').width(),
//        default_as_width = $('#as_search').width();
//    $('#main_search_top').focusin(function() {
//        var diff = $('#main_menu').outerWidth()-$('#main_menu ul.links').outerWidth()
//            -$('#main_menu ul.cart').outerWidth()-$('#main_menu div.search').outerWidth() - 120;
//        if (diff > 0) {
//            diff = (diff > 100) ? 100 : diff;
//            $(this).stop().animate({width:diff+default_tb_width-45},{queue:false,duration:200})
//                .parents('div.search').stop().animate({width:diff+default_width},{queue:false,duration:200});
//            var as_diff = (diff - 100) < 1 ? 0 : (diff - 100);
//            $('#as_search').stop().animate({width:as_diff+default_as_width},{queue:false,duration:200});
//        }
//        $('#search_form_button').fadeIn('fast');
//        if (!$('body').hasClass('wide')) $('#main_menu span.label').hide(200);
//    }).focusout(function() {
//            var $search_box = $(this);
//            // A 20 milliseconds delay should be enough to allow the menu links to be click
//            setTimeout(function() {
//                $search_box.stop().animate({width:default_tb_width},{queue:false,duration:200});
//                $search_box.parents('div.search').stop().animate({width:default_width},{queue:false,duration:200});
//                $('#as_search').css('width', default_as_width);
//                $('#search_form_button').fadeOut('fast');
//                if (!$('body').hasClass('wide')) $('#main_menu span.label').show(200);
//            }, 200);
//
//    });

});

/**
 * 
 * This menu is so complicated because we need in 1 second showing submenu 
 * after user mouseleave from item.
 * There were many funny things while developing :), so be careful when you change it
 * @author Yuriy Litvineko (viking_zp@i.ua)
 * 
 */

var main_menu = {
		opened: {},
        dropdownDelay: 600,
		
		init: function() {
            $('#main_menu').removeClass('css_hide'); //we use css_hide if there are problems with javascript
            $('#main_menu > ul > li').on('mouseenter',
		        function() { 
		            var id = $(this).attr('id');
		            $('#main_menu > ul > li[id!=' + id + '] ul.lvl1').hide();
		            main_menu.lock(id);
		        	$(this).find('ul.lvl1').animate({ "height": "show" }, 125);
		        }
		    ).on('mouseleave',
		        function() {
		            var lvl1 = $(this).find('ul.lvl1');
                	var id = $(this).attr('id');
                    setTimeout(function(){
                        main_menu.unlock(id);
                        if(!main_menu.is_locked(id)) lvl1.hide();
		        	},main_menu.dropdownDelay);
                }
		    );
            //not all links trigger a page load hence, the Need to remove menu once clicked
            $('#main_menu').on('click', 'li', function() {
                $(this).mouseleave();
            });


		    //main menu lvl2 drop-down effect
		    $('#main_menu  ul.lvl1 > li ul').hide();
		    $('#main_menu  ul.lvl1 > li').on('mouseenter', function() {
		        var lvl2 = $(this).find('ul');
		        if(lvl2.length){
                    var win = $(window);
                    var winTop = win.scrollTop();
                    var winHeight = win.height();
                    var lvl2Height = lvl2.outerHeight();
    	    	    		
                    lvl2.css('right', '-' + lvl2.outerWidth() + 'px').slideDown(125);
                    var lvl2Top = $(this).offset().top;
                    var correction = 0;
                            
                    if(lvl2Height>winHeight) correction = winTop - lvl2Top + 25;
                    else correction = winTop + winHeight - lvl2Top - lvl2Height;
                            
                    if(correction>0) correction = 0;
                            
                    lvl2.css('top', correction + 'px'); 
                            
                            
		        }
            }).on('mouseleave', function(){ 
                $(this).find('ul').hide();
            });		
		},
		
		lock: function(id){
			if(typeof(main_menu.opened[id])=='undefined') main_menu.opened[id] = 1; 
			else main_menu.opened[id]++; 
			
		},
		
		unlock: function(id){
			if(typeof(main_menu.opened[id])!='undefined' && main_menu.opened[id]>0) main_menu.opened[id]--;
		},
		
		is_locked: function(id){
			return typeof(main_menu.opened[id])!='undefined' && main_menu.opened[id]>0;
		}
}

var staff_notification = {
    init: function(user_id){
		if(typeof(cometNotifier)!='undefined'){
            var channel = 'staff_' + user_id;
	        cometNotifier.subscribe(channel, this.handleNotifies);
		}
    },

    handleNotifies: function(data){
		for(i in data.notifies){
			var notify = data.notifies[i];
			if(notify.entity=='support'){
				staff_notification.handleSupportNotify(notify);
			}
		}
    },

    handleSupportNotify: function(notify){
		if(notify.event=='reward'){
			staff_notification.loadMsgAboutReward(notify.data.credit_id);
		}
    },

    loadMsgAboutReward: function(credit_id){
        $.ajax({
            'url': '/admin/get_reward_msg/' + credit_id,
            success: function(data){
                if(data.status!=0) return;
                myJgrowl(data.html, '/images/jgrowl/pass.png');
            }
        });
    }


}

var livechat = {
    init: function(){
        if (typeof(LC_API)==='undefined') return false;

        $('body').on('click', '.lnk_livechat_open', function(event){
            if (LC_API.chat_window_minimized()) 
                LC_API.open_chat_window();
            else
                LC_API.minimize_chat_window();
            return false;
        });        
        
        LC_API.on_message = function(data){
            if (data.user_type=='visitor') {
                var visitor_id = LC_API.get_visitor_id();
                $.cookie('livechat_visitor_id', visitor_id, {path:'/', expires:60});
            } else {
                var agent_id = data.agent_login;
                $.cookie('livechat_agent_id', agent_id, {path:'/', expires:60});
            }
        }        
    }
}