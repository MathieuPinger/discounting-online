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

// Main instructions text
const instructionsText1 = `
<p>In diesem Experiment werden Ihnen nacheinander Ziffern von 0 bis 9 präsentiert. 
Sie werden in kurzen Blöcken à 30 Sekunden zwei Arten von Aufgaben bearbeiten:</p>

<p><strong>2-Back-Aufgabe:</strong> Bei diesen Durchgängen sollen Sie prüfen, ob die 
aktuell präsentierte Zahl mit der Zahl von <b>vor zwei Durchgängen</b> übereinstimmt. 
Wenn ja, drücken Sie bitte die <strong>linke Taste (g)</strong>, ansonsten drücken Sie die 
<strong>rechte Taste (b)</strong>.</p>

<p><strong>0-Back-Aufgabe:</strong> In anderen Durchgängen (0-Back-Bedingung) wird Ihnen 
zu Beginn des Blocks eine bestimmte Zielzahl genannt. Bei jedem Erscheinen dieser Zielzahl 
drücken Sie die <strong>linke Taste (g)</strong>, und bei allen anderen Zahlen die 
<strong>rechte Taste (b)</strong>.</p>

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
      stimulus: `<div style="font-size: 48px; font-weight: bold;">${num}</div>`,
      choices: [leftButton, rightButton],
      stimulus_duration: 900,
      trial_duration: 1000,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '2-back',
        blockNumber: blockNumber
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

// Create trial timelines for a single 0-back block
function createZeroBackBlock(blockNumber, targetNumber=5) {
  let {sequence, isTarget} = generate0BackSequence(30, 9, targetNumber);
  return sequence.map((num, i) => {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: `<div style="font-size: 48px; font-weight: bold;">${num}</div>`,
      choices: [leftButton, rightButton],
      stimulus_duration: 900,
      trial_duration: 1000,
      response_ends_trial: false,
      data: {
        target: isTarget[i],
        displayType: 'trial',
        blockType: '0-back',
        blockNumber: blockNumber
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

// Build the full experiment timeline
// We have 6 blocks of each type, alternating. So total 12 blocks:
// Block 1: 2-back
// Block 2: 0-back
// Block 3: 2-back
// Block 4: 0-back
// ...
// Block 11: 2-back
// Block 12: 0-back

let experiment_timeline = [instructions];

for (let i = 1; i <= 6; i++) {
  // Add a break before the 2-back block i
  experiment_timeline.push(twoBackBreak(i));
  experiment_timeline.push(...createTwoBackBlock(i));

  // Add a break before the 0-back block i
  experiment_timeline.push(zeroBackBreak(i, 5));
  experiment_timeline.push(...createZeroBackBlock(i, 5));
}

let n_back_experiment = {
  timeline: experiment_timeline
};

// Run experiment
jsPsych.run(n_back_experiment);
