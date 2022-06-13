/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/


// run experiment on page load
// path to testfile.json
let dataPath = "stimuli/trials_DPD.json";

window.onload = runExperiment();

async function fetchData() {
    // fetch json from server
    const  res = await fetch(dataPath);
    const data = await res.json();
    return data;
}

async function runExperiment() {
    /*
    RUN EXPERIMENT
    - loads json trial
    - converts json data to an array of trial objects
    - calls run2FC (2-forced-choice) function with the trial array
    */

    const loss1 = await fetchData().then(data => Object.values(data))
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
    let timeline = [];
    /* 
    INSTRUCTIONS AND TEST TRIALS
    - verbal instructions
    - one test trial per condition: loss and reward
    -> total timeline: [instructions, testProcedure, trialProcedure]
    */
    let instructionsText1 =
        `<div class="instructions">
        <h3>Welcome to the experiment!</h3>
        Please read these instructions carefully.
        <p>
        The experiment will take about <b>25 minutes</b> in total.
        After the experiment, you will be asked to fill out a few questionnaires. 
        You will complete <b>four blocks</b> of trials. 
        After each block, you will have the opportunity to take a short break if you wish.

        <p>
        In each trial of the experiment, you will see two hypothetical monetary losses to choose from, 
        one <span class="immediate">smaller value</span> 
        and one <span class="delayed">larger value</span>, like in this example:
        </p>
        </div>

        <div id='exampleStim'>
        ${constructStim('0', '-5.00', '-10.00', '30', '70')}
        </div>
        
        <div class="instructions">
        You can also see that each loss is attached to a <b>delay</b> and a <b>probability</b>.
        The <b>delay</b> informs you <b>when</b> you would lose the money. The <b>probability</b> informs 
        you about the likelihood of the chosen loss. If the probability is 100%, the loss will be certain. 
        If the probability is below 100%, there is a <b>chance of not losing any money</b>. 
        <br>In this example, you could either choose a loss of
        <span class="immediate">&pound; 5 immediately</span> with <span class="immediate">100% probability</span>, <b>or</b> a loss of
        <span class="delayed">&pound; 10 in one month</span>, but with only <span class="delayed">70% probability</span>.
        Your task is to choose between these options by <b>pressing 'q' for the left 
        option and 'p' for the right option</b>. (Note: This is only an example, pressing a button will not work here)

        <p>
        Each trial will have different amounts of money to choose from. 
        The <span class="immediate">smaller amount</span> would always be lost 
        <span class="immediate">immediately</span> and <span class="immediate">with 100% probability</span>, while the delay for losing the
        <span class="delayed">larger amount</span> will vary between 
        <span class="delayed">0, 30, 90, 180 days, 1 year, and 3 years</span>. The probability for losing
        the <span class="delayed">larger amount</span> will vary between <span class="delayed">100, 90, 75, 50, 25 and 10 percent.</span>
        </p>
        
        <p>
        Once you press <b>p</b> or <b>q</b>, the option you have chosen will be highlighted.
        For example, if you would rather like to lose 
        <span class="immediate">&pound; 5 immediately, with 100% probability</span> than 
        <span class="delayed">&pound; 10 in one month, with 70% probability</span>, you would press <b>q</b> 
        and then see the following:
        </p>
            <div id='exampleStim'>
            ${constructStim('0', '-5.00', '-10.00', '30', '70', 'left')}
            </div>
        The next trial would then be presented a few seconds later.

        You will see more instructions on the next page.
        </div>
        `

        let instructionsText2 = `
        <div class="instructions">
        <p>
        For each trial, you will have <b>10 seconds</b>
        to decide between the two options.<br>
        
        <p>
        The <span class="immediate">smaller option</span> and the 
        <span class="delayed">larger option</span> will be randomly 
        presented on the <b>left</b> and <b>right</b> side. For example, the last 
        example could also look like this:
        </p>

        <div id='exampleStim'>
        ${constructStim('1', '-5.00', '-10.00', '30', '70')}
        </div>

        <p>
        Note: All choices are <b>imaginary</b>, i.e. <b>your reimbursement 
        for this experiment will not depend on your decisions</b>. You will not lose any money.
        However, please choose between the losses 
        <b>as if the choices were real</b>. There is no correct or false answer. 
        Please select the option that you would prefer as if you would lose the money 
        in the corresponding timeframe and probability. 
        Each trial stands on its own, 
        please treat every decision independently.
        </p>

        
        <p>
        On the next page, you can try out the task in <b>3 test trials</b> with no time limit.
        </p>
        </div>`

    let instructions1 = {
        type: "html-button-response",
        stimulus: instructionsText1,
        choices: ['Continue'],
        margin_vertical: '100px',
    };

    let instructions2 = {
        type: "html-button-response",
        stimulus: instructionsText2,
        choices: ['Continue to test trials'],
        margin_vertical: '100px',
    };

    let testingProcedure = {

        timeline: [
            testingBlock = {
                type: "html-keyboard-response",
                stimulus: jsPsych.timelineVariable('stimulus'),
                data: jsPsych.timelineVariable('data'),
                choices: ['q', 'p'],
                on_finish: function(data) {
                    // add timelineType
                    data.timelineType = "test";
                }
            },
            testingFeedback = {
                type: 'html-keyboard-response',
                stimulus: function(){
                    lastChoice = jsPsych.data.getLastTrialData().values()[0].key_press;
                    lastRando = jsPsych.data.getLastTrialData().values()[0].randomize;
                    lastImmOpt = jsPsych.data.getLastTrialData().values()[0].immOpt;
                    lastDelOpt = jsPsych.data.getLastTrialData().values()[0].delOpt;
                    lastDelay = jsPsych.data.getLastTrialData().values()[0].delay;
                    lastProb = jsPsych.data.getLastTrialData().values()[0].prob;

                    if(lastChoice == 81){
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay, lastProb,
                            feedback='left');
                        return trialFeedback

                    } else if(lastChoice == 80) {
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay, lastProb,
                            feedback='right');
                        return trialFeedback

                    } else {
                        trialFeedback = `<div class = centerbox id='container'>
                        <p class = center-block-text style="color:red;">
                            <b>Please select an option by pressing Q or P!</b>
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
                //trial_duration:  Math.random() * (1500-500)+500
                trial_duration: 1000
              },
        ],
        timeline_variables: [
            {   data: {immOpt: '-5.00', delOpt: '-10.20', delay: '365', prob: '50', randomize: '0'},
                stimulus: constructStim('0', '-5.00', '-10.20', '365', '50') },
            {   data: {immOpt: '-4.00', delOpt: '-6.80', delay: '30', prob: '90', randomize: '1'},
                stimulus: constructStim('1', '-4.00', '-6.80', '30', '90') },
            {   data: {immOpt: '-3.00', delOpt: '-3.40', delay: '90', prob: '25', randomize: '1'},
                stimulus: constructStim('1', '-3.00', '-3.40', '90', '25') }
        ],
        randomize_order: false
    };

    let finishInstructions = {
        type: "html-keyboard-response",
        stimulus: 
            `<div class="instructions">
            <p>The experiment can now begin!
            From now on, you have <b>10 seconds</b> for each decision.
            After four blocks of trials, you will be asked to fill out 
            a few questionnaires.</p>
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
    let lossProc3 = createProcedure(loss3, "loss");
    let lossProc4 = createProcedure(loss4, "loss");
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

    let debrief = {
        type: "html-keyboard-response",
        stimulus: `<p>You have finished the first part.</p>
                    <p><b>Please don't close this browser window.</b>
                    <p>You will be automatically redirected to the second part.</p>
                    <p>The second part will start with two surveys.</p>
                    <p>Depending on your internet connection, the redirect may take a few seconds or minutes.</p>
                    <p>If you are not being redirected after a few minutes, please contact us via Prolific.</p>`,
                    // If you are not redirected, please click 
                    // <a target="_self" href="https://clox.zi-mannheim.de/rewad2/rewad2_server/rewad_part2.html" >here</a>`,
        margin_vertical: '100px',
        choices: jsPsych.NO_KEYS,
        on_load: function() {
            saveData();
        }
    };
    timeline.push(instructions1, instructions2, 
        testingProcedure, finishInstructions, trialProcedure, debrief);

    jsPsych.init({
        timeline: timeline,
        minimum_valid_rt: 200,
        on_finish: function() {
            // save only trial data, not feedback
            // let dataToSave = jsPsych.data.get().filter({timelineType: "trial"}).csv();
            // saveData(dataToSave);
            //jsPsych.data.displayData('json');
        },
        on_close: function(){
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


// function to create sub-timeline for the loss and reward blocks
function createProcedure(tl, task) {
        let introText = {
                type: "html-keyboard-response",
                stimulus: ` <p>In the following block of trials, you will always decide 
                            between two <b>${task=="loss" ? 'losses' : 'wins'}</b>.
                            <p>Press Q or P to start the next block whenever you are ready.</p>`,
                margin_vertical: '100px',
                choices: ['q', 'p'],
                on_finish: function(data) {
                    data.timelineType = "blockIntro";
                }
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
                    lastProb = jsPsych.data.getLastTrialData().values()[0].prob;

                    if(lastChoice == 81){
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay, lastProb,
                            feedback='left');
                        return trialFeedback

                    } else if(lastChoice == 80) {
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay, lastProb,
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
                trial_duration: 1000,
                on_finish: function(data) {
                    // add timelineType
                    data.timelineType = "fixcross"; 
                }
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