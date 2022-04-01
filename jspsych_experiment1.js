/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/

// redirect to index if no Prolific ID is stored
//console.log(sessionStorage.getItem('prolific_id'));
window.onload = function() {
    if(sessionStorage.getItem('prolific_id') === null) {
        window.location.assign('index.html');
    } else {
        findFile(sessionStorage.getItem('prolific_id'));
    }
};

// path to testfile.json
let dataPath = "testfiles/testfile.json";

// run experiment on page load
document.addEventListener(
    'DOMContentLoaded',
    () => {
        runExperiment(dataPath);
});


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
            // round trial Options to 2 digits
            trial['immOpt'] = parseFloat(trial['immOpt']).toFixed(2);
            trial['delOpt'] = parseFloat(trial['delOpt']).toFixed(2);
            // correct rounding errors (4.999 -> 5)
            if(trial['immOpt'] == trial['delOpt']) {
                trial['immOpt'] = trial['delOpt']-0.01;
            };
            // loss to negative values
            if(trial['task'] == "loss") {
                trial['immOpt'] = -trial['immOpt'];
                trial['delOpt'] = -trial['delOpt'];
            };
            // round trial Options to 2 digits
            trial['immOpt'] = parseFloat(trial['immOpt']).toFixed(2);
            trial['delOpt'] = parseFloat(trial['delOpt']).toFixed(2);
        });

        // create separate loss and reward lists
        let lossList = [];
        let rewList = [];
        trialList.forEach((trial) => (trial['task']=="loss" ? lossList : rewList).push(trial));
        
        // create reward and loss timelines to get 4 chunks
        //let loss1 = createTimeline(lossList);
        let rew1 = createTimeline(rewList);

        // random loss and reward timelines
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };
        //shuffleArray(loss1);
        shuffleArray(rew1);

        // slice loss and reward into 2 sections each
        //let loss2 = loss1.splice(0, Math.ceil(loss1.length/2));
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
        run2FC(rew1, rew2);


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
                randomize: trial.rando
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

function run2FC(rew1, rew2) {

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
        The experiment consists of two parts and will take about <b>25 minutes</b> in total.
        Between the two parts, you will be asked to fill out a few questionnaires. 
        Within each of the two parts, you will carry out <b>two blocks</b> of trials. 
        After each block, you will have the opportunity to take a short break if you wish.

        <p>
        In each trial of the experiment, you will see two amounts of money to choose from, 
        one <span class="immediate">smaller value</span> 
        and one <span class="delayed">larger value</span>, like in this example:
        </p>
        </div>

        <div id='exampleStim'>
        ${constructStim('0', '5.00', '10.00', '7')}
        </div>
        
        <div class="instructions">
        You can also see that each option is attached to a <b>time</b> 
        when you would receive the money. In this example, you could choose between 
        <span class="immediate">&pound; 5 immediately</span> and 
        <span class="delayed">&pound; 10 in one week</span>.
        Your task is to choose between these options by <b>pressing 'q' for the left 
        option and 'p' for the right option</b>. (Note: This doesn't work in this example)

        <p>
        Each trial will have different amounts of money to choose from. 
        The <span class="immediate">smaller amount</span> would always be paid 
        out <span class="immediate">immediately</span>, while the delay for receiving the
        <span class="delayed">larger amount</span> will vary between 
        <span class="delayed">1, 7, 30, 90, and 180 days</span>. 
        </p>
        
        <p>
        Once you press <b>p</b> or <b>q</b>, the option you have chosen will be highlighted.
        For example, if you would rather like to receive 
        <span class="immediate">&pound; 5 immediately</span> than 
        <span class="delayed">&pound; 10 in one week</span>, you would press <b>q</b> 
        and then see the following:
        </p>
            <div id='exampleStim'>
            ${constructStim('0', '5.00', '10.00', '7', 'left')}
            </div>
        The next trial would then be presented a few seconds later.
        </div>
        `

        let instructionsText2 = `
        <div class="instructions">
        <p>
        For each trial, you will have <b>10 seconds</b>
        to decide between the two options.<br>
        
        <p>
        The <span class="immediate">immediate option</span> and the 
        <span class="delayed">delayed option</span> will be randomly 
        presented on the <b>left</b> and <b>right</b> side. For example, the last 
        example could also look like this:
        </p>

        <div id='exampleStim'>
        ${constructStim('1', '5.00', '10.00', '7')}
        </div>

        <p>
        Note: All choices are <b>imaginary</b>, i.e. <b>your reimbursement 
        for this experiment will not depend on your decisions</b>.
        However, please choose between the options 
        <b>as if the choices were real</b>. There is no correct or false answer. 
        Please select the option that you would prefer as if the money 
        was paid out to you in the corresponding timeframe. 
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
            {   data: {immOpt: '5.00', delOpt: '10.20', delay: '7', randomize: '0'},
                stimulus: constructStim('0', '5.00', '10.20', '7') },
            {   data: {immOpt: '4.00', delOpt: '6.80', delay: '30', randomize: '1'},
                stimulus: constructStim('1', '4.00', '6.80', '30') },
            {   data: {immOpt: '3.00', delOpt: '3.40', delay: '90', randomize: '1'},
                stimulus: constructStim('1', '3.00', '3.40', '90') }
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

    //let lossProc1 = createProcedure(loss1, "loss");
    //let lossProc2 = createProcedure(loss2, "loss");
    let rewProc1 = createProcedure(rew1, "reward");
    let rewProc2 = createProcedure(rew2, "reward");
    // console.log(lossProc1);

    let trialProcedure;
    if(order==0) {
        trialProcedure={
            timeline: [rewProc1, rewProc2]
        };
    } else {
        trialProcedure={
            timeline: [rewProc2, rewProc1]
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

// convert days to years for stimulus
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
let feedbackStyle = 'style="border: thick solid  #008000;"';

function constructStim(rando, immOpt, delOpt, delay, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: thick solid  #008000;"';
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

// function to check session ID and redirect if necessary
function findFile(id) {
    let params = {
        "prolific_id": id
    };    
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'web_API/checkID.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function(){
        response = this.responseText;
        console.log(response);
        switch(response) {
            case '0':
                break; // stay on page if no data is available but ID is entered
            case '1':
                window.location.assign('questionnaires.html');
                break;
            case '2':
                let outTimeline = [];
                let usedID = {
                    type: "html-keyboard-response",
                    stimulus: `<p>Your ID is already used. Thank you for participating!</p>`,
                    margin_vertical: '100px',
                    choices: jsPsych.NO_KEYS
                    };
                outTimeline.push(usedID);
                jsPsych.init({
                    timeline: outTimeline,
                });
        }
    };

    xhr.send(JSON.stringify(params));
}

// function to create sub-timeline for the loss and reward blocks
function createProcedure(tl, task) {
        let introText = {
                type: "html-keyboard-response",
                stimulus: `<p>Press Q or P to start the next block whenever you are ready.</p>`,
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