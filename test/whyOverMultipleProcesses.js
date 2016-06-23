/**
 * Created by ciprian on 27.05.2016.
 */
var whys = require('whys')
var forker = require('child_process');
var assert = require("double-check").assert;

process.env["RUN_WITH_WHYS"] = true

assert.callback("Test why over multiple processes",function(end) {

    function startWorkers() {
        var worker1 = forker.fork(__dirname + "/whyWithCallback.js", {"silent": false});
        whys.linkWhyContext(worker1, "worker1")

        var worker2 = forker.fork(__dirname + "/whyWithError.js", {"silent": false});
        whys.linkWhyContext(worker2, "worker2")

        var worker3 = forker.fork(__dirname + "/syncAsyncWhyEmbeddings.js", {"silent": false});
        whys.linkWhyContext(worker3, "worker3")

        var worker4 = forker.fork(__dirname + "/synchronousWhy.js", {"silent": false});
        whys.linkWhyContext(worker4, "worker4")

        var worker5 = forker.fork(__dirname + "/syncWhyEmbeddings.js", {"silent": false});
        whys.linkWhyContext(worker5, "worker5")
    }



    startWorkers.why("Start tests")();
    setTimeout(performTest,1000)

    function performTest(){
        var executionSummaryCalls = whys.getGlobalCurrentContext().getExecutionSummary()['Start tests']['calls'];
        assert.equal(executionSummaryCalls.hasOwnProperty("worker1"),true);
        assert.equal(executionSummaryCalls.hasOwnProperty("worker2"),true);
        assert.equal(executionSummaryCalls['worker1'].hasOwnProperty("First Call"),true);
        assert.equal(executionSummaryCalls['worker2'].hasOwnProperty("First Call"),true);
        end();
    }
},2000)


