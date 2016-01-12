
/* why Function prototype implementation*/

if(typeof singleton_why_module_workaround_for_wired_node_js_caching == 'undefined') {
    singleton_why_module_workaround_for_wired_node_js_caching = module;
} else {
    module.exports = singleton_why_module_workaround_for_wired_node_js_caching.exports;
    return;
}


var enableLogs = false;

var sf = require("semantic-firewall");
var check = sf.check;
var logger  = sf.logger;



function TrackingItem(str, args, otherContextInfo){
    var a = [];
    for(var i = 0; i < args.length; i++){
        try{

            if(args[i] && args[i].constructor === Function){
                a.push('function');
            } else {
                if(JSON.stringify(args[i])){
                    a.push(args[i]);
                }
            }
        } catch(err){
            //console.log(err);
            a.push("UNKNOWN")
        }
    }
    return {step:str, args:a, other:otherContextInfo};
}

var currentContext = null;

function TrackingContext(){
    var trackingContext = [];
    var contextHistory = [];
    this.exceptionContextSource = undefined;

    if(enableLogs) console.log("Creating a new context...");

    this.push = function(item){
        if(enableLogs) console.log("Push ",trackingContext.length, contextHistory.length, item.step );
        trackingContext.unshift(item);
    }

    this.pop = function(item){

        var item =  trackingContext.shift(item);
        if(enableLogs) console.log("Pop ",trackingContext.length, contextHistory.length, item.step );
        contextHistory.push(item);

    }

    this.topLevel = function(){
        return trackingContext.length == 0;
    }

    this.print = function(){
        console.log("Execution context:");
        trackingContext.forEach(function(item){
            console.log("\t",item.step);
        })
    }

    this.dump = function(text, err){
         var ret = {
            whystack:trackingContext,
            history:contextHistory,
            exceptionContextSource: this.exceptionContextSource
        }

        if(text){
            ret.description = text;
        }

        if(err){
            ret.err = err;
        }

        if(this.exceptionContextSource){
            ret.exceptionContextSource = this.exceptionContextSource;
        }
        return ret;
    }
}


var whyExternalBinder = null;
module.exports.recordExternalBinder = function(f){
    whyExternalBinder = f;
}


Function.prototype.why = function(description, otherContextInfo, skipExternalBinder){
    var self = this;
    var savedContext = currentContext;
    var whyFunc = function(){
        if(!currentContext){
            if(savedContext){
                currentContext = savedContext;
            } else {
                currentContext = new TrackingContext();
            }
        }

        try {
            currentContext.push(new TrackingItem(description, arguments, otherContextInfo));
            var ret = self.apply(this, arguments);
            currentContext.pop();
        } catch(err) {
            if(!currentContext.exceptionContextSource){
                currentContext.exceptionContextSource = description;
            }
            currentContext.pop();
            if(!currentContext.topLevel()){
                throw err;
            }  else {
                try{
                    logger.error("Unexpected exception thrown outside of the why context ", err, arguments, 0,currentContext.dump());
                }catch(nerr){
                    console.log("Failed to log this error. Probably missing the logsCore.record function. Original error:", err, err.stack,nerr )
                }
            }
        }

        if(currentContext.topLevel()){
            if(enableLogs) console.log("Clearing context...");
            currentContext = null;
        }
        return ret;
    }

    if(!skipExternalBinder && whyExternalBinder){
        return whyExternalBinder(whyFunc);
    } else {
        return whyFunc;
    }
};


module.exports.printContext = function(){
    currentContext.print();
}

module.exports.dumpText = function(){
    var obj = currentContext.dump();
    console.log(JSON.stringify(obj));
}

module.exports.dump = function(){
    if(currentContext){
        return currentContext.dump();
    } else {
        return {};
    }
}


///////////////////////////////

