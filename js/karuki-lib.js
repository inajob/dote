// =====================================
// LIB KARUKI
// =====================================
    KARUKI = {
	_user_id:null,
	_screen_name:null,
	base:"../",
	type:"pix100x16",
	getUserId:function(){
	    if(KARUKI._screen_name != null){
		return 'tw:' + KARUKI._screen_name
	    }else{
		return null;
	    }
	},
	save:function(tt,s,f){ // title, body, next
	    /*
	      [ret]
	      status: logout | ok | fail
	     */
	    var param = {title:tt,body:s,type:KARUKI.type};
	    $.ajax({
		    type:"POST",
			url: KARUKI.base + "action.php?action=save",
			data:param,
			success:function(text){
			var ret = {};
			if(text=="[]"){ // not log in
			    ret.status = 'logout';
			}else{          // log in
			    var e = $.parseJSON(text);
			    if(e['success']=="ok"){
				ret.status = "ok";
			    }else{
				ret.status = "fail";
			    }
			}
			if(f)f(ret);
		    }
		});
	},
	del:function(tt,f){ // title, body, next
	    /*
	      [ret]
	      status: logout | ok | fail
	     */
	    var param = {title:tt};
	    $.ajax({
		    type:"POST",
			url: KARUKI.base + "action.php?action=del",
			data:param,
			success:function(text){
			var ret = {};
			if(text=="[]"){ // not log in
			    ret.status = 'logout';
			}else{          // log in
			    var e = $.parseJSON(text);
			    if(e['success']=="ok"){
				ret.status = "ok";
			    }else{
				ret.status = "fail";
			    }
			}
			if(f)f(ret);
		    }
		});
	},

	check: function(f){	// next
	    /*
	      [ret]
	      status: logout | ok | fail
	      
	      -[ok]
	        user_id: <TWITTER USER ID>
	        screen_name: <TWITTER SCREEN NAME>
	     */
	    function getFirstLine(s){
		return s.split(/[\r\n]+/)[0];
	    }
	    $.ajax({
		    type:"GET",
		    url: KARUKI.base + "action.php?action=check",
		    cache:false,
		    success:function(text){
			var ret = {};
			text = getFirstLine(text);
			if(text=="[]"){                                        // not login
			    ret.status = 'logout';
			}else{                                                 // login
			    var e = $.parseJSON(text);
			    if(e['user_id'] && e['screen_name']){              // log in
				ret.status = 'ok';
				var user = {user_id:e['user_id'],screen_name:e['screen_name']};
				ret.screen_name = user.screen_name;
				ret.user_id  = user.user_id;
				KARUKI._screen_name = ret.screen_name;
				KARUKI._user_id = ret.user_id;
			    }else{                                             // error?
				ret.status = 'fail';
			    }
			}
			if(f)f(ret);
		    }
		});
	},
	load:function(title,user,f){
	    var user = user || KARUKI._screen_name;
	    $.ajax({
		    type:"GET",
			url: KARUKI.base + "data/" + "tw:" + user + ":" + encodeURIComponent(title) + ".html",
			cache:false,
			success:function(text){
			var parser = new DOMParser();
			var xml = parser.parseFromString(text, "text/xml");
			if(f)f(xml);
		    },
			error:function(e){
			
			if(f)f(null,e);
		    }
		});
	},
	files:function(f){
	    $.ajax({
		    type:"GET",
			url: KARUKI.base + "data/files.list",
			cache:false,
			success:function(text){
			if(f)f(text.split("\n"));
		    }
		});
	},
	login:function(){
	    document.location = KARUKI.base + "action.php?action=login&title=" + encodeURIComponent(document.location.hash.replace("#",""));
	},
	logout:function(){
	    $.ajax({
	      type:'GET',
	      url: KARUKI.base + "action.php?action=logout",
	      success:function(){
	        window.location.reload();
	      },
	      error:function(){
	        alert("error");
	      }
	    });
	}
    }


// =====================================
// =====================================
