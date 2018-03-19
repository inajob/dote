var title; // 保存するときなどのためにtitleを設定
var user;
var data;
var isLogin = false;;
var WIDTH = 100;
var HEIGHT = 16;
$.ajax({
  type:"GET",
  url:"../template/pix.html",
  success: function(text){
    $('#body').hide();
    $('#user').hide();
    $('#type').hide();
    $('#lastupdate').hide();
    $(text).appendTo(document.body);

    //$('#text').val($('#body').text());
    title = $('#title').text();
    user = $('#user').text();
    data = $('#body').text();

    $('#favs').append($('<a href="http://b.hatena.ne.jp/entry/'+document.location.href+'" class="hatena-bookmark-button" data-hatena-bookmark-layout="simple" title="このエントリーをはてなブックマークに追加"><img src="http://b.st-hatena.com/images/entry-button/button-only.gif" alt="このエントリーをはてなブックマークに追加" width="20" height="20" style="border: none;" /></a><script type="text/javascript" src="http://b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async"></script>'))
    .append($('<a href="http://twitter.com/share" class="twitter-share-button" data-count="none" data-hashtags="DotE" data-url="'+document.location.href+'">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>'))
    .append($('<iframe src="http://www.facebook.com/plugins/like.php?href='+document.location.href+'&amp;layout=button_count&amp;show_faces=true&amp;width=120&amp;action=like&amp;font&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:200px; height:20px;" allowTransparency="true"></iframe>'))
          ;


    // tw: 誰にでもつくので省略
    $('#h1-title').text(user.replace(/^tw:/,'') + '  /  ' + title);
    init();
  }
});

function dumpDataURL(canvas){
    var s = canvas.toDataURL('image/png');
    return s.replace("data:image/png;base64,",""); // chop base64 header
}


function savePng(tt,s,f){ // title,body(dumpDataURL),callback
  var param = {title:tt,body:s};
  $.ajax({
    type:"POST",
    url: "../action.php?action=save_png",
    data:param,
    success:function(text){
      if(text=="[]"){
      // not log in
      }else{
        // log in
        var e = $.parseJSON(text);
        if(e['success']=="ok"){
          if(f)f();
        }else{
        }
      }
    }
  });
}

function tweetPng(twit,s,f){ // tweet,body(dumpDataURL),callback
    var param = {tweet:twit,body:s};
    $.ajax({
      type:"POST",
      url: "../action.php?action=twit_png",
      data:param,
      success:function(text){
      if(text=="[]"){
        // not log in
      }else{
        // log in
        var e = $.parseJSON(text);
        if(e['success']=="ok"){
          if(f)f();
        }else{
        }
      }
    }
  });
}


function init(){
  var HISTORY = [];  // アンドゥスタック
  var MAP = [];
  var SIZE = 10;
  var MOUSEF = false; // ドラッグ判定用
  var CURSOR = [0,0]; //マウスがある所（カーソル）
  var START = [0,0]; // DOWNしたときの座標を記録
  var PEN = 1;
  var tmp;
  // 中身の初期化
  for(var i = 0; i < WIDTH; i ++){
    tmp = [];
    for(var j = 0; j < HEIGHT; j ++){
      tmp.push(0);
    }
    MAP.push(tmp);
  }
  function clearMap(){
    for(var i = 0; i < WIDTH; i ++){
      for(var j = 0; j < HEIGHT; j ++){
        MAP[i][j] = 0;
      }
    }
  }
  function pushMap(){
    var map = [];
    for(var i = 0; i < WIDTH; i ++){
      tmp = [];
      for(var j = 0; j < HEIGHT; j ++){
        tmp.push(MAP[i][j]);
      }
      map.push(tmp);
    }
    HISTORY.push(map);
  }
  function popMap(){
    if(HISTORY.length > 0){
      MAP = HISTORY.pop();
    }
  }

  function drawMap(ctx,size, col0,col1,col2){
    if(col0 === undefined)col0 = "white";
    if(col1 === undefined)col1 = "black";
    if(col2 === undefined)col2 = "#808080";
    for(var i = 0; i < WIDTH; i ++){
      for(var j = 0; j < HEIGHT; j ++){
        switch(MAP[i][j]){
          case 2:
          ctx.fillStyle=col2;
          break;
          case 1:
          ctx.fillStyle=col1;
          break;
          case 0:
          ctx.fillStyle=col0;
          break;
        }
        ctx.fillRect(i * size, j * size , size, size);
      }
    }
  }
  function drawCursor(ctx,size){
    if(CURSOR){
      ctx.fillStyle="gray";
      ctx.fillRect(CURSOR[0] * size, CURSOR[1] * size , size, size);
    }
  }
  // gridの描画(globalのSIZEを利用）
  function drawGrid(ctx, size, col){
    if(col === undefined)col = "black";
    ctx.lineWidth = 0.5;
    ctx.strokeStyle=col;
    for(var x = 0; x < WIDTH; x ++){
      ctx.beginPath();
      ctx.moveTo(size * x, 0);
      ctx.lineTo(size * x, HEIGHT * size);
      ctx.stroke();
    }
    for(var y = 0; y < HEIGHT; y ++){
      ctx.beginPath();
      ctx.moveTo(0, size * y);
      ctx.lineTo(WIDTH * size, size * y);
      ctx.stroke();
    }
  }

  //保存用にシリアライズ
  function dumpData(){
    var s = "SIZE,"+WIDTH+","+HEIGHT+"\n"; // header
    var tmp;
    s += 'DATA\n';
    for(var i = 0; i < WIDTH; i ++){
      tmp = 0;
      for(var j = 0; j < HEIGHT; j ++){
        s += MAP[i][j] + ',';
      }
      s += '\n';
    }
    return s;
  }

  function loadData(s){
    var lines = s.split(/\n/);
    var tmp;
    var i = 0;
    var width = parseInt(WIDTH);
    var height = parseInt(HEIGHT);
    for(i = 0; i < lines.length; i ++){
      tmp = lines[i].split(',');
      if(tmp[0] == 'DATA'){  // DATAセクションは最後にある
        i ++; // DATAの行を飛ばす
        break;
      }else if(tmp[0] == 'SIZE'){
        WIDTH = width = parseInt(tmp[1]);
        HEIGHT = height = parseInt(tmp[2]);
      }
    }
    // 中身の初期化
    MAP = [];
    for(var k = 0; k < WIDTH; k ++){
      tmp = [];
      for(var j = 0; j < HEIGHT; j ++){
        tmp.push(0);
      }
      MAP.push(tmp);
    }

    ['canv-preview2', 'canv-preview3'].forEach(function(v){
    $('#' + v).attr("width",WIDTH * 3);
    $('#' + v).css("width",WIDTH * 3);
    $('#' + v).attr("height",HEIGHT * 3);
    $('#' + v).css("height",HEIGHT * 3);
    });

    $('#canv').attr("width",WIDTH * 10);
    $('#canv').css("width",WIDTH * 10);
    $('#canv').attr("height",HEIGHT * 10);
    $('#canv').css("height",HEIGHT * 10);

    $('#canv-preview').attr("width",WIDTH);
    $('#canv-preview').css("width",WIDTH);
    $('#canv-preview').attr("height",HEIGHT);
    $('#canv-preview').css("height",HEIGHT);

    $('#canv-pre-twit').attr("width",WIDTH * 4);
    $('#canv-pre-twit').css("width",WIDTH * 4);
    $('#canv-pre-twit').attr("height",HEIGHT * 4);
    $('#canv-pre-twit').css("height",HEIGHT * 4);


    var xpos = 0;
    
    for(; xpos <width; i ++){
      if(lines[i] == undefined){xpos ++; continue;}
      tmp = lines[i].split(',');
      for(var j = 0; j < height; j ++){
        MAP[xpos][j] = parseInt(tmp[j]);
        if(isNaN(MAP[xpos][j]))MAP[xpos][j] = 0;
      }
      xpos ++;
    }
    dumpCode();
  }

  // 84*16
  function dumpCode(){
    var sout = "";
    var lout = [];

    for(var i = 0; i < MAP.length; i ++){
      for( var j = 0; j < MAP[i].length; j ++){
        switch(MAP[i][j]){
          case 0: lout.push("BLACK"); break;
          case 1: lout.push("WHITE"); break;
          case 2: lout.push("GRAY"); break;
        }
      }
    }
    sout = "#include <SPI.h>\n\
#include <Gamebuino.h>\n\
Gamebuino gb;\n\
"
    sout += "const byte data[] PROGMEM = {" + lout.join(",") + "};\n";
    sout += "void setup(){\n\
  gb.begin();\n\
  gb.titleScreen(F(\"DotE\"));\n\
  gb.popup(F(\"Let's go!\"), 100);\n\
}\n\
\n\
void loop(){\n\
  if(gb.update()){\n\
    byte x, y, c, cc;\n\
    x = 0; y = 0;\n\
    for(int i = 0; i < "+WIDTH+"*"+HEIGHT+"; i ++){\n\
      c = pgm_read_byte(data + i);\n\
      switch(c){\n\
        case WHITE: cc= BLACK;break;\n\
        case BLACK: cc= WHITE;break;\n\
        case GRAY:  cc= GRAY; break;\n\
      }\n\
      gb.display.setColor(cc);\n\
      gb.display.drawPixel(x, y);\n\
      y ++;\n\
      if(y >= "+HEIGHT+"){\n\
        y = 0;\n\
        x ++;\n\
      }\n\
    }\n\
  }\n\
}\n\
"

    $("#lcd-code").val(sout);

    // ========================
    sout = "#include <Arduboy.h>\n\
Arduboy arduboy;\n\
AbPrinter text(arduboy);\n\
"
    sout += "const byte data[] PROGMEM = {" + lout.join(",") + "};\n";
    sout += "void setup() {\n\
  arduboy.begin();\n\
  arduboy.setFrameRate(15);\n\
}\n\
\n\
void loop() {\n\
  if (!(arduboy.nextFrame()))\n\
    return;\n\
  arduboy.clear();\n\
  byte x, y, c, cc;\n\
  x = 0; y = 0;\n\
  for(int i = 0; i < "+WIDTH+"*"+HEIGHT+"; i ++){\n\
    c = pgm_read_byte(data + i);\n\
    arduboy.drawPixel(x, y, c);\n\
    y ++;\n\
    if(y >= "+HEIGHT+"){\n\
      y = 0;\n\
      x ++;\n\
    }\n\
  }\n\
\n\
  arduboy.display();\n\
}\n\
"

    $("#lcd-code2").val(sout);

  }

  function copyMap(fromCanv, toCtx){
    // x3 (300 x 48)  ->  480 x 640
    // 90, 320-24 = 296
    // 100 x 16 -> 400 x 64 
    // 320 - 32 = 288
    toCtx.drawImage(fromCanv,40,288);
  }

  function changePen(pen){
    var col = 'black';
    switch(pen){
      case 0:
        col = 'white';
        break;
      case 1:
        col = 'black';
        break;
      case 2:
        col = '#808080';
        break;
    }
    PEN = pen;
    $('#pen-color').css('background-color', col);
  }

  function redraw(){
    drawMap(ctx,SIZE);
    drawGrid(ctx, SIZE);
    drawMap(ctxPreview,1);
    drawMap(ctxPreview2,3);

    drawMap(ctxPreview3,3, "black","#00ff00","#008000");
    drawGrid(ctxPreview3, 3, "#006000");
  }

  /*
  // 自分専用の出力
  function dumpText(){
    // 画面上半分
    var s = "";
    var tmp;
    for(var i = 0; i < 100; i ++){
      tmp = 0;
      for(var j = 0; j < 8; j ++){
        if(MAP[i][j]){
          tmp = (tmp | (1 << j));
        }
      }
      s += '0x' + tmp.toString(16) + ',';
    }
    s += "\n";
    // 画面下半分
    for(var i = 0; i < 100; i ++){
      tmp = 0;
      for(var j = 8; j < 16; j ++){
        if(MAP[i][j]){
          tmp = (tmp | (1 << (j - 8)));
        }
      }
      s += '0x' + tmp.toString(16) + ',';
    }
    $('text').value = s;
  }
  */
  
  //  =============== init ========================
  KARUKI.check(function(r){
    $('#loginbtn').hide();
    $('#logoutbtn').hide();
    $('#savebtn').hide();
    $('#delbtn').hide();
    $('#saveasbtn').hide();
    $('#clearbtn').hide();
    $('#undobtn').hide();
    $('#postbtn').hide();
    $('#post2btn').hide();
    $('.is-new').hide();

    if(title == 'new'){
      $('.is-new').show();
    }

    switch(r.status){
      case "logout":
        // logout now
        $('#loginbtn').show();
        break;
      case "ok":
        // login now
        isLogin = true;
        $('#logoutbtn').show();
        $('#saveasbtn').show();
        $('#postbtn').show();
        $('#clearbtn').show();
        $('#undobtn').show();
        $('#postbtn').show();
        $('#post2btn').show();
        if(user == KARUKI.getUserId()){
          // 作者本人の場合
          $('#savebtn').show();
          $('#delbtn').show();
        }else{
          // 作者ではない場合
        }
        break;
      case "fail":
        throw "fail";
        break;
      default:
        throw "unknown status";
    }
  });

  // コントロールUIの機能設定
  $('#loginbtn').click(function(){
    KARUKI.login();
  });
  $('#logoutbtn').click(function(){
    KARUKI.logout();
  });
  $('#delbtn').click(function(){
    if(!confirm('DELETE?')){
      return
    }
    KARUKI.del(title, function(r){
      switch(r.status){
        case 'ok':
          alert("delete ok");
          document.location.href='../dote.html';
        break;
        case 'logout':
          alert("logout now");
          break;
        case 'fail':
          throw "server fail";
          break;
        default:
          throw "unknown resoponse";
      }
    });
  });
  $('#savebtn').click(function(){
    //console.log(loadData(dumpData()));
    KARUKI.save(title, dumpData(), function(r){
      switch(r.status){
        case 'ok':
          savePng(title, dumpDataURL(canvPreview2));
          alert('save ok');
        break;
        case 'logout':
          alert('logout now');
        break;
        case 'fail':
          throw "saver fail"
        break;
        default:
          throw "unknown response"
      }
    });
  });
  $('#saveasbtn').click(function(){
    //console.log(loadData(dumpData()));
    var name = prompt("fork先の名前を入力してください\nすでに存在する名前を指定すると上書きします","new name");
    if(!name){
      alert("キャンセルしました");
      return;
    }

    KARUKI.save(name, dumpData(), function(r){
      switch(r.status){
        case 'ok':
          savePng(name, dumpDataURL(canvPreview2));
          alert('save ok');
          document.location.href='./' + KARUKI.getUserId() + ':' + name + '.html';
        break;
        case 'logout':
          alert('logout now');
        break;
        case 'fail':
          throw "saver fail"
        break;
        default:
          throw "unknown response"
      }
    });
  });

  $('#clearbtn').click(function(){
    pushMap();
    clearMap();
    redraw();
  });
  $('#undobtn').click(function(){
    popMap();
    redraw();
  });
 
  $('#postbtn').click(function(){
    var tweet;
    if(tweet = prompt('tweet', title + ' ' + document.location.href)){
      if(tweet.length > 100){
        alert("too long. abort.");
      }else{

        drawMap(ctxPreTwit,4);
        copyMap(canvPreTwit, ctxTwit);
        tweetPng(tweet,dumpDataURL(canvTwit),function(){
          alert('twit done!')
        });
      }
    }
  });
  $('#post2btn').click(function(){
    var tweet;
    if(tweet = prompt('tweet', title + ' ' + document.location.href)){
      if(tweet.length > 100){
        alert("too long. abort.");
      }else{

        drawMap(ctxPreTwit,4, "black","#00ff00","#008000");
        drawGrid(ctxPreTwit, 4, "#006000");
        copyMap(canvPreTwit, ctxTwit);
        tweetPng(tweet,dumpDataURL(canvTwit),function(){
          alert('twit done!')
        });
      }
    }
  });

  $('#blackpen').click(function(){
    changePen(1);
  });
  $('#whitepen').click(function(){
    changePen(0);
  });
  $('#graypen').click(function(){
    changePen(2);
  });


  var canv = $('#canv')[0];
  var ctx = canv.getContext('2d');
  
  var canvPreview = $('#canv-preview')[0];
  var ctxPreview = canvPreview.getContext('2d');
  
  var canvPreview2 = $('#canv-preview2')[0];
  var ctxPreview2 = canvPreview2.getContext('2d');

  var canvPreview3 = $('#canv-preview3')[0];
  var ctxPreview3 = canvPreview3.getContext('2d');

  var canvTwit = $('#canv-twit')[0];
  var ctxTwit = canvTwit.getContext('2d');
  
  var canvPreTwit = $('#canv-pre-twit')[0];
  var ctxPreTwit = canvPreTwit.getContext('2d');
 
  var text = $('#text');
  
  loadData(data); // 読み込み
  changePen(1);
  redraw(); 

  // クリックしたらドットが落ちる
  
  canv.onmouseup = function(e){
    if(isLogin){
      MOUSEF = false;
      var x = Math.floor(e.offsetX/SIZE);
      var y = Math.floor(e.offsetY/SIZE);
      if(x == START[0] && y == START[1]){
        //MAP[x][y] = (MAP[x][y] == 1)?0:1;  //反転
        MAP[x][y] = PEN;
        redraw();
        //dumpText();
      }
      return false;
    }
  }
  canv.onmousedown = function(e){
    if(isLogin){
      pushMap();
      var x = Math.floor(e.offsetX/SIZE);
      var y = Math.floor(e.offsetY/SIZE);
      START[0] = x;
      START[1] = y;
      MOUSEF = true;
      return false;
    }
  }
  
  
  canv.onmousemove = function(e){
    if(isLogin){
      var x = Math.floor(e.offsetX/SIZE);
      var y = Math.floor(e.offsetY/SIZE);
      CURSOR[0] = x;
      CURSOR[1] = y;
  
      if(MOUSEF){ // ドットをONに
        MAP[x][y] = PEN;
  
        redraw();
      }else{
        redraw();
        drawCursor(ctx,SIZE);
      }
    }
  }

  $(document).keydown(function(e){
    //console.log('key',e);
    if(e.ctrlKey && e.keyCode == 90){ // ctrl + z
      popMap();
      redraw();
    }else if(e.keyCode == 49){
      // 1
      changePen(1);
    }else if(e.keyCode == 50){
      // 2
      changePen(2);
    }else if(e.keyCode == 51){
      // 0
      changePen(0);
    }


  })
  
}

