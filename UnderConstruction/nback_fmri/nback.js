// Assume rando_list is defined globally, for example:
// const rando_list = [
//   { "subject_id": "dpd_1", "rando_hitbutton": "b", "rando_tasks": "0back" },
//   { "subject_id": "dpd_2", "rando_hitbutton": "g", "rando_tasks": "2back" },
//   ...
// ];

// ---------------------- GLOBAL PARAMETER DEFINITIONS ---------------------- //
const DEFAULT_STIMULUS_DURATION = 1400; // ms for all trials (demo, training, 2-back, 0-back)
const DEFAULT_TRIAL_DURATION = 1500;    // ms for all trials
const STIMULUS_STYLE = "font-size:150px; font-weight:bold;";
const TRIALS_PER_BLOCK = 20;
const TARGETS_PER_BLOCK = 7;
const zeroBackTargets = [5, 6, 3, 4, 9, 2];

let subjectId = null; 
let targetButton = "g";    // will be updated after ID input based on rando_list
let nonTargetButton = "b"; // will be updated after ID input
let starting_task = "2back"; // will be updated after ID input

const jsPsych = initJsPsych({
  on_close: saveData,
});

// Set a fixed seed for reproducible pseudorandomization
Math.seedrandom('42');

// Global counters for per-block success calculation
let hitsCount = 0;
let missesCount = 0;
let noResponsesCount = 0;

function resetBlockCounters() {
  hitsCount = 0;
  missesCount = 0;
  noResponsesCount = 0;
}

function calculateSuccessRate() {
  let total = hitsCount + missesCount + noResponsesCount;
  if (total === 0) return 0;
  return (hitsCount / total) * 100;
}

// Generate a 2-back sequence
function generate2BackSequence(numTrials, numTargets) {
  let sequence = [];
  for (let i = 0; i < numTrials; i++) {
    sequence.push(Math.floor(Math.random() * 10));
  }

  let possibleIndices = [];
  for (let i = 2; i < numTrials; i++) {
    possibleIndices.push(i);
  }

  possibleIndices.sort(() => Math.random() - 0.5);
  let targetIndices = possibleIndices.slice(0, numTargets);
  targetIndices.forEach(i => {
    sequence[i] = sequence[i - 2];
  });

  let isTarget = sequence.map((val, idx) => (idx >= 2 && sequence[idx] === sequence[idx-2]));
  return {sequence, isTarget};
}

// Generate a 0-back sequence
function generate0BackSequence(numTrials, numTargets, targetNumber) {
  let indices = [...Array(numTrials).keys()];
  indices.sort(() => Math.random() - 0.5);
  let targetIndices = indices.slice(0, numTargets);

  let sequence = new Array(numTrials).fill(null);
  for (let i = 0; i < numTrials; i++) {
    if (targetIndices.includes(i)) {
      sequence[i] = targetNumber;
    } else {
      let num;
      do {
        num = Math.floor(Math.random() * 10);
      } while (num === targetNumber);
      sequence[i] = num;
    }
  }

  let isTarget = sequence.map(val => (val === targetNumber));
  return {sequence, isTarget};
}

// Determine correct text based on targetButton
function getTargetButtonText() {
  // If targetButton = 'b', participants need to press the right button for target
  // If targetButton = 'g', participants need to press the left button for target
  return targetButton === 'b' ? "rechte Taste" : "linke Taste";
}

function getNonTargetButtonText() {
  return targetButton === 'b' ? "linke Taste" : "rechte Taste";
}

// Dynamically updated main instructions text
function getMainInstructions() {
  let stim = `
<p>In diesem Experiment werden Ihnen nacheinander Ziffern von 0 bis 9 präsentiert. 
Sie werden in kurzen Blöcken zwei Arten von Aufgaben bearbeiten:</p>

<p><strong>2-Back-Aufgabe:</strong> Prüfen Sie, ob die aktuell präsentierte Zahl mit der Zahl von vor zwei Durchgängen übereinstimmt. 
Wenn ja, drücken Sie bitte die <strong>${getTargetButtonText()}</strong>, ansonsten die <strong>${getNonTargetButtonText()}</strong>.</p>

<p><strong>0-Back-Aufgabe:</strong> Zu Beginn des Blocks wird Ihnen eine Zielzahl genannt. 
Bei jedem Erscheinen dieser Zielzahl drücken Sie die <strong>${getTargetButtonText()}</strong>, 
und bei allen anderen Zahlen die <strong>${getNonTargetButtonText()}</strong>.</p>

<p>Versuchen Sie bitte so schnell und genau wie möglich zu reagieren.</p>
`;
console.log(stim);
return stim
}

// After participant enters ID, determine buttons and starting task from rando_list
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
    subjectId = data.response.Q0;
    jsPsych.data.addProperties({ subject_id: subjectId });
    // Lookup rando_list entry for this subjectId
    let entry = rando_list.find(r => r.subject_id === subjectId);
    if (entry) {
      targetButton = entry.rando_hitbutton; 
      nonTargetButton = (targetButton === "b") ? "g" : "b";
      starting_task = entry.rando_tasks; 
    } else {
      // If not found, default:
      targetButton = "g";
      nonTargetButton = "b";
      starting_task = "2back";
    }

      // Log the values
      console.log('subjectId:', subjectId);
      console.log('targetButton:', getTargetButtonText());
      console.log('nonTargetButton:', getNonTargetButtonText());
      console.log('starting_task:', starting_task);
  }
};

const instructions = { 
  type: jsPsychHtmlKeyboardResponse,
  stimulus: getMainInstructions(),
  choices: function() {
    return [targetButton, nonTargetButton];
  },
  margin_vertical: "100px",
  data: {displayType: 'instructions1'}
};

// Colors for demo
const nonTargetColor = "#87CEFA"; 
const targetColor = "#F08080";    

// Demonstration sequence
const demoSequence = [4, 2, 3, 2, 3, 5, 8, 9, 0, 9];
let demoIsTarget = demoSequence.map((val, i, arr) => (i>=2 && arr[i]===arr[i-2]));

const demoInstructions1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Als nächstes sehen Sie ein kurzes Beispiel für eine <strong>2-Back</strong>-Aufgabe mit 10 Ziffern.</p>
    <p>In dieser Demonstration werden Ihnen die korrekten Antworten farblich angezeigt (nur zur Veranschaulichung).</p>
    <p>Drücken Sie eine beliebige Taste, um das Beispiel zu starten. Sie müssen nicht antworten.</p>
  `,
  choices: "ALL_KEYS",
  data: { displayType: 'demoInstructions1' }
};

// Demo trials
let demoTrials = demoSequence.map((num, i) => {
  let color = demoIsTarget[i] ? targetColor : nonTargetColor;
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:150px; font-weight:bold; color:${color};">${num}</div>`,
    choices: "NO_KEYS",
    trial_duration: DEFAULT_TRIAL_DURATION,
    stimulus_duration: DEFAULT_STIMULUS_DURATION,
    data: { displayType: 'demoTrial', target: demoIsTarget[i] }
  };
});

const demoInstructions2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: (function() {
    let html = `<p>Hier sehen Sie die komplette Folge noch einmal:</p><p>`;
    for (let i = 0; i < demoSequence.length; i++) {
      let color = demoIsTarget[i] ? targetColor : nonTargetColor;
      html += `<span style="font-size:100px; font-weight:bold; color:${color}; margin: 0 5px;">${demoSequence[i]}</span>`;
    }
    html += `</p><p><span style="color:${targetColor};">Hellrote</span> Ziffern sind Targets (nach zwei Durchgängen wiederholt).</p>`;
    html += `<p>Drücken Sie eine beliebige Taste, um mit einem kurzen Trainingsblock fortzufahren.</p>`;
    return html;
  })(),
  choices: "ALL_KEYS",
  data: { displayType: 'demoInstructions2' }
};

const trainingInstructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    stim = `
    <p>Jetzt folgt ein kurzer Trainingsblock (20 Durchgänge) der <strong>2-Back</strong>-Aufgabe.</p>
    <p>In diesem Trainingsblock erhalten Sie ein Feedback nach jedem Tastendruck.</p>
    <p>Das Feedback erscheint direkt über der präsentierten Zahl.</p>
    <p>Beachten Sie, dass Sie im echten Experiment kein Feedback erhalten werden – nur während des Trainings.</p>
    <p>Bitte drücken Sie jeweils die ${getTargetButtonText()}, wenn die gezeigte Zahl der vorletzten Zahl entspricht, sonst die ${getNonTargetButtonText()}.</p>
    <p>Drücken Sie eine beliebige Taste, um zu beginnen.</p>
    `;
    return stim
  },
  choices: "ALL_KEYS",
  data: {displayType: 'trainingInstructions'}
};

// Training block
let trainingNumTrials = 20;
let trainingNumTargets = 6;
let {sequence: trainingSequence, isTarget: trainingIsTarget} = generate2BackSequence(trainingNumTrials, trainingNumTargets);
resetBlockCounters();

let trainingTimeline = [];
for (let i = 0; i < trainingNumTrials; i++) {
  let targetVal = trainingIsTarget[i];
  let correctResponse = targetVal ? targetButton : nonTargetButton;

  let presentation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="${STIMULUS_STYLE}">${trainingSequence[i]}</div>`,
    choices: [targetButton, nonTargetButton],
    stimulus_duration: DEFAULT_STIMULUS_DURATION,
    trial_duration: DEFAULT_TRIAL_DURATION,
    response_ends_trial: true,
    data: {
      target: targetVal,
      displayType: 'trainingTrial',
      blockType: '2-back-training',
      stimNum: trainingSequence[i]
    },
    on_finish: function(data) {
      let correctResponse = data.target ? targetButton : nonTargetButton;
      if (data.response === null) {
        data.hit = 'no_response';
        noResponsesCount++;
      } else {
        if (data.response === correctResponse) {
          data.hit = 'hit';
          hitsCount++;
        } else {
          data.hit = 'miss';
          missesCount++;
        }
      }
      data.successRate = calculateSuccessRate();
    }
  };

  let feedback = {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    trial_duration: 600,
    stimulus_duration: 500,
    stimulus: function() {
      let last_data = jsPsych.data.getLastTrialData().values()[0];
      let numberShown = last_data.stimNum;
      let hit = last_data.hit;
      let response = last_data.response;

      let feedbackText;
      let feedbackColor = 'white';
      if (response === null) {
        feedbackText = "Zu langsam!";
      } else if (hit === 'hit') {
        feedbackText = "Richtig!";
        feedbackColor = "green";
      } else {
        feedbackText = "Falsch!";
        feedbackColor = "red";
      }

      return `
      <div id="feedback-container" style="position: relative; display: inline-block;">
        <div id="feedback-text" 
             style="position: absolute; top: -100px; left: 50%; transform: translateX(-50%); 
                    width: 500px; text-align: center; font-weight: bold; white-space: nowrap; font-size:80px; color: ${feedbackColor};">
          ${feedbackText}
        </div>
        <div style="${STIMULUS_STYLE}">${numberShown}</div>
      </div>`;
    },
    data: {displayType: 'trainingFeedback'}
  };

  trainingTimeline.push(presentation, feedback);
}

// Break instructions for 2-back
function twoBackBreak(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      return `
      <p>Nächster Block: <strong>2-back</strong> (Block ${blockNumber+1}).</p>
      <p><i>Startet in Kürze...</i></p>
      `
    },
    choices: "NO_KEYS",
    trial_duration: 5000,
    data: {displayType: 'break', blockType: '2-back', blockNumber: blockNumber}
  };
}

// Break instructions for 0-back
function zeroBackBreak(blockNumber, targetNumber=5) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      return `
      <p>Nächster Block: <strong>0-back</strong> (Block ${blockNumber+1}). Zielzahl: <strong>${targetNumber}</strong>.</p>
      <p><i>Startet in Kürze...</i></p>
      `
    },
    choices: "NO_KEYS",
    trial_duration: 5000,
    data: {displayType: 'break', blockType: '0-back', blockNumber: blockNumber}
  };
}

function createTwoBackBlock(blockNumber) {
  let {sequence, isTarget} = generate2BackSequence(TRIALS_PER_BLOCK, TARGETS_PER_BLOCK);
  let blockTimeline = [];
  for (let i = 0; i < sequence.length; i++) {
    let correctResponse = isTarget[i] ? targetButton : nonTargetButton;
    blockTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="${STIMULUS_STYLE}">${sequence[i]}</div>`,
      choices: [targetButton, nonTargetButton],
      stimulus_duration: DEFAULT_STIMULUS_DURATION,
      trial_duration: DEFAULT_TRIAL_DURATION,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '2-back',
        blockNumber: blockNumber,
        number: sequence[i]
      },
      on_finish: function(data) {
        if (data.response === null) {
          data.hit = 'no_response';
          noResponsesCount++;
        } else {
          if (data.response === correctResponse) {
            data.hit = 'hit';
            hitsCount++;
          } else {
            data.hit = 'miss';
            missesCount++;
          }
        }
        data.successRate = calculateSuccessRate();
      }
    });
  }
  return blockTimeline;
}

function createZeroBackBlock(blockNumber, targetNumber) {
  let {sequence, isTarget} = generate0BackSequence(TRIALS_PER_BLOCK, TARGETS_PER_BLOCK, targetNumber);
  let blockTimeline = [];
  for (let i = 0; i < sequence.length; i++) {
    let correctResponse = isTarget[i] ? targetButton : nonTargetButton;
    blockTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="${STIMULUS_STYLE}">${sequence[i]}</div>`,
      choices: [targetButton, nonTargetButton],
      stimulus_duration: DEFAULT_STIMULUS_DURATION,
      trial_duration: DEFAULT_TRIAL_DURATION,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '0-back',
        blockNumber: blockNumber,
        number: sequence[i],
        targetNumber: targetNumber
      },
      on_finish: function(data) {
        if (data.response === null) {
          data.hit = 'no_response';
          noResponsesCount++;
        } else {
          if (data.response === correctResponse) {
            data.hit = 'hit';
            hitsCount++;
          } else {
            data.hit = 'miss';
            missesCount++;
          }
        }
        data.successRate = calculateSuccessRate();
      }
    });
  }
  return blockTimeline;
}

let experiment_timeline = [
  enterId,
  instructions,
  demoInstructions1,
  ...demoTrials,
  demoInstructions2,
  trainingInstructions
];

// Add training block
experiment_timeline.push(...trainingTimeline, firstTrigger, triggerLoop);

// Add alternating blocks depending on starting_task
for (let i = 0; i <= 5; i++) {
  if (starting_task === "2back") {
    // 2-back first, then 0-back
    experiment_timeline.push(twoBackBreak(i));
    experiment_timeline.push(...createTwoBackBlock(i));
    experiment_timeline.push(zeroBackBreak(i, zeroBackTargets[i]));
    experiment_timeline.push(...createZeroBackBlock(i, zeroBackTargets[i]));
  } else {
    // 0-back first, then 2-back
    experiment_timeline.push(zeroBackBreak(i, zeroBackTargets[i]));
    experiment_timeline.push(...createZeroBackBlock(i, zeroBackTargets[i]));
    experiment_timeline.push(twoBackBreak(i));
    experiment_timeline.push(...createTwoBackBlock(i));
  }
}

const debriefPart1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Sie haben das Experiment beendet. Der/die Studienleiter/in wird Sie bald kontaktieren.</p>
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
  `,
  margin_vertical: "100px",
  choices: "NO_KEYS",
  on_start: function() {
    saveData();
  },
};

let n_back_experiment = {
  timeline: [experiment_timeline, debriefPart1, debriefPart2]
};

// Run experiment
jsPsych.run(n_back_experiment);

function saveData() {
  const startDate = jsPsych.getStartTime().toLocaleDateString();
  const startTime = jsPsych.getStartTime().toLocaleTimeString();
  jsPsych.data.addProperties({ startDate, startTime });
  jsPsych.data.addProperties({ subject_id: subjectId });
  jsPsych.data.get().ignore('stimulus').localSave('csv', `${subjectId}_nback_fmri.csv`);
}
