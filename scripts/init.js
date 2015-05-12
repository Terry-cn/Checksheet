
var module = ons.bootstrap('Nova', ['bootstrapLightbox']);
var DB = new Nova.services.db();
var dbSync = new Nova.services.db.DBSync(Nova.config);
var photoSync = new Nova.services.PhotosSync(Nova.config);
//persistence.typeMapper.idType ="INT";
var getServerURL = function(url){
    return Nova.config.remoteAddress + (url.indexOf('/') == 0? url : '/'+url);
}
var ajaxOption = {
   headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept':'*/*'
    }
};
module.controller('AppController',['$scope','$rootScope',function($scope,$rootScope){
    //var scope = $scope;
    $rootScope.$on("BUSY", function(){ 
        $scope.busy = true;
        $scope.waitNetwork = false;
        console.log('emit BUSY',$scope.busy,$scope.$id);
    });
    $rootScope.$on("NOTBUSY", function(){    
        $scope.busy = false;
        $scope.waitNetwork = false;
        console.log('emit NOTBUSY',$scope.busy,$scope.$id);
    });
    $rootScope.$on("WAITINGNETWORK", function(){    
        $scope.busy = true;
        $scope.waitNetwork = true;
        console.log('emit WAITINGNETWORK',$scope.busy,$scope.$id);
    });

}]);

module.controller('LoginController',['$scope','$http','$templateCache','$rootScope',
    function($scope, $http, $templateCache,$rootScope) {
        var rootScope = $rootScope;
        var scope = $scope;
       
        scope.email = "O&Muser1@gmail.com";
        scope.password = "oM11!!";
        scope.login = function(form) {

            if (!form.$valid) {
                console.log(form);
                return false;
            }
            $rootScope.$emit('BUSY');

            $http.post(getServerURL('token'),$.param({
               // withCredentials: true,
                username:scope.email,
                password:scope.password,
                grant_type:'password'
            }),ajaxOption).success(function(data){

                var lastLoginEmail = localStorage.getItem('Email');
                var currentEmail  = $.trim(scope.email.toLowerCase());
                if(lastLoginEmail != currentEmail){
                    DB.clear(function(){
                        loginSuccessed();
                    });
                }else{
                    loginSuccessed();
                }
                function loginSuccessed(){
                    ajaxOption.headers.Authorization = data.token_type + ' '+data.access_token;
                    localStorage.setItem('Authorization',ajaxOption.headers.Authorization);
                    localStorage.setItem('Email',currentEmail);
                    //get user roles name
                    $http.get(getServerURL('api/Account/Roles'),ajaxOption).success(function(roleData){
                        try{
                            dbSync.startSync($http,ajaxOption,$rootScope);
                        }catch(e){
                            setTimeout(function(){
                                dbSync.startSync($http,ajaxOption,$rootScope);
                            },60000);
                        }

                        localStorage.setItem('Roles',JSON.stringify(roleData.Roles));
                        localStorage.setItem('Name',roleData.Name);
                        //register Role function
                        window.isInRole = function(role){
                            var roles = JSON.parse(localStorage.getItem('Roles'));
                            return roles.indexOf(role) > -1;
                        };
                        //console.log(window.isInRole("Checksheet Admin"));
                        photoSync.startSync();
                        // ons.notification.alert({
                        //     message:data.access_token
                        // });
                        //console.log(data,data.access_token);
                        $rootScope.$emit('NOTBUSY');
                        myNavigator.pushPage("pages/list.html");
                    })
                }
              
            }).error(function(err){
                //console.log(err);
                if(err && err.error_description){
                    ons.notification.alert({
                        message:err.error_description
                    });
                }
                $rootScope.$emit('NOTBUSY');
            });
            return false;
            //myNavigator.pushPage("pages/list.html");
        };
}]);
module.controller('ChecksheetListController',['$scope','$http','$templateCache','$rootScope',
    function($scope, $http, $templateCache,$rootScope) {
        function loadCheckList() {
            //$templateCache.put('model',null);
            DB.getCheckSheets(function (err, results) {
                $scope.$apply(function () {
                    $scope.CheckSheets = results;
                });
            })
        };
        $scope.addChecksheet = function(){
            $templateCache.put('model',null);
            myNavigator.pushPage('pages/edit_check_sheet.html')
        }
        $scope.itemClick = function (item) {
            $templateCache.put('model',item);
            myNavigator.pushPage("pages/edit_check_sheet.html");
        };
        loadCheckList();
        $scope.$on('refreshCheckList', loadCheckList);

        $scope.syncOff = function(){
            dbSync.stopSync();
            photoSync.stopSync();
        }

        $scope.canEdit = window.isInRole("Checksheet Admin") || window.isInRole("Checksheet Resource");
}]);

module.config(function (LightboxProvider) {
  // set a custom template
  LightboxProvider.templateUrl = 'pages/lightbox-modal.html';
});
module.controller('LightboxController',function($scope,Lightbox){
    $scope.openLightboxModal = function (images,index) {
        if( !window.isInRole("Checksheet Admin") && !window.isInRole("Checksheet Resource"))
            return;
        Lightbox.canEdit = true;
        Lightbox.removePhoto = function(){
            var lightbox = this;
            console.log(this);
            ons.notification.confirm({
                message: 'Are you delete the photo?',
                callback: function(answer) {
                    // Do something here.

                    if(answer == 1){

                        for(var i=0;i<lightbox.images.length;i++){
                            if(lightbox.image == lightbox.images[i]){
                                if(lightbox.image.id.length == 32){
                                    DB.DeletePhoto(lightbox.image.id,function(err){
                                       
                                    });
                                }
                                lightbox.images.splice(i,1);
                                console.log(i,lightbox.images);
                            }
                        }

                        Lightbox.closeModal();
                    }
                }
            });

        }
        Lightbox.openModal(images, index);
    };

});
module.controller('EditChecksheetController',['$scope','$http','$templateCache','$rootScope',
    function($scope, $http, $templateCache,$rootScope) {
       // $('ons-scroller').height($(window).height() - 104);
        $scope.canEdit = window.isInRole("Checksheet Admin") || window.isInRole("Checksheet Resource");
        //if no edit permission return
        if(!$scope.canEdit){

        };

        $scope.townClicked =  function(){
            if(!$scope.isInsert) return;
            DB.getTowns(function(err,towns){
                $templateCache.put('title', 'Choose Town');
                $templateCache.put('command', 'townSelected');
                $templateCache.put('items', towns);
                $scope.siteSelected = false;
                $scope.addressSelected = false;
                $scope.assetSelected = false;
                $scope.sheetSelected = false;
                $scope.model.site = "";
                $scope.model.address = "";
                $scope.model.asset = "";
                $scope.model.sheet = "";
                myNavigator.pushPage("pages/item_choose.html");
            })

        };
        
        $scope.siteClicked =  function(){
            if(!$scope.isInsert) return;
            //if(!fromMain) myNavigator.getCurrentPage().destroy();
            DB.getSites($scope.model.town.id,function(err,sites){
                $templateCache.put('title', 'Choose Site');
                $templateCache.put('command', 'siteSelected');
                $templateCache.put('items', sites);
                $scope.addressSelected = false;
                $scope.assetSelected = false;
                $scope.sheetSelected = false;

                $scope.model.address = "";
                $scope.model.asset = "";
                $scope.model.sheet = "";
                myNavigator.pushPage("pages/item_choose.html");
            })

        };
        $scope.addressClicked =  function(){
            if(!$scope.isInsert) return;
            DB.getAddress($scope.model.site.id,function(err,address){
                $templateCache.put('title', 'Choose Address');
                $templateCache.put('command', 'addressSelected');
                $templateCache.put('items', address);
                $scope.assetSelected = false;
                $scope.sheetSelected = false;
                $scope.model.asset = "";
                $scope.model.sheet = "";
                myNavigator.pushPage("pages/item_choose.html");
            })

        };
        $scope.assetClicked =  function(){
            if(!$scope.isInsert) return;
            DB.getAsset($scope.model.address.id,function(err,Assets){
                $templateCache.put('title', 'Choose Asset');
                $templateCache.put('command', 'assetSelected');
                $templateCache.put('items', Assets);
                $scope.sheetSelected = false;
                $scope.model.sheet = "";
                myNavigator.pushPage("pages/item_choose.html");
            })

        };
        $scope.assetCheckSheetClicked =  function(){
            if(!$scope.isInsert) return;
            DB.getAssetSheets($scope.model.asset.id,function(err,sheets){
                $templateCache.put('title', 'Choose asset check sheets');
                $templateCache.put('command', 'sheetsSelected');
                $templateCache.put('items', sheets);
                myNavigator.pushPage("pages/item_choose.html");
            })

        };
        $scope.next = function(){
            var currentTabIndex = sheetTabs.getActiveTabIndex();
            sheetTabs.setActiveTab(currentTabIndex+1);
            //var items = $('input[name="segment-a"]');
            //$(items[sheetCarousel.getActiveCarouselItemIndex()]).trigger('click');
        };
        $scope.prev = function(){
          var currentTabIndex = sheetTabs.getActiveTabIndex();
            sheetTabs.setActiveTab(currentTabIndex-1);
           // var items = $('input[name="segment-a"]');
           // $(items[sheetCarousel.getActiveCarouselItemIndex()]).trigger('click');
        };
        $scope.$on("townSelected",function(){
            $scope.townSelected = true;
            $scope.model.town = $rootScope.selectedItem;
            $scope.siteClicked();
        });
        $scope.$on("siteSelected",function(){
            console.log('siteSelected');
            $scope.siteSelected = true;
            $scope.model.site = $rootScope.selectedItem;
            $scope.addressClicked();
        });
        $scope.$on("addressSelected",function(){
            $scope.addressSelected = true;
            $scope.model.address = $rootScope.selectedItem;
            $scope.assetClicked();
        });
        $scope.$on("assetSelected",function(){
            $scope.assetSelected = true;
            $scope.model.asset = $rootScope.selectedItem;
            $scope.assetCheckSheetClicked()

        });
        $scope.$on("sheetsSelected",function(){
            $scope.sheetSelected = true;
            $scope.model.sheet = $rootScope.selectedItem;

            if($scope.isInsert){
                var pages = myNavigator.getPages();

                while(pages.length > 4){
                    //myNavigator.getPages()[myNavigator.getPages().length].destroy();
                    pages[pages.length - 1].destroy();
                    
                }
                myNavigator.popPage();
                $scope.model.defects=[];
            }else{

                dbModel.defects.list(function(items){
                    $scope.model.defects = items;
                    items.forEach(function(defect){
                        defect.photos.list(function(results){
                            defect.images = [];
                            results.forEach(function(image){
                                defect.images.push({
                                    id:image.id,
                                    path:image.path,
                                    active:image.active
                                });
                            });
                        })
                    })
                });
            }

            DB.getSheetItems($scope.model.sheet.id,function(err,items){
                $scope.$apply(function(){
                    items.forEach(function(item){
                        if($scope.isInsert){
                            item.result = 2;
                            item.comment= "";
                        }else{
                            dbModel.assetchecksheet.items.list(function(items){
                                
                            });

                        }
                    });
                    $scope.model.results = items;
                    $scope.comments = function(sheet,index){
                        var $this = $('#check-row-'+sheet.server_id);
                        if(index == 2)
                            $this.addClass('active');
                        else
                            $this.removeClass('active');
                    };
                });

            })
        });
        $scope.$watch('tabIndex',function(newValue, oldValue, scope){
            //if(typeof sheetCarousel != 'undefined')  sheetCarousel.setActiveCarouselItemIndex(newValue);
        });
        // setTimeout(function(){
        //     sheetCarousel.setSwipeable(true);
        //     sheetCarousel.on('postchange',function(event){
        //         $scope.tabIndex = event.activeIndex;
        //         var items = $('input[name="segment-a"]');
        //        $(items[event.activeIndex]).trigger('click');
        //     });
        // },500);
        $scope.setActiveCarouse = function (index) {
            //if(typeof sheetCarousel != 'undefined')  sheetCarousel.setActiveCarouselItemIndex(index);
        }
        $scope.addComment = function(){
            if(!$scope.model.defects){
                $scope.model.defects = [];
            }
            var lastComment = $scope.model.defects[$scope.model.defects.length - 1];
            if(!lastComment || lastComment.comment != '') {
                $scope.model.defects.push({
                    comment: '',
                    active:1
                });
            }
        };
        $scope.takePhotos = function(comment){

             var TakePhotoCompleted = function(path) {
                    
                    console.log("takePhotos ",path,device.platform,cordova.file);
                    window.resolveLocalFileSystemURL(path, function (fileEntry) {
                        //var dataDirectory = (device.platform =="iOS") ? cordova.file.documentsDirectory : cordova.file.dataDirectory;
                        // parentEntry = new DirectoryEntry({fullPath: dataDirectory});
                        // console.log("parentEntry ",parentEntry);
                        window.requestFileSystem(LocalFileSystem.PERSISTENT, 1024*1024, function(fs) {
                            fs.root.getDirectory("files", {create:true}, function(dirEntry) {
                                fileEntry.moveTo(dirEntry, persistence.createUUID()+'.jpg', successCallback,errorCallback);
                            }, function(getDirectoryError){
                                 console.log("getDirectoryError",getDirectoryError);
                            });
                          
                        } , function(fsError){
                                 console.log("fsError",fsError);
                            });
                        
                     });
                    
                        
                        function successCallback(entry){
                            //nativeURL: "file:///var/mobile/Applications/8AB3CE37-2461-48D5-A968-3C471C7D58D1/Documents/files/cdv_photo_001.j…"
                            $scope.$apply(function(){
                                if (typeof comment.images == 'undefined') comment.images = [];
                                comment.images.push({'path':entry.nativeURL});
                            });
                            if(!$scope.isInsert && typeof comment.id != 'undefined'){
                                var defectPhoto = new DefectPhotos({
                                    created: new Date(),
                                    path:entry.nativeURL,
                                    active:1,
                                    status:0
                                });
                                
                                if(!comment.images) comment.images = [];
                                comment.images.push({
                                    id:defectPhoto.id,
                                    path:defectPhoto.path,
                                    active:defectPhoto.active
                                });
                                if(comment.photos){
                                    comment.photos.add(defectPhoto);
                                    console.log(defectPhoto);
                                    console.log("add defectPhoto!");
                                    persistence.flush(function(){
                                        console.log("add defectPhoto success!");
                                         //remove to cordova.file.dataDirectory
                                    });
                                }
                           }
                            console.log(entry);
                        };
                        function errorCallback(fileError){
                            console.log("copy photo error",fileError);
                        };
                    
                   
                    
            }
            var onFail = function(message){
                ons.notification.alert({
                    message:message
                });
            }
            try{
                
                navigator.camera.getPicture(TakePhotoCompleted, onFail, {
                    quality : 80,
                    destinationType : Camera.DestinationType.FILE_URI,//这里要用FILE_URI，才会返回文件的URI地址
                    sourceType : Camera.PictureSourceType.CAMERA,
                    allowEdit : true,
                    encodingType : Camera.EncodingType.JPEG,
                   //popoverOptions : CameraPopoverOptions,
                    targetWidth : 1024,
                    targetHeight : 768,
                    saveToPhotoAlbum : true
                });
            }catch(exp){
                console.log(exp,comment);

                var defectPhoto = new DefectPhotos({
                    created: new Date(),
                    path:'images/log.png',
                    active:1,
                    status:1
                });
                if(!comment.images) comment.images = [];
                comment.images.push({
                    id:defectPhoto.id,
                    path:defectPhoto.path,
                    active:defectPhoto.active
                });
                if(comment.photos){
                    comment.photos.add(defectPhoto);
                    console.log("add defectPhoto!");
                    persistence.flush(function(){
                    });
                }
            }
           
        }

        $scope.save = function(){

                if(!$scope.model.sheet || $scope.model.sheet == ''){
                    ons.notification.alert({
                        message:'Please select asset check sheet.',
                        callback:function(){
                            $scope.setActiveCarouse(0);
                        }
                    });
                    return;
                }
                ons.notification.confirm({
                    message:'Ready save check sheet result?.',
                    callback:function(result){

                        //persistence.transaction(function(tx) {
                        if(result == 1){
                            if($scope.isInsert){
                                dbModel = new CheckSheets({
                                    employee: $scope.model.employee,
                                    add_date:$scope.model.add_date,
                                    created: new Date(),
                                    status:0,
                                    active:1
                                });
                                console.log($scope.model.sheet.entity);
                                dbModel.assetchecksheet = $scope.model.sheet.entity;

                                // for(var i=0;i<$scope.model.results.length;i++){
                                //     var checkedItem = new ItemsResults({
                                //         created: new Date(),
                                //         result:$scope.model.results[i].result,
                                //         comment:$scope.model.results[i].comment,
                                //         checkitem:$scope.model.results[i]
                                //     });
                                //     dbModel.results.add(checkedItem);
                                // }
                                for(var i=0;$scope.model.defects && i<$scope.model.defects.length;i++){
                                    var comment = $scope.model.defects[i];
                                    if(comment.comment || (comment.images && comment.images.length > 0)){
                                        var def = new Defects({
                                            created:new Date(),
                                            active:1,
                                            comment:comment.comment,
                                            status:1
                                        });
                                        for(var j=0;comment.images && j< comment.images.length;j++){
                                            var photo = new DefectPhotos({
                                                created: new Date(),
                                                path:comment.images[j].path,
                                                status:0,
                                                active:1
                                            });
                                            def.photos.add(photo);
                                        }
                                        dbModel.defects.add(def);
                                    }
                                }
                                DB.saveCheckSheetResult(null,dbModel.assetchecksheet,$scope.model.results,function(resultId){
                                       dbModel.resultId = resultId;   
                                       persistence.flush(null, function() {
                                       $rootScope.$broadcast('refreshCheckList');
                                       console.log('add flush time:',new Date());
                                        myNavigator.popPage();
                                    });
                                });
                                
                            }else{
                                async.series([
                                        function(callback){
                                            // async.each($scope.model.results,function(currentResult,cb){
                                            //     console.log(currentResult);
                                            //     //DB.getCheckSheetResult(dbModel.assetchecksheet,dbModel.resultId,function(itemResults){
                                            //             var i = 1;
                                            //             dbModel.assetchecksheet.items.list(function(item){
                                            //                 //debugger;
                                                            
                                            //                 itemResults["criteria_"+i] = item.result;
                                            //                 itemResults["criteria_"+i+"_comment"] = item.result;
                                            //                 i++;
                                            //             });
                                            //             cb(null);
                                                  
                                            //     //});
                                                
                                            // },function(err){
                                            //     callback(null);
                                            // });
                                            DB.getCheckSheetResult(dbModel.assetchecksheet,dbModel.resultId,function(itemResults){
                                                for(var i=1;i<=$scope.model.results.length;i++){
                                                    var item = $scope.model.results[i-1];
                                                    itemResults["criteria_"+i] = item.result;
                                                    itemResults["criteria_"+i+"_comment"] = item.comment;
                                                }
                                                persistence.flush(null, function() {
                                                    callback(null);
                                                });
                                            });
                                        },
                                        function(callback){
                                            async.each($scope.model.defects,function(currentDefects,cb){
                                                if(typeof currentDefects.id == 'undefined'){
                                                    var def = new Defects({
                                                        created:new Date(),
                                                        comment:currentDefects.comment,
                                                        status:1
                                                    });
                                                    if(currentDefects.images && currentDefects.images.length > 0){
                                                        if(currentDefects.images.length == 0) cb(null);
                                                        async.each(currentDefects.images,function(photo,inner_callback){
                                                            var dbPhoto = new DefectPhotos({
                                                                created: new Date(),
                                                                path:photo.path,
                                                                status:1
                                                            });
                                                            def.photos.add(dbPhoto);
                                                            inner_callback(null);
                                                        },function(err,result){
                                                            dbModel.defects.add(def);
                                                            cb(null);
                                                        });
                                                    }else{
                                                        dbModel.defects.add(def);
                                                        cb(null);
                                                    }
                                                }else{
                                                    cb(null);
                                                }
                                            },function(err){
                                                callback(null);
                                            });
                                        }
                                    ],function(err){
                                        setTimeout(function(){
                                            persistence.flush(null, function() {
                                                $rootScope.$broadcast('refreshCheckList');
                                                console.log('update flush time:',new Date());
                                                myNavigator.popPage();
                                            });
                                        },500);
                                        
                                });
                                
                            }
                            
                        };
                        //});
                    }
                });
        }

        var dbModel = $templateCache.get('model');

        $scope.isInsert = false;
        $scope.townSelected = true;
        $scope.siteSelected = true;
        $scope.addressSelected = true;
        $scope.assetSelected = true;
        $scope.sheetSelected = true;


        if(!dbModel){
            $scope.isInsert = true;
            $scope.model = {
                employee : localStorage.getItem('Name'),
                add_date : new Date(),
                defects : [],
                results :[],
                town : {},
                site : {},
                address : {},
                asset : {},
                sheet: {},
            }
            $scope.townSelected = false;
            $scope.siteSelected = false;
            $scope.addressSelected = false;
            $scope.assetSelected = false;
            $scope.sheetSelected = false;
            
        }else{
            var assetchecksheet = dbModel.assetchecksheet;
            var asset = assetchecksheet.asset;
            var location = asset.location;
            $scope.model = {
                employee : dbModel.employee,
                add_date : moment(dbModel.add_date).toDate(),
                town : {
                    id:location.id,
                    name:location.site.town.name
                },
                site : {
                    id:location.id,
                    name:location.site.name
                },
                address : {
                    id:location.id,
                    name:location.address
                },
                asset : {
                    id:asset.id,
                    name:asset.assetName
                },
                sheet : {
                    id:assetchecksheet.id,
                    name:assetchecksheet.title
                }
            };
            
            dbModel.assetchecksheet.items.list(function(items){
                DB.getCheckSheetResult(assetchecksheet,dbModel.resultId,function(result){
                    if(result){
                        for(var i=0;i<items.length;i++){
                            var index = i + 1;
                            items[i].result = result["criteria_"+ index];
                            items[i].comment = result["criteria_"+ index+"_comment"];
                        }    
                    }
                })
            });
            dbModel.defects.list(function(items){
                $scope.model.defects = items;
                items.forEach(function(item){
                    item.photos.list(function(results){
                        try{
                            //item.photos = results;
                        }catch(exp){
                            console.log(exp);
                        }
                    });
                })
            });
            
            $rootScope.selectedItem = $scope.model.sheet;
            $scope.$emit("sheetsSelected");
        }

        $scope.tabIndex = 0;
        
        
    }]);
module.controller('ItemsChooseController',['$scope','$http','$templateCache','$rootScope',
    function($scope, $http, $templateCache,$rootScope) {
        var scope = $scope;
        scope.canEdit = window.isInRole("Checksheet Admin") || window.isInRole("Checksheet Resource");
        scope.title = $templateCache.get('title');
        scope.items = $templateCache.get('items');
        scope.command = $templateCache.get('command');
        if(scope.canEdit){
        scope.itemChecked = function(item){
                $rootScope.selectedItem = item;
                $rootScope.$broadcast(scope.command);
                //myNavigator.popPage();
            }
        }
    }]);

//define filter
module.filter('trustHtml', function ($sce) {

    return function (input) {

        return $sce.trustAsHtml(input);

    }

});
module.filter('formatTime', function ($sce) {

    return function (input) {
        if(input){
            var datetime =moment(input);
            datetime.local();
            return $sce.trustAsHtml(datetime.format('YYYY/MM/DD h:mm A'));
        }
            
        return "";
    }

});

module.filter('formatDate', function ($sce) {

    return function (input) {
        if(input)
            return $sce.trustAsHtml(moment(input).format('YYYY/MM/DD'));
        return "";
    }

});

module.filter('formatTime', function ($sce) {

    return function (input) {
        if(input)
            return $sce.trustAsHtml(moment(input).format('h:mm A'));
        return "";
    }

});