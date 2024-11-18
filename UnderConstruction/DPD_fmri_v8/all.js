/*
Script 1
*/
var jsPsych = initJsPsych();

// run experiment on page load
// path to testfile.json
let dataPath = "stimuli/gen_run_B.json";

window.onload = runExperiment;

async function runExperiment() {
  /*
  RUN EXPERIMENT
  - loads json trial
  - converts json data to an array of trial objects
  - calls run2FC (2-forced-choice) function with the trial array
  */

  const trialList = await fetchData(dataPath)
    .then((data) => Object.values(data))
    .then((data) => roundChoices(data))
    .then((data) => correctRounding(data))
    .then((data) => correctLossSign(data))
    .then((data) => roundChoices(data)) // second rounding for correct negative values!
    .then((data) => createTimeline(data))
    .then((data) => randomizeOrientation(data))
    .then((data) => shuffleArray(data));

  let loss1 = [];
  let rew1 = [];
  trialList.forEach((trial) => (trial.data.task == "loss" ? loss1 : rew1).push(trial));

  // slice loss and reward into 2 sections each
  let loss2 = loss1.splice(0, Math.ceil(loss1.length / 2));
  let rew2 = rew1.splice(0, Math.ceil(rew1.length / 2));

  // run 2 forced choice task
  run2FC(loss1, loss2, rew1, rew2);
}

function run2FC(loss1, loss2, rew1, rew2) {
  // create 2 orders of stimuli: loss-rew and rew-loss
  let order = Math.round(Math.random());
  console.log(order);

  let lossProc1 = createProcedure(loss1, "loss");
  let lossProc2 = createProcedure(loss2, "loss");
  let rewProc1 = createProcedure(rew1, "reward");
  let rewProc2 = createProcedure(rew2, "reward");

  let trialProcedure;
  if (order == 0) {
    trialProcedure = {
      timeline: [rewProc1, lossProc1, rewProc2, lossProc2],
    };
  } else {
    trialProcedure = {
      timeline: [lossProc1, rewProc1, lossProc2, rewProc2],
    };
  }

  let timeline = [
    instructions1,
    instructions2,
    practiceProcedure,
    finishInstructions,
    trialProcedure,
    debriefPart1,
  ];

  jsPsych.run(timeline);
}

// Updated saveData function to jsPsych v8 syntax
function saveData() {
  // add startdate and starttime
  let startdate = jsPsych.getStartTime().toLocaleDateString();
  let starttime = jsPsych.getStartTime().toLocaleTimeString();
  jsPsych.data.addProperties({ startdate: startdate, starttime: starttime });

  // add ID to every trial
  jsPsych.data.addProperties({ subject_id: sessionStorage.getItem("prolific_id") });

  // get data object
  let data = jsPsych.data.get();

  // separate json and csv files
  let jsonfile = data.json();
  let csvfile = data.filter({ timelineType: "trial" }).csv();
  let csvparams = {
    prolific_id: sessionStorage.getItem("prolific_id"),
    data: csvfile,
  };

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "web_API/saveExp1.php");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.upload.onloadstart = function () {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "web_API/saveExp1db.php");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(jsonfile);
  };

  xhr.send(JSON.stringify(csvparams));
}

/* SCRIPT 2*/

var jsPsych = initJsPsych();

// fetch data
async function fetchData(path) {
    // fetch json from server
    const  res = await fetch(path);
    const data = await res.json();
    return data;
};


// constructor function for html stimulus
function constructStim(rando, immOpt, delOpt, delay, prob, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: 5px solid  #008000; padding: 5px;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';
    let task = parseFloat(delOpt) > 0 ? 'reward' : 'loss';
    let delString = daysToYears(delay);
    let probString = 'with <b>'+prob*100+'%</b> probability'

    let stimString = `<div class = centerbox id='container'>
    <p class = center-block-text>
        Which amount would you prefer to 
        ${task=='reward' ? '<b>win</b>' : '<b>lose</b>'}?
        <br>Press
        <strong>'q'</strong> for left or
        <strong>'p'</strong> for right:
    </p>
    <div class='table'>
    <div class='row'>
    <div class = 'option' id='leftOption' ${feedback=='left' ? feedbackStyle : null}>
        <font color=${rando==0 ? immOptColor : delOptColor}>
        <div class = 'option-row'><b>&pound; ${rando==0 ? immOpt : delOpt}</b></div>
        <div class = 'option-row'>${rando==0 ? `<b>Today</b>` : delString}</div>
        <div class = 'option-row'>${rando==0 ? `with <b>100%</b> probability` : probString}</div>
        </font></div>
    <div class = 'option' id='rightOption' ${feedback=='right' ? feedbackStyle : null}>
        <font color=${rando==0 ? delOptColor : immOptColor}>
        <div class = 'option-row'><b>&pound; ${rando==0 ? delOpt : immOpt}</b></div>
        <div class = 'option-row'>${rando==0 ? delString : `<b>Today</b>`}</div>
        <div class = 'option-row'>${rando==0 ? probString : `with <b>100%</b> probability`}</div>
        </font></div></div></div></div>`;
        return stimString;
};

// function to create sub-timeline for the loss and reward blocks
function createProcedure(trials) {
    let trialProcedure = {
    timeline: [
        trialBlock,
        trialfeedback,
        fixation
    ],
    timeline_variables: trials,
    randomize_order: true
    };
let blockProcedure = {
    timeline: [blockIntro, trialProcedure]
};
return blockProcedure;
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


function shuffleArray(array) {
    /* Randomize trial order */
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    console.log(array);
    return array;
};



function roundChoices(arr) {
    /* Converts JSON to array and rounds monetary choices to 2 digits */
    arr.map(trial => {
        // round trial Options to 2 digits
        trial['immOpt'] = parseFloat(trial['immOpt']).toFixed(2);
        trial['delOpt'] = parseFloat(trial['delOpt']).toFixed(2);
        // correct rounding errors (4.999 -> 5)
        if(trial['immOpt'] == trial['delOpt']) {
            trial['immOpt'] = trial['delOpt']-0.01;
        };
    });
    console.log(arr);
    return arr;
}


function correctRounding(arr) {
    /* Converts JSON to array and rounds monetary choices to 2 digits */
    arr.map(trial => {
        // correct rounding errors (4.999 -> 5)
        if(trial['immOpt'] == trial['delOpt']) {
            trial['immOpt'] = trial['delOpt']-0.01;
        };
    });
    console.log(arr);
    return arr;
}


function correctLossSign(arr) {
    /* Convert Loss Values to negative, if necessary */
    arr.map(trial => {
        if (trial['task'] == "loss" && trial['immOpt'] > 0) {
            trial['immOpt'] = -trial['immOpt'];
            trial['delOpt'] = -trial['delOpt'];
        };
    });
    return arr;
}


function randomizeOrientation(arr) {
    arr.map(trial => {
        /* Add Randomizer for Stimulus Presentation */
        // create random number: 0 or 1
        // rando == 0 -> immediate left; rando == 1 -> immediate right
        trial.rando = Math.round(Math.random());
    });
    console.log(arr);
    return arr;
}

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
            stimulus: constructStim(trial.rando, trial.immOpt, trial.delOpt, trial.delay, trial.p_occurence),

            data: {
                trialID: trial.id,
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                delay: trial.delay,
                task: trial.task,
                prob: trial.p_occurence,
                odds: trial.odds,
                randomize: trial.rando
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

/* SCRIPT 3*/
/* 
INSTRUCTIONS AND TEST TRIALS
- verbal instructions
- one test trial per condition: loss and reward
-> total timeline: [instructions, testProcedure, trialProcedure]
*/
var jsPsych = initJsPsych();

const instructionsText1 =
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
    ${constructStim('0', '5.00', '10.00', '30', '0.7')}
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
    drücken</b>. (Hinweis: Dies ist nur ein Beispiel, das Drücken der Tasten funktioniert hier nicht.)

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
        ${constructStim('0', '5.00', '10.00', '30', '0.7', 'left')}
        </div>
    Der nächste Versuch würde dann ein paar Sekunden später präsentiert werden.

    Weitere Anweisungen finden Sie auf der nächsten Seite.
    </div>
    `

const instructionsText2 = `
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
        ${constructStim('0', '-5.00', '-10.00', '30', '0.7',)}
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
    ${constructStim('1', '-5.00', '-10.00', '30', '0.7')}
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

const instructions1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: instructionsText1,
    choices: ["Continue"],
    margin_vertical: "100px",
    };      

const instructions2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: instructionsText2,
    choices: ["Continue to test trials"],
    margin_vertical: "100px",
    };

const practiceBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: jsPsych.timelineVariable('stimulus'),
    data: jsPsych.timelineVariable('data'),
    choices: ["q", "p"],
    on_finish: function (data) {
        data.timelineType = "test";
    },
    };
      

const trialBlock = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: jsPsych.timelineVariable('stimulus'),
    data: jsPsych.timelineVariable('data'),
    choices: ["q", "p"],
    stimulus_duration: 10000,
    trial_duration: 10000,
    on_finish: function (data) {
        delete data.stimulus;
        if (data.response == "p" && data.randomize == 0) {
        data.choice = "delayed";
        } else if (data.response == "q" && data.randomize == 0) {
        data.choice = "immediate";
        } else if (data.response == "q" && data.randomize == 1) {
        data.choice = "delayed";
        } else if (data.response == "p" && data.randomize == 1) {
        data.choice = "immediate";
        }
        data.timelineType = "trial";
    },
    };
    
    const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<div style=\"font-size:60px;\">+</div>",
    choices: "NO_KEYS",
    trial_duration: 1000,
    on_finish: function (data) {
        data.timelineType = "fixcross";
    },
    };
    
    const trialfeedback = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
        let lastData = jsPsych.data.getLastTrialData().values()[0];
        let feedback;
    
        if (lastData.response == "q") {
        feedback = constructStim(
            lastData.randomize,
            lastData.immOpt,
            lastData.delOpt,
            lastData.delay,
            lastData.prob,
            "left"
        );
        } else if (lastData.response == "p") {
        feedback = constructStim(
            lastData.randomize,
            lastData.immOpt,
            lastData.delOpt,
            lastData.delay,
            lastData.prob,
            "right"
        );
        } else {
        feedback = `<div class = centerbox id='container'>
            <p class = center-block-text style="color:red;">
            <b>Please select an option by pressing Q or P!</b>
            </p>`;
        }
        return feedback;
    },
    choices: "NO_KEYS",
    trial_duration: 1000,
    on_finish: function (data) {
        data.timelineType = "feedback";
    },
    };
      

const practiceTimeline_variables = [
    {   data: {immOpt: '5.00', delOpt: '10.20', delay: '365', prob: '0.5', randomize: '0'},
        stimulus: constructStim('0', '5.00', '10.20', '365', '0.5') },
    {   data: {immOpt: '-4.00', delOpt: '-8.80', delay: '30', prob: '0.9', randomize: '1'},
        stimulus: constructStim('1', '-4.00', '-8.80', '30', '0.9') },
    {   data: {immOpt: '3.00', delOpt: '3.40', delay: '90', prob: '0.2', randomize: '1'},
        stimulus: constructStim('1', '3.00', '3.40', '90', '0.2') },
    {   data: {immOpt: '-3.00', delOpt: '-3.40', delay: '90', prob: '0.2', randomize: '1'},
        stimulus: constructStim('1', '-3.00', '-3.40', '90', '0.2') },
    {   data: {immOpt: '-3.00', delOpt: '-12.00', delay: '90', prob: '0.1', randomize: '1'},
        stimulus: constructStim('1', '-3.00', '-12.00', '90', '0.1') }
];

const practiceProcedure = {
    timeline: [practiceBlock, trialfeedback, fixation],
    timeline_variables: practiceTimeline_variables,
    randomize_order: false
}

const finishInstructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: 
        `<div class="instructions">
        <p>Das Experiment kann jetzt beginnen!
        Von nun an haben Sie für jede Entscheidung <b>10 Sekunden</b> Zeit.
        Nach vier Versuchsblöcken werden Sie gebeten, einige Fragebögen auszufüllen.</p>
        <p>Bitte legen Sie Ihren <b>linken Zeigefinger auf Q</b>, 
        und Ihren <b>rechten Zeigefinger auf P</b>.</p>
        <p>Drücken Sie dann Q oder P, um mit dem Experiment fortzufahren.</p>
        </div>`,
    choices: ['q', 'p'],
    margin_vertical: '100px',
};

const debriefPart1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Sie haben den erste Teil beendet.</p>
                <p><b>Bitte schließen sie nicht dieses Browserfenster.</b>
                <p>Sie werden automatisch zum zweiten Teil weitergeleitet.</p>
                <p>Der zweite Teil wird mit zwei Fragebögen beginnen.</p>
                <p>Je nach Ihrer Internetverbindung kann die Weiterleitung ein paar Sekunden oder Minuten dauern.</p>
                <p>Wenn Sie nach ein paar Minuten nicht weitergeleitet werden, kontaktieren Sie uns bitte über Prolific.</p>`,
                // If you are not redirected, please click 
                // <a target="_self" href="https://clox.zi-mannheim.de/rewad2/rewad2_server/rewad_part2.html" >here</a>`,
    margin_vertical: '100px',
    choices: "NO_KEYS",
    on_load: function() {
        saveData();
    }
};

const blockIntro = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Drücken Sie Q oder P, wenn Sie bereit sind, den nächsten Block zu starten.</p>`,
    margin_vertical: '100px',
    choices: ['q', 'p'],
    on_finish: function(data) {
        data.timelineType = "blockIntro";
    }
};