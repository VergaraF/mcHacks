/**
* @author Slavic Dragovtev [slavic@madhazelnut.com]
*/

(function( $ ) {
    var methods = {
        init : function(settings){
            var plugin = this
            
            var defaults = {
                storage: 'session',
                exclude: []
            }
            plugin.settings = $.extend(true,{
            
            },defaults,settings)
            
            // set storage
            if( typeof(Storage)!=="undefined" ){
                switch(plugin.settings.storage){
                    case 'local':
                        plugin.storage = localStorage
                        break;
                    case 'session': 
                        plugin.storage = sessionStorage
                        break;
                }
            } else {
                $.error( 'Browser does not support storage; Forms will not be autosaved.' );
            }
            
            // retrieve data from previous usage.
            methods.restore.call(plugin)
            
            // add handlers to listen to various change events
            plugin.find('input[type!=file]').add(plugin.find('select')).add(plugin.find('textarea')).bind('keyup', function(){
                methods.save.call(plugin,this)
            }).bind('change',function(){
                methods.save.call(plugin,this)
            })
        },
        save: function(input){
            var formId = $(this).attr('id')
            if (typeof formId == 'undefined') $.error('The form used by autosave does not have an id.')
            formId = formId.replace('-','')
            var name = $(input).attr('name')
            if (!name) return ;
            // exclude the items in exclude list
            var excl = this.settings.exclude
            for(var i in excl){
                if(excl[i] == name) return ;
            }
            var text = $(input).val()
            if (!text){
                return  delete this.storage["autosaver." + formId + "." + name];
            }
            this.storage["autosaver." + formId + "." + name] = text
        },
        /**
        * Will fill the form with stored values.
        */
        restore: function(){
            var formId = $(this).attr('id')
            if(typeof formId == 'undefined') return ;
            formId = formId.replace('-','')
            if(!formId) return;
            var plugin = this
            // add handlers to listen to various change events
            plugin.find('input[type!=file]').add(plugin.find('select')).add(plugin.find('textarea')).each(function(){
                if( typeof plugin.storage["autosaver." + formId + "." + $(this).attr('name')] != 'undefined' ){
                    $(this).val( plugin.storage["autosaver." + formId + "." + $(this).attr('name')] )
                }
            })            
        }
    };
    $.fn.autosave = function(method) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.autosaver' );
        }
    };
})( jQuery );