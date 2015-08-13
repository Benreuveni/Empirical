/*Created by Ben on 6/25/2015.*/

function img_preload(cfg){

    var debug = 0;

    var imgPath = "/images/VisCat_Stims_13_3/";
    var imgList = cfg["exp_control"].stimList;
    var totalImages = imgList.length;
    var imgArray = cfg["exp_control"].stimOrder;
    var winHeight = VisCat.height;
    var winWidth = VisCat.width;
    var halfW = winWidth/4;
    var halfH = winHeight / 2.2;
    var clickToBegin = "Click to begin";
    var images = [];
    var loadedCount = 0;
    var percentIncrement = 1;


    // the following progress bar functions are described here:
    // http://mag.splashnology.com/article/how-to-create-a-progress-bar-with-html5-canvas/478/

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arc(x+width-radius, y+radius, radius, -Math.PI/2, Math.PI/2, false);
        ctx.lineTo(x + radius, y + height);
        ctx.arc(x+radius, y+radius, radius, Math.PI/2, 3*Math.PI/2, false);
        ctx.closePath();
        ctx.fill();
    }

    function progressLayerRect(ctx, x, y, width, height, radius) {
        ctx.save();
        // Define the shadows
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#666';

        // first grey layer
        ctx.fillStyle = 'rgba(189,189,189,1)';
        roundRect(ctx, x, y, width, height, radius);

        // second layer with gradient
        // remove the shadow
        ctx.shadowColor = 'rgba(0,0,0,0)';
        var lingrad = ctx.createLinearGradient(0,y+height,0,0);
        lingrad.addColorStop(0, 'rgba(255,255,255, 0.1)');
        lingrad.addColorStop(0.4, 'rgba(255,255,255, 0.7)');
        lingrad.addColorStop(1, 'rgba(255,255,255,0.4)');
        ctx.fillStyle = lingrad;
        roundRect(ctx, x, y, width, height, radius);

        ctx.restore();
    }

    function progressBarRect(ctx, x, y, width, height, radius, max) {
        // deplacement for chord drawing
        var offset = 0;
        ctx.beginPath();
        if (width<radius) {
            offset = radius - Math.sqrt(Math.pow(radius,2)-Math.pow((radius-width),2));
            // Left angle
            var left_angle = Math.acos((radius - width) / radius);
            ctx.moveTo(x + width, y+offset);
            ctx.lineTo(x + width, y+height-offset);
            ctx.arc(x + radius, y + radius, radius, Math.PI - left_angle, Math.PI + left_angle, false);
        }
        else if (width+radius>max) {
            offset = radius - Math.sqrt(Math.pow(radius,2)-Math.pow((radius - (max-width)),2));
            // Right angle
            var right_angle = Math.acos((radius - (max-width)) / radius);
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width, y);
            ctx.arc(x+max-radius, y + radius, radius, -Math.PI/2, -right_angle, false);
            ctx.lineTo(x + width, y+height-offset);
            ctx.arc(x+max-radius, y + radius, radius, right_angle, Math.PI/2, false);
            ctx.lineTo(x + radius, y + height);
            ctx.arc(x+radius, y+radius, radius, Math.PI/2, 3*Math.PI/2, false);
        }
        else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.arc(x+radius, y+radius, radius, Math.PI/2, 3*Math.PI/2, false);
        }
        ctx.closePath();
        ctx.fill();

        // shadow on the right
        if (width<max-1) {
            ctx.save();
            ctx.shadowOffsetX = 1;
            ctx.shadowBlur = 1;
            ctx.shadowColor = '#666';
            if (width+radius>max)
                offset = offset+1;
            ctx.fillRect(x+width,y+offset,1,total_height-offset*2);
            ctx.restore();
        }
    }

    function progressText(ctx, x, y, width, height, radius, max) {
        ctx.save();
        ctx.fillStyle = 'white';
        var text = Math.floor(width/max*100)+"%";
        var text_width = ctx.measureText(text).width;
        var text_x = x+width-text_width-radius/2;
        if (width<=radius+text_width) {
            text_x = x+radius/2;
        }
        ctx.fillText(text, text_x, y+22);
        ctx.restore();
    }

    // Define the size and position of indicator
    var i = 0;
    var res = 0;
    var context = null;
    var total_width = 300;
    var total_height = 34;
    var initial_x = halfW;
    var initial_y = halfH;
    var radius = total_height/2;

    function preloadMain() {
        // Get the canvas element
        var elem = document.getElementById('VisCat');
        // Check the canvas support with the help of browser
        if (!elem || !elem.getContext) {
            return;
        }
        context = elem.getContext('2d');
        if (!context) {
            return;
        }

        // Gradient of the progress
        var progress_lingrad = context.createLinearGradient(0,initial_y+total_height,0,0);
        progress_lingrad.addColorStop(0, '#4DA4F3');
        progress_lingrad.addColorStop(0.4, '#ADD9FF');
        progress_lingrad.addColorStop(1, '#9ED1FF');
        context.fillStyle = progress_lingrad;

        // Text's font for "Please wait" note
        context.font = "24px Verdana";
        context.fillText("Please wait while images are being loaded.",50,150);

        // Text’s font of the progress
        context.font = "16px Verdana";

        // Create the animation
        preload(imgArray);
    }

    // This function preloads images.
    function preload(imgOrder){
        var img = images[loadedCount];
        if (typeof(img) === "undefined") {
            img = images[loadedCount] = new Image();
        }
        img.onload = imgLoaded();
        img.src = imgPath + imgList[loadedCount];
        images[loadedCount] = img;
    }

    // this function checks if an image has been loaded and then iterates the progress bar.
    function imgLoaded(){
        return function() {
            loadedCount++;
            percentIncrement = (total_width/totalImages); // a modifier to ensure that progress is always maxed at 100%
            if (debug === 1) {
                console.log('imgLoaded is not done');
            }
            draw(loadedCount*percentIncrement);
        };
    }

    function draw(count) {
        // Clear the layer
        context.clearRect(initial_x-5,initial_y-5,total_width+15,total_height+15);
        progressLayerRect(context, initial_x, initial_y, total_width, total_height, radius);
        progressBarRect(context, initial_x, initial_y, count, total_height, radius, total_width);
        progressText(context, initial_x, initial_y, count, total_height, radius, total_width );

        // stop the animation when it reaches 100%
        // makes the progress bar clickable when it reaches 100%
        if (count >= total_width) {
            if (debug === 1) {
                console.log(percentIncrement);
                console.log('draw is done');
                console.log(images);
            }
            canvas.addEventListener('click', event, false);
            context.fillStyle = "yellow";
            context.fillText(clickToBegin, halfW + (total_width/3.3), initial_y+total_height-12);
        }else {
            if (debug === 1) {
                console.log('loading with ' + count);
            }
            preload(imgList);
        }
    }

    // tracks mouse position.
    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
            y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
        };
    }
    var canvas = document.getElementById('VisCat');

    // listens for a mouse click. If they clicked the button, invokes the main experiment.
    function event(evt) {
        var mousePos = getMousePos(canvas, evt);
        var message = mousePos.x + ',' + mousePos.y;
        if (debug === 1) {
            console.log(message.slice(0, 3));
            console.log(message.slice(4, 8));
        }
        if (halfW <= mousePos.x && mousePos.x <= halfW + total_width && halfH <= mousePos.y && mousePos.y <= halfH + total_height) {
            canvas.removeEventListener('click', event, false);
            //console.log(images);
            startExp(images, cfg);
        }
    }
        preloadMain();
}