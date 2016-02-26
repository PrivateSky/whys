
/* why Function prototype implementation*/


function addArgs(args,trackingItem){
    var a = [];
    for(var i = 0; i < args.length; i++){
        try{
                    a.push(JSON.stringify(args[i]));
        } catch(err){
            a.push("Unserializable argument of type "+typeof args[i]);
        }
    }
    trackingItem.args = a;
}

function newTrackingItem(motivation,caller,context){
    return {
        step:motivation,
        parent:caller,
        children:[],
        id:context.getNewId(),
        indexInParentChildren:caller.hasOwnProperty('children')?caller.children.length:0
    };
}


function dropRedundantStack(trackingItem){
    if(!trackingItem.hasOwnProperty("stack")){
        console.error(trackingItem+" does not have a stack field");
        return;
    }
    if(!trackingItem.hasOwnProperty("parent")){
        console.error(trackingItem+" does not have a parent field");
        return;
    }
    if(!trackingItem.parent.hasOwnProperty("stack")){
        return;
    }

    if(!trackingItem.isCallback) {
        var keep = true;
        var redundantStackLine = trackingItem.parent.stack[0];
        trackingItem.stack = trackingItem.stack.filter(function (stackLine) {
            if (stackLine === redundantStackLine) {
                keep = false;
            }
            return keep;
        })
    }
    else{
        trackingItem.stack = [];
        trackingItem.stack.push(trackingItem.parent.stack[0]);
        trackingItem.stack.push("       on callback");
    }

}

var globalCurrentContext = null;

function TrackingContext(){
    var self = this;
    var lastId = 0;

    this.dump = function(){
        console.log("Call tree:")
        print(self.startingPoint,"");
    }

    function print(contextNode,prefix){
        var newPrefix =prefix+"\t";
        console.log(newPrefix+contextNode.step);


        if(contextNode.step !=="Context starter"&& contextNode.hasOwnProperty('result')) {
            contextNode.stack.forEach(function (stackLine) {
                if(stackLine!=="Error")
                console.log(prefix + "  " + stackLine);
            });
            console.log("\n");

        }
        if(contextNode.hasOwnProperty('exception')){
            console.log(prefix+" Caught exception "+contextNode.exception)
        }
        contextNode.children.forEach(function(child){
            print(child,newPrefix);
        })
    }
    this.getNewId = function(){
        return lastId++;
    }
    this.currentRunningItem = newTrackingItem("Context starter","root",self);

    this.startingPoint = this.currentRunningItem;
    this.callsCounter = 0;

}

var globalWhyStackLevel = 0;

function getRelevantStackInfo(stack){
    var stackInfo = {
        whyEmbeddingLevel:0
    };
    stack = stack.split("\n");
    stack.shift(); // eliminate the error line
    var whyEmbeddingLevel = 0;
    stack.some(function(stackLine){
        if(stackLine.match("at whyFunc")!==null||stackLine.match("at Function.why.whyFunc")!==null) {
            stackInfo.whyEmbeddingLevel++;
            return false;
        }
        return true;
    })

    stackInfo.realStack = stack.filter(function(stackLine){
        if(stackLine.match("at Function.why.whyFunc")!==null || stackLine.match("at whyFunc")!==null){
            return false;
        }
        return true;
    })
    return stackInfo;
}

Function.prototype.why = function(motivation, otherContextInfo, externalBinder){
    var self = this;


    var newContext = false;
    if(globalWhyStackLevel === 0){
        globalCurrentContext = new TrackingContext();
        newContext = true;
    }

    var callerItem = globalCurrentContext.currentRunningItem;
    var callerContext = globalCurrentContext;
    var thisItem = newTrackingItem(motivation,callerItem,callerContext);
    callerItem.children.push(thisItem);

    var whyFunc = function(){
        globalCurrentContext = callerContext;
        globalCurrentContext.currentRunningItem = thisItem;
        globalCurrentContext.callsCounter++;

        try {
            var stackInfo = getRelevantStackInfo(new Error().stack);
            thisItem.stack = stackInfo.realStack;
            thisItem.whyEmbeddingLevel = stackInfo.whyEmbeddingLevel;
            thisItem.isCallback = (globalWhyStackLevel === stackInfo.whyEmbeddingLevel-1)&&(!newContext);
        }
        catch(err){}


        addArgs(thisItem,arguments);
        dropRedundantStack(thisItem);

        if(thisItem.isCallback ){
            // get the real parent of the callback
            var realCaller = undefined;
            var thisItemIndex;
            callerItem.children.some(function(possibleCaller,index){
                if(possibleCaller.id === thisItem.id){
                    return true;
                }
                if(possibleCaller.hasOwnProperty('result')){
                    realCaller = possibleCaller;
                }
            })
            if(realCaller === undefined){
                return;
            }
            realCaller.children.push((callerItem.children.splice(thisItem.indexInParentChildren,1))[0]);
            for(var ind = thisItem.indexInParentChildren;ind<callerItem.children.length;ind++){
                callerItem.children[ind].indexInParentChildren--;
            }

            callerItem = realCaller;
            thisItem.parent = realCaller;
            thisItem.indexInParentChildren = realCaller.children.length-1;
        }

        if(thisItem.whyEmbeddingLevel>1) {
            if(!thisItem.isCallback) {
                thisItem.step += " AND " + callerItem.children.splice(thisItem.indexInParentChildren + 1, 1)[0].step;
                for(var ind = thisItem.indexInParentChildren+1;ind<callerItem.children.length;ind++){
                    callerItem.children[ind].indexInParentChildren--;
                }
            }
            else{
                thisItem.step += " AND " + callerItem.children.splice(thisItem.indexInParentChildren - 1, 1)[0].step;
                for(var ind = thisItem.indexInParentChildren-1;ind<callerItem.children.length;ind++){
                    callerItem.children[ind].indexInParentChildren--;
                }
            }
        }


        try {
            globalWhyStackLevel++;
            thisItem.result = self.apply(this, arguments);
            globalCurrentContext.callsCounter--;
            globalWhyStackLevel--;
        }
        catch(exception) {
            if(!exception.hasOwnProperty('logged')) {
                thisItem.exception = exception;
                exception.logged = true;
            }
            globalCurrentContext.callsCounter--;
            throw exception;
        }

        if(globalCurrentContext.callsCounter === 0){
            console.log("Context terminated");
            globalCurrentContext.dump();
        }
        globalCurrentContext.currentRunningItem = callerItem;
        return thisItem.result;
    }

    return whyFunc;
};