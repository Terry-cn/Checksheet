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
		//http://stage.iiuk.homeip.net/Pages/Healthboard_App/webservice.php?type=2&id=[uuid]&os=8.1&device=iphone6s&version=1.0&last_content_synced=2013-12-12
		this.startSync = function($http,ajaxOption,$rootScope){
			
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


			var runSync = function(callback){
				console.log("sync all start");
				var tmpEntityList = window.syncEntityList.concat([]);
				async.each(tmpEntityList,function(item,eachCallback){
					item.syncAll(persistence.sync.preferLocalConflictHandler, function() {
						console.log("sync success",item.meta.name);
						eachCallback();
						console.log(window.syncEntityList.length);
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
					setTimeout(function(){
						runSync(callback);
					},Nova.config.syncTime);
				})
			}
			

		}
		this.stopSync = function(){
			for(var item in persistence.sync.syncTimer){
				console.log('clear timer '+item+';')
				clearTimeout(persistence.sync.syncTimer[item]);
			}
		}
		this.syncLocations = function($http,ajaxOption){
			
			async.waterfall([
					function(callback){
						$http.post(remoteAddress + '/api/Options/Location',{
							lastSync:'2015-01-02',
							Identity:0
						},ajaxOption).success(function(data){
							callback(null,data);
						})
					},function(callback,locations){
						async.each(locations,function(item,callback){

						},function(err){
							callback(null);
						});
					}
				],function(err){

				console.log('pause syncLocations',new Date());
				syncTimer.location = setTimeout(function(err){
					console.log('start syncLocations',new Date());
					syncLocations($http);
				},30000);
			})
		}

		this.syncMessage = function(callback,tx){
				async.waterfall([
						function(callback){
							dbServices.getTableLastUpdateTime('messages',function(err,result){
								var requestData = Request('messages',Nova.user,getLastModified(result));
								var url = remoteAddress+'/webservice.php?'+ decodeURIComponent($.param(requestData));
								callback(null,url);
							});
						},
						function(url,callback){
							$.getJSON(url,function(result){
								callback(null,result);
							});
						},
						function(result,callback){
							if(result.response == 1){    
								var lastModified;
								async.each(result.content,function(_message,callback){
									try{
										dbServices.setMessage(true,_message,callback);
									}catch(err){
										callback(err);
									}
								},function(err){
									callback(null,result.content.length,result.last_content_synced);
								});
							}else{
								callback(null,0,result.last_content_synced);
							}
						},function(affectCount,lastModified,callback){
							dbServices.setTableLastUpdateTime(true,'messages',lastModified,function(err,result){
								console.log('updated messages last_content_synced');
								callback(false,result,affectCount);
							})
						}
					],function(err,result){
						if(err){
							console.log(err,result);
						}else{
							function syncSuccess(){
								console.log("Sync messages success.");
								dbServices.getLatestActiveMessage(function(err,messsage){
									console.log(messsage);
									if(messsage){
										Nova.notification.alert(messsage.content,function(){
											messsage.type = 2;
											persistence.flush(null,function() {
												if(callback && typeof callback == 'function') callback(null,result);
											});
										},messsage.title);
									}else{
										if(callback && typeof callback == 'function') callback(null,result);
									}
									
								});
							}
							if(tx || persistence.flushHooks.length == 0){
								syncSuccess();
							}else{
								persistence.flush(null,function() {
								  syncSuccess();
								});
							}
							
						}
				});
			
		}
		this.syncNavigation = function(callback,tx){

				async.waterfall([
						function(callback){
							dbServices.getTableLastUpdateTime('navigations',function(err,result){
								var requestData = Request('navigation',Nova.user,getLastModified(result));
								var url = remoteAddress+'/webservice.php?'+ decodeURIComponent($.param(requestData));
								callback(null,url);
							});
						},
						function(url,callback){
							$.getJSON(url,function(result){
								callback(false,result)
							});
						},
						function(result,callback){
							if(result.response == 1){    
								var lastModified;
								async.each(result.content,function(navigation,callback){
									try{
										dbServices.setNavigation(true,navigation,callback);
									}catch(err){
										console.log(err);
										callback(err);
									}
								},function(err){
									callback(null,result.content.length,result.last_content_synced);
								});
							}else{
								callback(null,0,result.last_content_synced);
							}
						},function(affectCount,lastModified,callback){
							dbServices.setTableLastUpdateTime(true,'navigations',lastModified,function(result){
								console.log('updated navigations last_content_synced');
								callback(false,result,affectCount);
							})
						}
					],function(err,result){
						if(err){
							console.log(err,result);
						}else{

							function syncSuccess(){
								console.log("Sync navigation success.");
								if(callback && typeof callback == 'function') callback(null,result);
							}
							if(tx || persistence.flushHooks.length == 0){
								syncSuccess();
							}else{
								persistence.flush(null,function() {
								  syncSuccess();
								});
							}
						}
				});
			
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


