// run parameter modeling
window.onload = function() {
    let prolific_id = sessionStorage.getItem('prolific_id');
    startPython(prolific_id);
};

function startPython(id) {
  let params = {
      "prolific_id": id
  }; 
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/startPython.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(params));
};

// check for params file every 3 seconds and enable/disable button
searchFile = setInterval(function() {
  let prolific_id = sessionStorage.getItem('prolific_id');
  const kappaPath = `data/${prolific_id}_kappa.json`;
  let xhr = new XMLHttpRequest();
  // HEAD request: look for file without loading
  xhr.open('GET', kappaPath, true);
  xhr.onload = function() {
      console.log(xhr.status);
      if (xhr.status == "404") {
          console.log("... waiting for parameters ...");
      } else {
          clearInterval(searchFile);
          // load kappa/beta and hand them over to php
          let kappabeta = JSON.parse(this.responseText);
          saveKappa(kappabeta);
      };
  }
  xhr.send();
}, 3000);

// ugly way to save kappa/beta to DB: load params from server and send to php
// function getKappa(kappaPath) {
//   let xhr = new XMLHttpRequest();
//   xhr.open('GET', kappaPath, true);
//   xhr.onload = function() {
//       let kappabeta = JSON.parse(this.responseText);
//       saveKappa(kappabeta);
//   };
//   xhr.send()
// }

function saveKappa(file) {
  console.log(JSON.stringify(file));
  console.log(file);
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/saveKappa.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      console.log(this.responseText);
  };
  xhr.send(JSON.stringify(file))
}

// DEMOGRAPHICS: text input fields required if respective radio buttons are checked
Array.from(document.getElementsByName('gender')).
forEach(function(item) {
    item.addEventListener('click', function(){
        let optionalRadio = document.getElementById("gender_selfdescribe");
        let optionalText = document.getElementById("gender_text");
        optionalText.required = optionalRadio.checked;
        optionalText.disabled = !optionalRadio.checked;
    })
});

Array.from(document.getElementsByName('employment')).
forEach(function(item) {
    item.addEventListener('click', function(){
        let optionalRadio = document.getElementById("employment_selfdescribe");
        let optionalText = document.getElementById("employment_text");
        optionalText.required = optionalRadio.checked;
        optionalText.disabled = !optionalRadio.checked;
    })
});

let currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab
let debrief = document.querySelectorAll("#debrief")

// add eventlistener for buttons
document.getElementById("prevBtn").addEventListener('click', function() {
    nextPrev(-1);
});
document.getElementById("nextBtn").addEventListener('click', function() {
    nextPrev(1);
});

// allow to press Enter for "continue"
document.addEventListener('keydown', function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.code === "Enter") {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("nextBtn").click();
  }
}); 


function showTab(n) {
  // This function will display the specified tab of the form ...
  let infoBlocks = document.getElementsByClassName("survey-tab");
  infoBlocks[n].style.display = "block";
  // ... and fix the Previous/Next buttons:
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(n)
};


function nextPrev(n) {
  // This function will figure out which tab to display
  // select all tabs
  let tabs = document.querySelectorAll(".survey-tab");
  // define array of all survey elements in current tab
  let currentForm = Array.from(tabs[currentTab].
    querySelectorAll("input, select, checkbox, textarea"));
  // test if any  element is invalid (output true if any invalild element)
  let anyInvalid = currentForm.some(e => !e.checkValidity());

  // check validity of current tab inputs (only for "continue" button)
  if(anyInvalid && n > 0) {
    // show error messages for invalid items
    currentForm.forEach(e => e.reportValidity());
    } else {
      // submit demographic data
      if (currentTab == 2 && n == 1) {
        submitDemographics();
      } else if (currentTab == 5 && n == 1) {
        submitSurvey();
      }
      // Hide the current tab:
      tabs[currentTab].style.display = "none";
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + n;
      // Display the next tab:
      showTab(currentTab);
    };
};
  
function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
      x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class to the current step:
    x[n].className += " active";
  };

function submitSurvey() {
  // get AUDIT, QF and BIS
  const bisform = document.forms['bisform'];
  const bisData = new FormData(bisform);
  //console.log(Array.from(bisData));
  const bisJSON = Object.fromEntries(bisData.entries());
  
  const auditform = document.forms['auditform'];
  const auditData = new FormData(auditform);
  const auditJSON = Object.fromEntries(auditData.entries());

  const QFform = document.forms['QFform'];
  const QFData = new FormData(QFform);
  const QFJSON = Object.fromEntries(QFData.entries());

  // merge audit and bis data
  const surveyData = Object.assign(auditJSON, QFJSON, bisJSON);

  // get date and time for storage
  let jsdate = new Date();
  let date = jsdate.toLocaleDateString();
  let time = jsdate.toLocaleTimeString();
  surveyData['date'] = date;
  surveyData['time'] = time;

  // creates object with prolific id and experiment data
  // sends json-object to php for storage
  let params = {
      //"prolific_id": prolific_id,
      "prolific_id": sessionStorage.getItem('prolific_id'),
      "data": surveyData
  };    
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/saveSurvey.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onload = function(){
    console.log("Data submitted");
  };
  xhr.send(JSON.stringify(params));
};

function submitDemographics() {
  // get demographics form element to check validity
  let form = document.forms['demographics'];
  // create FormData object
  let formData = new FormData(form);
  //console.log(Array.from(formData));
  let formJSON = Object.fromEntries(formData.entries());
  
  // get date and time for storage
  let jsdate = new Date();
  let date = jsdate.toLocaleDateString();
  let time = jsdate.toLocaleTimeString();
  formJSON['date'] = date;
  formJSON['time'] = time;

  // AJAX to save data and redirect
  let params = {
    //"prolific_id": prolific_id,
    "prolific_id": sessionStorage.getItem('prolific_id'),
    "data": formJSON
  };    
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/saveDemographics.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onload = function(){
    console.log("Data submitted");
  };

  xhr.send(JSON.stringify(params));

};