if(typeof(Nova) == 'undefined'){
	Nova = {};
}
if(typeof(Nova.services) == 'undefined'){
	Nova.services = {};
}
if(typeof(Nova.services.authentication) == 'undefined'){
	Nova.services.authentication = {};
}
//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=1&authcode=Nova&deviceid=12332
//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=1&authcode=wrong&deviceid=12332
Nova.services.authentication = (function(){

	return function(appConfig){

		this.AuthenticationRequest = function(deviceid,authcode){
			return {
				deviceid:deviceid,
				authcode:authcode,
				type:1
			};
		}
		this.isCachedAuthentication = function(){
			var storeAuthentication = localStorage.getItem('Authentication')
			if(!storeAuthentication || storeAuthentication =='') return false;
			return true;
		};
		this.getCachedAuthentication = function(){
			return localStorage.getItem('Authentication')
		};
		this.captureAuthentication = function(data){
			localStorage.setItem('Authentication',JSON.stringify(data));
		};
		this.checkNetworkConnected = function(){
			if(navigator.network && navigator.network.connection && navigator.network.connection.type == Connection.NONE)
				throw new Error('nonetwork');
			return true;
		};
		this.isNetworkConnected = function(){
			return navigator.network && navigator.network.connection && navigator.network.connection.type != Connection.NONE;
		};
		this.isWebserviceWorking = function($http,callback){
			$http({
				url:appConfig.remoteAddress + '/webservice.php',
				timeout:appConfig.timeout,
				type:'GET',
				// success :function(data){
				// 	callback(false,data);
				// },
				// complete : function(XMLHttpRequest,status){
				// 	if(status=='timeout'){
				// 		callback(true,MSG_RETUIREDNETWORK);
				// 	}
				// },
				// transformResponse:function(data, headersGetter, status){
				// 	XMLHttpRequest.abort();
				// 	if(textStatus !='timeout')
				// 		callback(true,MSG_SYSTEMERROR);
				// 	console.log(XMLHttpRequest, textStatus, errorThrown);
				// }
			}).
			success(function(data,status){
				callback(false,data);
			}).
			error(function(data,status,headers,config,statusText){
				//XMLHttpRequest.abort();
				if(statusText !='timeout')
					callback(true,MSG_SYSTEMERROR);
				else
					callback(true,MSG_RETUIREDNETWORK);
				
				console.log(arguments);
			})
		};
		this.checkRemoteAuthentication = function($http,requestData,callback){
			var self = this;
			var url = appConfig.remoteAddress+'/webservice.php?'+ decodeURIComponent($.param(requestData));
			$http({
				url:url,
				timeout:appConfig.timeout,
				type:'GET'
			}).
			success(function(result,status){

				/*
					result:
					{
						type:1
						response: 1 // 1 Authenticated , 2 Failed, 3 Error
						id: [uuid] 
						error:[error code]
					}
				*/
				
				switch(result.response){
                    case 1:
                    	Nova.user.authcode = requestData.authcode;
                        Nova.user.id = result.id;
                        self.captureAuthentication(Nova.user);
                        callback(false,result);
                        break;
                    case 2:
                    	callback(true,MSG_LOGINFAILED);
                        break;
                    case 3:
                    	callback(true,{title:MSG_SYSTEMERROR.title,content : Nova.utils.format(MSG_SYSTEMERROR.content,result.error)});
                        break;
                }


			}).
			error(function(data,status,headers,config,statusText){
				//XMLHttpRequest.abort();
				if(statusText !='timeout')
					callback(true,MSG_SYSTEMERROR);
				else
					callback(true,MSG_RETUIREDNETWORK);
				
				console.log(arguments);
			});
		};
	}
})();
