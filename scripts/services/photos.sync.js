if(typeof(Nova) == 'undefined'){
	Nova = {};
}
if(typeof(Nova.services) == 'undefined'){
	Nova.services = {};
}


Nova.services.PhotosSync =  (function(){

	return function(config){
		
		this.config = config;
		this.startSync =function(obj){
			if(!this.db){
				this.db = new Nova.services.db();
			}
			console.log("start photo syncs.");
			var self = obj ? obj : this;
			this.db.getSyncPhotos(function(error,photos){
				var win = function (r,callback) {
				    console.log("Code = " + r.responseCode);
				    console.log("Response = " + r.response);
				    console.log("Sent = " + r.bytesSent);
				    callback(null);
				}

				var fail = function (error,callback) {
				    alert("An error has occurred: Code = " + error.code);
				    console.log("upload error source " + error.source);
				    console.log("upload error target " + error.target);
				    callback(null);
				}
				
				async.each(photos,function(photo,callback){
					console.log("each sync");
					try{
						var ft = new FileTransfer();
						window.resolveLocalFileSystemURL(path, function (photoEntry) {
								console.log("photoEntry success:",photoEntry.fullPath);
								ft.upload(photo.path, encodeURI(config.remoteAddress + "/uploads/save?photo="+photo.id), 
									function(r){ 
										console.log("upload success:");
										photo.status = 1;
										 persistence.flush(function(){
										 	console.log("upload success:",photo.id);
										 	callback(null);
										 });
										win(r,callback);
									},
									function(error){
										console.log("upload fail:");
										fail(error,callback);
									}, options);

							// read file failed download file
							},function(evt){
								console.log("photoEntry fail:",evt);
								var newPath  = cordova.file.dataDirectory +'/'+ defectPhoto.id+'.jpg' ;
								fileTransfer.download(config.remoteAddress+photo.path,
									newPath,
									function(entry){
										console.log("download success:"+entry.fullPath);
										photo.path = entry.fullPath;
										photo.status = 1;
										 persistence.flush(function(){
										 	console.log("download success:",entry.fullPath,photo.id);
										 	callback(null);
										 });
									},
									function(error){
										console.log("download fail:");
										fail(error,callback);
									}, 
									false,
									{}
								);
							});
				
					}catch(e){
						console.log("requestFileSystem err:",e);
						callback(null);
					}
				},function(error){
					console.log("syncTimer: start",self);
					self.syncTimer = setTimeout(function(){
						self.startSync(self);
					},config.syncTime);
				});
			
			});
		};
		this.stopSync = function(){
			if(this.syncTimer) clearTimeout(this.syncTimer);
		}
	}
})();