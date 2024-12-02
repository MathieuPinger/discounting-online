/*
Script 1
*/
// Initialize jsPsych
const jsPsych = initJsPsych();
// Seed the random number generator for pseudorandomization
Math.seedrandom('42');

// Path to the JSON data file
const dataPath = "stimuli/gen_run_B_test.json";

// Run experiment on page load
window.onload = runExperiment;

async function runExperiment() {
  // Fetch and process trial data
  const data = await fetchData(dataPath);
  const trialList = processTrialData(Object.values(data));
  console.log(trialList)
  // Sort trials
  const sortedTrials = sortTrials(trialList);
  console.log(sortedTrials);
  // Assign IDs
  const trialsWithIDs = assignIDs(sortedTrials);

  // Pseudorandomize trials
  const pseudorandomTrials = pseudorandomizeTrials(trialsWithIDs);
  console.log(pseudorandomTrials);


  // Generate pseudorandomized left/right sequence
  const leftRightSequence = pseudorandomizeLeftRight(pseudorandomTrials.length, 3);

  // Assign left/right sequence to trials
  pseudorandomTrials.forEach((trial, index) => {
    trial.rando = leftRightSequence[index];
  });
  console.log('Left/Right Sequence:', leftRightSequence);

  // Set displayDelayFirst for each trial
  pseudorandomTrials.forEach((trial) => {
    trial.displayDelayFirst = Math.random() < 0.5;
  });
  console.log(pseudorandomTrials);
  

  const trialTimeline = createTimeline(pseudorandomTrials);
  console.log(trialTimeline);

  // Run the two-forced-choice task
  run2FC(trialTimeline);
}

function run2FC(trials) {
  const trialProcedure = createProcedure(trials);

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

  // Round options to 2 decimal places
  trial.immOpt = parseFloat(trial.immOpt).toFixed(2);
  trial.delOpt = parseFloat(trial.delOpt).toFixed(2);
  // Correct rounding errors
  if (trial.immOpt === trial.delOpt) {
  trial.immOpt = (trial.delOpt - 0.01).toFixed(2);
  }

  // Determine condition
  if (trial.delay > 0 && trial.prob == 1) {
    trial.condition = "DD";
  } else if (trial.delay == 0 && trial.prob < 1) {
    trial.condition = "PD";
  } else if (trial.delay > 0 && trial.prob < 1) {
    trial.condition = "DPD";
  } else {
    trial.condition = "Other"; // Just in case
  }
  
  return trial;
  });
}


// deterministic shuffle
function shuffleArray(array) {
  let currentIndex = array.length,
    temporaryValue, randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // Swap
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}


function sortTrials(trialArray) {
  const conditionOrder = { DD: 1, PD: 2, DPD: 3 };
  return trialArray.sort((a, b) => {
    // Sort by condition
    if (conditionOrder[a.condition] !== conditionOrder[b.condition]) {
      return conditionOrder[a.condition] - conditionOrder[b.condition];
    }
    // Then by p_certain
    if (a.p_certain !== b.p_certain) {
      return a.p_certain - b.p_certain;
    }
    // Then by prob
    if (a.prob !== b.prob) {
      return a.prob - b.prob;
    }
    // Then by delay
    return a.delay - b.delay;
  });
}

function assignIDs(trialArray) {
  return trialArray.map((trial, index) => {
    trial.id = index + 1;
    return trial;
  });
}
function pseudorandomizeTrials(trialArray) {
  // Shuffle the entire array
  shuffleArray(trialArray);

  // Initialize an array to hold the pseudorandomized trials
  const pseudorandomTrials = [];

  // Loop through the shuffled array and build the pseudorandomized sequence
  while (trialArray.length > 0) {
    let trialAdded = false;
    for (let i = 0; i < trialArray.length; i++) {
      const trial = trialArray[i];

      // Check if adding this trial would create a sequence of more than two similar trials
      const lastTrial = pseudorandomTrials[pseudorandomTrials.length - 1];
      const secondLastTrial = pseudorandomTrials[pseudorandomTrials.length - 2];

      const isSameAsLastTwo =
        lastTrial &&
        secondLastTrial &&
        trial.condition === lastTrial.condition &&
        trial.prob === lastTrial.prob &&
        trial.delay === lastTrial.delay &&
        trial.condition === secondLastTrial.condition &&
        trial.prob === secondLastTrial.prob &&
        trial.delay === secondLastTrial.delay;

      if (!isSameAsLastTwo) {
        // Add the trial to the pseudorandomized sequence
        pseudorandomTrials.push(trialArray.splice(i, 1)[0]);
        trialAdded = true;
        break;
      }
    }

    if (!trialAdded) {
      // If no trial could be added without violating the sequence rule, add the trial that causes the least violation
      pseudorandomTrials.push(trialArray.shift());
    }
  }

  return pseudorandomTrials;
}

function assignIDs(trialArray) {
  return trialArray.map((trial, index) => {
    trial.id = index + 1;
    return trial;
  });
}

function pseudorandomizeLeftRight(totalTrials, maxConsecutive) {
  // Generate an array with equal numbers of 0s and 1s
  const halfTrials = Math.floor(totalTrials / 2);
  const zeros = halfTrials;
  const ones = totalTrials - zeros; // In case totalTrials is odd

  let leftRightArray = [];

  for (let i = 0; i < zeros; i++) {
    leftRightArray.push(0);
  }

  for (let i = 0; i < ones; i++) {
    leftRightArray.push(1);
  }

  // Shuffle the array using the deterministic shuffle
  shuffleArray(leftRightArray);

  // Rearrange to avoid more than maxConsecutive same values in a row
  let rearrangedArray = [];

  while (leftRightArray.length > 0) {
    let valueAdded = false;

    for (let i = 0; i < leftRightArray.length; i++) {
      const value = leftRightArray[i];

      const lastValues = rearrangedArray.slice(- (maxConsecutive));
      const sameAsLastValues = lastValues.every((v) => v === value);

      if (!sameAsLastValues) {
        // Add value to rearrangedArray
        rearrangedArray.push(leftRightArray.splice(i, 1)[0]);
        valueAdded = true;
        break;
      }
    }

    if (!valueAdded) {
      // Can't avoid exceeding maxConsecutive, so add the next value
      rearrangedArray.push(leftRightArray.shift());
    }
  }

  return rearrangedArray;
}
  
function createTimeline(trialArray) {
  return trialArray.map((trial) => ({
    data: {
      trialID: trial.id,
      immOpt: trial.immOpt,
      delOpt: trial.delOpt,
      delay: trial.delay,
      prob: trial.prob,
      odds: trial.odds,
      randomize: trial.rando,
      condition: trial.condition,
      p_certain: trial.p_certain,
      displayDelayFirst: trial.displayDelayFirst
    },
  }));
}



function createProcedure(trials) {
  // Randomly decide whether to display Delay or Probability first for each trial
  return {
    timeline: [
      firstDisplay,
      secondDisplay,
      thirdDisplay,
      trialFeedback,
      fixation,
    ],
    timeline_variables: trials, // Pass trials directly
    randomize_order: false,
  };
}
  
function constructStimulus(
  rando,
  immOpt,
  delOpt,
  delay,
  prob,
  feedback,
  displayOptions = {}
) {
  const {
    showDelayedAmount = true,
    showDelay = true,
    showProb = true,
    immAlwaysVisible = true,
  } = displayOptions;

  // Format delay and probability
  const formattedDelay = formatDelay(delay);
  const formattedProb =
    prob < 1 ? `with <b>${prob * 100}%</b> probability` : "with <b>100%</b> probability";

  // Immediate option content
  const immOptionContent = `
    <div class='option-row'><b>${immOpt}€</b></div>
    <div class='option-row'><b>Today</b></div>
    <div class='option-row'>with <b>100%</b> probability</div>
  `;

  // Delayed option content
  let delayedOptionContent = "";
  if (showDelayedAmount) {
    delayedOptionContent += `<div class='option-row'><b>${delOpt}€</b></div>`;
  } else {
    delayedOptionContent += `<div class='option-row'>&nbsp;</div>`;
  }
  if (showDelay) {
    delayedOptionContent += `<div class='option-row'><b>${formattedDelay}</b></div>`;
  } else {
    delayedOptionContent += `<div class='option-row'>&nbsp;</div>`;
  }
  if (showProb) {
    delayedOptionContent += `<div class='option-row'>${formattedProb}</div>`;
  } else {
    delayedOptionContent += `<div class='option-row'>&nbsp;</div>`;
  }

  // Feedback border (if applicable)
  let feedbackLeft = "";
  let feedbackRight = "";
  if (feedback === "left") {
    feedbackLeft = "style='border: 5px solid green;'";
  } else if (feedback === "right") {
    feedbackRight = "style='border: 5px solid green;'";
  }

  // Option templates with feedback styles
  const immOption = `
    <div class='option' id='${rando === 0 ? "leftOption" : "rightOption"}' ${rando === 0 ? feedbackLeft : feedbackRight}>
      <font color='#005AB5'>
        ${immOptionContent}
      </font>
    </div>
  `;

  const delayedOption = `
    <div class='option' id='${rando === 0 ? "rightOption" : "leftOption"}' ${rando === 0 ? feedbackRight : feedbackLeft}>
      <font color='#DC3220'>
        ${delayedOptionContent}
      </font>
    </div>
  `;

  // Construct the final stimulus HTML
  const stimulusHTML = `
    <div class='centerbox' id='container'>
      <p class='center-block-text'>
        Which amount would you prefer to <b>win</b>?
        <br>Press <strong>'q'</strong> for left or <strong>'p'</strong> for right:
      </p>
      <div class='table'>
        <div class='row'>
          ${rando === 0 ? immOption + delayedOption : delayedOption + immOption}
        </div>
      </div>
    </div>
  `;

  return stimulusHTML;
}


function formatDelay(days) {
  const daysNum = parseFloat(days);
  if (daysNum === 0) {
    return `<b>Today</b>`;
  } else if (daysNum === 30) {
    return `in <b>1 month</b>`;
  } else if (daysNum === 182.5) {
    return `in <b>6 months</b>`;
  } else if (daysNum < 365) {
    return `in <b>${daysNum}</b> days`;
  } else {
    const years = daysNum / 365;
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
  <h3>Willkommen zum Experiment!</h3>
  <p>
  Wie im ersten Teil des Experiments haben Sie die Wahl zwischen zwei hypothetischen Geldgewinnen, 
  einem <span class="immediate">geringeren Betrag</span> 
  und einem <span class="delayed">größeren Betrag</span>.
  </p>

  <div class="instructions">
  Jeder Gewinn ist mit einer <b>Verzögerung</b> und einer <b>Wahrscheinlichkeit</b> verbunden.
  Die <b>Verzögerung</b> informiert Sie darüber, <b>wann</b> Sie das Geld gewinnen/verlieren würden. Die <b>Wahrscheinlichkeit</b> 
  gibt Ihnen Auskunft über die Wahrscheinlichkeit des gewählten Gewinns/Verlusts. Wenn die Wahrscheinlichkeit 100% beträgt, ist 
  der Gewinn/Verlust sicher. Ihre Aufgabe ist es, zwischen diesen Optionen zu wählen, indem Sie <b>"q" für die linke Option und "p" für die rechte Option 
  drücken</b>.

  <p>
  Der <span class="immediate">geringere Betrag</span> besteht immer aus 50€, 
  <span class="immediate">sofort</span> und <span class="immediate">mit 100% Wahrscheinlichkeit</span>.
  Beim <span class="delayed">größeren Betrag</span> stehen unterschiedliche Geldbeträge, Verzögerungen und Wahrscheinlichkeiten zur Auswahl.
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
  type: jsPsychHtmlKeyboardResponse,
  stimulus: instructionsText1,
  choices: ["q", "p"],
  margin_vertical: "100px",
};

const instructions2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: instructionsText2,
  choices: ["q", "p"],
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

const firstDisplay = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    const displayDelayFirst = trial.displayDelayFirst;
    console.log(trial);
    

    return constructStimulus(
      trial.randomize,
      trial.immOpt,
      trial.delOpt,
      trial.delay,
      trial.prob,
      null, // No feedback
      {
        showDelayedAmount: false,
        showDelay: displayDelayFirst,
        showProb: !displayDelayFirst,
      }
    );
  },
  trial_duration: 2000,
  choices: "NO_KEYS",
  data: function () {
    return {
      timelineType: "firstDisplay",
    };
  },
};

const secondDisplay = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");

    return constructStimulus(
      trial.randomize,
      trial.immOpt,
      trial.delOpt,
      trial.delay,
      trial.prob,
      null, // No feedback
      {
        showDelayedAmount: false,
        showDelay: true,
        showProb: true,
      }
    );
  },
  trial_duration: 3000,
  choices: "NO_KEYS",
  data: function () {
    return {
      timelineType: "secondDisplay",
    };
  },
};

const thirdDisplay = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    console.log(trial);
    

    return constructStimulus(
      trial.randomize,
      trial.immOpt,
      trial.delOpt,
      trial.delay,
      trial.prob,
      null, // No feedback
      {
        showDelayedAmount: true,
        showDelay: true,
        showProb: true,
      }
    );
  },
  trial_duration: 10000,
  choices: ["q", "p"],
  data: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return {
      ...trial,
      timelineType: "thirdDisplay",
    };
  },
  on_finish: function (data) {
    const response = data.response;
    const randomize = data.randomize;

    if (
      (response === "p" && randomize == 0) ||
      (response === "q" && randomize == 1)
    ) {
      data.choice = "delayed";
    } else if (
      (response === "q" && randomize == 0) ||
      (response === "p" && randomize == 1)
    ) {
      data.choice = "immediate";
    } else {
      data.choice = "no_response";
    }
    // Record the response time
    data.rt = data.rt;
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
        feedbackSide,
        {
          showDelayedAmount: true,
          showDelay: true,
          showProb: true,
        }
    );
      console.log(feedbackStimulus);
    } else {
      feedbackStimulus = `
        <div class="centerbox" id="container">
          <p class="center-block-text" style="color:red;">
            <b>Bitte wählen Sie rechtzeitig eine Option!</b>
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

const fixation = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size:60px;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 5000,
  data: {
    timelineType: "fixation",
  },
};
      

const practiceTrials = [
    {   data: {immOpt: '50.00', delOpt: '100.00', delay: '365', prob: '0.5', randomize: '0', displayDelayFirst: true} }
];

const practiceProcedure = createProcedure(practiceTrials);

// const practiceProcedure = {
//     timeline: [practiceBlock, trialFeedback, fixation],
//     timeline_variables: practiceTrials,
//     randomize_order: false,
//   };
  
  const finishInstructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div class="instructions">
        Der Probedurchlauf ist abgeschlossen. <br>
        Sie können das Experiment starten, indem Sie auf Q oder P drücken.
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