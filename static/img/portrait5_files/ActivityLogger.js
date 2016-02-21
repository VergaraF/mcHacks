/**
* A class to record page visits and duration.
* Works with jQuery ajax methods.
* config values:
*  - serverUrl   [mandatory]    : server side handler for log requests
*  - frequency   [optional]     : frequency of requests, given in number of seconds between requests
*  - maxRuntime  [optional]     : limits the number of requests by specifying a time limit in seconds
*  - pageId      [optional]     : a unique page id, so that the server is able to differentiate among various page requests
* @author Slavic Dragovtev [slavic@madhazelnut.com]
*/
function PI_ActivityLogger(config){
    var default_frequency = 6000;
    // make config object visible throughtout this class
    this.config = config
    if(!jQuery) throw 'ActivityLogger requires jQuery to run'
    if(!config) throw 'ActivityLogger needs configuration'
    if(!config.serverUrl) throw 'ActivityLogger needs serverUrl parameter'
    if(!config.frequency){
        this.config.frequency = default_frequency
    } else {
        this.config.frequency = this.config.frequency * 1000
    }
    this.config.pageId = null
    // mark start of the app
    var d=new Date();
    this.start = this.currentRun = d.getTime();
    // start the chain
    if(this.shouldSend()) this.sendLogRequest();
    // setup corrections
    var obj = this;
    $(window).bind('unload',function(){
        obj.setCorrection();
    })
    this.secondarySent = false; // secondary requests sent, flag
}

/**
* Will write to session storage (browser) any correction needed for 
* not-waiting for the next request, but rather navigating away to another page.
*/
PI_ActivityLogger.prototype.setCorrection = function(){
    if(!this.shouldSend()) return ;
    if(!this.config.pageId) return ;
    var d=new Date();
    var remaining = d.getTime() - (this.currentRun + this.config.frequency)
    // will only set a correction if the error is big enough
    if(Math.abs(remaining) > 1000){
        sessionStorage.setItem('aLoggerCorrection', Math.round(remaining/1000));
        sessionStorage.setItem('aLoggerCorrectionPage', this.config.pageId);
    }
}

/**
* Will send an activity log request to the server 
* secondary means it is not a request from the main chain. It will still schedule 
* further self-requests if shouldSend() returns false
*/
PI_ActivityLogger.prototype.sendLogRequest = function(secondary) {
    // secondary requests are requests that are manually sent from special pages like search page
    if(secondary && !this.secondarySent){
        // first request from secondary sources happens to be upon page load. We dont'need it.
        this.secondarySent = true
        return ;
    }
    if(secondary == undefined) secondary = false
    // Only send the URI
    var parsed = this.parse_url(window.location)
    var toSend = {uri: parsed.relative};
    if(this.config.pageId) toSend.pageId = this.config.pageId
    var correction = false;
    // if a correction was sent from another page, include it
    if(window.sessionStorage && sessionStorage.getItem('aLoggerCorrection')){
        correction = sessionStorage.getItem('aLoggerCorrection')
        sessionStorage.removeItem('aLoggerCorrection')
    }
    if(correction){
        toSend.timeCorrection = correction
        toSend.timeCorrectionPage = sessionStorage.getItem('aLoggerCorrectionPage')
        sessionStorage.removeItem('aLoggerCorrectionPage')
    }
    var obj = this
    $.ajax({
        url: this.config.serverUrl,
        data: toSend,
        success: function(response){
            if(response.status === 0){
                if(response.pageId){
                    obj.config.pageId = response.pageId
                    var d=new Date();
                    obj.start = obj.currentRun = d.getTime();
                }
            }
        }
    })
    // if conditions meet, schedule another request 
    if(this.shouldSend() && !secondary || !this.shouldSend() && secondary) {
        var obj = this
        var d=new Date();
        this.currentRun = d.getTime();
        setTimeout(function(){ obj.sendLogRequest(); },this.config.frequency);
    }
}

/**
* returns whether the app should continue sennding requests
*/
PI_ActivityLogger.prototype.shouldSend = function(){
    if(!this.config.maxRuntime) return true;
    if(this.config.maxRuntime<0) return false;
    var d=new Date();
    var now = d.getTime();
    if(this.config.maxRuntime * 1000 <= now - this.start) return false;
    return true;
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
PI_ActivityLogger.prototype.parse_url = function (str) {
    var o = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    },
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;
    while (i--) uri[o.key[i]] = m[i] || "";
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });
    return uri;
};