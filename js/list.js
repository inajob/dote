$(function(){


$('#favs').append($('<a href="http://b.hatena.ne.jp/entry/'+document.location.href+'" class="hatena-bookmark-button" data-hatena-bookmark-layout="simple" title="このエントリーをはてなブックマークに追加"><img src="http://b.st-hatena.com/images/entry-button/button-only.gif" alt="このエントリーをはてなブックマークに追加" width="20" height="20" style="border: none;" /></a><script type="text/javascript" src="http://b.st-hatena.com/js/bookmark_button.js" charset="utf-8" async="async"></script>'))
  .append($('<a href="http://twitter.com/share" class="twitter-share-button" data-count="none" data-hashtags="DotE" data-url="'+document.location.href+'">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>'))
  .append($('<iframe src="http://www.facebook.com/plugins/like.php?href='+document.location.href+'&amp;layout=button_count&amp;show_faces=true&amp;width=120&amp;action=like&amp;font&amp;colorscheme=light&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:200px; height:20px;" allowTransparency="true"></iframe>'))
	    ;



KARUKI.base = './';
KARUKI.files(function(list){
  for(var i = list.length - 1; i >= 0; i--){
    if(list[i].length == 0)continue;
    $('<div>').addClass('piece').addClass('lfloat').append(
      $('<a>').css('display','block').attr('href','./data/' + list[i])
        .append(
	  $('<img>').addClass('border')
	    .attr('src', './data/' + list[i].replace(/\.html$/, '.png')))
        .append($('<div>').text(list[i].replace(/^tw:/,'').replace(/\.html$/,'')))
    ).appendTo($('#contents'));
  }
});


});
