
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
