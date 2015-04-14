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
						window.resolveLocalFileSystemURL(photo.path, function (photoEntry) {
								
								var url = encodeURI(config.remoteAddress + "/Uploads/Save/"+photo.id);
								console.log("photoEntry success:",photoEntry.nativeURL,url);

								var options = new FileUploadOptions();
								options.fileKey = "file";
								options.fileName = photoEntry.nativeURL.substr(photoEntry.nativeURL.lastIndexOf('/') + 1);
								options.mimeType = "text/plain";


								ft.upload(photo.path, url, 
									function(r){ 
										photo.status = 1;
										persistence.flush(function(){
										 	console.log("upload success:",photo.id);
										 	win(r,callback);
										 });
									},
									function(error){
										console.log("upload fail:");
										fail(error,callback);
									}, options);

							// read file failed download file
							},function(evt){
								
								var url = encodeURI(config.remoteAddress+"/Files/Photo/"+photo.id);
								console.log("photoEntry fail:",evt,url);
								ft.download(url,
									photo.path,
									function(entry){
										console.log("download success:"+entry.nativeURL);
										photo.path = entry.nativeURL;
										photo.status = 1;
										 persistence.flush(function(){
										 	console.log("download success:",entry.nativeURL,photo.id);
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