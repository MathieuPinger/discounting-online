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
        document.styleSheets[0].disabled = true;
        runExperiment(dataPath);
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


async function runExperiment() {
    /*
    RUN EXPERIMENT
    - loads json trial
    - converts json data to an array of trial objects
    - calls run2FC (2-forced-choice) function with the trial array
    */

    const trialList = await fetchData(dataPath).then(data => Object.values(data))
    .then(data => roundChoices(data))
    .then(data => correctRounding(data))
    .then(data => correctLossSign(data))
    .then(data => roundChoices(data)) // second rounding for correct negative values!
    .then(data => createTimeline(data))
    .then(data => randomizeOrientation(data))
    .then(data => shuffleArray(data))

    let loss1 = [];
    let rew1 = [];
    trialList.forEach((trial) => (trial.data.task=='loss' ? loss1 : rew1).push(trial));

    // slice loss and reward into 2 sections each
    // slice loss and reward into 2 sections each
    let loss2 = loss1.splice(0, Math.ceil(loss1.length/2));
    let rew2 = rew1.splice(0, Math.ceil(rew1.length/2));

    // // debug: only 5 trials
    loss1 = loss1.slice(0,5)
    console.log(loss1);
    loss2 = loss2.slice(0,5)
    rew1 = rew1.slice(0,5)
    console.log(rew1);
    rew2 = rew2.slice(0,5)

    // run 2 forced choice task
    run2FC(loss1, loss2, rew1, rew2);

};


function run2FC(loss1, loss2, rew1, rew2) {

    // input: jsPsych timeline (array)
    

    // console.log("This is the trialTimeline:");
    // console.log(trialTimeline);

    // create 2 orders of stimuli: loss-rew and rew-loss
    let order=Math.round(Math.random());
    console.log(order);

    let lossProc1 = createProcedure(loss1, "loss");
    let lossProc2 = createProcedure(loss2, "loss");
    let rewProc1 = createProcedure(rew1, "reward");
    let rewProc2 = createProcedure(rew2, "reward");
    // console.log(lossProc1);

    let trialProcedure;
    if(order==0) {
        trialProcedure={
            timeline: [rewProc1, lossProc1, rewProc2, lossProc2]
        };
    } else {
        trialProcedure={
            timeline: [lossProc1, rewProc1, lossProc2, rewProc2]
        };
    }

    let timeline = [];
    timeline.push(instructionsPart2, trialProcedure, debriefPart2);

    jsPsych.init({
        timeline: timeline,
        minimum_valid_rt: 200,
        on_close: function(){
            saveData(); // save data if window is closed; otherwise during debrief trial
        }
    });
};

function saveData() {
    // creates object with prolific id and experiment data
    // sends json-object to php for storage

    // add startdate and starttime
    let startdate = jsPsych.startTime().toLocaleDateString();
    let starttime = jsPsych.startTime().toLocaleTimeString();
    jsPsych.data.addProperties({startdate: startdate, starttime: starttime});

    // add ID to every trial
    jsPsych.data.addProperties({subject_id: sessionStorage.getItem('prolific_id')});

    // get data object
    let data = jsPsych.data.get();

    // separate json and csv files
    let jsonfile = data.json();
    let csvfile = data.filter({timelineType: "trial"}).csv();
    let csvparams = {
                "prolific_id": sessionStorage.getItem('prolific_id'),
                "data": csvfile
            }; 
   
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'web_API/saveExp2.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
     xhr.onload = function() {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'web_API/saveExp2db.php');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(jsonfile)

     }

    xhr.send(JSON.stringify(csvparams));
};