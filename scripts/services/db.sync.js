if(typeof(Nova) == 'undefined'){
	Nova = {};
}
if(typeof(Nova.services) == 'undefined'){
	Nova.services = {};
}
if(typeof(Nova.services.db) == 'undefined'){
	Nova.services.db = {};
}


Nova.services.db.DBSync =  (function(){
	
	
	var getLastModified = function(result){
		if(!result){
			return '1900-01-01 00:00:00';
		}else{
			return result.lastUpdatetime;
		}
	}

	Request = function(table,user,lastModified){
		return {
			type:2,
			table:table,
			uuid:user.id,
			os:user.os,
			device:user.deviceName,
			version:user.appVersion,
			last_content_synced:moment(lastModified).format('YYYY-MM-DD')
		}
	};

	return function(appConfig){

		window.syncEntityList = [];
		var remoteAddress = appConfig.remoteAddress;
		var dbServices = new Nova.services.db();
		var syncTimer = {};
		window.firstSync = true;
		//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=2&id=[uuid]&os=8.1&device=iphone6s&version=1.0&last_content_synced=2013-12-12
		this.startSync = function($http,ajaxOption,$rootScope){



			var runSync = function(callback){
				console.log("sync all start");
				var tmpEntityList = window.syncEntityList.concat([]);
				async.each(tmpEntityList,function(item,eachCallback){
					item.syncAll(persistence.sync.preferLocalConflictHandler, function() {
						//console.log("sync success",item.meta.name);
						eachCallback();
						//console.log(window.syncEntityList.length);
					}, function(){
						console.log("sync normal",item.meta.name);
						eachCallback();
					}, function(){
						console.log("sync failed",item.meta.name);
						eachCallback();
					});
				},function(err){
					console.log("sync timer start");
					$rootScope.$broadcast('refreshCheckList');
					persistence.sync.syncTimer = setTimeout(function(){
						runSync(callback);
					},Nova.config.syncTime);
				})
			}
			if(window.firstSync){
				window.firstSync = false;
				window.syncEntityList.push(Towns);
				window.syncEntityList.push(Sites);
				window.syncEntityList.push(Assets);
				window.syncEntityList.push(Locations);
				window.syncEntityList.push(AssetCheckSheets);
				window.syncEntityList.push(AssetCheckSheetItems);
				window.syncEntityList.push(CheckSheets);
				window.syncEntityList.push(Defects);
				window.syncEntityList.push(DefectPhotos);
				persistence.sync.initExistsTableSync(function(){
					runSync(runSync);
				});
			}else{
				runSync(runSync);
			}

		}
		this.stopSync = function(){
			console.log('clear timer ;');
			clearTimeout(persistence.sync.syncTimer);
		}


		this.runInBackGround = function(callback){
			var self = this;
			async.series([
				function(callback){
					self.syncArticle(function(){
						callback(null);
					},true);
				},
				function(callback){
					self.syncNavigation(function(){
						callback(null);
					},true);
				},
				function(callback){
					self.syncMessage(function(){
						callback(null);
					},true);
				}
			],function(err){
				persistence.flush(null,function() {
					if(callback && typeof callback == 'function') 
						callback(err);			 
				});
			})
		}
	}
})();


