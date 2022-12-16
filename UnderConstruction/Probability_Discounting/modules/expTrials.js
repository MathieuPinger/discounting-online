/* 
INSTRUCTIONS AND TEST TRIALS
- verbal instructions
- one test trial per condition: loss and reward
-> total timeline: [instructions, testProcedure, trialProcedure]
*/

const instructionsText1 =
    `<div class="instructions">
    <h3>Willkommen zu dem Experiment!</h3>
    Bitte lesen Sie diese Anweisungen sorgfältig durch.
    <p>
    Das Experiment besteht aus zwei Teilen und wird insgesamt etwa <b>45 Minuten</b> in Anspruch nehmen.
    Zwischen den beiden Teilen werden Sie gebeten, einige Fragebögen auszufüllen. 
    In jedem der beiden Teile werden Sie <b>vier Blöcke</b> von Versuchen durchführen. 
    Nach jedem Block haben Sie die Möglichkeit, eine kurze Pause einzulegen, wenn Sie dies möchten.

    <p>
    Bei jedem Versuch des Experiments haben Sie die Wahl zwischen zwei hypothetischen Geldgewinnen oder -verlusten, 
    einem <span class="immediate">geringeren Betrag</span> 
    und einem <span class="delayed">größeren Betrag</span>, wie in diesem Beispiel:
    </p>
    </div>

    <div id='exampleStim'>
    ${constructStim('0', '5.00', '10.00', '30', '70')}
    </div>
    
    <div class="instructions">
    Sie können sehen, dass jeder Gewinn mit einer <b>Verzögerung</b> und einer <b>Wahrscheinlichkeit</b> verbunden ist.
    Die <b>Verzögerung</b> informiert Sie darüber, <b>wann</b> Sie das Geld gewinnen/verlieren würden. Die <b>Wahrscheinlichkeit</b> 
    gibt Ihnen Auskunft über die Wahrscheinlichkeit des gewählten Gewinns/Verlusts. Wenn die Wahrscheinlichkeit 100% beträgt, ist 
    der Gewinn/Verlust sicher. 
    Liegt die Wahrscheinlichkeit unter 100%, besteht eine <b>Chance, kein Geld zu gewinnen/zu verlieren</b>. 
    <br>In diesem Beispiel könnten Sie sich entweder für einen Gewinn von
    <span class="immediate">5 &euro; sofort</span> mit <span class="immediate">100% Wahrscheinlichkeit</span> entscheiden, 
    <b>oder</b> einen Gewinn von
    <span class="delayed">10 &euro; in einem Monat</span>, aber nur mit <span class="delayed">70% Wahrscheinlichkeit</span>.
    Das bedeutet, Sie haben eine Chance von 70%, in einem Monat 10 &euro; zu gewinnen, aber auch eine Chance von 30%, gar nichts 
    zu gewinnen.
    Ihre Aufgabe ist es, zwischen diesen Optionen zu wählen, indem Sie <b>"q" für die linke Option und "p" für die rechte Option 
    drücken</b>. (Hinweis: Dies ist nur ein Beispiel, das Drücken der Tasten funktioniert hier nicht.)

    <p>
    Bei jedem Versuch stehen unterschiedliche Geldbeträge zur Auswahl. 
    Der <span class="immediate">geringere Betrag</span> würde immer 
    <span class="immediate">sofort</span> und <span class="immediate">mit 100% Wahrscheinlichkeit</span> gewonnen/verloren werden, 
    während die Verzögerung für den Gewinn/Verlust des
    <span class="delayed">größeren Betrags</span> zwischen 
    <span class="delayed">0, 30, 90, 180 Tagen, 1 Jahr, und 3 Jahren</span> variiert. Die Wahrscheinlichkeit, den
    <span class="delayed">größeren Betrag</span> zu gewinnen/verlieren, variiert zwischen 
    <span class="delayed">100, 90, 75, 50, 25 und 10 Prozent.</span>
    </p>
    
    <p>
    Sobald Sie <b>p</b> oder <b>q</b> drücken, wird die von Ihnen gewählte Option hervorgehoben.
    Wenn Sie zum Beispiel lieber 
    <span class="immediate">sofort 5 &euro; mit einer Wahrscheinlichkeit von 100%</span> gewinnen möchten als 
    <span class="delayed">10 &euro; in einem Monat mit einer Wahrscheinlichkeit von 70%</span>, drücken Sie auf <b>q</b> 
    und sehen dann Folgendes:
    </p>
        <div id='exampleStim'>
        ${constructStim('0', '5.00', '10.00', '70', 'left')}
        </div>
    Der nächste Versuch würde dann ein paar Sekunden später präsentiert werden.

    Weitere Anweisungen finden Sie auf der nächsten Seite.
    </div>
    `

const instructionsText2 = `
    <div class="instructions">
    <p>
    Bei jedem Versuch haben Sie <b>10 Sekunden Zeit</b>, um sich zwischen den
    beiden Optionen zu entscheiden.<br>
    In der Hälfte der Blöcke wählen Sie zwischen zwei <b>Gewinnen</b>, 
    in der anderen Hälfte zwischen zwei <b>Verlusten</b>.
    </p>

    <p>
    Ein <b>Versuch mit Verlusten</b> könnte so aussehen:
        <div id='exampleStim'>
        ${constructStim('0', '-5.00', '-10.00', '70',)}
        </div>
    </p>
    
    <p>
    In diesem Fall könnten sie sich entweder für einen Verlust von 
    <span class="immediate">5 &euro; sofort</span> mit 100% Wahrscheinlichkeit
    oder von <span class="delayed">10 &euro; in einem Monat</span> mit 70% Wahrscheinlichkeit entscheiden. 
    Mit anderen Worten: Wenn Sie die rechte Option wählen, haben Sie eine Chance von 30%, nichts zu verlieren, aber auch eine 
    Chance von 70%, in einem Monat 10 &euro; zu verlieren. 
    </p>

    <p>
    Die <span class="immediate">kleinere Variante</span> und die 
    <span class="delayed">größere Variante</span> werden nach dem Zufallsprinzip auf der 
    <b>linken</b> und <b>rechten</b> Seite angezeigt. Das letzte Beispiel könnte beispielsweise auch wie folgt aussehen: 
    </p>

    <div id='exampleStim'>
    ${constructStim('1', '-5.00', '-10.00', '70')}
    </div>

    <p>
    Hinweis: Alle Wahlmöglichkeiten sind <b>fiktiv</b>, d.h. <b>Ihre Vergütung für dieses Experiment wird nicht von Ihren 
    Entscheidungen abhängen</b>. Sie werden kein Geld verlieren.
    Bitte wählen Sie dennoch zwischen den Verlusten, 
    <b>als ob die Möglichkeiten real wären</b>. Es gibt keine richtige oder falsche Antwort. 
    Bitte wählen Sie die Option, die Sie bevorzugen würden, als ob Sie das Geld in dem entsprechenden Zeitrahmen und mit der 
    entsprechenden Wahrscheinlichkeit verlieren würden. Jeder Versuch steht für sich allein, bitte behandeln Sie jede Entscheidung 
    unabhängig.
    </p>

    
    <p>
    Auf der nächsten Seite können Sie die Aufgabe in <b>5 Testversuchen</b> ohne Zeitlimit ausprobieren.
    </p>
    </div>`

const instructions1 = {
    type: "html-button-response",
    stimulus: instructionsText1,
    choices: ['Continue'],
    margin_vertical: '100px',
};

const instructions2 = {
    type: "html-button-response",
    stimulus: instructionsText2,
    choices: ['Continue to test trials'],
    margin_vertical: '100px',
};

const practiceBlock = {
    type: "html-keyboard-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    data: jsPsych.timelineVariable('data'),
    choices: ['q', 'p'],
    on_finish: function(data) {
        // add timelineType
        data.timelineType = "test";
    }
};

const trialBlock = {
    type: "html-keyboard-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    data: jsPsych.timelineVariable('data'),
    choices: ['q', 'p'],
    stimulus_duration: 10000,
    trial_duration: 10000,
    on_finish: function(data) {
        delete data.stimulus; // not needed in csv
        // recode button press for csv
        if(data.key_press == 80 && data.randomize == 0){
        data.choice = "delayed";
        } else if(data.key_press == 81 && data.randomize == 0){
        data.choice = "immediate";
        } else if(data.key_press == 81 && data.randomize == 1){
        data.choice = "delayed";
        } else if(data.key_press == 80 && data.randomize == 1){
        data.choice = "immediate";
        };
        // add timelineType
        data.timelineType = "trial";
    }
};

const fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: jsPsych.NO_KEYS,
    // jitter fixcross between 500 and 1500 ms
    trial_duration: 1000,
    on_finish: function(data) {
        // add timelineType
        data.timelineType = "fixcross"; 
    }
};

const trialfeedback = {
    type: 'html-keyboard-response',
    stimulus: function(){
        lastChoice = jsPsych.data.getLastTrialData().values()[0].key_press;
        lastRando = jsPsych.data.getLastTrialData().values()[0].randomize;
        lastImmOpt = jsPsych.data.getLastTrialData().values()[0].immOpt;
        lastDelOpt = jsPsych.data.getLastTrialData().values()[0].delOpt;
        lastProb = jsPsych.data.getLastTrialData().values()[0].prob;

        if(lastChoice == 81){
            trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastProb,
                feedback='left');
            return trialFeedback

        } else if(lastChoice == 80) {
            trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastProb,
                feedback='right');
            return trialFeedback

        } else {
            trialFeedback = `<div class = centerbox id='container'>
            <p class = center-block-text style="color:red;">
                <b>Please select an option by pressing Q or P!</b>
            </p>`;
            return trialFeedback
        }
    },
    choices: jsPsych.NO_KEYS,
    trial_duration: 1000,
    on_finish: function(data) {
        // add timelineType
        data.timelineType = "feedback"; 
    }
};

const practiceTimeline_variables = [
    {   data: {immOpt: '5.00', delOpt: '10.20', prob: '50', randomize: '0'},
        stimulus: constructStim('0', '5.00', '10.20', '50') },
    {   data: {immOpt: '-4.00', delOpt: '-8.80', prob: '90', randomize: '1'},
        stimulus: constructStim('1', '-4.00', '-8.80','90') },
    {   data: {immOpt: '3.00', delOpt: '3.40', prob: '25', randomize: '1'},
        stimulus: constructStim('1', '3.00', '3.40', '25') },
    {   data: {immOpt: '-3.00', delOpt: '-3.40', prob: '25', randomize: '1'},
        stimulus: constructStim('1', '-3.00', '-3.40', '25') },
    {   data: {immOpt: '-3.00', delOpt: '-12.00', prob: '10', randomize: '1'},
        stimulus: constructStim('1', '-3.00', '-12.00', '10') }
];

const practiceProcedure = {
    timeline: [practiceBlock, trialfeedback, fixation],
    timeline_variables: practiceTimeline_variables,
    randomize_order: false
}

const finishInstructions = {
    type: "html-keyboard-response",
    stimulus: 
        `<div class="instructions">
        <p>Das Experiment kann jetzt beginnen!
        Von nun an haben Sie für jede Entscheidung <b>10 Sekunden</b> Zeit.
        Nach vier Versuchsblöcken werden Sie gebeten, einige Fragebögen auszufüllen.</p>
        <p>Bitte legen Sie Ihren <b>linken Zeigefinger auf Q</b>, 
        und Ihren <b>rechten Zeigefinger auf P</b>.</p>
        <p>Drücken Sie dann Q oder P, um mit dem Experiment fortzufahren.</p>
        </div>`,
    choices: ['q', 'p'],
    margin_vertical: '100px',
};

const debriefPart1 = {
    type: "html-keyboard-response",
    stimulus: `<p>Sie haben den erste Teil beendet.</p>
                <p><b>Bitte schließen sie nicht dieses Browserfenster.</b>
                <p>Sie werden automatisch zum zweiten Teil weitergeleitet.</p>
                <p>Der zweite Teil wird mit zwei Fragebögen beginnen.</p>
                <p>Je nach Ihrer Internetverbindung kann die Weiterleitung ein paar Sekunden oder Minuten dauern.</p>
                <p>Wenn Sie nach ein paar Minuten nicht weitergeleitet werden, kontaktieren Sie uns bitte über Prolific.</p>`,
                // If you are not redirected, please click 
                // <a target="_self" href="https://clox.zi-mannheim.de/rewad2/rewad2_server/rewad_part2.html" >here</a>`,
    margin_vertical: '100px',
    choices: jsPsych.NO_KEYS,
    on_load: function() {
        saveData();
    }
};

const blockIntro = {
    type: "html-keyboard-response",
    stimulus: `<p>Drücken Sie Q oder P, wenn Sie bereit sind, den nächsten Block zu starten.</p>`,
    margin_vertical: '100px',
    choices: ['q', 'p'],
    on_finish: function(data) {
        data.timelineType = "blockIntro";
    }
};

const instructionsPart2 = {
    type: "html-keyboard-response",
    stimulus: 
        `<div class="instructions">
        <h3>Welcome to part 2 of the experiment!</h3>
        <p>As in the first part, you will go through four blocks of decisions. 
        You are free to take breaks between the blocks. 
        Once you have finished all blocks, the experiment ends.</p>
        <p>You have 10 seconds for each trial.</p>
        <p>Please place your <b>left index finger on Q</b>, 
        and your <b>right index finger on P</b>.</p>
        <p>Then press Q or P to continue to the experiment.</p>
        </div>`,
    choices: ['q', 'p'],
    margin_vertical: '100px',
};

const debriefPart2 = {
    type: "html-keyboard-response",
    stimulus: `<p>You have finished the experiment.</p>
                <p>Thank you for participating!</p>
                <p>Please click on the link below to get back to Prolific:</p>
                <a href="https://app.prolific.co/submissions/complete?cc=314880B1"> https://app.prolific.co/submissions/complete?cc=314880B1 </a>`,
    margin_vertical: '100px',
    choices: jsPsych.NO_KEYS,
    on_load: function() {
        saveData();
    }
};