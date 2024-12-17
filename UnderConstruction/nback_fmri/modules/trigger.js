// TRIGGER CODE
// Define Key for Trigger and number of triggers before experiment
const triggerKey = "t";
const triggersToCollect = 5;

// initialize triggerFlag: if false, entering "t" is not counted as MRI trigger
let triggerFlag = false;

// initialize trigger array
const triggers = [];
let triggerCount = 0;

// Event Listener for Trigger
document.addEventListener('keydown', (event) => {
    let name = event.key;
    // Alert the key name and key code on keydown
    if (name == 't' & triggerFlag == true) {
        triggerTime = new Date().getTime();
        triggerCount = triggerCount + 1;
        triggers.push(triggerTime);
        console.log(triggers);
        
    }
},
    false
);

const firstTrigger = {
    on_load: function() {
      triggerFlag = true;
    },
    type: jsPsychHtmlKeyboardResponse,
    data: { displayType: 'first_trigger' },
    stimulus: `
        <div class="centerbox" id="container">
        <p class="center-block-text" style="color:lightgrey;">
        <b>Der Probedurchlauf ist abgeschlossen. 
        Die Versuchsleitung meldet sich gleich bei Ihnen.</b>
        </p>
    </div>`,
    choices: [triggerKey]
};

// Wait for N triggers, then continue
const collectTriggers = {
type: jsPsychHtmlKeyboardResponse,
stimulus:`
    <div class="centerbox" id="container">
    <p class="center-block-text" style="color:lightgrey;">
    <b>Bitte warten, Experiment startet bald...</b>
    </p>
</div>`,
choices: [triggerKey],
data: { displayType: 'wait_for_trigger' }
}

// Loop function that ends display of collectTriggers when triggerCount > triggersToCollect
const triggerLoop = {
timeline: [collectTriggers],
loop_function: function(){
    if (triggerCount < (triggersToCollect - 1)) {
    return true;
    } else {
    return false;
    }
}
};
