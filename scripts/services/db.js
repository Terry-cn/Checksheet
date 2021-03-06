if(typeof(Nova) == 'undefined'){
	Nova = {};
}
if(typeof(Nova.services) == 'undefined'){
	Nova.services = {};
}

Nova.services.db =(function(){
	return function(){
		persistence.schemaSync(null,function(){
           
        });
	}
})();

Nova.services.db.prototype.getTableLastUpdateTime = function(tableName,callback){
	var mSync = sync.all()
    .filter('tableName','=',tableName)
    .and(new persistence.PropertyFilter('active', '=', 1));

	mSync.one(null,function(result){
		callback(false,result);
	});
};

Nova.services.db.prototype.getSyncPhotos = function(callback){

    var photos = DefectPhotos.all()
    .prefetch('defects')
    .filter('status','=',0)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .limit(5);
    photos.list(null,function(result){
        console.log("get photos success:",result);
        callback(false,result);
    });
};
Nova.services.db.prototype.DeletePhoto = function(id,callback){
    DefectPhotos.load(id,function(photo){
        if(photo!=null){
            photo.active = 0;
            persistence.flush(function(){
                callback(null);
            })
        }else{
            callback(null);
        }
    });
};
Nova.services.db.prototype.getSyncChecksheets = function(callback){

    var checksheets = CheckSheets.all()
    .filter('status','=',0)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .limit(5);
    checksheets.list(null,function(result){
        callback(false,result);
    });
};

Nova.services.db.prototype.getSyncDefctCount = function(checksheetId,callback){

    var defects = Defects.all()
    .filter('checksheet','=',checksheetId)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .and(new persistence.PropertyFilter('status', '=', 0));
    defects.count(null,function(num){
        callback(false,num);
    });
};

Nova.services.db.prototype.getSyncPhotoCount = function(defectId,callback){

    var photos = DefectPhotos.all()
    .filter('defects','=',defectId)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .and(new persistence.PropertyFilter('status', '=', 0));
    photos.count(null,function(num){
        callback(false,num);
    });
};

Nova.services.db.prototype.setTableLastUpdateTime = function(tx,tableName,lastUpdatetime,callback){
	this.getTableLastUpdateTime(tableName,function(err,result){
		if(!result){
			var _sync = new sync({
				tableName:tableName,
				lastUpdatetime:lastUpdatetime
			});
			persistence.add(_sync);
		}else{
			result.lastUpdatetime = lastUpdatetime;
		}
		if(!tx){
			persistence.flush(function() {
			  callback(false);
			});
		}else{
			callback(false);
		}
		
	});
};

Nova.services.db.prototype.getTowns = function(callback){
	var dbTown = Towns.all().order('name',true).filter('active', '=', 1);
    dbTown.list(null,function(results){
        var townsName = [];
        var towns = [];
        results.forEach(function(town){
            if($.inArray(townsName,town.name) == -1){
                townsName.push(town.id);
                towns.push({name:town.name,id: town.id});
            }
        });
		callback(false,towns);
	})
};
Nova.services.db.prototype.getSites = function(town,callback){
    var dbSite = Sites.all()
    .filter('town','=',town)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .order('name',true);
    dbSite.list(null,function(results){
        console.log(results,'site',town);
        var sitesName = [];
        var sites = [];
        results.forEach(function(site){
            if($.inArray(sitesName,site.name) == -1){
                sitesName.push(site.id);
                sites.push({name:site.name,id: site.id});
            }
        });
        callback(false,sites);
    });
};
Nova.services.db.prototype.getAddress = function(site,callback){
    var dbLocation = Locations.all()
    .filter('site','=',site)
    .and(new persistence.PropertyFilter('active', '=', 1))
    .order('address',true);
    dbLocation.list(null,function(results){
        var locationName = [];
        var locations = [];
        results.forEach(function(location){
            if($.inArray(locationName,location.name) == -1){
                locationName.push(location.id);
                locations.push({name:location.address,id: location.id});
            }
        });
        callback(false,locations);
    })
};
Nova.services.db.prototype.getAsset = function(locationId,callback){
    var assets = Assets.all().filter('location','=',locationId)
        .and(new persistence.PropertyFilter('active', '=', 1))
        .order('assetName',true);
    assets.list(null,function(results){
        var arrAssets = [];
        results.forEach(function(ass){
            arrAssets.push({name:'('+ass.assetNo+')'+ass.assetName,id: ass.id});
        });
        callback(false,arrAssets);
    })
};
Nova.services.db.prototype.saveCheckSheetResult = function(tx,assetchecksheet,results,callback){
    var newid = persistence.createUUID();
    var params = [];
    var columns = [];
    var values = [];
    for(var i=0;i<results.length;i++){
        var index = i+1;
        columns.push("criteria_"+index); 
        params.push("?");
        values.push(results[i].result);

        if(results[i].comment){
            columns.push("criteria_"+index+"_comment"); 
            params.push("?");
            values.push(results[i].comment);
        }
    }
    columns.push("assetchecksheet");
    params.push("?");
    values.push(assetchecksheet.id);

    columns.push("active");
    params.push("?");
    values.push(1);

    columns.push("id");
    params.push("?");
    values.push(newid);

    columns.push("created");
    params.push("?");
    values.push((new Date()).getTime());

    columns.push("_lastChange");
    params.push("?");
    values.push((new Date()).getTime());

    var sql = "INSERT INTO "+ this.getResultsTableName(assetchecksheet) +"\
    ( "+columns.join(",")+" ) \
    VALUES \
    ( "+params.join(",")+"  )";
    persistence.transaction(function(tx) {
        tx.executeSql(sql,values,function(result){
            persistence.flush(tx, function() {
                callback(newid);
            });
            console.log("success:",arguments);
        },function(){
            callback(newid);
            console.log("err:",arguments);
        });
    });
};
Nova.services.db.prototype.getResultsTableName = function(assetchecksheet){
    var tableName = "Results_"+assetchecksheet.tableName+"_v"+assetchecksheet.version;
    return tableName.toLowerCase();
}
Nova.services.db.prototype.getCheckSheetResult =function(assetchecksheet,id,callback){
    var Entity = window.CheckSheetResults[this.getResultsTableName(assetchecksheet)];
    Entity.load(id,function(result){
        callback(result);
    })
}
Nova.services.db.prototype.getAssetSheets = function(assetId,callback){
    var sheets = AssetCheckSheets.all()
        .filter('asset','=',assetId)
        .and(new persistence.PropertyFilter('active', '=', 1))
        .order('title',true);
    sheets.list(null,function(results){
        var arrSheets = [];
        results.forEach(function(sheet){
            arrSheets.push({name:sheet.title,id: sheet.id,entity:sheet});
        });
        callback(false,arrSheets);
    })
};

Nova.services.db.prototype.getSheetItems = function(asset_check_sheets_id,callback){
    var items = AssetCheckSheetItems.all().filter('assetchecksheet','=',asset_check_sheets_id)
        .and(new persistence.PropertyFilter('active', '=', 1))
        .order('id',true);
    items.list(null,function(results){
        callback(false,results);
    })
};

Nova.services.db.prototype.getCheckSheets = function(callback){
    var items = CheckSheets.all()
        .filter('active', '=', 1)
        .prefetch("assetchecksheet")
        .order('id',true);
    items.list(null,function(results){
        async.each(results,function(item,cb){
            item.assetchecksheet.fetch('asset',function(){
                item.assetchecksheet.asset.fetch('location',function() {
                    item.assetchecksheet.asset.location.fetch('site',function() {
                        item.assetchecksheet.asset.location.site.fetch('town',function() {
                            cb(null);
                        });
                    });
                });
            });
        },function(err){
            callback(false,results);
        });

    })
};

Nova.services.db.prototype.setMessageUsed = function(id,callback){

	var mMessages = message.all().filter('id','=',id);
	mMessages.one(null,function(message){
		message.type = 2;
		persistence.flush(function() {
		 	callback(false,message);
		});
	})
};

Nova.services.db.prototype.clear =function(callback){
	persistence.reset(null, function(){
		persistence.schemaSync(function(){
			if(typeof callback == 'function') callback();
		});
	});
};