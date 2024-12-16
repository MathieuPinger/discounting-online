/*
Script 1
*/

// Set Test Mode and fMRI mode
// TestMode = 3 trials total
const testMode = true;

// fMRI mode = buttons for left and right = b/g
const fmriMode = false;
if (fmriMode) {
  leftButton = "g";
  rightButton = "b";
} else {
  leftButton = "q";
  rightButton = "p";
}

// Initialize jsPsych
const jsPsych = initJsPsych();
// Seed the random number generator for pseudorandomization
Math.seedrandom('42');

// Run experiment on page load
window.onload = runExperiment;

function runExperiment() {
  // Fetch and process trial data
  const data = trial_data.run_B;
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

  let trialTimeline = createTimeline(pseudorandomTrials);
  console.log(trialTimeline);

  if (testMode) {
    trialTimeline = createTimeline(pseudorandomTrials.slice(0, 10));
  } else {
    trialTimeline = createTimeline(pseudorandomTrials);
  }
  // Run the two-forced-choice task
  run2FC(trialTimeline);
}

function run2FC(trials) {
  const trialProcedure = createProcedure(trials);

  const timeline = [
    enterId,
    instructions1,
    instructions2,
    practiceProcedure,
    firstTrigger,
    triggerLoop,
    trialProcedure,
    debriefPart1,
    debriefPart2,
  ];

  jsPsych.run(timeline);
}

function saveData() {
  // Add start date and time to data
  const startDate = jsPsych.getStartTime().toLocaleDateString();
  const startTime = jsPsych.getStartTime().toLocaleTimeString();
  jsPsych.data.addProperties({ startDate, startTime });

  // Add subject ID to data
  jsPsych.data.addProperties({ subject_id: subjectId });

  // // Add trigger data
  // let trigger_data = {triggers: triggers};
  // jsPsych.data.write(trigger_data);

  // Get data and prepare files
  jsPsych.data.get().ignore('stimulus').localSave('csv',`${subjectId}_dpd_fmri.csv`)
}

/* SCRIPT 2*/

function processTrialData(dataArray) {
  return dataArray.map((trial) => {
  // replace p_occurence with prob
  trial.prob = trial.p_occurence;
  delete trial.p_occurence;

  // Round options to 2 decimal places
  trial.immOpt = parseFloat(trial.immOpt).toFixed(2).replace('.', ',');
  trial.delOpt = parseFloat(trial.delOpt).toFixed(2).replace('.', ',');
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
      ? `<b>${prob * 100}%</b>`
      : "<b>100%</b>";

  // Immediate option content
  const immOptionContent = `
    <div class='option-row'><b>${immOpt}€</b></div>
    <div class='option-row'><b>Heute</b></div>
    <div class='option-row'><b>100%</b></div>
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
      <font color='#4CA8FF'>
        ${immOptionContent}
      </font>
    </div>
  `;

  const delayedOption = `
    <div class='option ${rando === 0 ? "rightOption" : "leftOption"} ${
    rando === 0 ? feedbackRight : feedbackLeft
  }'>
      <font color='#FF4D4D'>
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
        Bitte entscheiden Sie sich für einen <b>Gewinn</b>.<br>Drücken Sie <strong>'links'</strong> oder <strong>'rechts'</strong>:
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
    return `<b>Heute</b>`;
  } else if (daysNum === 30) {
    return `in <b>1 Monat</b>`;
  } else if (daysNum === 182.5) {
    return `in <b>6 Monaten</b>`;
  } else if (daysNum < 365) {
    return `in <b>${daysNum}</b> Tagen`;
  } else {
    const years = daysNum / 365;
    return `in <b>${years}</b> Jahr${years > 1 ? "en" : ""}`;
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

const enterId = {
  type: jsPsychSurveyText,
  questions: [
    {prompt: 'Probanden-ID:'}
  ],
  button_label: "Weiter",
  data: {
    displayType: 'enter_id'
  },
  on_finish: function(data) {
    // Capture the subject ID from the response
    subjectId = data.response.Q0;
    console.log(subjectId);
    

    // Add subject ID to data properties for subsequent trials
    jsPsych.data.addProperties({ subject_id: subjectId });
  }
}

const instructions1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: instructionsText1,
  choices: [leftButton, rightButton],
  margin_vertical: "100px",
  data: {displayType: 'instructions1'},
};

const instructions2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: instructionsText2,
  choices: [leftButton, rightButton],
  margin_vertical: "100px",
  data: {displayType: 'instructions2'},
};

// Practice and trial blocks
const practiceBlock = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: jsPsych.timelineVariable("stimulus"),
  data: jsPsych.timelineVariable("data"),
  choices: [leftButton, rightButton],
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
    const trial = jsPsych.evaluateTimelineVariable("data");
    const displayType = trial.displayDelayFirst ? "delay" : "prob";
    return {
      timelineType: "firstDisplay",
      displayType: displayType,
      delay: trial.delay,
      prob: trial.prob,
      delOpt: trial.delOpt,
      trialID: trial.trialID,
      condition: trial.condition,
      duration: trial.firstDisplayDuration,
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
    const trial = jsPsych.evaluateTimelineVariable("data");
    const displayType = trial.displayDelayFirst ? "prob" : "delay";
    return {
      timelineType: "secondDisplay",
      displayType: displayType,
      delay: trial.delay,
      prob: trial.prob,
      delOpt: trial.delOpt,
      trialID: trial.trialID,
      condition: trial.condition,
      duration: trial.secondDisplayDuration,
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
    const trial = jsPsych.evaluateTimelineVariable("data");
    return {
      timelineType: "thirdDisplay",
      displayType: "all",
      delay: trial.delay,
      prob: trial.prob,
      delOpt: trial.delOpt,
      trialID: trial.trialID,
      condition: trial.condition,
      duration: trial.thirdDisplayDuration,
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
  choices: [leftButton, rightButton],
  data: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return {
      ...trial,
      timelineType: "fourthDisplay",
      displayType: "prompt",
      delay: trial.delay,
      prob: trial.prob,
      delOpt: trial.delOpt,
      trialID: trial.trialID,
      condition: trial.condition,
      duration: null, // Will be set in on_finish
    };
  },
  on_finish: function (data) {
    const response = data.response;
    const randomize = data.randomize;

    if (
      (response === rightButton && randomize == 0) ||
      (response === leftButton && randomize == 1)
    ) {
      data.choice = "delayed";
    } else if (
      (response === leftButton && randomize == 0) ||
      (response === rightButton && randomize == 1)
    ) {
      data.choice = "immediate";
    } else {
      data.choice = "no_response";
    }
    // Record the duration based on response time
    if (data.rt !== null) {
      data.duration = data.rt;
    } else {
      data.duration = 10000; // Maximum duration if no response
    }
  },
};

const trialFeedback = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: () => {
    const lastData = jsPsych.data.getLastTrialData().values()[0];
    let feedbackStimulus;
    if (lastData.response === leftButton || lastData.response === rightButton) {
      const feedbackSide = lastData.response === leftButton ? "left" : "right";
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
            <b>Bitte entscheiden Sie sich für eine Option!</b>
          </p>
        </div>`;
    }
    return feedbackStimulus;
  },
  choices: "NO_KEYS",
  trial_duration: 1000,
  data: function () {
    const lastData = jsPsych.data.getLastTrialData().values()[0];
    return {
      timelineType: "feedback",
      displayType: "feedback",
      delay: lastData.delay,
      prob: lastData.prob,
      delOpt: lastData.delOpt,
      trialID: lastData.trialID,
      condition: lastData.condition,
      duration: 1000,
    };
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
  data: function () {
    const trial = jsPsych.evaluateTimelineVariable("data");
    return {
      timelineType: "fixation",
      displayType: "fixation",
      trialID: trial.trialID,
      condition: trial.condition,
      duration: trial.fixationDuration,
    };
  },
};
      

const practiceTrials = [
    {   data: {immOpt: '50.00', delOpt: '100.00', delay: '365', prob: '0.5', randomize: '0', displayDelayFirst: true,
      firstDisplayDuration: '3000', secondDisplayDuration: '3000', thirdDisplayDuration: '3000', fixationDuration: '1000'} }
];

const practiceProcedure = createProcedure(practiceTrials);

const debriefPart1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Sie haben das Experiment beendet. Der/die Studienleiter/in wird Sie bald kontaktieren.</p>
    <!-- Additional content -->
  `,
  margin_vertical: "100px",
  choices: "NO_KEYS",
  trial_duration: 500,
  data: function () {
    return {
      displayType: 'triggersave',
      triggers: triggers,
    };
  },
};

const debriefPart2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Sie haben die Studie beendet. Der/die Studienleiter/in wird Sie bald kontaktieren.</p>
    <!-- Additional content -->
  `,
  margin_vertical: "100px",
  choices: "NO_KEYS",
  on_start: function() {
    // data.displayType = 'debrief';
    // data.triggers = triggers;
    // Call saveData after data has been recorded
    saveData();
  },
};