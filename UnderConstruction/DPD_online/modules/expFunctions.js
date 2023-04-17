// fetch data
async function fetchData(path) {
    // fetch json from server
    const  res = await fetch(path);
    const data = await res.json();
    return data;
};


// constructor function for html stimulus
function constructStim(rando, immOpt, delOpt, prob, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: 5px solid  #008000; padding: 5px;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';
    let task = parseFloat(delOpt) > 0 ? 'reward' : 'loss';
    let probString = 'mit <b>'+prob+'%</b> Wahrscheinlichkeit'

    let stimString = `<div class = centerbox id='container'>
    <p class = center-block-text>
        Welchen Betrag würden Sie lieber 
        ${task=='reward' ? '<b>gewinnen</b>' : '<b>verlieren</b>'}?
        <br>Drücken Sie
        <strong>'Q'</strong> für die linke Option oder
        <strong>'P'</strong> für die rechte Option:
    </p>
    <div class='table'>
    <div class='row'>
    <div class = 'option' id='leftOption' ${feedback=='left' ? feedbackStyle : null}>
        <font color=${rando==0 ? immOptColor : delOptColor}>
        <div class = 'option-row'><b>&euro; ${rando==0 ? immOpt : delOpt}</b></div>
        <div class = 'option-row'>${rando==0 ? `mit <b>100%</b> Wahrscheinlichkeit` : probString}</div>
        </font></div>
    <div class = 'option' id='rightOption' ${feedback=='right' ? feedbackStyle : null}>
        <font color=${rando==0 ? delOptColor : immOptColor}>
        <div class = 'option-row'><b>&euro; ${rando==0 ? delOpt : immOpt}</b></div>
        <div class = 'option-row'>${rando==0 ? probString : `mit <b>100%</b> Wahrscheinlichkeit`}</div>
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
    input: array of Objects with immOpt, delOpt
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
            stimulus: constructStim(trial.rando, trial.immOpt, trial.delOpt, trial.probability),

            data: {
                trialID: trial.id,
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                task: trial.task,
                prob: trial.probability,
                odds: trial.odds,
                randomize: trial.rando
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

function createTimeline2(trialArray) {
    /*
    input: array of Objects with immOpt, delOpt
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
            stimulus: constructStim(trial.rando, trial.immOpt, trial.delOpt, trial.probability),

            data: {
                trialID: trial.id,
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                task: trial.task,
                prob: trial.probability,
                odds: trial.odds,
                randomize: trial.rando,
                p_imm: trial.p_imm,
                problem: trial.problem
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};