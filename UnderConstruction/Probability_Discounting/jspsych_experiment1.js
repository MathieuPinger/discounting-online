/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/


// run experiment on page load
// path to testfile.json
let dataPath = "stimuli/trials_PD_v2.json";
window.onload = runExperiment();

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
    // loss1 = loss1.slice(0,5)
    // console.log(loss1);
    // loss2 = loss2.slice(0,5)
    // rew1 = rew1.slice(0,5)
    // console.log(rew1);
    // rew2 = rew2.slice(0,5)

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
    timeline.push(instructions1, instructions2, 
        practiceProcedure, finishInstructions, trialProcedure, debriefPart1);

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
    xhr.open('POST', 'web_API/saveExp1.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
     xhr.upload.onloadstart = function() {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', 'web_API/saveExp1db.php');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function(){
            window.location.assign('rewad_part2.html');
        };
        xhr.send(jsonfile)

     }

    xhr.send(JSON.stringify(csvparams));
};