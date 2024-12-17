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