<?php
  // start
require_once("twitteroauth/twitteroauth.php");
require_once("config.php");
// ############################
// CONSTANTS
// ############################

$consumer_key = TW_CONSUMER_KEY;
$consumer_secret = TW_CONSUMER_SECRET;


// ############################
// PARAMETER
// ############################

$method = $_GET['action'];

// ############################
// FILE ACCESS API
// ############################

function checkTitle($title){
  if(mb_strlen($title) > 200){
    return FALSE;
  }
  $count = preg_match('/^[a-zA-Z0-9%_\-ぁ-んァ-ヶー一-龠]+$/',$title);
  return $count == 1;
}
function mkFileName($user,$title,$ext = 'html'){
  if(checkTitle($title)){
    return $user .':' .$title. '.' . $ext;
  }
  return false;
}

function del($user,$title){
  if(checkTitle($title)){
    $fname = DATA_PATH . mkFileName($user,$title);
    #$xml;
    if(file_exists($fname)){
      #remove
      $xml = simplexml_load_string(file_get_contents($fname));
      if($xml->body->div[0] != $user){
	error_log('user error');
	return false;
      }
      $res = unlink($fname);
      if($res){
	mkfiles();
	#require("rsstest.php");
      }
      return $res;
    }
    return false;
  }  
  return false;
}

function writeTmpPng($body){
  // body : base64
  error_log("write tmp");
  $fname = DATA_PATH . 'tmp.png';
  $body = base64_decode($body);
  file_put_contents($fname, $body);
  return true;
}

function writePng($user,$title,$body){
  // body : base64
  // title: filename?
  error_log("write title ".$title);
  if(checkTitle($title)){
    $fname = DATA_PATH . mkFileName($user,$title,'png');
    $body = base64_decode($body);
    file_put_contents($fname, $body);

    // Require GD
    // RESIZE
    $img = imagecreatefrompng($fname);
    $width = ImageSx($img);
    $height = ImageSy($img);

    $out = ImageCreateTrueColor(120,120);

    ImageAlphaBlending($out, false);
    ImageSaveAlpha($out, true);
    $fillcolor = imagecolorallocatealpha($out, 0, 0, 0, 127);
    imagefill($out, 0, 0, $fillcolor);
    ImageCopyResampled($out, $img, 0,0,0,0, 100 * 4,16 * 4, $width, $height);


    $tfname = DATA_PATH . mkFileName($user,$title,'thumb.png');
    ImagePNG($out, $tfname . '');

    return true;
  }else{
    return false;
  }
}

function mkfiles(){
  $files = glob( DATA_PATH . '*.html');
  $flist = array();
  foreach($files as $f){
    $m = filemtime($f);
    $flist[$f] = $m;
  }
  asort($flist);
  $all = $flist; // copy

  $alls = "";
  foreach($all as $f => $d){
    $alls .= basename($f)."\n";
  }
  file_put_contents( DATA_PATH . "files.list", $alls);
}

function write($user,$title,$body,$type){
  error_log("write title ".$title);
  if(checkTitle($title)){
    $fname = DATA_PATH . mkFileName($user,$title);
    #$xml;
    if(file_exists($fname)){
      error_log('exist file '  . $fname);
      $xml = simplexml_load_string(file_get_contents($fname));
      # todo: check parmission
    }else{
      // new file
      error_log('new file ' . $rbody . " " . $fname);
    }

    $xml = new SimpleXmlElement('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja" lang="ja"></html>');
    $ehead = $xml->addChild('head');
    $ebody = $xml->addChild('body');
    $ehead->addChild('title', urldecode($title))->addAttribute('id','title');
    $emeta = $ehead->addChild('meta');
    $emeta->addAttribute('property','og:image');
    $emeta->addAttribute('content',BASE_URL.'data/' . urlencode(mkFileName($user,$title,'png')));
    $ehead->addChild('script','')->addAttribute('src','../js/jquery-2.1.0.min.js');
    $ehead->addChild('script','')->addAttribute('src','../js/loader.js');
    $link = $ehead->addChild('link','');
    $link->addAttribute('rel','stylesheet');
    $link->addAttribute('type','text/css');
    $link->addAttribute('href','../css/style.css');

    $ebody->addChild('pre',str_replace('&','&amp;',$body))->addAttribute('id','body');
    $ebody->addChild('div',$user)->addAttribute('id','user');
    $ebody->addChild('div',$type)->addAttribute('id','type');
    $ebody->addChild('div',time())->addAttribute('id','lastupdate');

    file_put_contents($fname,$xml->asXML());
    # exec mkrss
    #exec ("/usr/bin/php rsstest.php > rss.xml &");
    #require("rsstest.php");
    error_log("title " . $title);
    #$r = append($user,urlencode('/updates/' . strftime('%Y%m%d')), $title, 'wiki');
    #if(!$r){
    #  error_log("error updates");
    #}
    
    return true;
  }else{
    return false;
  }
}


// ############################
// DISPATCHER
// ############################

function redirect( $action ){
    header('Location: ' . 'http://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'] . "?action=" . $action);
    exit;
}

if($method == "login"){
  # ---- LOGIN ----
  session_start();
  if(
     (!isset($_SESSION['oauth_token']) || $_SESSION['oauth_token']===NULL) &&
     (!isset($_SESSION['oauth_token_secret']) || $_SESSION['oauth_token_secret']===NULL)
     ){
    $to = new TwitterOAuth($consumer_key,$consumer_secret);
    $title = $_GET['title'];

    #echo $title;
    $tok = $to->getRequestToken('http://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'] . "?action=callback");
    #$tok = $to->getRequestToken(BASE_URL . "action.php?action=callback");
    // todo:set redirect url ?
    #echo '*'.$_SERVER['HTTP_REFERER'].'*';
    $_SESSION['redirect'] = $_SERVER['HTTP_REFERER'] . '#' . $title;
    $_SESSION['request_token'] = $token = $tok['oauth_token'];
    $_SESSION['request_token_secret'] = $tok['oauth_token_secret'];
    $url = $to->getAuthorizeURL($token);
    #echo "<a href='" . $url . "'>sign in</a><br>" . $title;
    header('Location: ' . $url);
  }else{
    echo "something wrong";
  }
 }elseif($method == "callback"){
   # ---- LOGIN CALLBACK ----
   session_start();
   if(
       (isset($_SESSION['request_token']) && $_SESSION['request_token']!==NULL) &&
       (isset($_SESSION['request_token_secret']) && $_SESSION['request_token_secret']!==NULL) &&
       (isset($_GET['oauth_verifier']) && $_GET['oauth_verifier']) &&
       (!isset($_SESSION['user_id']) || $_SESSION['user_id']===NULL)
     ){
     $title = $_GET['title'];
     $verifier = $_GET['oauth_verifier'];
     $to = new TwitterOAuth($consumer_key,$consumer_secret,$_SESSION['request_token'],$_SESSION['request_token_secret']);
     //var_dump($to->get("account/verify_credentials"));
     $access_token = $to->getAccessToken($verifier);
     #var_dump($access_token);
     
     #var_dump($_SESSION);
     $_SESSION['oauth_token'] = $access_token['oauth_token'];
     $_SESSION['oauth_token_secret'] = $access_token['oauth_token_secret'];
     
     $_SESSION['user_id'] = $access_token['user_id'];
     $_SESSION['screen_name'] = $access_token['screen_name'];
     
     #echo "<div>welcome ".$_SESSION['screen_name']."</div>";
     #echo "<h2><a href='" . $_SESSION['redirect'] . "'>go</a></h2>";
     #echo "<a href='data'>list</a>";
     
     #echo "<pre>";
     #print_r($_SESSION);
     #echo "</pre>";
     unset($_SESSION['redirect_url']);
     header('Location: ' . $_SESSION['redirect']);
   }elseif(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
     ## ---- RE CALLBACK ---- ( unusual )
     echo "reconnect " . $_SESSION['screen_name'];
   }else{
     echo "unknown error";
   }
  }elseif($method == "logout"){
    # ---- LOGOUT ----
    session_start();
    session_destroy();
    echo "logout";
   }elseif($method == "check"){
     # ---- CHECK ----
     session_start();
     
     if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
       echo json_encode(array(
			      "user_id" => $_SESSION['user_id'],
			      "screen_name" => $_SESSION['screen_name']
			      ));
     }else{
       echo json_encode(array());
     }
    }elseif($method == "del"){
      session_start();
      if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
	$user_id = "tw:" . $_SESSION['screen_name'];
	if(get_magic_quotes_gpc()){
		$title = stripslashes($_REQUEST['title']);  # todo:sanitize
	}else{
		$title = $_REQUEST['title'];  # todo:sanitize
	}
	if(!checkTitle($title)){
	  echo json_encode(array(
				 'error' => 'invalid title'
				 ));
	  return;
	}
	if(del($user_id,$title)){
	  echo json_encode(array(
				 'success' => 'ok',
				 'title' => $title,
				 'id' => $user_id
				 ));
	}else{
	  echo json_encode(array(
				 'error' => 'del fail'
				 ));
	}
      }else{
       echo json_encode(array());
      }
     }elseif($method == "twit_png"){
      # ---- SAVE ----
      session_start();
      if(get_magic_quotes_gpc()){
      }
      if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
      # login
	if(!isset($_REQUEST['tweet']) || !isset($_REQUEST['body'])){
	  echo json_encode(array(
				 'error' => 'parameter error'
				 ));
	  return;
	}
	$user_id = "tw:" . $_SESSION['screen_name'];
	if(get_magic_quotes_gpc()){
		$tweet = stripslashes($_REQUEST['tweet']);  # todo:sanitize
		$body = stripslashes($_REQUEST['body']); # todo sanitize?
	}else{
		$tweet = $_REQUEST['tweet'];  # todo:sanitize
		$body = $_REQUEST['body']; # todo sanitize?
	}
	
	//if(!checkTitle($title)){
	//  echo json_encode(array(
	//			 'error' => 'invalid title'
	//			 ));
	//  return;
	//}
	//if(writePng($user_id,$title,$body)){
	//  echo json_encode(array(
	//			 'success' => 'ok',
	//			 'id' => $user_id
	//			 ));
	//}else{
	//  echo json_encode(array(
	//			 'error' => 'write'
	//			 ));
	//  
	//}
        writeTmpPng($body);
        $to = new TwitterOAuth($consumer_key,$consumer_secret,$_SESSION['oauth_token'],$_SESSION['oauth_token_secret']);
        $ret = $to->oAuthRequestImage('https://api.twitter.com/1.1/statuses/update_with_media.json','POST', array(
          'status'=> $tweet . ' ' . TW_HASHTAG,
	  'media[]' => '@'. DATA_PATH .'tmp.png' 
	  //'media[]' => '@/home/ina/workspace/gragen/html/data/tw:ina_ani:typhoon.png' 
	));
	error_log(var_export($ret,true));
	echo json_encode(array(
		 'success' => 'ok'
		 ));

      }
 
     }elseif($method == "save_png"){
      # ---- SAVE ----
      session_start();
      if(get_magic_quotes_gpc()){
      }
      if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
      # login
	if(!isset($_REQUEST['title']) || !isset($_REQUEST['body'])){
	  echo json_encode(array(
				 'error' => 'parameter error',
				 'title' => $_REQUEST['title'],
				 'body' => $_REQUEST['body'],
				 ));
	  return;
	}
	$user_id = "tw:" . $_SESSION['screen_name'];
	if(get_magic_quotes_gpc()){
		$title = stripslashes($_REQUEST['title']);  # todo:sanitize
		$body = stripslashes($_REQUEST['body']); # todo sanitize?
	}else{
		$title = $_REQUEST['title'];  # todo:sanitize
		$body = $_REQUEST['body']; # todo sanitize?
	}
	
	if(!checkTitle($title)){
	  echo json_encode(array(
				 'error' => 'invalid title'
				 ));
	  return;
	}
	if(writePng($user_id,$title,$body)){
	  echo json_encode(array(
				 'success' => 'ok',
				 'id' => $user_id
				 ));
	}else{
	  echo json_encode(array(
				 'error' => 'write'
				 ));
	}
      }
     }elseif($method == "save_png_plus"){
      # ---- SAVE ----
      # any user executable
      session_start();
      if(get_magic_quotes_gpc()){
      }
      if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
      # login
	if(!isset($_REQUEST['title']) || !isset($_REQUEST['body'])){
	  echo json_encode(array(
				 'error' => 'parameter error'
				 ));
	  return;
	}
	$user_id = $_REQUEST['screen_name']; // # DANGER !!! #
	if(get_magic_quotes_gpc()){
		$title = stripslashes($_REQUEST['title']);  # todo:sanitize
		$body = stripslashes($_REQUEST['body']); # todo sanitize?
	}else{
		$title = $_REQUEST['title'];  # todo:sanitize
		$body = $_REQUEST['body']; # todo sanitize?
	}
	
	if(!checkTitle($title)){
	  echo json_encode(array(
				 'error' => 'invalid title'
				 ));
	  return;
	}
	if(writePng($user_id,$title,$body)){
	  echo json_encode(array(
				 'success' => 'ok',
				 'id' => $user_id
				 ));
	}else{
	  echo json_encode(array(
				 'error' => 'write'
				 ));
	  
	}
      }
     }elseif($method == "save"){
      # ---- SAVE ----
      session_start();
      if(get_magic_quotes_gpc()){
	#echo json_encode(array(
	#		       'error' => 'environment error'
	#		       ));
	#return; # environment error
      }
      if(isset($_SESSION['user_id']) && $_SESSION['user_id'] !== NULL){
      # login
	if(!isset($_REQUEST['title']) || !isset($_REQUEST['body']) || !isset($_REQUEST['type'])){
	  echo json_encode(array(
				 'error' => 'parameter error'
				 ));
	  return;
	}
	$user_id = "tw:" . $_SESSION['screen_name'];
	if(get_magic_quotes_gpc()){
		$title = stripslashes($_REQUEST['title']);  # todo:sanitize
		$type = stripslashes($_REQUEST['type']);  # todo:sanitize
		$body = stripslashes($_REQUEST['body']); # todo sanitize?
	}else{
		$title = $_REQUEST['title'];  # todo:sanitize
		$type = $_REQUEST['type'];  # todo:sanitize
		$body = $_REQUEST['body']; # todo sanitize?
	}
      
        # todo: new line normalize
	
	if(!checkTitle($title)){
	  echo json_encode(array(
				 'error' => 'invalid title'
				 ));
	  return;
	}
	if(write($user_id,$title,$body,$type)){
	  mkfiles();
	  echo json_encode(array(
				 'success' => 'ok',
				 'body' => $body,
				 'pre' => $_REQUEST['body'],
				 'id' => $user_id
				 ));
	}else{
	  echo json_encode(array(
				 'error' => 'write'
				 ));
	  
	}
      }else{ // not log in
	  echo json_encode(array());
      }
     }else{
         # ---- UNKOWN ----
         echo "unknown method";
     }

?>
