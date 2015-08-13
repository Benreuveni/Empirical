/**
 * Created by drlemur on 8/3/2015.
 */

preload_state=0;
preload_start=window.performance.now();

function preload_draw(){
    if(this.preload_state==0){
        ServerHelper.request_config(sessionToken);
        preload_state=1;
    } else if(this.preload_state==1){
        if(ServerHelper.config_received){
            preload_state=2;
            parse_config();
            cfg_adjust();
        }
    } else if(preload_state==2){
        preload_images();
        preload_state=3;
    } else if(preload_state==3) {
        if (config_parsed) { // don't continue until ready
            // put config into the response log to start
            response_log.push("SISL.js Version: " + _version);
            response_log.push("Source URL: " + document.URL);
            response_log.push("Run on " + new Date());
            response_log.push("");
            for (key in cfg) {
                response_log.push(key + ": " + cfg[key]);
            }
            response_log.push("##########");

            preload_state = 4;
        }
    } else if(preload_state==4) {
        ServerHelper.request_status();
        preload_state=5;
    } else if(preload_state==5) {
        if(ServerHelper.status_received) {
            console.log("Status received");
            window.cancelAnimationFrame(requestId);       // remove preload_draw redraw loop
            console.log("status: "+ServerHelper.status);  // parse to see if this session is already in progress
            // Switch to main draw
            requestId = window.requestAnimationFrame(draw);
            return;
        }
    }

    var elap=Math.floor((window.performance.now()-preload_start)/100.0); // 10ths of seconds since start
    ctx.clearRect(0,0, 600, 600);
    ctx.font = "24px Arial";
    ctx.fillStyle='black';
    ctx.textAlign="center";
    ctx.fillText("Preload "+preload_state.toString()+' '+(elap/10.0).toString(),300,300); //
    requestId = window.requestAnimationFrame(preload_draw);
}

function preload_experiment(){
    preload_state=0;
    preload_start=window.performance.now();
    requestId=window.requestAnimationFrame(preload_draw);
}

// preloads the images -- but doesn't actually wait for load (to do: add waiting)
function preload_images(){
    var img_name_list=[];
    var im = new Image();

    ServerHelper.image_url+="sisl_images/"; // this could be drawn from config file here

    for(var i=0;i<session.length;i++) {
        if(session[i][0]=='Break:' && !contains(session[i][1],img_name_list)){
            img_name_list.push(session[i][1]);
        }
    }
    for(i=0;i<img_name_list.length;i++){
        im = new Image();
        im.src = ServerHelper.image_url+img_name_list[i];
        images[img_name_list[i]]=im;
    }
    // check if all loaded before starting
}



// SISL specific cfg processing and translation from .py coordinates (PsychoPy) to .js (canvas HTML5)

var cfg_strings=['key_list','letter_color', 'feedback', 'feedback_remove_cue', 'progress_bar', 'fixation_info', 'results_file']; // config tokens not to be converted to numbers
var cfg_colors=['background_color','cue_colors','target_color','letter_color','feedback_pos_color','feedback_neg_color']; // fixation

// .cfg parameters not yet processed
//   fixation point
//   progress bar
//   port codes will not be supported


// utilities for parse_config, contains and hex translation for colors
function contains(s,string_list){
    for(var i=0;i<string_list.length;i++){
        if (string_list[i]==s) {
            return(true);
        }
    }
    return(false);
}

function dec2hex(dec){
    hex=Number(parseInt(dec,10)).toString(16);
    if(hex.length==1) return("0"+hex);
    return(hex);
}

function convert_colors(tokens){
    var color_list=[];
    for(var i=0; i<tokens.length; i++) {
        // color format possibilities -- #aabbcc, color-name or 3 floats [-1.0,1.0]
        r=parseFloat(tokens[i]);
        if (r==NaN) {
            color_list.push(tokens[i]);
        } else {
            r=(r+1.0)*127.5;
            if (tokens.length > (i + 1)) {
                i++;
                g = (parseFloat(tokens[i])+1.0)*127.5;
                i++;
                b = (parseFloat(tokens[i])+1.0)*127.5;
            }
            else {
                g=r; b=r;
            }
            // scale from [-1.0, 1.0] to [#00, FF]
            color='#'+dec2hex(r)+dec2hex(g)+dec2hex(b);
            color_list.push(color);
        }
    }
    return(color_list);
}

// sets up the cfg array, which is global
function parse_config() {
    var config=ServerHelper.config_file;
    var j=0;
    var t=[];
    var args=[];
    var a='';
    var in_session_struct=false;

    if(config_parsed){  // don't re-parse if already loaded
        return;
    }

    // some initial cfg settings; should probably scale to window size; also set within SISL.html
    var canvas = document.getElementById("mainWin");
    cfg['text_height']=20;
    cfg['text_size']=18;
    cfg['height']=canvas.height;
    cfg['width']=canvas.width;

    // parse config
    var lines = config.split('\n');
    for (var i=0;i<lines.length;i++) {
        t=lines[i].trim().split(' ');
        if (lines[i][0]!='#' && t.length>0 && t[0].trim()!='') {
            args=[];
            if(t[0]=='session_begin{'){
                in_session_struct=true;
                // add preload images as the first session structure state
                session.push(["Preload:"]);
            }
            else if(t[0]=='}session_end') {
                in_session_struct = false;
            }
            else if(in_session_struct){
                // if in session struct, trim all the arguments and add to session structure list
                for(j=0;j<t.length;j++){
                    a=t[j].trim();
                    if(a.length>0) args.push(a);
                }
                session.push(args);
            }
            else { // otherwise add to cfg object
                if (contains(t[0], cfg_strings)) { // don't convert the parameters to numbers, keep as strings
                    for (j = 1; j < t.length; j++) {
                        a = t[j].trim();
                        if (a.length > 0) {
                            if (a.length == 1) args.push(a.toUpperCase()); // convert single keys to uppercase
                            else args.push(a);
                        }
                    }
                } else if (contains(t[0], cfg_colors)) {
                    args = convert_colors(t.slice(1)); // parse color information
                } else { // convert to numbers
                    for (j = 1; j < t.length; j++) args.push(Number(t[j].trim()));
                }
                // add args to cfg object, appending if this key already exists
                if (cfg.hasOwnProperty(t[0])) cfg[t[0]] = cfg[t[0]].concat(args);
                else {
                    if (args.length == 1) cfg[t[0]] = args[0]; // if only one value, don't store as list
                    else cfg[t[0]] = args;
                }
            }
        }
    }

    // parse session structure separately
    config_parsed=true;
}


function cfg_adjust(){ // modify parameters from PsychoPy structure to browser coordinates
    // Fill in z parameters if missing
    if(cfg.hasOwnProperty('start_z')==false){
        cfg['start_z']=[];
        cfg['delta_z']=[];
        cfg['target_z']=[];
        for (i=0;i<cfg['num_keys'];i++) {
            cfg['start_z'].push(100);
            cfg['delta_z'].push(0);
            cfg['target_z'].push(100);
        }
    }

    // convert coordinate frame from PsychoPy to browser
    var scale=0.6;
    cfg['cue_size']=cfg['cue_size']*0.5*scale;
    cfg['target_diameter']=cfg['target_diameter']*0.5*scale;
    cfg['letter_size']=cfg['letter_size']*scale;
    for (var i=0;i<cfg['num_keys'];i++) {
        cfg['start_x'][i]=(cfg['start_x'][i]+cfg['width']/2.0)*scale;
        cfg['target_x'][i]=(cfg['target_x'][i]+cfg['width']/2.0)*scale;
        cfg['delta_x'][i]=cfg['delta_x'][i]*scale;
        cfg['delta_y'][i]=cfg['delta_y'][i]*-1*scale;
        cfg['start_y'][i]=(cfg['height']/2.0-cfg['start_y'][i])*scale;
        cfg['target_y'][i]=(cfg['height']/2.0-cfg['target_y'][i])*scale;
        cfg['letter_x'][i]=(cfg['letter_x'][i]+cfg['width']/2.0)*scale;
        cfg['letter_y'][i]=(cfg['height']/2.0-cfg['letter_y'][i])*scale;
    }

    // font placement correction (or center?)
    for(i=0;i<cfg['num_keys'];i++){
        cfg['letter_y'][i]=cfg['letter_y'][i]+cfg['letter_size']*2.0;
    }

    // use cfg['code_map'] to remap the cue_pattern to 0-index
    if (cfg.hasOwnProperty('code map')){
        for(i=0;i<cfg['cue_pattern'].length;i++) {
            cfg['cue_pattern'][i]=cfg['code map'][cfg['cue_pattern']];
        }
    } else { // if no code map, assume 1-indexed for historical reasons
        for(i=0;i<cfg['cue_pattern'].length;i++) {
            cfg['cue_pattern'][i]-=1;
        }
    }

    // variable overrides for testing
    cfg['speed_fraction']=[10,11];
    cfg['feedback_remove_cue']='none';
    cfg['check_every']=5;
    cfg['on_screen_feedback']=['speed','speed_info','seq_correct','foil_correct','seq_pc','foil_pc','streak','longest_streak','sspa','fps'];
}


