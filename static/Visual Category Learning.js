
function startExp(images, cfg){

    var win = document.getElementById('VisCat').getContext("2d"); // creates a window reference.
    var canvas = document.getElementById('VisCat');
    var winHeight = VisCat.height;
    var winWidth = VisCat.width;
    win.font = "30px Arial";
    win.textAlign = 'center';
    win.fillStyle = "#fFfFfF";
    var halfW = winWidth / 2;
    var halfH = winHeight / 2;
    var debug = 1;
    var empiricalMainPage = "http://127.0.0.1:8000/";


// These variables will end up coming from a .cfg file - These lines need to be modified to refer to the JSON that contains them

    var fixateTimeout = cfg["timings"].fixateTimeout;
    var stimTimeout = cfg["timings"].stimTimeout;
    var maskTimeout = cfg["timings"].maskTimeout;
    var feedbackTimeout = cfg["timings"].feedbackTimeout;
    var itiTimeout = cfg["timings"].itiTimeout;
    var feedback = cfg["timings"].feedback;
    var trialBeforeBreak = cfg["exp_control"].trialBeforeBreak;
    var trialsBeforeEnd = cfg["exp_control"].trialBeforeEnd;
    var stimLabels = cfg["exp_control"].stimLabels;

    var corrImg = images[1000];
    var incorrImg = images[1001];
    var mask = images[1002];


    var masterClock = 0;
    var startTime = 0;
    var endTime = 0;
    var trialCount = 0;
    var introSlide = 0;

    var data = [];
    var show = 1;
    var response = {
        "trial": 0,
        "totalTime": 0,
        "stimImg": null,
        "label": null,
        "response": null,
        "feedback": null,
        "hitMiss": null,
        "duration": 0,
        "subj": 00340798
    };

    var keyDict = {
        100: 1,
        107: 2,
        32: 32,
        'NA': 'NA'
    };

    if (stimTimeout > 1000){
        var s = 's'
    }

    var introText = 'In this experiment, you will be shown a series of images. These images belong to either category A or category B.' +
        '\n\nCategorize each image by pressing "d" for A, or "k" for B. Please note that you have ' + stimTimeout/1000 + ' second'+s+' to make your decision.' +
        '\n\nPress any key to advance.';

    var introText2 = 'something else';

    var endText = 'Thank you for participating in this study.\n\nPlease inform the researcher that you have finished.';


    /* Functions */

    function doFeedback(){
        endTime = performance.now();
        document.removeEventListener('keypress', doFeedback, false);
        response.hitMiss = null;
        if (event.keyCode === 100 || event.keyCode === 107){
            clearTimeout(picTimeout);

            response.duration = (endTime - startTime) / 1000;
            response.duration = response.duration.toFixed([4]);
            response.response = keyDict[event.keyCode];
            response.totalTime = endTime / 1000;
            response.totalTime = response.totalTime.toFixed([4]);
            response.label = stimLabels[trialCount];

            if (debug === 1) {
                console.log(event.keyCode);
                console.log('in doFeedback');
                console.log('keypress was: ' + response.response);
                console.log('rt was: ' + response.duration);
            }

            if (response.response === response.label) {
                response.feedback = 1;
                response.hitMiss = "hit";
                if (show === 1) {
                    fsm.showMask();
                }
            } else if (response.response !== response.label) {
                response.feedback = 0;
                response.hitMiss = "miss";
                if (show === 1) {
                    fsm.showMask();
                }
            } else if (response.response === 'NA') {
                response.hitMiss = "NA";
                response.feedback = 'NA';
                fsm.showITI();
            }
        }else{
            if (debug === 1) {
                console.log("wrong key was pressed");
            }
            response.duration = (endTime - startTime) / 1000;
            response.duration = response.duration.toFixed([4]);
            response.response = keyDict[event.keyCode];
            response.totalTime = endTime / 1000;
            response.totalTime = response.totalTime.toFixed([4]);
            response.feedback = 'NA';
            //fsm.showITI();
        }
    }

    // this function moves us on from our "breaks".
    function breakOut() {
        document.removeEventListener('keypress', breakOut, false);
        win.clearRect(0, 0, winHeight, winWidth);
        fsm.showFixation();
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var cars = text.split("\n");

        for (var ii = 0; ii < cars.length; ii++) {

            var line = "";
            var words = cars[ii].split(" ");

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + " ";
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;

                if (testWidth > maxWidth) {
                    context.fillText(line, x, y);
                    line = words[n] + " ";
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }

            context.fillText(line, x, y);
            y += lineHeight;
        }
    }

    function DrawText(text) {
        win.clearRect(0, 0, winHeight, winWidth);
        var maxWidth = winWidth;
        var lineHeight = 35;
        var x = halfW; // (canvas.width - maxWidth) / 2;
        var y = halfH*.5 ;
        wrapText(win, text, x, y, maxWidth, lineHeight);
    }

    function doBegin(){
        win.clearRect(0, 0, winHeight, winWidth);
        document.removeEventListener('keypress', doBegin, false);
        introSlide++;

        // this bit will allow us to display multiple instructions. Just add new "else if" before the "else"
        if (introSlide === 1){
            document.addEventListener('keypress', doBegin, false);
            DrawText(introText2);
        }//else if (introSlide === 2){} // if we need another intro text screen.

        else{
            fsm.showFixation();
        }
    }

    function getMousePos1(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
            y: Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
        };
    }

    // make a button here!

    function backToMain(evt) {
        var mousePoss = getMousePos1(canvas, evt);
        var message = mousePoss.x + ',' + mousePoss.y;
        if (debug === 1) {
            console.log(message.slice(0, 3));
            console.log(message.slice(4, 8));
        }

        if (200 <= mousePoss.x && mousePoss.x <= 400 && 400 <= mousePoss.y && mousePoss.y <= 475) {
            canvas.removeEventListener('click', backToMain, false);
            window.location = empiricalMainPage;
        }
    }


    /* FSM */

    var fsm = StateMachine.create({ // Version 2 self-contained.
        //initial: 'wait',
        events: [
            { name: "start",         from: 'none',                                      to: 'instructions'},
            { name: 'showFixation',  from: ['break', 'ITI', 'none', 'instructions'],    to: 'fixation' },
            { name: 'showStim',      from: 'fixation',                                  to: 'stim'    },
            { name: 'showMask',      from: 'stim',                                      to: 'mask'    },
            { name: 'showFeedback',  from: ['stim', 'mask'],                            to: 'feedback' },
            { name: 'showTooSlow',   from: 'stim',                                      to: 'tooSlow' },
            { name: 'showITI',       from: ['feedback', 'tooSlow'],                     to: 'ITI'  },
            { name: 'showBreak',     from: 'ITI',                                       to: 'break'  },
            { name: 'showFinish',    from: 'ITI',                                       to: 'end'  }
        ],
        callbacks: {

            oninstructions: function(event, from, to){
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                //alert('The following dialog box will contain your receipt token.\n\nPlease press Ctrl+C to copy it');
                //alert('987654321');
                DrawText(introText);
                document.addEventListener('keypress', doBegin, false);
            },

            onfixation:  function(event, from, to)  { // show fixate
                startTime = null;
                endTime = null;
                if (masterClock === 0){
                    masterClock = performance.now();
                }
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                win.font = "50px Arial";
                win.fillText('+', halfH, halfW);
                win.font = "30px Arial";
                response.trial = trialCount;

                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    fsm.showStim();
                },fixateTimeout);
            },

            onstim:  function(event, from, to)      { // show image, wait for key or timeout
                img = images[trialCount]; // Iterates the image based on trialCount

                response.stimImg = cfg["exp_control"].stimOrder[trialCount];

                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                    console.log('trail number: ' +trialCount);
                }
                //win.drawImage(img, (halfH - (img.height / 4)), (halfW - (img.width / 4)), img.height/2, img.width/2);
                win.drawImage(img, (halfH - (img.height / 2)), (halfW - (img.width / 2)), img.height, img.width);

                startTime = performance.now();
                document.addEventListener('keypress', doFeedback, false);

                picTimeout = window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    document.removeEventListener('keypress', doFeedback, false);
                    fsm.showTooSlow();
                },stimTimeout);
            },

            ontooSlow:  function(event, from, to)  { // show fixate
                endTime = performance.now();
                win.fillText('Too Slow!', halfH, halfW);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                response.totalTime  = endTime / 1000;
                response.totalTime  = response.totalTime.toFixed([4]);
                response.response = 'NA';
                response.feedback = 'NA';
                response.duration = 'NA';
                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    fsm.showITI();
                },itiTimeout);
            },

            onmask: function(event, from, to){
                win.clearRect(0, 0, winHeight, winWidth);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                win.drawImage(mask, (halfH - (img.height / 2)), (halfW - (img.width / 2)), img.height , img.width);
                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    fsm.showFeedback(response.feedback);
                },maskTimeout);
            },


            onfeedback:  function(event, from, to, corr)  { // show feedback
                win.clearRect(0, 0, winHeight, winWidth);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                if (corr === 1) {
                    //corrImg.onload = function(){
                    //win.drawImage(corrImg, (halfH - (corrImg.height / 6)), (halfW - (corrImg.width / 6)), corrImg.height/3, corrImg.width/3);
                    //};
                    win.drawImage(corrImg, (halfH - (img.height / 2)), (halfW - (img.width / 2)), img.height , img.width);

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        fsm.showITI();
                    },feedbackTimeout);

                }else if (corr === 0) {
                    //incorrImg.onload = function(){
                    //win.drawImage(incorrImg, (halfH - (incorrImg.height / 6)), (halfW - (incorrImg.width / 6)), incorrImg.height/3, incorrImg.width/3);
                    //};
                    win.drawImage(incorrImg, (halfH - (img.height / 2)), (halfW - (img.width / 2)), img.height, img.width);

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        fsm.showITI();
                    },feedbackTimeout);
                }
            },

            onITI: function(event, from, to) { // show ITI
                win.clearRect(0, 0, winHeight, winWidth);
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
                data.push((response.trial+1) + " " + response.totalTime + " " + response.stimImg + " " + response.label + " " + response.response + " " + response.feedback + " " + response.hitMiss + " " + response.duration + " " + response.subj +"\n");
                trialCount++;
                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    if (trialCount === trialsBeforeEnd){
                        fsm.showFinish();
                    }
                    else if (trialCount % trialBeforeBreak === 0){
                        fsm.showBreak();
                    }else{
                        fsm.showFixation();
                    }

                },itiTimeout);
            },

            onbreak: function(event, from, to){
                document.addEventListener('keypress', breakOut, false);
                win.clearRect(0,0, winHeight, winWidth);
                win.fillText('Please feel free to take a break.', (winWidth/2), ((winHeight/2)-20));
                win.fillText('Press any key to continue', (winWidth/2), ((winHeight/2)+20));
                if (debug === 1) {
                    console.log('state is ' + fsm.current);
                }
            },

            onend: function(event, from, to){
                win.clearRect(0, 0, winHeight, winWidth);
                if (debug === 1) {
                    console.log(data);
                }
                ServerHelper.upload_data('complete',data);
                canvas.addEventListener('click', backToMain, false);
                DrawText(endText);
                win.beginPath();
                win.rect(200, 400, 200,75);
                win.stroke();
                win.fillText("Main Page.",305,445);
            }
        }
    });

    fsm.start();
}