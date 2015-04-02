if(typeof(AKHB) == 'undefined'){
	AKHB = {};
}
if(typeof(AKHB.utils) == 'undefined'){
	AKHB.utils = function(){};
}

AKHB.utils.exitApp = function(){
	if(navigator.app)
		navigator.app.exitApp();
	else
		alert('Exit App');
}

AKHB.utils.format = function (source, params) {
    if (arguments.length == 1)
        return function () {
            var args = $.makeArray(arguments);
            args.unshift(source);
            return $.format.apply(this, args);
        };
    if (arguments.length > 2 && params.constructor != Array) {
        params = $.makeArray(arguments).slice(1);
    }
    if (params.constructor != Array) {
        params = [params];
    }
    $.each(params, function (i, n) {
        source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
    });
    return source;
};



if(typeof(AKHB.notification) == 'undefined'){
	AKHB.notification = (function(){
		return function(){
		}
	})();
}

AKHB.notification.confirm = function(message,callback,title){
	if(navigator.notification && navigator.notification.alert){
		navigator.notification.confirm(
		    message,  				// message
		    callback,         		// callback
		    title ? title : 'Confirm', // title
		    ['OK','Cancel']         // buttonName
		);
	}else{
		if(confirm(message)){
			callback(0);
		}else{
			callback(1);
		}
	}
};
AKHB.notification.alert = function(message,callback,title){
	if(navigator.notification && navigator.notification.alert){
		navigator.notification.alert(
		    message,  			// message
		    callback,         	// callback
		    title ? title : 'Message',          // title
		    'Done'              // buttonName
		);
	}else{
		alert(message);
		callback();
	}
};
