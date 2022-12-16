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

