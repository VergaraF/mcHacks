// add custom validation to validator
$.validator.addMethod('nodefaulttext', function(value,element) {
    return $(element).attr('data-defaultext') != value;
}, 'Complete this field');

var Authenticate = {
    authCallback: null,
    errors: {
        USER_EXISTS: "Oops. We already have this email in our records. Do you already have an account with us?"
    },
    showPopup: function(msg, template, callback){
        if(!msg) msg = '';
        if(!template) template = 1;
        var params = {msg: msg, template: template}
        PopupMgr.popStart('authenticate',params,function(){
            Authenticate.init()
            if(callback) callback($('#popup_authenticate'))
        });
    },
  
    init: function(){
        Authenticate.initLogin()
        Authenticate.initRegister()
        $('#popup_authenticate').find('[data-form="federated"] a').click(function(e){
            e.preventDefault();
            window.open($(this).attr('href'), '_blank','height=500,width=1000,location=no,menubar=no');
        })
        // login toggler
        $('body').on('click', '#popup_authenticate [data-iui="toggle_login"]', this.toggleLogin);

        $('body').on('click', '.captcha_input, .captcha_refresh', function(){
            $('.captcha_input').attr('src', '/authentication/captcha/?a=' + new Date().getTime());
            return false;
        });        
        
    },
    toggleLogin: function(){
        $('#popup_authenticate_signup').hide();
        $('#popup_authenticate_signin').show();
        $(this).html("Signup screen")
        $(this).unbind()
        $(this).click(Authenticate.toggleSignup)
        return false;
    },
    toggleSignup: function(){
        $('#popup_authenticate_signin').hide();
        $('#popup_authenticate_signup').show();
        $(this).html("Already signed up?")
        $(this).unbind()
        $(this).click(Authenticate.toggleLogin)
        return false;
    },
    initLogin: function(){
        // prepare login form
        $('#popup_authenticate').find('[data-form="authenticate"]').ajaxForm({
            beforeSubmit: function(arr,form){
                // clear any previous feedback
                form.find('section').html('').removeClass('message_error')
            },
            success: Authenticate.loginResponse
        })
    },
    loginResponse: function(resp,status,xhr,form){
        if(resp.status==0){
            if (location.href.indexOf('/image/')!=-1) location.reload();
            Authenticate.updateAreas(resp)
            Authenticate.close(resp)
        } else {
            Authenticate.showError(resp.msg)
        }
    },
    sendDummyLoginRequest: function(){
        $('#popup_authenticate').find('[data-form="authenticate"]').ajaxSubmit({
            success: Authenticate.loginResponse
        })
    },
    countryCodes: [],
    initRegister: function(){
        // validation plugin
        $('#popup_authenticate').find('[data-form="register"]').sValidate({
            rules: {
                name: {required: true, minlength: 3, remote: "/authentication/checkname?register=1"},
                email: {required: true,email: true, remote: "/authentication/checkemail?register=1"}, 
                password: {required: true,minlength: 4},
                captcha: {required: true,minlength: 4,remote: "/authentication/checkcaptcha"},
                company: {minlength: 2},
                phone: {phone: true}
            },
            validators: {
                phone : function(element, value, arg){
                    if (!Authenticate.countryCodes.length) {
                        $('#popup_authenticate_signup select[name=phone_country_prefix] option').each(function(){
                            Authenticate.countryCodes[Authenticate.countryCodes.length] = $(this).val();
                        });
                    }
                    var valid = 0;
                    if(Authenticate.countryCodes.indexOf(value)==-1) valid = true;
                    return valid;                    
                }
            },
            beforeSubmit: function(){
                // visual feedback
                $(this).find('button').html('Submitting..')                
            },
            noSubmit: function(){
                // visual feedback
                $(this).find('button').html('Done! Log me in')                 
            },
            submit: function() {
                $(this).ajaxSubmit({
                    success: function(response,textStatus,xhr){
                        if(response.status==0){
                            // present email confirmation message
                            Authenticate.updateAreas(response, 0);
                            $('#popup_authenticate_1').hide()
                            $('#popup_authenticate_2').show()
                            $('#popup_authenticate_2').find('form').ajaxForm({
                                success: function(resp){
                                    //window.location.href='/profile/bonus';
                                    //return ;    // following code irrelevant after decision to direct to prices page
                                    Authenticate.updateAreas(response);
                                    
                                    if ($('#popup_authenticate_3').html()) {
                                        $('#popup_authenticate_2').hide();
                                        $('#popup_authenticate_3').show();
                                    } else {
                                        Authenticate.close(response);
                                    }    
                                }
                            })                            
                        } else {
                            myJgrowl(response.msg,'error');
                        }
                    }
                })
            },
            errorMessages: {
                name: {
                    required: "Please specify your name",
                    minlength: jQuery.validator.format("Please use your real name. At least {0} characters"),
                    remote: "Please use your real name"
                },
                email: {
                    required: "We need your email address. Can't do without.",
                    email: "Your email address must be in the format of name@domain.tilda.",
                    remote: function(arg,htmlElem){
                        if(arg.status==1){
                            // user is a member
                            $('#popup_authenticate_1').find('[data-iui="heading"]').attr('src','/images/signup/welcome.png').show()
                            Authenticate.toggleLogin.call(Authenticate.getElement().find('[data-iui="toggle_login"]'))
                            Authenticate.getElement().find('[data-form="authenticate"]').find('[name="username"]').val($(htmlElem).val())
                            Authenticate.getElement().find('[data-iui="feedback"]').html('')
                            // check if user also supplied a password then try to log him in
                            var passFieldR = Authenticate.getElement().find('[data-form="register"]').find('[name="password"]')
                            var passFieldL = Authenticate.getElement().find('[data-form="authenticate"]').find('[name="password"]')
                            if(passFieldR.val()!=passFieldR.attr('data-defaultext')){
                                passFieldL.focus()
                                // reassign element because it was changed by focus
                                var passFieldL = Authenticate.getElement().find('[data-form="authenticate"]').find('[name="password"]')
                                // after focus, wait n+1 ms, where n is the custom time used by text-to-password custom transformation code
                                window.setTimeout(function(){
                                    passFieldL.val(passFieldR.val())
                                    Authenticate.getElement().find('[data-form="authenticate"]').submit()
                                },IE_TEXT_TO_PASS_TIMEOUT)
                            }
                            return 'Other screen'; //return 'Use the other screen to log in.';
                        } else {
                            return 'There seems to be a problem reaching your mailbox. Please use a valid email for signup.';
                        }
                    }
                },
                password: {
                    required: "Please choose a password and make sure to memorize it.",
                    nodefaulttext: "Please choose a password and make sure to memorize it."
                },
                captcha: {
                    required: "In order to know that you are a real person, please fill this out.",
                    nodefaulttext: "In order to know that you are a real person, please fill this out.",
                    remote: "Captcha not entered correctly. If you aren't able to see the image, click it to refresh."
                }
            },
            errorLabelContainer: '#popup_authenticate [data-iui="feedback"]'
        });
        
        var registerForm = $('#popup_authenticate').find('[data-form="register"]')
        //
        registerForm.find('[name="phone_country_prefix"]').on('change', function(){
            if (!$(this).val()) return ;
            registerForm.find('[name="phone"]').val($(this).val()).trigger('change')
        })
        // if a country code was supplied, mirror it onto phone field
        if (registerForm.find('[name="phone_country_prefix"]').val()) {
            registerForm.find('[name="phone"]').val(registerForm.find('[name="phone_country_prefix"]').val())
        }
        //
        registerForm.autosave({exclude: ['captcha', 'password']});
    },
    updateAreas: function(resp, with_cart){
        // update APPINIT
        if(resp.user_id){
            APPINIT.userId = resp.user_id
        } else {
            APPINIT.userId = resp.profile.id
        }
        $('#a0').remove();
        $('#a1').html(resp.html.area1)
        $('#a2').html(resp.html.area2)
        $('#top-nav .links').replaceWith(resp.html.navigation)
        main_menu.init();
        
        if (typeof(with_cart)=='undefined') with_cart = 1;
        if (with_cart && cart.id!=resp.cart_id) {
            cart.id = resp.cart_id;
            cart.init();
        }        
    },
    // invoked after successful authentication/registration
    close: function(resp){
        PopupMgr.popKill(function(){
            if(Authenticate.authCallback) Authenticate.authCallback(resp);
        })
        // if any signup gadgets were present, kill them:
        $('[data-gadget="signup"]').remove()
        if(resp && resp.msg)
            myJgrowl(resp.msg,'ok')
    },
    showError: function(msg){
        var fdb = $('#popup_authenticate').find('[data-iui="feedback"]')[0]
        $(fdb).html("<li><label>" + msg + "</label></li>")
        $(fdb).show()
    },
    /**
    * return the popup element. for external usage.
    */
    getElement: function(){
        return $('#popup_authenticate')
    }
}

