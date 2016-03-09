/* why Function prototype implementation*/



function newTrackingItem(motivation,caller,context){
    return {
        step:motivation,
        parent:caller,
        children:[],
        id:context.getNewId(),
        context:context,
        indexInParentChildren:caller.hasOwnProperty('children')?caller.children.length:0
    };
}



var globalCurrentContext = null;
exports.getGlobalCurrentContext = function(){
    return globalCurrentContext;
}

function TrackingContext(){
    var self = this;
    var lastId = 0;

    this.errorOccured = false;

    this.dump = function(){
        console.log("Call tree:")
        print(self.startingPoint,"");
    }

    function print(contextNode,prefix){
        var newPrefix =prefix+"\t";


        if(contextNode.step ==="Context starter") {
            console.log(prefix+"Start");
            displayChildren(contextNode,newPrefix+"\t");
            return;
        }

        if(!contextNode.done){
            return;
        }


        console.log(prefix+contextNode.step);
        console.log(newPrefix + "Stack:");
        contextNode.stack.forEach(function (stackLine) {
            console.log(newPrefix + stackLine);
        });

        console.log(newPrefix+"Args: "+contextNode.args);

        if(contextNode.hasOwnProperty('exception')){
            console.log(newPrefix+"Exception caught:\n "+newPrefix+"\t"+contextNode.exception)
        }else{
            displayChildren(contextNode,newPrefix+"\t");
        }

        function displayChildren(node,prefix){
            if(node.children.length>0) {
                console.log(newPrefix + "Calls made:");
                node.children.forEach(function (child) {
                    print(child, prefix);
                })
            }
        }
    }

    this.getExecutionSummary = function(){
        var summary = {
            "root":self.startingPoint.step,
            "calls":{}
        }
        self.startingPoint.children.forEach(function(child){
            summary.calls[child.step] = getNodeSummary(child);
        })

        function getNodeSummary(node){
            var summary = {};
            summary.args = node.args;
            summary.stack = node.stack;
            if(node.exception){
                summary.exception = node.exception;
            }else{
                if(node.children.length>0){
                    summary.calls = {};
                    node.children.forEach(function(child){
                        summary.calls[child.step] = getNodeSummary(child);
                    })
                }
            }
            return summary;
        }

        return summary;
    }
    this.getNewId = function(){
        return lastId++;
    }
    this.currentRunningItem = newTrackingItem("Context starter","root",self);

    this.startingPoint = this.currentRunningItem;
}

var globalWhyStackLevel = 0;


Function.prototype.why = function(motivation, otherContextInfo, externalBinder){

    /*
     'why' will be activated by an environment variable
     The intent is to use 'why' during developement&debug only
     if(!process.env["runWithWhys"]){
     return this;
     }*/

    var self = this;
    var newContext = false;
    if(globalWhyStackLevel === 0){
        globalCurrentContext = new TrackingContext();
        newContext = true;
    }

    var thisItem = newTrackingItem(motivation,globalCurrentContext.currentRunningItem,globalCurrentContext);
    globalCurrentContext.currentRunningItem.children.push(thisItem);

    var whyFunc = function(){
        updateContext(thisItem);
        addArgs(arguments,thisItem);
        attatchStackInfoToItem(thisItem,newContext,globalWhyStackLevel);
        resolveEmbeddingLevel(thisItem);
        var result = executeWhyFunction(self,thisItem,arguments);
        maybeDump(globalCurrentContext);
        returnFromCall(thisItem);
        return result
    }
    return whyFunc;


    function attatchStackInfoToItem(item,newContext,globalWhtStackLevel) {
        var stack = new Error().stack.split("\n");


        stack.shift();
        stack.shift(); //remove the 'error' and 'attatchStackInfoToItem' lines from stack

        stack = dropLinesMatching(stack, ["executeWhyFunction"]);

        item.whyEmbeddingLevel = getWhyEmbeddingLevel(stack);
        item.stack = getRelevantStack(item, stack);
        item.isCallback = (globalWhyStackLevel === item.whyEmbeddingLevel - 1) && (!newContext);


        function getWhyEmbeddingLevel(stack) {
            var whyEmbeddingLevel = 0;
            stack.some(function (stackLine) {
                if (stackLine.match("at whyFunc") !== null || stackLine.match("at Function.whyFunc") !== null) {
                    whyEmbeddingLevel++;
                    return false;
                }
                return true;
            })
            return whyEmbeddingLevel;
        }

        function getRelevantStack(trackingItem, stack) {
            if (trackingItem.isCallback) {
                stack = [];
                stack.push(trackingItem.parent.stack[0]);
                stack.push("       After callback");
                return stack;
            }
            else {
                if (!trackingItem.parent.hasOwnProperty("stack")) {
                    return dropWhysFromStack(stack);
                }
                var keep = true;
                var firstRedundantStackLine = trackingItem.parent.stack[0];

                return dropWhysFromStack(stack.filter(function (stackLine) {
                    if (stackLine === firstRedundantStackLine) {
                        keep = false;
                    }
                    return keep;
                }))
            }
            function dropWhysFromStack(stack) {
                var whyMatches = ["at Function.whyFunc", "at whyFunc"];
                return dropLinesMatching(stack, whyMatches);
            }
        }

        function dropLinesMatching(stack, lineMatches) {
            return stack.filter(function (stackLine) {
                var ret = true;
                lineMatches.forEach(function (lineMatch) {
                    if (stackLine.match(lineMatch) !== null) {
                        ret = false;
                        return true;
                    }
                    return false;
                })
                return ret;
            })
        }
    }

    function resolveEmbeddingLevel(item){
        if(item.whyEmbeddingLevel>1) {
            item.step += " AND " + item.parent.children.splice(item.indexInParentChildren +1, 1)[0].step;
            item.parent.children.forEach(function(children){
                if(children.indexInParentChildren>item.indexInParentChildren){
                    children.indexInParentChildren--;
                }
            })
        }
    }

    function addArgs(args,trackingItem){

        var a = [];
        for(var i = 0; i < args.length; i++){
            if(typeof args[i] === "function"){
                a.push("function");
                continue;
            }

            try{
                a.push(JSON.stringify(args[i]));
            } catch(err){
                a.push("Unserializable argument of type "+typeof args[i]);
            }
        }
        trackingItem.args = a;
    }

    function updateContext(item){
        globalCurrentContext = item.context;
        globalCurrentContext.currentRunningItem = item;
    }

    function executeWhyFunction(func,item,args) {
        var previousGlobalWhyStackLevel = globalWhyStackLevel;
        try {
            globalWhyStackLevel++;
            item.result = func.apply(func, args);
            item.done = true;
            globalWhyStackLevel--;
            return item.result;
        }
        catch (exception) {
            globalWhyStackLevel = previousGlobalWhyStackLevel;
            if(!exception.logged){
                exception.logged = true;
                item.exception = exception;
                item.done = true;
                globalCurrentContext.currentRunningItem = item.parent;
            }
            throw exception;
        }
        return item.result;
    }

    function returnFromCall(item){
        globalCurrentContext.currentRunningItem = item.parent;
    }

    function maybeDump(context){
        if(globalWhyStackLevel === 0){
            console.log(JSON.stringify(context.getExecutionSummary(),null,4));
        }
    }
};

/*
 could be used to link callbacks to the async calls
 for now we will link callbacks to the functions in which the async calls were made
 function resolveCaller(thisItem) {
 //Find the real caller of callback (if that's the case)
 if(!thisItem.isCallback){
 return;
 }
 var realCaller = undefined;
 var thisItemIndex;
 callerItem.children.some(function (possibleCaller, index) {
 if (possibleCaller.id === thisItem.id) {
 return true;
 }
 if (possibleCaller.hasOwnProperty('result')) {
 realCaller = possibleCaller;
 }
 })
 if (realCaller === undefined) {
 return;
 }
 realCaller.children.push((callerItem.children.splice(thisItem.indexInParentChildren, 1))[0]);
 for (var ind = thisItem.indexInParentChildren; ind < callerItem.children.length; ind++) {
 callerItem.children[ind].indexInParentChildren--;
 }
 callerItem = realCaller;
 thisItem.parent = realCaller;
 thisItem.indexInParentChildren = realCaller.children.length - 1;
 }
 */