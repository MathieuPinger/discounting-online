
// constructor function for html stimulus
function constructStim(rando, immOpt, delOpt, delay, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: 5px solid  #008000; padding: 16px;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';
    let task = parseFloat(delOpt) > 0 ? 'reward' : 'loss';
    let delString = daysToYears(delay);

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
        <center><font color=${rando==0 ? immOptColor : delOptColor}>
        <b>&pound; ${rando==0 ? immOpt : delOpt}</b>
        <br>
        ${rando==0 ? `<b>Today</b>` : delString}
        </font></center></div>
    <div class = 'option' id='rightOption' ${feedback=='right' ? feedbackStyle : null}>
        <center><font color=${rando==0 ? delOptColor : immOptColor}>
        <b>&pound; ${rando==0 ? delOpt : immOpt}</b>
        <br>
        ${rando==0 ? delString : `<b>Today</b>`}
        </font></center></div></div></div></div>`;
        return stimString;
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

function correctLossSign(arr) {
    /* Convert Loss Values to negative, if necessary */
    arr.map(trial => {
        if (trial['task'] == "loss" && trial['immOpt'] > 0) {
            trial['immOpt'] = -trial['immOpt'];
            trial['delOpt'] = -trial['delOpt'];
        };
    });
    console.log(arr);
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

function addOne(arr) {
    arr.forEach
}