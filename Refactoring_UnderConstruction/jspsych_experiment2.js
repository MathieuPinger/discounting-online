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
const prolific_id = sessionStorage.getItem('prolific_id');
const dataPath = `data/${prolific_id}_params_exp2.json`;
const continueButton = document.querySelector('#toPart2');

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
/* 
QUESTIONNAIRES ================================================================
*/
//on form submit: remove audit and move on to BIS15
// define survey elements to change
let audit = document.querySelectorAll("#audit");
let bis = document.querySelectorAll("#BIS");
toBisBtn = document.querySelectorAll("#toBisBtn");

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


function runExperiment(dataPath) {
    /*
    RUN EXPERIMENT
    - loads json trial
    - converts json data to an array of trial objects
    - calls run2FC (2-forced-choice) function with the trial array
    */

    //console.log(dataPath);
    //console.log(sessionStorage.getItem('prolific_id'));
    
    
    // AJAX get request
    let xhr = new XMLHttpRequest();
    xhr.open('GET', dataPath, true);
    xhr.onload = function() {

        // load and parse JSON
        let trialObj = JSON.parse(this.responseText);
        console.log(trialObj);
        
        // object to array
        let trialList = Object.values(trialObj);
        console.log(trialList);

        // loss to negative values
        trialList.forEach(trial => {
            // // not needed in part 2: negative values returned from python
            // if(trial['task'] == "loss") {
            //     trial['immOpt'] = -trial['immOpt'];
            //     trial['delOpt'] = -trial['delOpt'];
            // };
            // round trial Options to 2 digits
            trial['immOpt'] = parseFloat(trial['immOpt']).toFixed(2);
            trial['delOpt'] = parseFloat(trial['delOpt']).toFixed(2);
        });

        // create separate loss and reward lists
        let lossList = [];
        let rewList = [];
        trialList.forEach((trial) => (trial['task']=="loss" ? lossList : rewList).push(trial));

        // create reward and loss timelines to get 4 chunks
        let loss1 = createTimeline(lossList);
        let rew1 = createTimeline(rewList);

        // random loss and reward timelines
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };
        shuffleArray(loss1);
        shuffleArray(rew1);

        // slice loss and reward into 2 sections each
        let loss2 = loss1.splice(0, Math.ceil(loss1.length/2));
        let rew2 = rew1.splice(0, Math.ceil(rew1.length/2));


        // TEST: Only 5 trials per run
        // loss1 = loss1.slice(0,5)
        // loss2 = loss2.slice(0,5)
        // rew1 = rew1.slice(0,5)
        // rew2 = rew2.slice(0,5)


        // console.log(loss1);
        // console.log(loss2);
        // console.log(rew1);
        // console.log(rew2);

        // run 2 forced choice task
        run2FC(loss1, loss2, rew1, rew2);
    }
    xhr.send();

};

function createTimeline(trialArray) {
    /*
    input: array of Objects with immOpt, delOpt, delay
    output: jsPsych-Timeline with html stimuli
    */
    const trialTimeline = [];

    // add trials to timeline: loop through trialList
    trialArray.map(trial => {
        // create random number: 0 or 1
        // rando == 0 -> immediate left; rando == 1 -> immediate right
        trial.rando = Math.round(Math.random());

        let trialData = {
            // 
            stimulus: constructStim(trial.rando, trial.immOpt, trial.delOpt, trial.delay),

            data: {
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                delay: trial.delay,
                task: trial.task,
                randomize: trial.rando,
                p_imm: trial.p_imm
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

function run2FC(loss1, loss2, rew1, rew2) {

    // input: jsPsych timeline (array)
    let timeline = [];
    /* 
    INSTRUCTIONS AND TEST TRIALS
    - verbal instructions
    - one test trial per condition: loss and reward
    -> total timeline: [instructions, testProcedure, trialProcedure]
    */

    let instructions = {
        type: "html-keyboard-response",
        stimulus: 
            `<div class="instructions">
            <h3>Welcome to part 2 of the experiment!</h3>
            <p>As in the first part, you will go through four blocks of decisions. 
            You are free to take breaks between the blocks. 
            Once you have finished all blocks, the experiment ends.</p>
            <p>You have 10 seconds for each trial.</p>
            <p>Please place your <b>left index finger on Q</b>, 
            and your <b>right index finger on P</b>.</p>
            <p>Then press Q or P to continue to the experiment.</p>
            </div>`,
        choices: ['q', 'p'],
        margin_vertical: '100px',
    };

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
    // console.log(trialProcedure);

    let debrief = {
        type: "html-keyboard-response",
        stimulus: `<p>You have finished the experiment.</p>
                    <p>Thank you for participating!</p>
                    <p>Please click on the link below to get back to Prolific:</p>
                    <a href="https://app.prolific.co/submissions/complete?cc=314880B1"> https://app.prolific.co/submissions/complete?cc=314880B1 </a>`,
        margin_vertical: '100px',
        choices: jsPsych.NO_KEYS,
        on_load: function() {
            saveData();
        }
    };
    timeline.push(instructions, trialProcedure, debrief);

    jsPsych.init({
        timeline: timeline,
        minimum_valid_rt: 200,
        on_finish: function() {
            // save only trial data, not feedback
            // let dataToSave = jsPsych.data.get().filter({timelineType: "trial"}).csv();
            // saveData(dataToSave);
            //jsPsych.data.displayData('json');
        },
        on_close: function() {
            saveData();
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
    
     xhr.upload.onloadstart = function() {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'web_API/saveExp2db.php');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(jsonfile)

     }

    xhr.send(JSON.stringify(csvparams));
};

function daysToYears(numberOfDays) {
    if(numberOfDays < 365){
        let delayString = "in <b>"+numberOfDays+"</b> days";
        return delayString;
    } else if(numberOfDays >= 365){
        let years = Math.floor(numberOfDays / 365);
        if(years > 1){
            let yearString = "in <b>"+years+"</b> years";
            return yearString;
        } else {
            let yearString = "in <b>" +years+"</b> year";
            return yearString;
        };
    };
};

// constructor function for html stimulus
function constructStim(rando, immOpt, delOpt, delay, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: 5px solid  #008000; padding: 16px;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';
    let task = parseFloat(delOpt) > 0 ? 'reward' : 'loss';
    let delString = daysToYears(delay);

    let stimString = `<div class = centerbox id='container'>
    <p class = center-block-text>
        Which amount would you prefer to 
        ${task=='reward' ? '<b>win</b>' : '<b>lose</b>'}?
        <br>Press
        <strong>'q'</strong> for left
        <strong>'p'</strong> for right:
    </p>
    <div class='table'>
    <div class='row'>
    <div class = 'option' id='leftOption' ${feedback=='left' ? feedbackStyle : null}>
        <center><font color=${rando==0 ? immOptColor : delOptColor}>
        <b>&pound; ${rando==0 ? immOpt : delOpt}</b>
        <br>
        ${rando==0 ? `<b>Today</b>` : delString}
        </font></center></div>
    <div class = 'option' id='rightOption' ${feedback=='right' ? feedbackStyle : null}>
        <center><font color=${rando==0 ? delOptColor : immOptColor}>
        <b>&pound; ${rando==0 ? delOpt : immOpt}</b>
        <br>
        ${rando==0 ? delString : `<b>Today</b>`}
        </font></center></div></div></div></div>`;
        return stimString;
};

// function to create sub-timeline for the loss and reward blocks
function createProcedure(tl, task) {
    let introText = {
            type: "html-keyboard-response",
            stimulus: ` <p>In the following block of trials, you will always decide 
                        between two <b>${task=="loss" ? 'losses' : 'wins'}</b>.
                        <p>Press Q or P to start the next block whenever you are ready.</p>`,
            margin_vertical: '100px',
            choices: ['q', 'p']
        };

    let trialProcedure = {
    timeline: [
        testBlock = {
            type: "html-keyboard-response",
            stimulus: jsPsych.timelineVariable('stimulus'),
            data: jsPsych.timelineVariable('data'),
            choices: ['q', 'p'],
            stimulus_duration: 10000,
            trial_duration: 10000,
            on_finish: function(data) {
                delete data.stimulus; // not needed in csv
                // recode button press for csv
                if(data.key_press == 80 && data.randomize == 0){
                data.choice = "delayed";
                } else if(data.key_press == 81 && data.randomize == 0){
                data.choice = "immediate";
                } else if(data.key_press == 81 && data.randomize == 1){
                data.choice = "delayed";
                } else if(data.key_press == 80 && data.randomize == 1){
                data.choice = "immediate";
                };
                // add timelineType
                data.timelineType = "trial";
            }
        },
        feedback = {
            type: 'html-keyboard-response',
            stimulus: function(){
                lastChoice = jsPsych.data.getLastTrialData().values()[0].key_press;
                lastRando = jsPsych.data.getLastTrialData().values()[0].randomize;
                lastImmOpt = jsPsych.data.getLastTrialData().values()[0].immOpt;
                lastDelOpt = jsPsych.data.getLastTrialData().values()[0].delOpt;
                lastDelay = jsPsych.data.getLastTrialData().values()[0].delay;

                if(lastChoice == 81){
                    trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                        feedback='left');
                    return trialFeedback

                } else if(lastChoice == 80) {
                    trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                        feedback='right');
                    return trialFeedback

                } else {
                    trialFeedback = `<div class = centerbox id='container'>
                    <p class = center-block-text style="color:red;">
                        Please select an option by pressing Q or P!
                    </p>`;
                    return trialFeedback
                }
            },
            choices: jsPsych.NO_KEYS,
            trial_duration: 1000,
            on_finish: function(data) {
                // add timelineType
                data.timelineType = "feedback"; 
            }
        },
        fixation = {
            type: 'html-keyboard-response',
            stimulus: '<div style="font-size:60px;">+</div>',
            choices: jsPsych.NO_KEYS,
            // jitter fixcross between 500 and 1500 ms
            trial_duration: 1000
        },
    ],
    timeline_variables: tl,
    randomize_order: true
    };
let blockProcedure = {
    timeline: [introText, trialProcedure]
};
return blockProcedure;
// let arr = [introText, trialProcedure];
// return arr;
// return trialProcedure
}