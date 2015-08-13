/*Created by Ben on 6/26/2015.*/





function master() {

    function get(url) {
        // Return a new promise.
        return new Promise(function(resolve, reject) {
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            req.open('GET', url);

            req.onload = function() {
                // This is called even on 404 etc
                // so check the status
                if (req.status == 200) {
                    // Resolve the promise with the response text
                    resolve(req.response);
                }
                else {
                    // Otherwise reject with the status text
                    // which will hopefully be a meaningful error
                    reject(Error(req.statusText));
                }
            };
            // Handle network errors
            req.onerror = function() {
                reject(Error("Network Error"));
            };
            // Make the request
            req.send();
        });
    }

    get('https://www.dropbox.com/s/7ws9ui2m58wnpmi/package.json?dl=1').then(function(response) {
        console.log("Success!", response);
        var timing = JSON.parse(response);
        console.log(timing.timings.feedback)
    }, function(error) {
        console.error("Failed!", error);
    });
}


    /*
    var shown = false;
    var run = false;
    var win = document.getElementById('mainWin').getContext("2d");
    var img = new Image();
    var startTime = performance.now();
    var images = [];
    var fixateTimeout = 2000;
    var stimTimeout = 2000;
    var feedbackTimeout = 2000;
    var itiTimeout = 2000;
    var feedback = 0;
    var response = {
        "keys": [],
        "firstKey": null,
        "lastKey": null,
        "startTime": startTime,
        "endTime": endTime,
        "duration": 0,
        "timedOut": false
    };
    var winHeight = mainWin.height;
    var winWidth = mainWin.width;

    var keys = []; // array to hold keys.
    var corrImg = new Image();
    corrImg.src = "pics/Correct.png";
    var incorrImg = new Image();
    incorrImg.src = "pics/Incorrect.png";
    var imgSrc = [];
    var imgOrder = [1,2,3,4,5,6,7,8,9,10];
    var endTime = 0;
    win.font = "50px Arial";
    var fixation = "+";
    //var ITI = win.fillText("",0,0);
    var trialCount = 0;
    var trialBeforeBreak = 20;



    function master(){

        var shown = false;
        var run = false;
        var win = document.getElementById('mainWin').getContext("2d");
        var img1 = new Image();
//        img1.src = "http://i.imgur.com/p6FV3B6.jpg";
        var startTime = performance.now();
        var fixateTimeout = 2000;
        var stimTimeout = 2000;
        var feedbackTimeout = 2000;
        var itiTimeout = 2000;
        var feedback = 0;
        var response = {
            "keys": [],
            "firstKey": null,
            "lastKey": null,
            "startTime": startTime,
            "endTime": endTime,
            "duration": 0,
            "timedOut": false
        };
        var winHeight = mainWin.height;
        var winWidth = mainWin.width;

        var keys = []; // array to hold keys.
        var endTime = 0;
        win.font = "50px Arial";
        // var fixation = "+";
        //var ITI = win.fillText("",0,0);
        var trialCount = 0;
        var trialBeforeBreak = 20;

        function doFeedback(key, label, show){
            console.log('in doFeedback');
            if (key === label){
                feedback = 1;
                if (show === 1){
                    //showFeedback(1);
                }
            }else if (key !== label){
                feedback = 0;
                if (show === 1){
                    //showFeedback(0)
                }
            }else if (key === 'NA') {
                feedback = 'NA';
            }
            //fsm.feedback(feedback);
        }
        var stimTimeout = null;
        showCorrect = function(){
            document.removeEventListener('keypress', showCorrect, false);
            win.clearRect(0,0, winHeight, winWidth);
            win.fillText('CORRECT!', 200,200);
            clearTimeout(picTimeout);
            fsm2.showITI();
        }

        function pause() {
            return StateMachine.ASYNC;
        }

        var fsm2 = StateMachine.create({ // Version 2 self-contained.
            //initial: 'wait',
            events: [
                { name: "start",         from: "none", to: "fixation"},
                { name: 'showFixation',  from: 'ITI',  to: 'fixaton' },
                { name: 'showStim',      from: 'fixation', to: 'stim'    },
                { name: 'showFeedback',  from: 'stim',    to: 'feedback' },
                { name: 'showTooSlow',  from: 'stim',    to: 'tooSlow' },
                { name: 'showITI',       from: ['feedback', 'tooSlow'], to: 'fixation'  }
            ],
            callbacks: {
                onfixation:  function(event, from, to)  { // show fixate
                    console.log(fsm2.current);
                    console.log('in showFixate');
                    win.fillText('+', 100,100);
                    console.log('in showFixate - 1');
                    startTime = performance.now();
                    console.log('in showFixate - 2');
                    trialCount++;
                    console.log('in showFixate - 3');

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        console.log('state is ' +fsm2.current);
                        fsm2.showStim();
                    },fixateTimeout);
                },

                onbeforestim: function(event, from, to) { img = img1; console.log(trialCount);     }, // iterate image

                onstim:  function(event, from, to)      { // show image, wait for key or timeout
                    console.log(fsm2.current);
                    console.log('in showStim');
                    //img = img1;
                    console.log(trialCount);
                    img1.onload = function(){
                        console.log('drawing');
                        win.drawImage(img1, 75, 75, 250, 250);
                        console.log('drawn');
                    };
                    img1.src = "http://i.imgur.com/p6FV3B6.jpg";

                    console.log('img displayed');
                    startTime = performance.now();
                    endTime = startTime + stimTimeout;
                    //document.addEventListener('keypress', doFeedback(event,1,1), false);
                    document.addEventListener('keypress', showCorrect, false);
                    picTimeout = window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        //document.removeEventListener('keypress', doFeedback(event,1,1), false);
                        document.removeEventListener('keypress', showCorrect, false);
                        fsm2.showTooSlow();
                    },endTime);
                },

                ontooSlow:  function(event, from, to)  { // show fixate
                    console.log(fsm2.current);
                    console.log('in tooSlow');
                    win.fillText('Too Slow!', 100,100);
                    window.setInterval(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        fsm2.showITI();
                    },itiTimeout);
                },

                onfeedback:  function(event, from, to)  { // show feedback
                    console.log('in showFeedback');
                    if (corr === 1) {
                        corrImg.onload = function(){ win.drawImage(corrImg, 75, 75, 250, 250);};
                        startTime = performance.now();
                        endTime = startTime + feedbackTimeout;

                        window.setTimeout(function(){
                            win.clearRect(0, 0, winHeight, winWidth);
                        },endTime);

                    }else if (corr === 0) {
                        incorrImg.onload = function(){ win.drawImage(incorrImg, 75, 75, 250, 250);};
                        startTime = performance.now();
                        endTime = startTime + feedbackTimeout;

                        window.setTimeout(function(){
                            win.clearRect(0, 0, winHeight, winWidth);
                        },endTime);
                    }
                },

                onITI: function(event, from, to) { // show ITI
                    console.log('in showITI');
                    win.clearRect(0, 0, winHeight, winWidth);

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                        fsm2.showFixation();
                    },itiTimeout);


                }
            }
        });

        fsm2.start();
        //window.setTimeout(fsm2.fixation, 5000);


    }































    var fsm = StateMachine.create({ // Version 1 that relies on calling external functions.
        initial: 'wait',
        events: [
            { name: 'fixation',  from: 'wait',  to: 'stim' },
            { name: 'stim',      from: 'fixation', to: 'feedback'    },
            { name: 'feedback',  from: 'stim',    to: 'ITI' },
            { name: 'ITI',       from: 'feedback', to: 'fixation'  }
        ],
        callbacks: {
            onfixation:  function(event, from, to)  { showFixation();               }, // show fixate
            onbeforestim: function(event, from, to) { img = images[trialCount]; console.log(trialCount);     }, // iterate image
            onstim:  function(event, from, to)      { showStim(img);                }, // show image, wait for key or timeout
            onfeedback:  function(event, from, to)  { showFeedback(feedback)       }, // show feedback
            onITI: function(event, from, to)        { showITI();                    } // show ITI
        }
    });

    var fsm2 = StateMachine.create({ // Version 2 self-contained.
        initial: 'wait',
        events: [
            { name: 'fixation',  from: 'wait',  to: 'stim' },
            { name: 'stim',      from: 'fixation', to: 'feedback'    },
            { name: 'feedback',  from: 'stim',    to: 'ITI' },
            { name: 'ITI',       from: 'feedback', to: 'wait'  }
        ],
        callbacks: {
            onbeforefixation:  function(event, from, to)  { // show fixate
                console.log('in showFixate');
                win.fillText('+', 0,0);
                startTime = performance.now();
                endTime = startTime + fixateTimeout;
                trialCount++;

                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                },endTime);
            },

            onbeforestim: function(event, from, to) { img = images[trialCount]; console.log(trialCount);     }, // iterate image

            onstim:  function(event, from, to)      { // show image, wait for key or timeout
                console.log('in showStim');
                img = images[trialCount];
                console.log(trialCount);
                img.onload = function(){ win.drawImage(img, 75, 75, 250, 250);};
                startTime = performance.now();
                endTime = startTime + stimTimeout;
                document.addEventListener('keypress', doFeedback(event,1,1), false);
                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                    document.removeEventListener('keypress', doFeedback(event,1,1), false);
                },endTime);
            },

            onfeedback:  function(event, from, to)  { // show feedback
                console.log('in showFeedback');
                if (corr === 1) {
                    corrImg.onload = function(){ win.drawImage(corrImg, 75, 75, 250, 250);};
                    startTime = performance.now();
                    endTime = startTime + feedbackTimeout;

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                    },endTime);

                }else if (corr === 0) {
                    incorrImg.onload = function(){ win.drawImage(incorrImg, 75, 75, 250, 250);};
                    startTime = performance.now();
                    endTime = startTime + feedbackTimeout;

                    window.setTimeout(function(){
                        win.clearRect(0, 0, winHeight, winWidth);
                    },endTime);
                }
            },

            onITI: function(event, from, to) { // show ITI
                console.log('in showITI');
                win.clearRect(0, 0, winHeight, winWidth);
                startTime = performance.now();
                endTime = startTime + itiTimeout;

                window.setTimeout(function(){
                    win.clearRect(0, 0, winHeight, winWidth);
                },endTime);


            }
        }
    });



    /* Promise */
/*
    var p = setupEvents();  // this would set up your timeout and callback events
    p.then(
        function success(keystroke) {
            // grade the keystroke
        }
    ).catch(
        function failure() {
            // grade the timeout
        }
    ).finally(fsm.feedback) ;  // instead of defining your own code, just have the feedback function called

    /*  Easy enough, right?
        Guess what?  The “setupevents” code is pretty easy, too!  There are promise constructor libraries that make life super-easy for you.
        I like “Q” or “bluebird” (“Q” seems to be a flagship standard, but bluebird is supposed to be more efficient)…
        Anyway, here’s setupEvents for you:
    */
/*
    function setupEvents() {
        var timeout,
            keywatch,
            p = new Promise(resolve, reject){  // could name them accept/reject – they’re both functions to be called.
            // this code gets executed right away, BUT!!!! *AFTER* the “return” is processed!!!
            timeout = window.setTimeout(reject, howeverLongWeWaitForKeys);
            keywatch = window.addListener(“keypress”, resolve);
        }
        p.finally(
            function() {
                timeout.cancel();      // or whatever the “forget about it” call is
                window.removeListener(keywatch);                                       // you might have to do this differently, but this is pseudo-code anyway.
            }
        );
        return p;
    }

    /*  So, what happens is the setup function queues some async behavior – which queues *other* async behavior…in fact the whole thing is a mess of async behavior…but it makes *sense* now!  At least once you “get” promises./*
        Mix this in with the state machine to track where you are, and you have all kinds of async goodness going for you!
        Seriously…I think that if I had 4 hours to do it, I could probably have the heart of this thing written for you.  Even set up as a framework that you can just initialize the way the fsm is; a config object to define everything and a “go()” function.
    */


/*
        var p1 = new Promise(function(resolve, reject) {
            img.onload = function(){ win.drawImage(img, 75, 75, 250, 250);};
            var startTime = performance.now();
            var endTime = startTime + timeout;
            console.log('drawing');
            if (performance.now() > endTime){
                resolve(
                    win.clearRect(0, 0, winHeight, winWidth),
                    win.fillText("Yep",10,50)
                );
            }else{
                reject(
                    win.fillText("Nope",10,50)
                );
            }

            // if (performance.now() > endTime) {
            //   resolve(win.clearRect(0, 0, winHeight, winWidth), console.log('resolved'));
            // }
            // else {
            //   reject(console.log(performance.now()));
            // }
        });

        /*p.then(function(){
         if (performance.now() > endTime) {
         win.clearRect(0, 0, winHeight, winWidth);
         console.log('resolved');
         }

         });p.catch(function(){
         win.clearRect(0, 0, winHeight, winWidth);
         win.fillText("Nope",10,50);

         });*/
/*
//win.clearRect(0, 0, winHeight, winWidth);
        img.src = "http://i.imgur.com/p6FV3B6.jpg";
    }


    function preload(imgOrder){
        for (x = 0; x <= (imgOrder.length)-1; x++){
            imgSrc[x] = "pics/mask_"+(x+1)+".jpg";
        }
        // start preloading
        for(i=0; i<= (imgOrder.length) -1; i++){
            images[i] = new Image();
            images[i].src = imgSrc[i];
        }
        console.log(images);
    }


    function userInteraction(stim, allowInput, timeout) {
        win.clearRect(0, 0, winHeight, winWidth); // make sure the canvas is clear
        console.log('starting');
        console.log(stim);
        keys = []; // reset key array for next trial.
        var stimStartTime = performance.now();
        endTime = startTime + timeout;
        response = {
            "keys": [],
            "firstKey": null,
            "lastKey": null,
            "startTime": startTime,
            "endTime": endTime,
            "duration": 0,
            "timedOut": false
        };
        console.log(endTime);

        if (allowInput === true) {
            win.drawImage(stim, 75, 75, 250, 250);
        }else if (allowInput === false){
            win.fillText(stim, 190, 190);
        }

        if (allowInput) {
            document.addEventListener('keypress', keyLogger, false);
        }

        var timeOut = window.setTimeout(function(){
            win.clearRect(0, 0, winHeight, winWidth);
        },endTime);

/*        var interval = window.setInterval(function () {
            // do your thing, do your thing
            console.log('waiting for keypress');
            if (timeout !== null && performance.now() > endTime) {
                response["duration"] = performance.now() - stimStartTime;
                response["timedOut"] = true;
                response["firstKey"] = 'NA';
                win.clearRect(0, 0, winHeight, winWidth);
                console.log(startTime, endTime, response["duration"]);
                window.clearInterval(interval);
            }
        });*/
/*
        function keyLogger(event) {
            window.clearInterval(interval);
            response["firstKey"] = event.keyCode;
            console.log(performance.now() - startTime);
            console.log(keys);
            document.removeEventListener('keypress', keyLogger, false);
        }
    }



    function show(stim) {
        console.log('showing image');
        win.drawImage(stim, 75, 75, 250, 250);
    }

    function showFixation(){
        console.log('in showFixate');
        win.fillText('+', 150,150);
        startTime = performance.now();
        endTime = startTime + fixateTimeout;
        trialCount++;

        window.setTimeout(function(){
            win.clearRect(0, 0, winHeight, winWidth);
        },endTime);

/*        var interval = window.setInterval(function () {
            // do your thing, do your thing
            console.log('waiting for keypress');
            if (performance.now() > endTime) {
                win.clearRect(0, 0, winHeight, winWidth);
                console.log(startTime, endTime);
                window.clearInterval(interval);
            }
        });*/
        //return userInteraction(fixation, false, fixateTimeout);
/*
    }

    function showStim(img){
        console.log('in showStim');
        img.onload = function(){ win.drawImage(img, 75, 75, 250, 250);};
        startTime = performance.now();
        endTime = startTime + stimTimeout;
        document.addEventListener('keypress', doFeedback(event,1,1), false);
        window.setTimeout(function(){
            win.clearRect(0, 0, winHeight, winWidth);
            document.removeEventListener('keypress', doFeedback(event,1,1), false);
        },endTime);

    }

    function doFeedback(key, label, show){
        console.log('in doFeedback');
        if (key === label){
            feedback = 1;
            if (show === 1){
                showFeedback(1);
            }
        }else if (key !== label){
            feedback = 0;
            if (show === 1){
                showFeedback(0)
            }
        }else if (key === 'NA') {
            feedback = 'NA';
        }
        fsm.feedback(feedback);
    }

    function showFeedback(corr){
        console.log('in showFeedback');
        if (corr === 1) {
            corrImg.onload = function(){ win.drawImage(corrImg, 75, 75, 250, 250);};
            startTime = performance.now();
            endTime = startTime + feedbackTimeout;

            window.setTimeout(function(){
                win.clearRect(0, 0, winHeight, winWidth);
            },endTime);

        }else if (corr === 0) {
            incorrImg.onload = function(){ win.drawImage(incorrImg, 75, 75, 250, 250);};
            startTime = performance.now();
            endTime = startTime + feedbackTimeout;

            window.setTimeout(function(){
                win.clearRect(0, 0, winHeight, winWidth);
            },endTime);
        }
    }

    function showITI(){
        console.log('in showITI');
        win.clearRect(0, 0, winHeight, winWidth);
        startTime = performance.now();
        endTime = startTime + itiTimeout;


        window.setTimeout(function(){
            win.clearRect(0, 0, winHeight, winWidth);
        },endTime);
        //fsm.fixation();
    }

    function showBreak(){
        return userInteraction(breakImage, false, null);
    }


    preload(imgOrder);
    fsm2.fixation();






/* TO DO (6/29/15):

Ongoing:
inspect all functions and logic flow
add / modify functions as needed
test
test
test

Research:
find out how to reference an external file (local for now)
find out how to write to a string
work out how to load 10 images at a time

*/

/* Unused misc. that may be interesting later:

document.onkeypress = function (event) {
    window.clearInterval(interval);
    response["duration"] = performance.now() - stimStartTime;
    console.log(event.keyCode[0]);
    keyLogger(event);
    clear();
     // do some other thing, other thing
}




 */