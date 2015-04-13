if(typeof(Nova) == 'undefined'){
	Nova = {};
}
if(typeof(Nova.services) == 'undefined'){
	Nova.services = {};
}


Nova.services.PhotosSync =  (function(){

	return function(config){
		
		this.config = config;
		this.startSync =function(){
			if(!this.db){
				this.db = new Nova.services.db();
			}
			console.log("start photo syncs.");
			var self = this;
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
						try{
							var ft = new FileTransfer();
							window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
								fileSystem.root.getFile(path,null,
								//read file success upload file
								function(photoEntry){
									console.log(photoEntry.fullPath);
									ft.upload(photo.path, encodeURI(config.remoteAddress + "/uploads/save?photo="+photo.id), 
										function(r){ 

											photo.status = 1;
											 persistence.flush(function(){
											 	console.log("upload success:",photo.id);
											 	callback(null);
											 });
											win(r,callback);
										},
										function(error){
											fail(error,callback);
										}, options);

								// read file failed download file
								},function(evt){
									var newPath  = cordova.file.dataDirectory +'/'+ defectPhoto.id+'.jpg' ;
									fileTransfer.download(config.remoteAddress+photo.path,
										newPath,
										function(entry){
											photo.path = entry.fullPath;
											photo.status = 1;
											 persistence.flush(function(){
											 	console.log("download success:",entry.fullPath,photo.id);
											 	callback(null);
											 });
										},
										function(error){
											fail(error,callback);
										}, 
										false,
										{}
									);
								});
							});
					
						}catch(e){
							console.log(e);
							callback(null);
						}
					},function(error){
						self.syncTimer = setTimeout(self.startSync,config.syncTime);
					});
			
			});
		};
		this.stopSync = function(){
			if(this.syncTimer) clearTimeout(this.syncTimer);
		}
	}
})();