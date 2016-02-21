// Constructor. 
// Create new Dklab_Realplexor object.
/**
 * REDEVELOPED by Yuriy Litvinenko(viking_zp@i.ua)
 * Now supports browsers: FF3.1+, IE8+, Chrome, Safari(5?), Opera10.5+
 * It was redeveloped for prevent using of document.domain
 * 
 */
function Dklab_Realplexor(fullUrl, namespace, viaDocumentWrite)
{
	// Current JS library version.
	var VERSION = "1.32a1";
	var th = this;

	// Detect current page hostname.
	var host = document.location.host;
	
	// Assign initial properties.
	if (!this.constructor._registry) this.constructor._registry = {}; // all objects registry
	this.version = VERSION;
	this._map = {};
	this._realplexor = null;
	this._namespace = namespace;
	this._login = null;
	this._iframeId = "mpl" + (new Date().getTime());
		
	this._iframeTag = 
		'<iframe'
		+ ' id="' + this._iframeId + '"'
		+ ' onload="' + 'Dklab_Realplexor' + '._iframeLoaded(&quot;' + this._iframeId + '&quot;)"'
		+ ' src="' + fullUrl + '?identifier=IFRAME&amp;HOST=' + host + '&amp;version=' + this.version + '"'
		+ ' style="position:absolute; visibility:hidden; width:200px; height:200px; left:-1000px; top:-1000px"' +
		'></iframe>';
	this._iframeCreated = false;
	this._needExecute = false;
	this._executeTimer = null;
	
	// Register this object in the registry (for IFRAME onload callback).
	this.constructor._registry[this._iframeId] = this;

    function listener(event){
        if (event.origin.indexOf(host)==-1) return;
        data = JSON.parse(event.data);
        if ( data.type !== "dklab_realplexor_iframe" )
	        return;
        callbacks = th._map[data.id].callbacks;
        for(var i = 0; i < callbacks.length; i++){
        	callbacks[i].apply(null, data.args);
        }
    }

    if (window.addEventListener){
        window.addEventListener("message", listener,false);
    } else {
        window.attachEvent("onmessage", listener);
    }    
	
	// Validate realplexor URL.
	if (!fullUrl.match(/^\w+:\/\/([^/]+)/)) {
		throw 'Dklab_Realplexor constructor argument must be fully-qualified URL, ' + fullUrl + ' given.';
	}
	var mHost = RegExp.$1;
	if (mHost != host && mHost.lastIndexOf("." + host) != mHost.length - host.length - 1) {
		throw 'Due to the standard XMLHttpRequest security policy, hostname in URL passed to Dklab_Realplexor (' + mHost + ') must be equals to the current host (' + host + ') or be its direct sub-domain.';
	} 
	
	// Create IFRAME if requested.
	if (viaDocumentWrite) {
		document.write(this._iframeTag);
		this._iframeCreated = true;
	}
}

// Static function. 
// Called when a realplexor iframe is loaded.
Dklab_Realplexor._iframeLoaded = function(id)
{
	var th = this._registry[id];
	// use setTimeout to let IFRAME JavaScript code some time to execute.
	setTimeout(function() {
		th._realplexor = true;
		if (th.needExecute) {
			th.execute();
		}
	}, 50);
}

// Set active login.
Dklab_Realplexor.prototype.logon = function(login) {
	this._login = login;
}

// Set the position from which we need to listen a specified ID.
Dklab_Realplexor.prototype.setCursor = function(id, cursor) {
	if (!this._map[id]) this._map[id] = { cursor: null, callbacks: [] };
	this._map[id].cursor = cursor;
	return this;
}

// Subscribe a new callback to specified ID.
// To apply changes and reconnect to the server, call execute()
// after a sequence of subscribe() calls.
Dklab_Realplexor.prototype.subscribe = function(id, callback) {
	if (!this._map[id]) this._map[id] = { cursor: null, callbacks: [] };
	var chain = this._map[id].callbacks;
	for (var i = 0; i < chain.length; i++) {
		if (chain[i] === callback) return this;
	}
	chain.push(callback);
	return this;
}

// Unsubscribe a callback from the specified ID.
// You do not need to reconnect to the server (see execute()) 
// to stop calling of this callback.
Dklab_Realplexor.prototype.unsubscribe = function(id, callback) {
	if (!this._map[id]) return this;
	if (callback == null) {
		this._map[id].callbacks = [];
		return this;
	}
	var chain = this._map[id].callbacks;
	for (var i = 0; i < chain.length; i++) {
		if (chain[i] === callback) {
			chain.splice(i, 1);
			return this;
		}
	}
	return this;
}

// Reconnect to the server and listen for all specified IDs.
// You should call this method after a number of calls to subscribe().
Dklab_Realplexor.prototype.execute = function() {
	// Control IFRAME creation.
	if (!this._iframeCreated) {
		var div = document.createElement('DIV');
		div.innerHTML = this._iframeTag;
		document.body.appendChild(div);
		this._iframeCreated = true;
	}

	// Check if the realplexor is ready (if not, schedule later execution).
	if (this._executeTimer) {
		clearTimeout(this._executeTimer);
		this._executeTimer = null;
	}
	var th = this;
	if (!this._realplexor) {
		this._executeTimer = setTimeout(function() { th.execute() }, 30);
		return;
	}
	var ids = new Array();
	for(var key in this._map) ids[ids.length] = key;
	var window = document.getElementById(this._iframeId).contentWindow;
	var namespace = (this._login != null? this._login + "_" : "") + (this._namespace != null? this._namespace : "");
	if(window.postMessage && JSON){
		var msg = JSON.stringify({type: 'dklab_realplexor_parent', ids: ids, namespace: namespace});
		window.postMessage(msg, '*');
	}
	

}