// path to param data
const prolific_id = sessionStorage.getItem('prolific_id');
const continueButton = document.querySelector('#toPart2');

/* 
QUESTIONNAIRES ================================================================
*/
//on form submit: remove audit and move on to BIS15
// define survey elements to change
let audit = document.querySelectorAll("#audit");
let bis = document.querySelectorAll("#BIS");
let toBisBtn = document.querySelectorAll("#toBisBtn");
let debrief = document.querySelectorAll("#debrief")

document.getElementById("toBisBtn").addEventListener('click', function(e){
    e.preventDefault();
    // get audit form element to check validity
    let auditform = document.forms['auditform'];

    // checkValidity returns false if any item is invalid
    let auditcheck = auditform.checkValidity();

    if(!auditcheck) {
        // show error messages for invalid items
        auditform.reportValidity();
    } else {
        // remove finished survey and load new survey
        audit[0].style.display = "none";
        bis[0].style.display = "block";
    }
});

document.getElementById("toPart2").addEventListener('click', function(e){
    e.preventDefault();
    // get audit form element to check validity
    let bisform = document.forms['bisform'];

    // checkValidity returns false if any item is invalid
    let bischeck = bisform.checkValidity();

    if(!bischeck) {
        // show error messages for invalid items
        bisform.reportValidity();
    } else {
        // create FormData object
        let bisData = new FormData(bisform);
        //console.log(Array.from(bisData));
        const bisJSON = Object.fromEntries(bisData.entries());
        
        const auditform = document.forms['auditform'];
        const auditData = new FormData(auditform);
        const auditJSON = Object.fromEntries(auditData.entries());
        console.log(auditJSON);

        // merge audit and bis data
        const surveyData = Object.assign(auditJSON, bisJSON);

        // get date and time for storage
        let jsdate = new Date();
        let date = jsdate.toLocaleDateString();
        let time = jsdate.toLocaleTimeString();
        surveyData['date'] = date;
        surveyData['time'] = time;

        // AJAX to save data and redirect
        saveSurvey(surveyData);

    }
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
    xhr.open('POST', 'web_API/saveSurvey.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function(){
        bis[0].style.display = "none";
        debrief[0].style.display = "block";
    };

    xhr.send(JSON.stringify(params));
};

/// Experiment 2
// redirect to index if no Prolific ID is stored
//console.log(sessionStorage.getItem('prolific_id'));
window.onload = function() {
    if(sessionStorage.getItem('prolific_id') === null) {
        window.location.assign('index.html');
    } else {
        let prolific_id = sessionStorage.getItem('prolific_id');
        startPython(prolific_id);
    }
};

function startPython(id) {
    let params = {
        "prolific_id": id
    };    
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'web_API/startPython.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function(){
    };
    xhr.send(JSON.stringify(params));
};

// ugly way to save kappa/beta to DB: load params from server and send to php
function getKappa(kappaPath) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', kappaPath, true);
    xhr.onload = function() {
        let kappabeta = JSON.parse(this.responseText);
        saveKappa(kappabeta);
    };
    xhr.send()
}

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

/*
ENABLE PART2 WHEN PARAMS ARE FOUND
*/

// path to param data
const dataPath = `data/${prolific_id}_params_exp2.json`;

// check for params file every 3 seconds and enable/disable button
searchFile = setInterval(function() {

    let xhr = new XMLHttpRequest();
    // HEAD request: look for file without loading
    xhr.open('HEAD', dataPath, true);
    xhr.onload = function() {
        console.log(xhr.status);
        if (xhr.status == "404") {
            continueButton.disabled = true;
        } else {
            continueButton.disabled = false;
            clearInterval(searchFile);

            // load kappa/beta and hand them over to php
            const kappaPath = `data/${prolific_id}_kappa.json`;
            getKappa(kappaPath);
        };
    }
    xhr.send();
}, 3000);