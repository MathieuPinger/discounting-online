var serverComm = {};

serverComm.logging = false;

serverComm.save_data = function(data){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'php/save_data.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    if(xhr.status == 200){
      var response = JSON.parse(xhr.responseText);
      if(serverComm.logging){
        console.log(response);
      }
    }
  };
  xhr.send(JSON.stringify(data));
}
