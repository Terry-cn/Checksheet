var dbservices = new AKHB.services.db();

QUnit.config.autostart = false;


function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
}


dbservices.clear(function(){

	var _nav1 = new navigation({
		server_id:122,
		type:2,
		status:0,
		title:'About AKHB',
		link:'1',
		parent_id:0,
		order_by:1,
		lastModified:'2015-01-07 23:14:16'	
	});
	persistence.add(_nav1);

	persistence.flush(function() {
	  QUnit.start();
	});
	
});

AKHB.user = { 
	id:null, 
	authcode:null,
	deviceid : uuid(),
    os : 'test',
    deviceName : 'browser test'
};

module( "数据库测试" );
QUnit.asyncTest( "数据同步表测试", function(assert) {
	var date = new Date();
	dbservices.setTableLastUpdateTime(null,'sync',date,function(err){
		dbservices.getTableLastUpdateTime('sync',function(err,result){
			result.selectJSON(null,['*'],function(result){
				console.log(result);
			});
			console.log(result.lastUpdatetime(),date);
			assert.ok( result.lastUpdatetime() == date, "Passed!" );
			QUnit.start();
		})
	})
  
});


//module( "Article 测试" );
QUnit.asyncTest( "文章数据表插入和查询测试", function(assert) {
	var _article = {
		id:119,
	  	title: '测试文章',
	  	content: '测试文章内容',
	  	lastModified: new Date(),
	  	type:1,
	  	status:1
	};
	dbservices.setArticle(null,_article,function(err){
		dbservices.getArticleById(_article.id,function(err,result){
			console.log(result);
			assert.ok( result.title() == _article.title, "Passed!" );
			QUnit.start();
		})
	})
  
});
QUnit.asyncTest( "读取菜单JSON", function(assert) {
	dbservices.getNavigations(function(result){
		assert.ok(true, JSON.stringify(result));
		QUnit.start();
	})
});


var syncservices = new AKHB.services.db.DBSync(window.config);

QUnit.test( "数据同步测试", function(assert) {
	assert.expect(2);
 
	var done1 = assert.async();
	var done2 = assert.async();

	syncservices.syncArticle(function(err,result){
		console.log("文章同步完成, Total(" + result + ")");
		assert.ok(result > 0, "文章同步完成, Total(" + result + ")");
		done1();
		//QUnit.start();
	});

	syncservices.syncNavigation(function(err,result){
		console.log("菜单同步完成, Total(" + result + ")");
		assert.ok(result > 0, "菜单同步完成, Total(" + result + ")");
		//QUnit.start();
		done2();
	});
});


