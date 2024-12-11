// ---------------------- PARAMETER DEFINITIONS ---------------------- //
const DEFAULT_STIMULUS_DURATION = 1400; // ms for all trials (demo, training, 2-back, 0-back)
const DEFAULT_TRIAL_DURATION = 1500;    // ms for all trials
const STIMULUS_STYLE = "font-size:80px; font-weight:bold;";

// fMRI mode = buttons for left and right = b/g
const leftButton = "g";
const rightButton = "b";

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

// Helper function to generate a fixed 2-back sequence for one block
function generate2BackSequence(numTrials=30, numTargets=9) {
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

// Helper function to generate a 0-back sequence for one block
function generate0BackSequence(numTrials=30, numTargets=9, targetNumber=5) {
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

// ----------------------------------------- //
// Experimental Blocks
// ------------------------------------------//
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
  }
}

// Main instructions text
const instructionsText1 = `
<p>In diesem Experiment werden Ihnen nacheinander Ziffern von 0 bis 9 präsentiert. 
Sie werden in kurzen Blöcken à 30 Sekunden zwei Arten von Aufgaben bearbeiten:</p>

<p><strong>2-Back-Aufgabe:</strong> Bei diesen Durchgängen sollen Sie prüfen, ob die 
aktuell präsentierte Zahl mit der Zahl von <b>vor zwei Durchgängen</b> übereinstimmt. 
Wenn ja, drücken Sie bitte die <strong>linke Taste</strong>, ansonsten drücken Sie die 
<strong>rechte Taste</strong>.</p>

<p><strong>0-Back-Aufgabe:</strong> In anderen Durchgängen (0-Back-Bedingung) wird Ihnen 
zu Beginn des Blocks eine bestimmte Zielzahl genannt. Bei jedem Erscheinen dieser Zielzahl 
drücken Sie die <strong>linke Taste</strong>, und bei allen anderen Zahlen die 
<strong>rechte Taste</strong>.</p>

<p>Vor Beginn jedes Blocks erfahren Sie, um welche Art von Aufgabe es sich handelt und 
auf welche Zahl Sie achten sollen (im Falle des 0-Back-Blocks). Versuchen Sie bitte so 
schnell und genau wie möglich zu reagieren.</p>
`;

const instructions = { 
  type: jsPsychHtmlKeyboardResponse,
  stimulus: instructionsText1,
  choices: [leftButton, rightButton],
  margin_vertical: "100px",
  data: {displayType: 'instructions1'},
};

// Define colors for demonstration
const nonTargetColor = "#87CEFA"; // Light blue
const targetColor = "#F08080";    // Light red

// Demonstration sequence
const demoSequence = [4, 2, 3, 2, 3, 5, 8, 9, 0, 9];
let demoIsTarget = demoSequence.map((val, i, arr) => (i>=2 && arr[i]===arr[i-2]));

// Instructions before the demonstration
const demoInstructions1 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Als nächstes sehen Sie ein kurzes Beispiel für eine 2-Back-Aufgabe mit 10 Ziffern.</p>
    <p>In dieser Demonstration werden Ihnen die korrekten Antworten farblich angezeigt:</p>
    <ul>
      <p>Ziffern, die ein Target sind (d.h. die gleiche Zahl wie vor zwei Durchgängen), werden in <span style="color:${targetColor};">Hellrot</span> dargestellt.</p>
      <p>Ziffern, die kein Target sind, werden in <span style="color:${nonTargetColor};">Hellblau</span> dargestellt.</p>
    </ul>
    <p>Beachten Sie, dass Sie im echten Experiment keine farblichen Hinweise erhalten werden – dies dient nur zur Veranschaulichung der Regel.</p>
    <p>Drücken Sie eine beliebige Taste, um das Beispiel zu starten. Sie müssen in dem Beispiel nichts machen.</p>
  `,
  choices: "ALL_KEYS",
  data: { displayType: 'demoInstructions1' }
};

// Demo trials use default durations, only inline styling with colors
let demoTrials = demoSequence.map((num, i) => {
  let color = demoIsTarget[i] ? targetColor : nonTargetColor;
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:80px; font-weight:bold; color:${color};">${num}</div>`,
    choices: "NO_KEYS",
    trial_duration: DEFAULT_TRIAL_DURATION,
    stimulus_duration: DEFAULT_STIMULUS_DURATION,
    data: { displayType: 'demoTrial', target: demoIsTarget[i] }
  };
});

// After the demo sequence, show entire sequence at once
const demoInstructions2 = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: (function() {
    let html = `<p>Hier sehen Sie die komplette Folge noch einmal:</p><p>`;
    for (let i = 0; i < demoSequence.length; i++) {
      let color = demoIsTarget[i] ? targetColor : nonTargetColor;
      html += `<span style="font-size:36px; font-weight:bold; color:${color}; margin: 0 5px;">${demoSequence[i]}</span>`;
    }
    html += `</p><p><span style="color:${targetColor};">Hellrote</span> Ziffern sind diejenigen, die sich nach zwei Durchgängen wiederholen.</p>`;
    html += `<p>Drücken Sie eine beliebige Taste, um mit einem kurzen Trainingsblock fortzufahren.</p>`;
    return html;
  })(),
  choices: "ALL_KEYS",
  data: { displayType: 'demoInstructions2' }
};

// Training instructions
const trainingInstructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <p>Jetzt folgt ein kurzer Trainingsblock mit 30 Durchgängen der 2-Back-Aufgabe.</p>
    <p>In diesem Trainingsblock erhalten Sie jedoch direktes Feedback nach jedem Tastendruck.</p>
    <p>Das Feedback erscheint direkt über der präsentierten Zahl.</p>
    <p>Beachten Sie, dass Sie im echten Experiment kein Feedback erhalten werden – nur während des Trainings.</p>
    <p>Drücken Sie eine beliebige Taste, um zu beginnen.</p>
  `,
  choices: "ALL_KEYS",
  data: {displayType: 'trainingInstructions'}
};

// Generate training sequence (2-back)
let trainingNumTrials = 30;
let trainingNumTargets = 9;
let {sequence: trainingSequence, isTarget: trainingIsTarget} = generate2BackSequence(trainingNumTrials, trainingNumTargets);
resetBlockCounters();

let trainingTimeline = [];
for (let i = 0; i < trainingNumTrials; i++) {
  let targetVal = trainingIsTarget[i];
  let correctResponse = targetVal ? leftButton : rightButton;

  let presentation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="${STIMULUS_STYLE}">${trainingSequence[i]}</div>`,
    choices: [leftButton, rightButton],
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
      let correctResponse = data.target ? leftButton : rightButton;
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
                    width: auto; text-align: center; font-weight: bold; font-size:36px; color: ${feedbackColor};">
          ${feedbackText}
        </div>
        <div style="${STIMULUS_STYLE}">${numberShown}</div>
      </div>`;
    },
    data: {displayType: 'trainingFeedback'}
  };

  trainingTimeline.push(presentation, feedback);
}

// Break instructions for 2-back block
function twoBackBreak(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Nächster Block: 2-back (Block ${blockNumber}).</p>
      <p>Bei der 2-Back-Aufgabe sollen Sie prüfen, ob die aktuell präsentierte Zahl 
      mit der Zahl von vor zwei Durchgängen übereinstimmt.</p>
      <p>Wenn ja, drücken Sie bitte die <strong>linke Taste (g)</strong>, ansonsten die <strong>rechte Taste (b)</strong>.</p>
      <p><i>Der nächste Block startet in Kürze...</i></p>
    `,
    choices: "NO_KEYS",
    trial_duration: 10000,
    data: {displayType: 'break', blockType: '2-back', blockNumber: blockNumber},
    on_start: function() {
      resetBlockCounters();
    }
  };
}

// Break instructions for 0-back block
function zeroBackBreak(blockNumber, targetNumber=5) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Nächster Block: 0-back (Block ${blockNumber}). Zielzahl: <b>${targetNumber}</b>.</p>
      <p>Bei der 0-Back-Aufgabe drücken Sie bitte die <strong>linke Taste (g)</strong>, wenn die aktuell präsentierte Zahl der Zielzahl entspricht,</p>
      <p>ansonsten drücken Sie die <strong>rechte Taste (b)</strong>.</p>
      <p><i>Der nächste Block startet in Kürze...</i></p>
    `,
    choices: "NO_KEYS",
    trial_duration: 10000,
    data: {displayType: 'break', blockType: '0-back', blockNumber: blockNumber},
    on_start: function() {
      resetBlockCounters();
    }
  };
}

// Create 2-back block trials
function createTwoBackBlock(blockNumber) {
  let {sequence, isTarget} = generate2BackSequence(30, 9);
  let blockTimeline = [];

  for (let i = 0; i < sequence.length; i++) {
    let correctResponse = isTarget[i] ? leftButton : rightButton;
    blockTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="${STIMULUS_STYLE}">${sequence[i]}</div>`,
      choices: [leftButton, rightButton],
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

// Create 0-back block trials
function createZeroBackBlock(blockNumber, targetNumber) {
  let {sequence, isTarget} = generate0BackSequence(30, 9, targetNumber);
  let blockTimeline = [];

  for (let i = 0; i < sequence.length; i++) {
    let correctResponse = isTarget[i] ? leftButton : rightButton;
    blockTimeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="${STIMULUS_STYLE}">${sequence[i]}</div>`,
      choices: [leftButton, rightButton],
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

// Define 0-back targets
let zeroBackTargets = [5, 6, 3, 4, 9, 2];

let experiment_timeline = [
  enterId,
  instructions,
  demoInstructions1,
  ...demoTrials,
  demoInstructions2,
  trainingInstructions,
  ...trainingTimeline,
  firstTrigger,
  triggerLoop,
];

// Add alternating 2-back and 0-back blocks
for (let i = 1; i <= 6; i++) {
  experiment_timeline.push(twoBackBreak(i));
  experiment_timeline.push(...createTwoBackBlock(i));

  experiment_timeline.push(zeroBackBreak(i, zeroBackTargets[i]));
  experiment_timeline.push(...createZeroBackBlock(i, zeroBackTargets[i]));
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
  jsPsych.data.get().ignore('stimulus').localSave('csv', `${subjectId}_dpd_fmri.csv`);
}
