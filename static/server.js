/**
 * Created by drlemur on 8/5/2015.
 */

// parse sessionToken from document.URL

var ServerHelper = {
    server_url: "http://127.0.0.1:8000/exp/",
    image_url: "http://127.0.0.1:8000/images/", // it might be more flexible to allow this to be set in the cfg file
    xmlhttp: new XMLHttpRequest(),
    config_file: "",
    error: "",
    response_log: "",
    status: "",
    config_requested: false,
    config_received: false,
    upload_requested: false,
    data_logged: false,
    upload_in_progress: false,
    upload_queue: [],

    request_config: function(sessionToken){                          // retrieve config file from server
        if(this.config_requested){
            console.log("Multiple calls to config request");
            return;
        }
        this.sessionToken=sessionToken;
        url=this.server_url+'start/'+this.sessionToken;
        this.xmlhttp.addEventListener('load',this.get_config);
        this.xmlhttp.open("GET",url,true);
        this.xmlhttp.send();
        this.config_requested=true;
    },

    get_config: function() { // this function needs to reference the ServerHelper object directly, 'this.' doesn't work b/c called as event?
        if (ServerHelper.config_received) {
            console.log("Multiple calls to config received");
            return;
        }
        if (ServerHelper.xmlhttp.readyState == 4) {
            ServerHelper.config_received = true;
            if (ServerHelper.xmlhttp.status == 200) {
                ServerHelper.config_file = ServerHelper.xmlhttp.responseText;
            } else {
                ServerHelper.error = ServerHelper.xmlhttp.statusText;
            }
        }
    },

    request_status: function() {
        this.sessionToken=sessionToken;
        url=this.server_url+'status/'+this.sessionToken;
        this.xmlhttp = new XMLHttpRequest();
        this.xmlhttp.addEventListener('load',this.get_status);
        this.xmlhttp.open("GET",url,true);
        this.xmlhttp.send();
    },

    get_status: function() {
        if (ServerHelper.xmlhttp.readyState == 4) {
            ServerHelper.status_received=true;
            if (ServerHelper.xmlhttp.status == 200) {
                ServerHelper.status = ServerHelper.xmlhttp.responseText;
            } else {
                ServerHelper.error = ServerHelper.xmlhttp.statusText;
            }
        }
    },

    upload_data: function(event_type,response_log){            // start the upload process by requesting the form to get the csrf token
        // stringify response log
        data="";
        for(var i=0;i<response_log.length;i++){
            data=data+response_log[i]+"\n";
        }

        if(this.upload_in_progress) {
            // queue the next upload file
            this.upload_queue.push([event_type,data]);
            console.log('queued a '+event_type);
            return;
        }
        this.event_type=event_type;
        this.response_log=data;
        var url=this.server_url+'report/'+this.sessionToken;
        this.xmlhttp = new XMLHttpRequest();
        this.xmlhttp.addEventListener('load',this.upload_ready);
        this.xmlhttp.open("GET",url,true);
        this.xmlhttp.send();
        this.upload_in_progress=true;
    },

    upload_from_queue: function() {
        if(this.upload_queue.length==0) {
            this.upload_in_progress=false;
            return;
        }
        next_upload=this.upload_queue.pop();
        this.event_type=next_upload[0];
        this.response_log=next_upload[1];          // get the next element

        this.xmlhttp = new XMLHttpRequest();
        var url=this.server_url+'report/'+this.sessionToken;
        this.xmlhttp.addEventListener('load',this.upload_ready);
        this.xmlhttp.open("GET",url,true);
        this.xmlhttp.send();
        //console.log("Getting from queue "+this.event_type);
    },

    upload_ready: function() { // or just xmlhttp post?
        if (ServerHelper.xmlhttp.readyState != 4) {
            console.log("Server state "+ServerHelper.xmlhttp.readyState.toString());
            return;
        } else if(ServerHelper.xmlhttp.status != 200) { // form request didn't work... should recover
            console.log("upload error");
            terminate(ServerHelper.xmlhttp.statusText);
        }

        // find csrf token
        //console.log("form response "+ServerHelper.xmlhttp.responseText);
        token_loc = ServerHelper.xmlhttp.responseText.search("csrfmiddlewaretoken");
        if(token_loc<0) {
            console.log(ServerHelper.xmlhttp.responseText);
        }
        else csrf_token = ServerHelper.xmlhttp.responseText.slice(token_loc).match("value=\'([^\']*)'")[1];

        var formData = new FormData();
        formData.append("csrfmiddlewaretoken", csrf_token);
        formData.append("eventType", ServerHelper.event_type);
        formData.append("sessionToken", ServerHelper.sessionToken);
        formData.append("dataLog", ServerHelper.response_log);

        ServerHelper.xmlhttp = new XMLHttpRequest();
        ServerHelper.xmlhttp.open("POST", ServerHelper.server_url + 'report/' + ServerHelper.sessionToken);
        ServerHelper.xmlhttp.send(formData);
        console.log("data sent "+ServerHelper.event_type)

        // if there is a queue, start the next upload
        if(ServerHelper.upload_queue!=[]) {
            ServerHelper.upload_from_queue();
        }
        else ServerHelper.upload_in_progress=false;
    },
}



