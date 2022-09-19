var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab

// add eventlistener for buttons
document.getElementById("prevBtn").addEventListener('click', function() {
    nextPrev(-1);
});

document.getElementById("nextBtn").addEventListener('click', function() {
    nextPrev(1);
});

// click button if user presses Enter
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
  let infoBlocks = document.getElementsByClassName("info");
  infoBlocks[n].style.display = "block";
  // ... and fix the Previous/Next buttons:
  if (n == 0 | n == 1 | n == 6) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(n)
};

function nextPrev(n) {
    // This function will figure out which tab to display
    let infoBlocks = document.getElementsByClassName("info");

    // check and submit consent if "next" is clicked on landing page
    if (currentTab == 0 && n == 1) {
      submitID();
      // check and submit consent if "next" is clicked on consent page
    } else if (currentTab == 5 && n == 1) {
       //...the form gets submitted:
      submitConsent();
    } else if (currentTab == 6 && n == 1) {
      submitDemographics();
    } else {
       // Hide the current tab:
      infoBlocks[currentTab].style.display = "none";
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

function submitConsent() {
  let consentForm = document.forms['consentform'];
  let messageField = document.querySelector('#message');

  // create FormData object for validity check and AJAX
  const consentData = new FormData(consentForm);
  const consentArray = Array.from(consentData);

  // checkValidity returns false if any item is invalid
  let consentCheck = consentForm.checkValidity();

  if(!consentCheck) {
    // show error messages for invalid items
    consentForm.reportValidity();
    // show warning if any value is "no"
  } else if (JSON.stringify(consentArray).includes("no")) {
    messageField.style.display = "block";
    messageField.innerHTML = `Thank you for your interest in our study.
                              You did not consent to proceed.`;
  } else {
    // delete error message if still present
    messageField.style.display = "none";
    // convert FormData to JSON
    let consentJSON = Object.fromEntries(consentData.entries());

    // add id to json
    consentJSON['prolific_id'] = sessionStorage.getItem('prolific_id');

    // create random ID, replace sessionStorage id and save both in consent
    let newID = randomID();
    consentJSON['new_id'] = newID;
    sessionStorage.setItem('prolific_id', newID);

    // get date and time for storage
    let jsdate = new Date();
    let date = jsdate.toLocaleDateString();
    let time = jsdate.toLocaleTimeString();
    consentJSON['date'] = date;
    consentJSON['time'] = time;
    
    //console.log(consentJSON);
    saveConsent(consentJSON);

    // save consent and move to next tab
    let infoBlocks = document.getElementsByClassName("info");
    // Hide the current tab:
    infoBlocks[currentTab].style.display = "none";
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + 1;
      // Display the next tab:
      showTab(currentTab);
  }
}

function submitID() {
  let idForm = document.forms['prolific'];

  // check correct ID
  let idCheck = idForm.checkValidity();
  // show error if ID is invalid
  if(!idCheck) {
    idForm.reportValidity();
  
  // if ID is valid: save ID and move to next tab
  } else {
    // ID as session storage
    let prolific = document.querySelector('#prolific_id').value;
    sessionStorage.setItem('prolific_id', prolific);

    // move to next tab
    let infoBlocks = document.getElementsByClassName("info");
    // Hide the current tab:
    infoBlocks[0].style.display = "none";
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + 1;
      // Display the next tab:
      showTab(currentTab);
  }
}

function submitDemographics() {
 // get demographics form element to check validity
  let form = document.forms['demographics'];

  // checkValidity returns false if any item is invalid
  let formCheck = form.checkValidity();

  if(!formCheck) {
      // show error messages for invalid items
      form.reportValidity();
  } else {
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

      //console.log(formJSON);

      // AJAX to save data and redirect
      saveSurvey(formJSON);
      //window.location.assign("rewad_part1.html");

  }
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

function saveSurvey(data) {
  // creates object with prolific id and experiment data
  // sends json-object to php for storage
  let params = {
      //"prolific_id": prolific_id,
      "prolific_id": sessionStorage.getItem('prolific_id'),
      "data": data
  };    
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/saveDemographics.php');
  xhr.setRequestHeader('Content-Type', 'application/json');
  
  xhr.onload = function(){
    window.location.assign("rewad_part1.html");
  };

  xhr.send(JSON.stringify(params));
};

function saveConsent(data) {
  // creates object with prolific id and experiment data
  // sends json-object to php for storage
  let params = data;   
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'web_API/saveConsent.php');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.send(JSON.stringify(params));
};

// random ID to replace prolific ID
function randomID() {
  return Math.random().toString(36).substr(2, 9);
};