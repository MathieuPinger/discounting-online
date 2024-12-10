// N-Back Experiment for fMRI
// Mathieu Pinger, 10.12.2024

// SET PARAMETERS BEFORE EACH EXPERIMENT:

// fMRI mode = buttons for left and right = b/g
const leftButton = "g";
const rightButton = "b";

// Initialize jsPsych
const jsPsych = initJsPsych();

// Set a fixed seed to ensure reproducible pseudorandomization
Math.seedrandom('42');

// Helper function to generate a fixed 2-back sequence for one block
function generate2BackSequence(numTrials=30, numTargets=9) {
  // Create a random sequence of digits 0-9
  let sequence = [];
  for (let i = 0; i < numTrials; i++) {
    sequence.push(Math.floor(Math.random() * 10));
  }

  // Determine possible target positions (from trial 2 onwards)
  let possibleIndices = [];
  for (let i = 2; i < numTrials; i++) {
    possibleIndices.push(i);
  }

  // Shuffle possibleIndices and pick where to put targets
  possibleIndices.sort(() => Math.random() - 0.5);
  let targetIndices = possibleIndices.slice(0, numTargets);

  // Enforce targets: sequence[i] = sequence[i-2]
  targetIndices.forEach(i => {
    sequence[i] = sequence[i - 2];
  });

  // Determine which trials are targets
  let isTarget = sequence.map((val, idx) => {
    return (idx >= 2 && sequence[idx] === sequence[idx-2]);
  });

  return {sequence: sequence, isTarget: isTarget};
}

// Helper function to generate a 0-back sequence for one block
function generate0BackSequence(numTrials=30, numTargets=9, targetNumber=5) {
  // We want exactly numTargets instances of targetNumber and the rest non-target
  let indices = [...Array(numTrials).keys()];
  indices.sort(() => Math.random() - 0.5);
  let targetIndices = indices.slice(0, numTargets);

  let sequence = new Array(numTrials).fill(null);
  for (let i = 0; i < numTrials; i++) {
    if (targetIndices.includes(i)) {
      sequence[i] = targetNumber;
    } else {
      // Pick a number different from the targetNumber
      let num;
      do {
        num = Math.floor(Math.random() * 10);
      } while (num === targetNumber);
      sequence[i] = num;
    }
  }

  let isTarget = sequence.map(val => (val === targetNumber));
  return {sequence: sequence, isTarget: isTarget};
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
    // Capture the subject ID from the response
    subjectId = data.response.Q0;
    console.log(subjectId);
    

    // Add subject ID to data properties for subsequent trials
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

// Instructions block
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

// Determine targets for the demo sequence (2-back logic)
let demoIsTarget = demoSequence.map((val, i, arr) => {
  if (i >= 2 && arr[i] === arr[i-2]) {
    return true;
  }
  return false;
});

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

// Present the sequence trial-by-trial with color coding
let demoTrials = demoSequence.map((num, i) => {
  let color = demoIsTarget[i] ? targetColor : nonTargetColor;
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:80px; font-weight:bold; color:${color};">${num}</div>`,
    choices: "NO_KEYS",
    trial_duration: 1000, // 1 second per demo trial
    stimulus_duration: 900,
    data: { displayType: 'demoTrial', target: demoIsTarget[i] }
  };
});

// After the demo sequence, show the entire sequence at once with an explanation
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

// Instructions before the training block
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


// Generate a 2-back training sequence of 30 trials with 9 targets
let trainingNumTrials = 30;
let trainingNumTargets = 9;
let {sequence: trainingSequence, isTarget: trainingIsTarget} = generate2BackSequence(trainingNumTrials, trainingNumTargets);

// For each trial in the training block, we create a two-trial sequence: presentation, then feedback.

// For each trial in the training block, we create a two-trial sequence: presentation, then feedback.
let trainingTimeline = [];

for (let i = 0; i < trainingNumTrials; i++) {
  let targetVal = trainingIsTarget[i];
  let correctResponse = targetVal ? leftButton : rightButton;

  // Presentation trial
  let presentation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="font-size:80px; font-weight:bold;">${trainingSequence[i]}</div>`,
    choices: [leftButton, rightButton],
    stimulus_duration: 900,     // Stimulus disappears after 900 ms
    trial_duration: 1000,       // Trial ends at 1000 ms if no response
    response_ends_trial: true,  // If response before 900 ms, end immediately
    data: {
      target: targetVal,
      displayType: 'trainingTrial',
      blockType: '2-back-training',
      stimNum: trainingSequence[i] // Store the stimulus number for feedback
    },
    on_finish: function(data) {
      // Determine correctness
      let correctResponse = data.target ? leftButton : rightButton;
      if (data.response === null) {
        data.hit = 'miss';
      } else {
        data.hit = (data.response === correctResponse) ? 'hit' : 'miss';
      }
    }
  };

  // Feedback trial
  // Shows feedback for 500 ms, total trial_duration = 600 ms
  // After 500 ms, stimulus disappears, leaving 100 ms blank before next trial
  let feedback = {
    type: jsPsychHtmlKeyboardResponse,
    choices: "NO_KEYS",
    trial_duration: 600,      
    stimulus_duration: 500,   // Feedback + number visible for 500 ms
    stimulus: function() {
      let last_data = jsPsych.data.getLastTrialData().values()[0];
      let numberShown = last_data.stimNum;
      let hit = last_data.hit;
      let response = last_data.response;

      // Determine feedback text
      let feedbackText;
      if (response === null) {
        feedbackText = "Zu langsam!";
        feedbackColor = "white";
      } else if (hit === 'hit') {
        feedbackText = "Richtig!";
        feedbackColor = "green";
      } else {
        feedbackText = "Falsch!";
        feedbackColor = "red";
      }

      // Position feedback above the number
      return `
      <div id="feedback-container" style="position: relative; display: inline-block;">
        <div id="feedback-text" 
             style="position: absolute; top: -100px; left: 50%; transform: translateX(-50%); 
                    width: auto; text-align: center; font-weight: bold; font-size:36px; color: ${feedbackColor};">
          ${feedbackText}
        </div>
        <div style="font-size:80px; font-weight:bold;">${numberShown}</div>
      </div>`;
    },
    data: {displayType: 'trainingFeedback'}
  };

  trainingTimeline.push(presentation, feedback);
}

// Break instructions for 2-back block (shown before each 2-back block)
function twoBackBreak(blockNumber) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Nächster Block: 2-back (Block ${blockNumber}).</p>
      <p>Prüfen Sie, ob die aktuell präsentierte Zahl mit der Zahl von vor zwei Durchgängen übereinstimmt.</p>
      <p>Wenn ja, drücken Sie bitte die <strong>linke Taste (g)</strong>, ansonsten die <strong>rechte Taste (b)</strong>.</p>
      <p><i>Der nächste Block startet in Kürze...</i></p>
    `,
    choices: "NO_KEYS",
    trial_duration: 10000,
    data: {displayType: 'break', blockType: '2-back', blockNumber: blockNumber}
  };
}

// Break instructions for 0-back block (shown before each 0-back block)
function zeroBackBreak(blockNumber, targetNumber=5) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>Nächster Block: 0-back (Block ${blockNumber}). Zielzahl: <b>${targetNumber}</b>.</p>
      <p>Drücken Sie bitte die <strong>linke Taste (g)</strong>, wenn die aktuell präsentierte Zahl mit der Zielzahl übereinstimmt,</p>
      <p>ansonsten drücken Sie die <strong>rechte Taste (b)</strong>.</p>
      <p><i>Der nächste Block startet in Kürze...</i></p>
    `,
    choices: "NO_KEYS",
    trial_duration: 10000,
    data: {displayType: 'break', blockType: '0-back', blockNumber: blockNumber}
  };
}

// Create trial timelines for a single 2-back block
function createTwoBackBlock(blockNumber) {
  let {sequence, isTarget} = generate2BackSequence(30, 9);
  return sequence.map((num, i) => {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size: 80px; font-weight: bold;">${num}</div>`,
      choices: [leftButton, rightButton],
      stimulus_duration: 900,
      trial_duration: 1000,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '2-back',
        blockNumber: blockNumber,
        number: num
      },
      on_finish: function(data) {
        let correctResponse = data.target ? leftButton : rightButton;
        if (data.response === null) {
          data.hit = 'miss';
        } else {
          data.hit = (data.response === correctResponse) ? 'hit' : 'miss';
        }
      }
    };
  });
}

// Define the target numbers for each of the 0-back blocks
let zeroBackTargets = [5, 6, 3, 4, 9, 2];

// Create 0-back blocks using these targets
for (let block = 0; block < 6; block++) {
  let currentTarget = zeroBackTargets[block]; 
  let {sequence, isTarget} = generate0BackSequence(30, 9, currentTarget);
  let block_timeline = sequence.map((num, i) => {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size: 48px; font-weight: bold;">${num}</div>`,
      choices: [leftButton, rightButton],
      trial_duration: 1000,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '0-back',
        blockNumber: block + 1,
        number: num,
        targetNumber: currentTarget
      },
      on_finish: function(data) {
        let correctResponse = data.target ? leftButton : rightButton;
        if (data.response === null) {
          data.hit = 'miss';
        } else {
          data.hit = (data.response === correctResponse) ? 'hit' : 'miss';
        }
      }
    };
  });
  zero_back_blocks.push(...block_timeline);
}

// Build the full experiment timeline
// We have 6 blocks of each type, alternating. So total 12 blocks:
// Block 1: 2-back
// Block 2: 0-back
// Block 3: 2-back
// Block 4: 0-back
// ...
// Block 11: 2-back
// Block 12: 0-back

let experiment_timeline = [
  enterId,
  instructions,      
  demoInstructions1,
  ...demoTrials,
  demoInstructions2,
  trainingInstructions,
  trainingTimeline,
  firstTrigger,
  triggerLoop,
];
for (let i = 1; i <= 6; i++) {
  // Add a break before the 2-back block i
  experiment_timeline.push(twoBackBreak(i));
  experiment_timeline.push(...createTwoBackBlock(i));

  // Add a break before the 0-back block i
  experiment_timeline.push(zeroBackBreak(i, 5));
  experiment_timeline.push(...createZeroBackBlock(i, 5));
}


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

let n_back_experiment = {
  timeline: [experiment_timeline,debriefPart1, debriefPart2]
};

// Run experiment
jsPsych.run(n_back_experiment);

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