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
        <h3>Willkommen zu dem Experiment!</h3>
        Bitte lesen Sie diese Anweisungen sorgfältig durch.
        <p>
        Das Experiment besteht aus zwei Teilen und wird insgesamt etwa <b>45 Minuten</b> in Anspruch nehmen.
        Zwischen den beiden Teilen werden Sie gebeten, einige Fragebögen auszufüllen. 
        In jedem der beiden Teile werden Sie <b>vier Blöcke</b> von Versuchen durchführen. 
        Nach jedem Block haben Sie die Möglichkeit, eine kurze Pause einzulegen, wenn Sie dies möchten.

        <p>
        Bei jedem Versuch des Experiments haben Sie die Wahl zwischen zwei hypothetischen Geldgewinnen oder -verlusten, 
        einem <span class="immediate">geringeren Betrag</span> 
        und einem <span class="delayed">größeren Betrag</span>, wie in diesem Beispiel:
        </p>
        </div>

        <div id='exampleStim'>
        ${constructStim('0', '5.00', '10.00', '30', '70')}
        </div>
        
        <div class="instructions">
        Sie können sehen, dass jeder Gewinn mit einer <b>Verzögerung</b> und einer <b>Wahrscheinlichkeit</b> verbunden ist.
        Die <b>Verzögerung</b> informiert Sie darüber, <b>wann</b> Sie das Geld gewinnen/verlieren würden. Die <b>Wahrscheinlichkeit</b> 
        gibt Ihnen Auskunft über die Wahrscheinlichkeit des gewählten Gewinns/Verlusts. Wenn die Wahrscheinlichkeit 100% beträgt, ist 
        der Gewinn/Verlust sicher. 
        Liegt die Wahrscheinlichkeit unter 100%, besteht eine <b>Chance, kein Geld zu gewinnen/zu verlieren</b>. 
        <br>In diesem Beispiel könnten Sie sich entweder für einen Gewinn von
        <span class="immediate">5 &euro; sofort</span> mit <span class="immediate">100% Wahrscheinlichkeit</span> entscheiden, 
        <b>oder</b> einen Gewinn von
        <span class="delayed">10 &euro; in einem Monat</span>, aber nur mit <span class="delayed">70% Wahrscheinlichkeit</span>.
        Das bedeutet, Sie haben eine Chance von 70%, in einem Monat 10 &euro; zu gewinnen, aber auch eine Chance von 30%, gar nichts 
        zu gewinnen.
        Ihre Aufgabe ist es, zwischen diesen Optionen zu wählen, indem Sie <b>"q" für die linke Option und "p" für die rechte Option 
        drücken.</b>. (Hinweis: Dies ist nur ein Beispiel, das Drücken der Tasten funktioniert hier nicht.)

        <p>
        Bei jedem Versuch stehen unterschiedliche Geldbeträge zur Auswahl. 
        Der <span class="immediate">geringere Betrag</span> würde immer 
        <span class="immediate">sofort</span> und <span class="immediate">mit 100% Wahrscheinlichkeit</span> gewonnen/verloren werden, 
        während die Verzögerung für den Gewinn/Verlust des
        <span class="delayed">größeren Betrags</span> zwischen 
        <span class="delayed">0, 30, 90, 180 Tagen, 1 Jahr, und 3 Jahren</span> variiert. Die Wahrscheinlichkeit, den
        <span class="delayed">größeren Betrag</span> zu gewinnen/verlieren, variiert zwischen 
        <span class="delayed">100, 90, 75, 50, 25 und 10 Prozent.</span>
        </p>
        
        <p>
        Sobald Sie <b>p</b> oder <b>q</b> drücken, wird die von Ihnen gewählte Option hervorgehoben.
        Wenn Sie zum Beispiel lieber 
        <span class="immediate">sofort 5 &euro; mit einer Wahrscheinlichkeit von 100%</span> gewinnen möchten als 
        <span class="delayed">10 &euro; in einem Monat mit einer Wahrscheinlichkeit von 70%</span>, drücken Sie auf <b>q</b> 
        und sehen dann Folgendes:
        </p>
            <div id='exampleStim'>
            ${constructStim('0', '5.00', '10.00', '30', '70', 'left')}
            </div>
        Der nächste Versuch würde dann ein paar Sekunden später präsentiert werden.

        Weitere Anweisungen finden Sie auf der nächsten Seite.
        </div>
        `

        let instructionsText2 = `
        <div class="instructions">
        <p>
        Bei jedem Versuch haben Sie <b>10 Sekunden Zeit</b>, um sich zwischen den
        beiden Optionen zu entscheiden.<br>
        In der Hälfte der Blöcke wählen Sie zwischen zwei <b>Gewinnen</b>, 
        in der anderen Hälfte zwischen zwei <b>Verlusten</b>.
        </p>

        <p>
        Ein <b>Versuch mit Verlusten</b> könnte so aussehen:
            <div id='exampleStim'>
            ${constructStim('0', '-5.00', '-10.00', '30', '70',)}
            </div>
        </p>
        
        <p>
        In diesem Fall könnten sie sich entweder für einen Verlust von 
        <span class="immediate">5 &euro; sofort</span> mit 100% Wahrscheinlichkeit
        oder von <span class="delayed">10 &euro; in einem Monat</span> mit 70% Wahrscheinlichkeit entscheiden. 
        Mit anderen Worten: Wenn Sie die rechte Option wählen, haben Sie eine Chance von 30%, nichts zu verlieren, aber auch eine 
        Chance von 70%, in einem Monat 10 &euro; zu verlieren. 
        </p>

        <p>
        Die <span class="immediate">kleinere Variante</span> und die 
        <span class="delayed">größere Variante</span> werden nach dem Zufallsprinzip auf der 
        <b>linken</b> und <b>rechten</b> Seite angezeigt. Das letzte Beispiel könnte beispielsweise auch wie folgt aussehen: 
        </p>

        <div id='exampleStim'>
        ${constructStim('1', '-5.00', '-10.00', '30', '70')}
        </div>

        <p>
        Hinweis: Alle Wahlmöglichkeiten sind <b>fiktiv</b>, d.h. <b>Ihre Vergütung für dieses Experiment wird nicht von Ihren 
        Entscheidungen abhängen</b>. Sie werden kein Geld verlieren.
        Bitte wählen Sie dennoch zwischen den Verlusten, 
        <b>als ob die Möglichkeiten real wären</b>. Es gibt keine richtige oder falsche Antwort. 
        Bitte wählen Sie die Option, die Sie bevorzugen würden, als ob Sie das Geld in dem entsprechenden Zeitrahmen und mit der 
        entsprechenden Wahrscheinlichkeit verlieren würden. Jeder Versuch steht für sich allein, bitte behandeln Sie jede Entscheidung 
        unabhängig.
        </p>

        
        <p>
        Auf der nächsten Seite können Sie die Aufgabe in <b>5 Testversuchen</b> ohne Zeitlimit ausprobieren.
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
            {   data: {immOpt: '5.00', delOpt: '10.20', delay: '365', prob: '50', randomize: '0'},
                stimulus: constructStim('0', '5.00', '10.20', '365', '50') },
            {   data: {immOpt: '-4.00', delOpt: '-8.80', delay: '30', prob: '90', randomize: '1'},
                stimulus: constructStim('1', '-4.00', '-8.80', '30', '90') },
            {   data: {immOpt: '3.00', delOpt: '3.40', delay: '90', prob: '25', randomize: '1'},
                stimulus: constructStim('1', '3.00', '3.40', '90', '25') },
            {   data: {immOpt: '-3.00', delOpt: '-3.40', delay: '90', prob: '25', randomize: '1'},
                stimulus: constructStim('1', '-3.00', '-3.40', '90', '25') },
            {   data: {immOpt: '-3.00', delOpt: '-12.00', delay: '90', prob: '10', randomize: '1'},
                stimulus: constructStim('1', '-3.00', '-12.00', '90', '10') }
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