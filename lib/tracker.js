
var sf = require("semantic-firewall");
var check = sf.assert;

function TrackingItem(str, args){
    return {step:str, args:args};
}

var currentContext = null;

function TrackingContext(){
    var trackingContext = [];
    var contextHistory = [];
    this.exceptionContextSource = null;

    this.push = function(item){
        trackingContext.unshift(item);
    }

    this.pop = function(item){
        var item =  trackingContext.shift(item);
        contextHistory.push(item);
        if(trackingContext.length == 0){
            currentContext = null;
        }
    }

    this.print = function(){
        console.log("Execution context:");
        trackingContext.forEach(function(item){
            console.log("\t",item.step);
        })
    }

    this.dump = function(text, err){
        console.log(text, err);
        if(err){
            console.log(">>>Local stack:", err.stack);
        }
        console.log(">>>Contexts Stack:");
        trackingContext.forEach(function(item){
            console.log("\t",item.step);
        })

        console.log(">>>History Stack:");
        contextHistory.forEach(function(item){
            console.log("\t",item.step);
        })

        if(this.exceptionContextSource){
            console.log(">>>Exception generated in:",this.exceptionContextSource);
        }
    }
}


function mkArgs(myArguments, from){
    if(myArguments.length <= from){
        return [];
    }
    var args = [];
    for(var i = from; i < myArguments.length; i++){
        args.push(myArguments[i]);
    }
    return args;
}

Function.prototype.why = function(goalText){
    var self = this;
    return function(){
        try {
            currentContext.push(new TrackingItem(goalText, arguments));
            var ret = self.apply(this, arguments);
            currentContext.pop();
        } catch(err) {
            currentContext.pop();
            if(!currentContext.exceptionContextSource){
                currentContext.exceptionContextSource = goalText;
            }
            throw err;
        }
        return ret;
    }
}

Function.prototype.goal = function(description){
    var self = this;
    return function(){
        try {
            check.equal(currentContext, null, "TRACKER: \'goal'\ got called inside of an unfinished goal, aborting execution");
            currentContext = new TrackingContext();
            currentContext.push(new TrackingItem(description, arguments));
            var ret = self.apply(this, arguments);
            currentContext.pop();
        } catch(err) {
            if(!currentContext.exceptionContextSource){
                currentContext.exceptionContextSource = description;
            }
            currentContext.dump("Unexpected exception in context ", err);
            currentContext.pop();
        }
        return ret;
    }
};



function asyncExample(callback){
    setTimeout(callback, 1000);
}




Function.prototype.Async = function(){
    var self = this;
    var currentTrackingContext = currentContext;
    return function(){
        check.equal(currentContext, null, "TRACKER: \'goal'\ got called inside of an unfinished goal");
        currentContext = currentTrackingContext;
        try{
            var ret = self.apply(this,mkArgs(arguments, 0));
        } catch(err){
            //report.exception(err);
        }
        return ret;
    }
};


module.exports.printContexts = function(){
    currentContext.print();
}


///////////////////////////////

var f1 = function(){
    throw new Error("Test error");
    module.exports.dumpContexts();
}.why("Call f1");


var f2 = function(){
    f1();
}.why("Call f2");



f2.goal("Show demo")();


