/* 
INSTRUCTIONS AND TEST TRIALS
- verbal instructions
- one test trial per condition: loss and reward
-> total timeline: [instructions, testProcedure, trialProcedure]
*/

const instructionsText0 =
    `<div class="instructions">
    <h3>Willkommen zu dem Experiment!</h3>
    Bitte lesen Sie diese Anweisungen sorgfältig durch.
    <p>
    Das Experiment besteht aus zwei Teilen und wird insgesamt etwa <b>45 Minuten</b> in Anspruch nehmen.
    Der erste und der zweite Teil werden jeweils etwa 20 Minuten dauern. 
    Zwischen den beiden Teilen werden Sie gebeten, einige Fragebögen auszufüllen. 
    In jedem der beiden Teile werden Sie <b>vier Blöcke</b> von Durchgängen einer Entscheidungsaufgabe durchführen, 
    die Ihnen auf den nächsten Seiten erklärt wird. 
    Nach jedem Block haben Sie die Möglichkeit, eine kurze Pause einzulegen, wenn Sie dies möchten.
    Versuchen Sie nach Möglichkeit, Störfaktoren (z.B. Handy, E-Mails, offene Browserfenster) während der Durchgänge zu minimieren. 

    Auf den folgenden Seiten werden Ihnen die Aufgaben für den ersten Teil erklärt.
    </div>`

const instructionsText1 = 
    `<div class="instructions">
    <h3>Allgemeine Aufgabenbeschreibung</h3>
    Im <b>ersten Teil</b> gibt es zwei Aufgaben, 
    die Sie in getrennten Blöcken bearbeiten. Insgesamt wird 
    es <b>vier Blöcke</b> mit jeweils ca. 50 Durchgängen geben. 

    Die Aufgaben bestehen im Allgemeinen aus Durchgängen, bei denen Sie sich 
    zwischen zwei hypothetischen Geldgewinnen entscheiden müssen, 
    die zu unterschiedlichen Zeitpunkten (Aufgabe 1) <b>oder</b> 
    mit unterschiedlichen Wahrscheinlichkeiten (Aufgabe 2) 
    auftreten können. Dabei wird stets ein kleinerer Gewinn 
    angeboten, der sicher und sofort ist, sowie ein größerer Gewinn, der verzögert oder unsicher ist. 
    Die Geldbeträge, die zeitliche Verzögerung (in Tagen) und die Wahrscheinlichkeit (in Prozent) für 
    den größeren Gewinn werden dabei variiert.


    <h3>Aufgabe 1: Entscheidungen zwischen Geldbeträgen und Zeitpunkten</h3>

    Bei jedem Durchgang von Aufgabe 1 haben Sie die Wahl zwischen zwei hypothetischen Geldgewinnen 
    zu unterschiedlichen Zeitpunkten, wie in diesem Beispiel: 
    (Hinweis: Dies ist nur ein Beispiel, das Drücken der Tasten funktioniert hier nicht.)
    </p>
    </div>

    <div id='exampleStim'>
    ${constructStim('0', '5.00', '10.00', 'DD', '180')}
    </div>
    
    <div class="instructions">
    Sie können sehen, dass jeder Gewinn mit einem <b>Zeitpunkt</b> verbunden ist.
    <br>In diesem Beispiel könnten Sie sich entweder für einen Gewinn von
    <span class="immediate">5 &euro;</span> <span class="immediate">sofort</span> entscheiden, 
    <b>oder</b> einen Gewinn von
    <span class="delayed">10 &euro;</span>, den Sie aber erst in <span class="delayed">180 Tagen</span> erhalten würden.
    Ihre Aufgabe ist es, zwischen diesen Optionen zu wählen, indem Sie <b>"Q" für die linke Option 
    oder "P" für die rechte Option drücken</b>.

    <p>
    Bei jedem Durchgang stehen unterschiedliche Geldbeträge zur Auswahl. 
    Der <span class="immediate">geringere Betrag</span> würde immer 
    <span class="immediate">sofort</span> gewonnen werden, 
    während der Zeitpunkt zum 
    <span class="delayed">größeren Betrag</span> zwischen 
    <span class="delayed">30 Tagen und 3 Jahren Prozent</span> variiert.
    </p>
    
    <p>
    Sobald Sie <b>Q</b> oder <b>P</b> drücken, wird die von Ihnen gewählte Option kurz hervorgehoben.
    Wenn Sie zum Beispiel lieber 
    <span class="immediate">sofort 5 &euro;</span> gewinnen möchten als 
    <span class="delayed">10 &euro; in 180 Tagen</span>, drücken Sie auf <b>Q</b> 
    und sehen dann Folgendes:
    </p>
        <div id='exampleStim'>
        $${constructStim('0', '5.00', '10.00', 'DD', '180', null, 'left')}
        </div>
    Der nächste Durchgang wird dann jeweils ein paar Sekunden später präsentiert.

    <h3>Aufgabe 2: Entscheidungen zwischen Geldbeträgen und Wahrscheinlichkeiten</h3>

    Bei jedem Durchgang von Aufgabe 2 haben Sie die Wahl zwischen zwei hypothetischen Geldgewinnen 
    mit unterschiedlichen Wahrscheinlichkeiten, wie in diesem Beispiel: 
    (Hinweis: Dies ist nur ein Beispiel, das Drücken der Tasten funktioniert hier nicht.)
    </p>
    </div>

    <div id='exampleStim'>
    $${constructStim('0', '5.00', '10.00', 'PD', null, '50')}
    </div>
    
    <div class="instructions">
    Sie können sehen, dass jeder Gewinn mit einer <b>Wahrscheinlichkeit</b> verbunden ist.
    Wenn die Wahrscheinlichkeit 100% beträgt, ist der Gewinn sicher. 
    Liegt die Wahrscheinlichkeit unter 100%, besteht ein <b>Risiko, kein Geld zu gewinnen</b>. 
    <br>In diesem Beispiel könnten Sie sich entweder für einen Gewinn von
    <span class="immediate">5 &euro;</span> mit <span class="immediate">100% Wahrscheinlichkeit</span> entscheiden, 
    <b>oder</b> einen Gewinn von
    <span class="delayed">10 &euro;</span>, aber nur mit <span class="delayed">50% Wahrscheinlichkeit</span>.
    Das bedeutet, Sie haben eine Chance von 50%, 10 &euro; zu gewinnen, aber auch ein Risiko von 50%, gar nichts 
    zu gewinnen.

    Wie in Aufgabe 1 wählen Sie zwischen den Optionen, indem Sie <b>"Q" für die linke Option 
    oder "P" für die rechte Option drücken</b>.

    Weitere Anweisungen finden Sie auf der nächsten Seite.
    </div>
    `

const instructionsText2 = `
    <div class="instructions">
    <p>
    Bei jedem Durchgang haben Sie <b>10 Sekunden Zeit</b>, um sich zwischen den
    beiden Optionen zu entscheiden.<br>
    Die <span class="immediate">kleinere Option</span> und die 
    <span class="delayed">größere Option</span> werden nach dem Zufallsprinzip auf der 
    <b>linken</b> und <b>rechten</b> Seite angezeigt. Das letzte Beispiel könnte beispielsweise auch wie folgt aussehen: 
    </p>

    <div id='exampleStim'>
    $${constructStim('1', '5.00', '10.00', 'PD', null, '50')}
    </div>

    <p>
    Hinweis: Alle Wahlmöglichkeiten sind <b>fiktiv</b>, d.h. <b>Ihre Vergütung für dieses Experiment wird nicht von Ihren 
    Entscheidungen abhängen</b>. Bitte wählen Sie dennoch zwischen den Gewinnen, 
    <b>als ob sie eine echte Entscheidungg treffen müssten</b>. Es gibt keine richtige oder falsche Antwort. 
    Jeder Durchgang steht für sich allein, bitte behandeln Sie jede Entscheidung unabhängig.
    </p>

    
    <p>
    Auf der nächsten Seite können Sie die Aufgabe in <b>5 Testdurchgängen</b> ohne Zeitlimit ausprobieren.
    </p>
    </div>`

const instructions0 = {
    type: "html-button-response",
    stimulus: instructionsText0,
    choices: ['Weiter'],
    margin_vertical: '100px',
};
    

const instructions1 = {
    type: "html-button-response",
    stimulus: instructionsText1,
    choices: ['Weiter'],
    margin_vertical: '100px',
};

const instructions2 = {
    type: "html-button-response",
    stimulus: instructionsText2,
    choices: ['Weiter zu den Testdurchgängen'],
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
        lastDelay = jsPsych.data.getLastTrialData().values()[0].delay;
        lastTask = jsPsych.data.getLastTrialData().values()[0].task;

        if(lastChoice == 81){
            trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastTask, lastDelay, lastProb,
                feedback='left');
            return trialFeedback

        } else if(lastChoice == 80) {
            trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastTask, lastDelay, lastProb,
                feedback='right');
            return trialFeedback

        } else {
            trialFeedback = `<div class = centerbox id='container'>
            <p class = center-block-text style="color:red;">
                <b>Bitte wählen Sie eine Option mit Q oder P!</b>
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
        <h3>Willkommen zu Teil 2 des Experiments!</h3>
        <p>Wie im ersten Teil werden Sie vier Blöcke mit Durchgängen bearbeiten.
        Sie können zwischen den Blöcken kurze Pausen nehmen.
        Das Experiment endet, wenn Sie alle Blöcke beendet haben.</p>
        <p>Sie haben 10 Sekunden pro Durchgang.</p>
        <p>Bitte platzieren Sie Ihren <b>linken Zeigefinger auf Q</b>, 
        und Ihren <b>rechten Zeigefinger auf P</b>.</p>
        <p>Drücken Sie auf Q oder P, um mit dem ersten Block zu starten.</p>
        </div>`,
    choices: ['q', 'p'],
    margin_vertical: '100px',
};

const debriefPart2 = {
    type: "html-keyboard-response",
    stimulus: `<p>Sie haben das Experiment beendet.</p>
                <p>Vielen Dank für Ihre Teilnahme!</p>
                <p>Bitte klicken Sie auf den untenstehenden Link, um zurück zu Prolific zu gelangen 
                und Ihren Abschluss des Experiments zu bestätigen:</p>
                <a href="https://app.prolific.co/submissions/complete?cc=314880B1"> https://app.prolific.co/submissions/complete?cc=314880B1 </a>`,
    margin_vertical: '100px',
    choices: jsPsych.NO_KEYS,
    on_load: function() {
        saveData();
    }
};