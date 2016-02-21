/**
* @author Slavic Dragovtev [slavic@madhazelnut.com]
* @author Yuriy Litvinenko [viking_zp@i.ua]
*/

(function( $ ) {
    var methods = {
        init : function(settings){ 
            var plugin = this;
            plugin.errors = {};
            
            var defaults = {
                beforeSubmit: function(){ //we call it before validate in submit event
                    
                },
                submit: function(){
                    this.submit()
                },
                serverNotRespond: function(){
                    alert("Server doesn't respond. Please try again later");
                }
            }
            plugin.settings = $.extend(true,{
                /**
                 * validator should return:
                 * true
                 * false
                 * 0 - initial state
                 */
                validators: {
                    required: function(element, value, arg){
                        var valid = false
                        if(value!='') valid = true
                        // checkbox special treatment
                        if( $(element).attr('type') == "checkbox" ) valid = $(element).is(':checked')
                        return valid
                    },
                    email: function(element,value, arg){
                        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        valid = re.test(value);
                        return valid
                    },
                    minlength: function(element,value,arg){
                        var valid = false;
                        if(value.length>=arg) valid = true;
                        return valid
                    },
                    remote: function(element,value,arg){
                        var plugin = this
                        var name = element.attr('name');
                        var fData = {}
                        fData[name] = value;
                        if (typeof(plugin.errors[name])=='undefined') plugin.errors[name] = {};
                        plugin.errors[name]['remote'] = 2;
                        $.ajax({
                            url: arg,
                            data: fData,
                            success: function(resp){
                                if (resp.status == 0){
                                    var valid = true
                                } else {
                                    var valid = false
                                }
                                methods.validationFeedback.call(plugin,element,"remote",valid, resp);
                            }
                        });
                        return 0;
                    }
                },
                errorMessages: {
                    _default: {
                        email: "This does not look like an email address",
                        required: "Please complete this field",
                        minlength: function(arg){ return "Please enter at least " + arg + " characters"; },
                        remote: "Remote validation failed"
                    }
                }
            },defaults,settings)
            // add handlers to listen to various change events
            plugin.find('input').add(plugin.find('select')).add(plugin.find('textarea')).bind('change', function(){
                methods.validateField.call(plugin,this)
            })
            plugin.bind('submit',function(e){
                plugin.settings.beforeSubmit.call(this);
                methods.validate.call(plugin,e,this)
            })
            return plugin 
        },
        /**
        * controlRun variable indicates that this 
        */
        validateField: function(elem){
            if(typeof(elem.name)=="undefined" || !elem.name 
            || typeof(this.settings.rules[elem.name])=="undefined") return;
 
            var $elem = $(elem);
            for(var validator in this.settings.rules[elem.name]){
                var value = $.trim($(elem).val())
                var arg = this.settings.rules[elem.name][validator];
                var res = 0;
                if (value.length==0 && validator!='required') {
                    res = 0;
                } else {                    
                    res = this.settings.validators[validator].call(this, $elem, value, arg);
                }
                methods.validationFeedback.call(this, $elem, validator, res, arg);
                if (res===false) return;
            }            
        },
        validate: function(e){
            var plugin = this
            $.data(plugin,'field_checks',{});
            var inputs = plugin.find('input').add(plugin.find('select')).add(plugin.find('textarea'))
            // run the validations
            inputs.each(function(index,element){
                methods.validateField.call(plugin,element)
            });
            //check errors and then we submit if no errors and ajax checkings
            methods.trySubmit.call(plugin,inputs, 300);          
            e.preventDefault();
        },
        
        trySubmit: function(inputs, num) {
            if (num<=0) {
                this.settings.serverNotRespond.call(this);
                return;
            }
            var flag = true;
            var inputs2 = []; 
            var plugin = this;
            inputs.each(function(index,element){
                if (typeof(plugin.errors[element.name])=='undefined') return;
                for(validator in plugin.errors[element.name]){
                    if (plugin.errors[element.name][validator]==1){
                        flag = false;
                    } else if (plugin.errors[element.name][validator]==2) {
                        inputs2[inputs2.length] = element; 
                    }
                } 
            });

            if (!flag) {
                if (typeof(this.settings.noSubmit)=='function'){
                    this.settings.noSubmit.call(this,this.errors);
                }                
            } else if (inputs2.length) {
                setTimeout(function(){ methods.trySubmit.call(plugin,$(inputs2), num-1) },500); 
            } else {
                this.settings.submit.call(this);
            }
        },
        
        validationFeedback: function(element,reason,result,optional){
            var field = $(element).attr('name')
            
            if(result || result===0){
                if (typeof(this.errors[field])!='undefined' 
                && typeof(this.errors[field][reason])!='undefined'
                && (this.errors[field][reason]!=2 || result)) { //result==true or error state is not processing
                    delete this.errors[field][reason];
                }
                if (result) {
                    methods.showConfirmation.call(this,element,reason);
                } else {
                    methods.showInitialState.call(this,element);
                }    
            } else {    
                this.errors[field] = {};
                this.errors[field][reason] = 1;
                methods.showError.call(this,element,reason,optional);
            }
        },
        /**
        * this is a means to execute random error routines, not just to return errors
        */
        getErrorMsg: function(element,reason,ruleVal){
            var rule = element.attr('name')
            if(typeof this.settings.errorMessages[rule]!='undefined' &&
               typeof this.settings.errorMessages[rule][reason]!='undefined'){
               if(typeof this.settings.errorMessages[rule][reason] == 'function'){
                   return this.settings.errorMessages[rule][reason](ruleVal,element)
               } else {
                   return this.settings.errorMessages[rule][reason]
               }
            } else {
                if(typeof this.settings.errorMessages._default[reason] == 'function'){
                    return this.settings.errorMessages._default[reason](ruleVal,element)
                } else {
                    return this.settings.errorMessages._default[reason]
                }
            }
        },
        showError: function(element,reason,ruleVal){
            if (this.settings.inputContainer) {
                var inputCont =  element.parents(this.settings.inputContainer)
                inputCont.removeClass('confirmed').addClass('error')
            } else {
                element.removeClass('confirmed').addClass('error')
                var inputCont =  element.parent()
            }
            if (this.settings.errorLabelContainer) {
                var elemId = element.attr('name')
                var message = methods.getErrorMsg.call(this,element,reason,ruleVal);
                if(!message) return;
                $(this.settings.errorLabelContainer).append(
                    '<li data-for="' + elemId + '"><label>' + message + '</label></li>'
                );
            } else {
                inputCont.find('label[for="' + element.attr('id') + '"]').html(methods.getErrorMsg.call(this,element,reason,ruleVal))
            }
        },
        showConfirmation: function(element){
            if (this.settings.inputContainer) {
                var inputCont = element.parents(this.settings.inputContainer)
                inputCont.removeClass('error').addClass('confirmed')
            } else {
                element.removeClass('error').addClass('confirmed')
            }

            if (this.settings.errorLabelContainer) {
                $(this.settings.errorLabelContainer).find('li[data-for="' + element.attr('name') + '"]').html('');
            } else {
                inputCont.find('label[for="' + element.attr('id') + '"]').html('Ok')
            }
        },
        showInitialState: function(element){
            if (this.settings.inputContainer) {
                var inputCont = element.parents(this.settings.inputContainer)
                inputCont.removeClass('error').removeClass('confirmed')
            } else {
                element.removeClass('error').removeClass('confirmed')
            }

            if (this.settings.errorLabelContainer) {
                $(this.settings.errorLabelContainer).find('li[data-for="' + element.attr('name') + '"]').html('');
            } else {
                inputCont.find('label[for="' + element.attr('id') + '"]').html('')
            }            
        },
        disable: function(){
            this.unbind('submit')
            this.bind('submit',function(){return false;})
        }
    };
    $.fn.sValidate = function(method) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.sValidate' );
        }
    };
})( jQuery );