
persistence.store.websql.config(persistence, 'CheckSheets', 'CheckSheets db', 5 * 1024 * 1024);
//persistence.store.memory.config(persistence);
persistence.debug = false;


var CheckSheets = persistence.define('checksheets', {
    employee: "TEXT",
    add_date:"DATE",
    resultId:"TEXT",
    created: "DATE",
    status:"INT",
    active:"INT"
});
var AssetCheckSheets = persistence.define('assetchecksheets', {
    created: "DATE",
    version:"INT",
    tableName:"TEXT",
    columnNum:"INT",
    title: "TEXT",
    active:"INT"
});
var AssetCheckSheetItems = persistence.define('assetchecksheetitems', {
    question: "TEXT",
    active:"INT"
});
// var ItemsResults = persistence.define('itemresults', {
//   	created: "DATE",
//     result:"INT",
//     comment:"TEXT",
//     active:"INT"
// });
var Defects = persistence.define('defects', {
    comment:"TEXT",
    status:"INT",
    active:"INT"
});
var DefectPhotos = persistence.define('defectphotos', {
    path:"TEXT",
    status:"INT",
    active:"INT",
    synccount:"INT"
});

var Locations = persistence.define('locations', {
    location_no:"TEXT",
    address:"TEXT",
    description:"TEXT",
    active:"INT"
});

var Towns  = persistence.define('twons', {
    name:"TEXT",
    active:"INT"
});
var Sites  = persistence.define('sites', {
    name:"TEXT",
    active:"INT"
});
var Assets = persistence.define('assets', {
    assetNo:"TEXT",
    assetName:"TEXT",
    active:"INT"
});


AssetCheckSheets.hasOne('asset',Assets);
AssetCheckSheets.hasMany('items',AssetCheckSheetItems,'assetchecksheet');

Assets.hasOne('location',Locations);
Locations.hasOne('site',Sites);
//Addresses.hasOne('site',Sites);
Sites.hasOne('town',Towns);

//CheckSheets.hasMany('results',ItemsResults,'checksheet');
CheckSheets.hasMany('defects',Defects,'checksheet');
CheckSheets.hasOne('assetchecksheet',AssetCheckSheets);

Defects.hasMany('photos',DefectPhotos,'defects');

//ItemsResults.hasOne('checkitem',AssetCheckSheetItems);

Towns.enableSync(Nova.config.remoteAddress + '/api/Options/Towns');
Sites.enableSync(Nova.config.remoteAddress + '/api/Options/Sites');
//Addresses.enableSync(Nova.config.remoteAddress + '/api/Options/Addresses');

Assets.enableSync(Nova.config.remoteAddress + '/api/Options/Assets');
Locations.enableSync(Nova.config.remoteAddress + '/api/Options/Location'); 
Defects.enableSync(Nova.config.remoteAddress + '/api/CheckSheets/Defects');
DefectPhotos.enableSync(Nova.config.remoteAddress + '/api/CheckSheets/DefectPhotos');

CheckSheets.enableSync(Nova.config.remoteAddress + '/api/CheckSheets/CheckSheets');
AssetCheckSheets.enableSync(Nova.config.remoteAddress + '/api/Options/AssetCheckSheets');
AssetCheckSheetItems.enableSync(Nova.config.remoteAddress + '/api/Options/AssetCheckSheetItems');

//ItemsResults.enableSync(Nova.config.remoteAddress + '/api/CheckSheets/ItemsResults');


//ItemsResults.enableSync(Nova.config.remoteAddress + '/api/CheckSheets/ItemsResults');


persistence.schemaSync(function(tx){
     console.log("Update schema success.");

});
