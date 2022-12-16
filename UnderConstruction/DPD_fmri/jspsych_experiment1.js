/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/


// run experiment on page load
// path to testfile.json
let dataPath = "stimuli/trials_DPD.json";
window.onload = runExperiment();

async function runExperiment() {
    /*
    RUN EXPERIMENT
    - loads json trial
    - converts json data to an array of trial objects
    - calls run2FC (2-forced-choice) function with the trial array
    */

    const loss1 = await fetchData(dataPath).then(data => Object.values(data))
    .then(data => correctLossSign(data))
    .then(data => roundChoices(data))
    .then(data => createTimeline(data))
    .then(data => randomizeOrientation(data))
    .then(data => shuffleArray(data))

    // slice loss and reward into 2 sections each
    //let loss2 = loss1.splice(0, Math.ceil(loss1.length/2));
    const loss2 = loss1.splice(0, Math.ceil(loss1.length/2));
    const loss3 = loss1.splice(0, Math.ceil(loss1.length/2));
    const loss4 = loss2.splice(0, Math.ceil(loss2.length/2));

    // TEST: Only 5 trials per run
    // loss1 = loss1.slice(0,5)
    // loss2 = loss2.slice(0,5)

    // run 2 forced choice task
    run2FC(loss1, loss2, loss3, loss4);

};


function run2FC(loss1, loss2, loss3, loss4) {

    // input: jsPsych timeline (array)
    

    // console.log("This is the trialTimeline:");
    // console.log(trialTimeline);

    // create 2 orders of stimuli: loss-rew and rew-loss
    let order=Math.round(Math.random());
    console.log(order);

    let lossProc1 = createProcedure(loss1);
    let lossProc2 = createProcedure(loss2);
    let lossProc3 = createProcedure(loss3);
    let lossProc4 = createProcedure(loss4);
    //let rewProc1 = createProcedure(rew1, "reward");
    //let rewProc2 = createProcedure(rew2, "reward");
     console.log(lossProc1);

    let trialProcedure;
    if(order==0) {
        trialProcedure={
            timeline: [lossProc1, lossProc2, lossProc3, lossProc4]
        };
    } else {
        trialProcedure={
            timeline: [lossProc2, lossProc1, lossProc4, lossProc3]
        };
    }
    // console.log(trialProcedure);

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