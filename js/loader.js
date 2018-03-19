$(function(){
  var documentType = $('#type').text();
  var elm;
  switch(documentType){
    case 'pix100x16':
      elm = document.createElement('script');
      elm.src = '../js/karuki-lib.js';
      document.body.appendChild(elm);

      elm = document.createElement('script');
      elm.src = '../js/pix.js';
      document.body.appendChild(elm);
      break;
  }
});
