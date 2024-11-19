/*
Script 1
*/
// Initialize jsPsych
const jsPsych = initJsPsych();

// Path to the JSON data file
const dataPath = "stimuli/gen_run_B.json";

// Run experiment on page load
window.onload = runExperiment;

async function runExperiment() {
  // Fetch and process trial data
  const data = await fetchData(dataPath);
  const trialList = processTrialData(Object.values(data));
  console.log(trialList)
  const trialTimeline = createTimeline(trialList);
  console.log(trialTimeline)
  const shuffledTrials = shuffleArray(trialTimeline);

  // Separate trials into loss and reward, then split each into two halves
  const [loss1, loss2, rew1, rew2] = splitTrials(shuffledTrials);

  // Run the two-forced-choice task
  run2FC(loss1, loss2, rew1, rew2);
}

function run2FC(loss1, loss2, rew1, rew2) {
  // Randomly decide the order of blocks
  const order = Math.round(Math.random());

  const lossProc1 = createProcedure(loss1);
  const lossProc2 = createProcedure(loss2);
  const rewProc1 = createProcedure(rew1);
  const rewProc2 = createProcedure(rew2);

  const trialProcedure = {
    timeline: order === 0
      ? [rewProc1, lossProc1, rewProc2, lossProc2]
      : [lossProc1, rewProc1, lossProc2, rewProc2],
  };

  const timeline = [
    instructions1,
    instructions2,
    practiceProcedure,
    finishInstructions,
    trialProcedure,
    debriefPart1,
  ];

  jsPsych.run(timeline);
}

function saveData() {
  // Add start date and time to data
  const startDate = jsPsych.getStartTime().toLocaleDateString();
  const startTime = jsPsych.getStartTime().toLocaleTimeString();
  jsPsych.data.addProperties({ startDate, startTime });

  // Add subject ID to data
  const subjectId = sessionStorage.getItem("prolific_id");
  jsPsych.data.addProperties({ subject_id: subjectId });

  // Get data and prepare files
  const data = jsPsych.data.get();
  const jsonData = data.json();
  const csvData = data.filter({ timelineType: "trial" }).csv();

  // Prepare parameters for CSV
  const csvParams = {
    prolific_id: subjectId,
    data: csvData,
  };

  // Send CSV data
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "web_API/saveExp1.php");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.upload.onloadstart = () => {
    // Send JSON data upon upload start
    const xhr2 = new XMLHttpRequest();
    xhr2.open("POST", "web_API/saveExp1db.php");
    xhr2.setRequestHeader("Content-Type", "application/json");
    xhr2.send(jsonData);
  };
  xhr.send(JSON.stringify(csvParams));
}

/* SCRIPT 2*/
async function fetchData(path) {
    const res = await fetch(path);
    return res.json();
  }
  
  function processTrialData(dataArray) {
    return dataArray.map((trial) => {
    // replace p_occurence with prob
    trial.prob = trial.p_occurence;
    delete trial.p_occurence;

    // Correct loss signs if necessary
    if (trial.task === "loss" && trial.immOpt > 0) {
    trial.immOpt = -trial.immOpt;
    trial.delOpt = -trial.delOpt;
    }

    // Round options to 2 decimal places
    trial.immOpt = parseFloat(trial.immOpt).toFixed(2);
    trial.delOpt = parseFloat(trial.delOpt).toFixed(2);
    // Correct rounding errors
    if (trial.immOpt === trial.delOpt) {
    trial.immOpt = (trial.delOpt - 0.01).toFixed(2);
    }
    // Randomize option presentation
    trial.rando = Math.round(Math.random());
    return trial;
    });
  }
  
  function createTimeline(trialArray) {
    return trialArray.map((trial) => ({
      stimulus: constructStimulus(trial.rando, trial.immOpt, trial.delOpt, trial.delay, trial.prob),
      data: {
        trialID: trial.id,
        immOpt: trial.immOpt,
        delOpt: trial.delOpt,
        delay: trial.delay,
        task: trial.task,
        prob: trial.prob,
        odds: trial.odds,
        randomize: trial.rando,
      },
    }));
  }
  
  function splitTrials(trials) {
    const lossTrials = trials.filter((trial) => trial.data.task === "loss");
    const rewardTrials = trials.filter((trial) => trial.data.task !== "loss");
  
    const lossMid = Math.ceil(lossTrials.length / 2);
    const rewardMid = Math.ceil(rewardTrials.length / 2);
  
    const loss1 = lossTrials.slice(0, lossMid);
    const loss2 = lossTrials.slice(lossMid);
    const rew1 = rewardTrials.slice(0, rewardMid);
    const rew2 = rewardTrials.slice(rewardMid);
  
    return [loss1, loss2, rew1, rew2];
  }
  
  // Helper functions
  function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }
  
  function createProcedure(trials) {
    return {
      timeline: [
        blockIntro,
        {
          timeline: [trialBlock, trialFeedback, fixation],
          timeline_variables: trials,
          randomize_order: true,
        },
      ],
    };
  }
  
  
// constructor function for html stimulus
function constructStimulus(rando, immOpt, delOpt, delay, prob, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: 5px solid  #008000; padding: 5px;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';
    let task = parseFloat(delOpt) > 0 ? 'reward' : 'loss';
    let delString = formatDelay(delay);
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
  
  function formatDelay(days) {
    if (days < 365) {
      return `in <b>${days}</b> days`;
    } else {
      const years = Math.floor(days / 365);
      return `in <b>${years}</b> year${years > 1 ? "s" : ""}`;
    }
  }

/* SCRIPT 3*/
/* 
INSTRUCTIONS AND TEST TRIALS
- verbal instructions
- one test trial per condition: loss and reward
-> total timeline: [instructions, testProcedure, trialProcedure]
*/

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
    ${constructStimulus('0', '5.00', '10.00', '30', '0.7')}
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
        ${constructStimulus('0', '5.00', '10.00', '30', '0.7', 'left')}
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
        ${constructStimulus('0', '-5.00', '-10.00', '30', '0.7',)}
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
    ${constructStimulus('1', '-5.00', '-10.00', '30', '0.7')}
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

// Practice and trial blocks
const practiceBlock = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("stimulus"),
  data: jsPsych.timelineVariable("data"),
  choices: ["q", "p"],
  on_finish: (data) => {
    data.timelineType = "test";
  },
};

const trialBlock = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("stimulus"),
  data: jsPsych.timelineVariable("data"),
  choices: ["q", "p"],
  stimulus_duration: 10000,
  trial_duration: 10000,
  on_finish: (data) => {
    delete data.stimulus;
    const { response, randomize } = data;
    if ((response === "p" && randomize === 0) || (response === "q" && randomize === 1)) {
      data.choice = "delayed";
    } else if ((response === "q" && randomize === 0) || (response === "p" && randomize === 1)) {
      data.choice = "immediate";
    }
    data.timelineType = "trial";
    console.log(data);
  },
};

const fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 1000,
  on_finish: (data) => {
    data.timelineType = "fixcross";
  },
};

const trialFeedback = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: () => {
    const lastData = jsPsych.data.getLastTrialData().values()[0];
    console.log(lastData);
    let feedbackStimulus;
    if (lastData.response === "q" || lastData.response === "p") {
      const feedbackSide = lastData.response === "q" ? "left" : "right";
      //feedbackStimulus = constructStimulus({ ...lastData, feedback: feedbackSide });
      feedbackStimulus = constructStimulus(
        lastData.randomize,
        lastData.immOpt,
        lastData.delOpt,
        lastData.delay,
        lastData.prob,
        feedbackSide
    );
      console.log(feedbackStimulus);
    } else {
      feedbackStimulus = `
        <div class="centerbox" id="container">
          <p class="center-block-text" style="color:red;">
            <b>Please select an option by pressing Q or P!</b>
          </p>
        </div>`;
    }
    return feedbackStimulus;
  },
  choices: "NO_KEYS",
  trial_duration: 1000,
  on_finish: (data) => {
    data.timelineType = "feedback";
  },
};
      

const practiceTrials = [
    {   data: {immOpt: '5.00', delOpt: '10.20', delay: '365', prob: '0.5', randomize: '0'},
        stimulus: constructStimulus('0', '5.00', '10.20', '365', '0.5') },
    {   data: {immOpt: '-4.00', delOpt: '-8.80', delay: '30', prob: '0.9', randomize: '1'},
        stimulus: constructStimulus('1', '-4.00', '-8.80', '30', '0.9') },
    {   data: {immOpt: '3.00', delOpt: '3.40', delay: '90', prob: '0.2', randomize: '1'},
        stimulus: constructStimulus('1', '3.00', '3.40', '90', '0.2') },
    {   data: {immOpt: '-3.00', delOpt: '-3.40', delay: '90', prob: '0.2', randomize: '1'},
        stimulus: constructStimulus('1', '-3.00', '-3.40', '90', '0.2') },
    {   data: {immOpt: '-3.00', delOpt: '-12.00', delay: '90', prob: '0.1', randomize: '1'},
        stimulus: constructStimulus('1', '-3.00', '-12.00', '90', '0.1') }
];

const practiceProcedure = {
    timeline: [practiceBlock, trialFeedback, fixation],
    timeline_variables: practiceTrials,
    randomize_order: false,
  };
  
  const finishInstructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        <!-- Your instruction content here -->
      </div>`,
    choices: ["q", "p"],
    margin_vertical: "100px",
  };
  
  const debriefPart1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Sie haben den ersten Teil beendet.</p>
      <!-- Additional content -->
    `,
    margin_vertical: "100px",
    choices: "NO_KEYS",
    on_load: saveData,
  };
  
  const blockIntro = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p>Drücken Sie Q oder P, wenn Sie bereit sind, den nächsten Block zu starten.</p>`,
    margin_vertical: "100px",
    choices: ["q", "p"],
    on_finish: (data) => {
      data.timelineType = "blockIntro";
    },
  };