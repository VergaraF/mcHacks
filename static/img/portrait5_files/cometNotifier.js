/** 
* 
* Object for working with Comet server.
* It is a wrapper for Dklab_Realplexor.
* 
* @author Yuriy Litvinenko (viking_zp@i.ua)
* 
*/
var cometNotifier = {
	
    _realplexor:null,
    _prefix: null,
		
    getRealplexor: function(){
        if (!cometNotifier._realplexor && APPINIT.dklab_realplexor_enable){
            try{
                cometNotifier._realplexor = new Dklab_Realplexor(APPINIT.dklab_realplexor_url);
                cometNotifier._prefix = APPINIT.dklab_realplexor_prefix;
            } catch(e) {
                console.log(e);
                APPINIT.dklab_realplexor_enable = false;
            }
        }
        return cometNotifier._realplexor;
    },
	
    isRealplexorEnable: function(){
        cometNotifier.getRealplexor(); //there could be exception
        return APPINIT.dklab_realplexor_enable;
    },
    
    subscribe: function(channel, handler){
            if(cometNotifier.isRealplexorEnable()){
                var realplexor = cometNotifier.getRealplexor();
                realplexor.subscribe(cometNotifier._prefix + channel, handler);
                realplexor.execute();
            }        
    },

};