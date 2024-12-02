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
  
  // Assign jittered durations to trials
  pseudorandomTrials.forEach((trial) => {
    // Jitter durations between 2000ms and 4000ms for displays
    trial.firstDisplayDuration = Math.round(2000 + Math.random() * 2000);
    trial.secondDisplayDuration = Math.round(2000 + Math.random() * 2000);
    trial.thirdDisplayDuration = Math.round(2000 + Math.random() * 2000);

    // Jitter fixation duration between 5000ms and 7000ms
    trial.fixationDuration = Math.round(5000 + Math.random() * 2000);
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
      displayDelayFirst: trial.displayDelayFirst,
      firstDisplayDuration: trial.firstDisplayDuration,
      secondDisplayDuration: trial.secondDisplayDuration,
      thirdDisplayDuration: trial.thirdDisplayDuration,
      fixationDuration: trial.fixationDuration
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
      fourthDisplay,
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
    showPrompt = true, // Control prompt visibility
  } = displayOptions;

  // Format delay and probability
  const formattedDelay = formatDelay(delay);
  const formattedProb =
    prob < 1
      ? `with <b>${prob * 100}%</b> probability`
      : "with <b>100%</b> probability";

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
    delayedOptionContent += `<div class='option-row'>${formattedDelay}</div>`;
  } else {
    delayedOptionContent += `<div class='option-row'>&nbsp;</div>`;
  }
  if (showProb) {
    delayedOptionContent += `<div class='option-row'>${formattedProb}</div>`;
  } else {
    delayedOptionContent += `<div class='option-row'>&nbsp;</div>`;
  }

  // Feedback outline (if applicable)
  let feedbackLeft = "";
  let feedbackRight = "";
  if (feedback === "left") {
    feedbackLeft = "feedback-highlight";
  } else if (feedback === "right") {
    feedbackRight = "feedback-highlight";
  }

  // Option templates with feedback styles
  const immOption = `
    <div class='option ${rando === 0 ? "leftOption" : "rightOption"} ${
    rando === 0 ? feedbackLeft : feedbackRight
  }'>
      <font color='#005AB5'>
        ${immOptionContent}
      </font>
    </div>
  `;

  const delayedOption = `
    <div class='option ${rando === 0 ? "rightOption" : "leftOption"} ${
    rando === 0 ? feedbackRight : feedbackLeft
  }'>
      <font color='#DC3220'>
        ${delayedOptionContent}
      </font>
    </div>
  `;

  // Control prompt visibility using CSS classes
  const promptClass = showPrompt ? "prompt-visible" : "prompt-hidden";

  // Construct the final stimulus HTML
  const stimulusHTML = `
    <div class='centerbox' id='container'>
      <p class='center-block-text ${promptClass}'>
        Which amount would you prefer to <b>win</b>?<br>Press <strong>'q'</strong> for left or <strong>'p'</strong> for right:
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
  gibt Ihnen Auskunft über die Wahrscheinlichkeit des gewählten Gewinns/Verlusts. 
  Ihre Aufgabe ist es, zwischen diesen Optionen zu wählen, indem Sie <b>Links für die linke Option und Rechts für die rechte Option 
  drücken</b>.

  Bitte drücken Sie Links oder Rechts, um die weiteren Anweisungen zu lesen.
  </div>
  `

const instructionsText2 = `
  <div class="instructions">
  <p>
  In diesem Teil des Experiments ist der <span class="immediate">geringere Betrag</span> immer gleich: 50€, sofort und mit 100% Wahrscheinlichkeit.
  Die Informationen für den <span class="delayed">größeren Betrag</span>, also Wahrscheinlichkeit, 
  Verzögerung und Geldbetrag, werden in jedem Durchgang <b>nacheinander</b> präsentiert. <br>
  Bitte warten Sie die Präsentation aller Informationen ab, bevor Sie sich für eine der beiden Optionen entscheiden. <br>
  Es erscheint in jedem Durchgang ein Hinweis, sobald Sie eine der beiden Optionen wählen sollen. Sie haben ab dann jeweils <b>5 Sekunden</b> Zeit.
  </p>

  <p>
  Der <span class="immediate">kleinere Betrag</span> und der 
  <span class="delayed">größere Betrag</span> werden nach dem Zufallsprinzip auf der 
  <b>linken</b> und <b>rechten</b> Seite angezeigt.
  </p>

  <p>
  Bitte warten Sie nun auf die Anweisungen der/des Versuchsleiters/Versuchsleiterin.
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
        showPrompt: false,
      }
    );
  },
  trial_duration: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return trial.firstDisplayDuration;
  },
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
        showPrompt: false,
      }
    );
  },
  trial_duration: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return trial.secondDisplayDuration;
  },
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

    return constructStimulus(
      trial.randomize,
      trial.immOpt,
      trial.delOpt,
      trial.delay,
      trial.prob,
      null,
      {
        showDelayedAmount: true,
        showDelay: true,
        showProb: true,
        showPrompt: false, // Remove prompt
      }
    );
  },
  trial_duration: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return trial.thirdDisplayDuration;
  },
  choices: "NO_KEYS", // Do not allow responses yet
  data: function () {
    const trial = jsPsych.timelineVariable();
    return {
      ...trial,
      timelineType: "thirdDisplay",
    };
  },
};

const fourthDisplay = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");

    return constructStimulus(
      trial.randomize,
      trial.immOpt,
      trial.delOpt,
      trial.delay,
      trial.prob,
      null,
      {
        showDelayedAmount: true,
        showDelay: true,
        showProb: true,
        showPrompt: true, // Show prompt
      }
    );
  },
  trial_duration: 10000, // Allow up to 10 seconds for response
  choices: ["q", "p"],
  data: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return {
      ...trial,
      timelineType: "fourthDisplay",
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
    let feedbackStimulus;
    if (lastData.response === "q" || lastData.response === "p") {
      const feedbackSide = lastData.response === "q" ? "left" : "right";
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
          showPrompt: true, // Show prompt during feedback if desired
        }
      );
    } else {
      feedbackStimulus = `
        <div class="centerbox" id="container">
          <p class="center-block-text" style="color:red;">
            <b>Please make a selection in time!</b>
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
  trial_duration: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return trial.fixationDuration;
  },
  data: {
    timelineType: "fixation",
  },
};
      

const practiceTrials = [
    {   data: {immOpt: '50.00', delOpt: '100.00', delay: '365', prob: '0.5', randomize: '0', displayDelayFirst: true,
      firstDisplayDuration: '3000', secondDisplayDuration: '3000', thirdDisplayDuration: '3000', fixationDuration: '1000'} }
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