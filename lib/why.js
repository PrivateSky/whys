/* why Function prototype implementation*/


var logger = require('double-check').logger;

logger.addCase("dumpWhys", function(){
    return exports.getAllContexts();
    
});

function newTrackingItem(motivation,caller){
    return {
        step:motivation,
        parent:caller,
        children:[],
        id:caller.context.getNewId(),
        context:caller.context,
        indexInParentChildren:caller.hasOwnProperty('children')?caller.children.length:0
    };
}

var contexts = [];

var globalCurrentContext = null;

exports.getGlobalCurrentContext = function(){
    if(process.env['RUN_WITH_WHYS']) {
        return globalCurrentContext;
    }
    else{
        throw new Error('Why is not activated\nYou must set env variable RUN_WITH_WHYS to true to be able to use whys')
    }
}

exports.getAllContexts = function(){
    return contexts;
}


function onTermination(){
    if(process.env['RUN_WITH_WHYS']) {
        var process_summary = exports.getAllContexts().map(function(context) {return context.getExecutionSummary()})

        if(process.send){
            linkWithParentProcess();
        }else{
            logger.dumpWhys();
        }
    }
    function linkWithParentProcess(){
        process.send({"whyLogs":process_summary})
    }
}

process.on('exit', onTermination);


function TrackingContext(){
    var self = this;
    var lastId = 0;
    this.getExecutionSummary = function(){
        var summary = {}
        self.startingPoint.children.forEach(function(child){
            summary[child.step] = getNodeSummary(child);
        })

        function getNodeSummary(node){
            if(node['summary']){
                //this node is already a summarized ( it was executed in another process)
                return node['summary'];
            }
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
    this.getNewId = function(){return lastId++}
    this.currentRunningItem = newTrackingItem("Context starter",{context:self});
    this.startingPoint = this.currentRunningItem;
    contexts.push(this);
}

var globalWhyStackLevel = 0;

Function.prototype.why = function(motivation, caller,otherContextInfo, externalBinder){
    if(!process.env["RUN_WITH_WHYS"]){
        return this;
    }
    var self = this;
    var newContext = false;
    var thisItem;
    linkToContext();


    var whyFunc = function(){
        updateContext(thisItem);
        addArgs(arguments,thisItem);
        attatchStackInfoToItemWHY(thisItem,newContext,globalWhyStackLevel);
        resolveEmbeddingLevel(thisItem);
        var result = executeWHYFunction(self,thisItem,arguments);
        //maybeLog(globalCurrentContext);
        returnFromCall(thisItem);
        return result
    }

    return whyFunc;

    function linkToContext(){
        if(!caller){
            if (globalWhyStackLevel === 0) {
                globalCurrentContext = new TrackingContext();
                newContext = true;
            }
            thisItem = newTrackingItem(motivation, globalCurrentContext.currentRunningItem);
            globalCurrentContext.currentRunningItem.children.push(thisItem);
        }
        else{
            thisItem = newTrackingItem(motivation,caller);
            caller.children.push(thisItem);
        }
    }

    function attatchStackInfoToItemWHY(item,newContext,globalWhtStackLevel) {
        var stack = new Error().stack.split("\n");

        stack.shift();

        stack = dropLinesMatching(stack, ["WHY"]);

        item.whyEmbeddingLevel = getWhyEmbeddingLevel(stack);
        item.stack = getRelevantStack(item, stack);
        item.isCallback = (globalWhyStackLevel === item.whyEmbeddingLevel - 1) && (!newContext);


        function getWhyEmbeddingLevel(stack) {
            var whyEmbeddingLevel = 0;
            stack.some(function (stackLine) {
                if (stackLine.match("whyFunc") !== null || stackLine.match("at whyFunc") !== null) {
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
                var whyMatches = ["whyFunc"];
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

    function addArgs(args,item){
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
        item.args = a;
    }

    function updateContext(item){
        globalCurrentContext = item.context;
        globalCurrentContext.currentRunningItem = item;
    }

    function executeWHYFunction(func,item,args) {
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
            if(exception.logged!==true){
                var error = {
                    'exception':exception,
                    'logged':true
                }
                item['exception'] = error;
                item.done = true;
                globalCurrentContext.currentRunningItem = item.parent;
            }
            throw error;
        }
        return item.result;
    }

    function returnFromCall(item){
        globalCurrentContext.currentRunningItem = item.parent;
    }

    function maybeLog(context){
        if(globalWhyStackLevel === 0){
            logger.logWhy(context.getExecutionSummary());
        }
    }
};


/*
    When launching child processes that run with WHYS you might want to get those logs and integrate in
    the context of the parent process
 */
exports.linkWhyContext = function(childProcess,stepName){
    var onMessage = undefined;
    if(!childProcess._events['message']){
        console.log("Callbacks for 'message' event must be registered before linking with the why context!")
    }else{
        onMessage = childProcess.events['message']
    }

    
    var callingPoint = exports.getGlobalCurrentContext().currentRunningItem;
    childProcess.on('message',function(message){
        if(onMessage) {
            onMessage(message);
        }
        
        if(message['whyLogs']){
            message['whyLogs'].forEach(function(contextSummay) {
                callingPoint.children.push({"step":stepName,'summary':contextSummay})
            })
        }
    })
}
