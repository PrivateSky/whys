/**
 * Created by ctalmacel on 3/9/16.
 */
var assert = require("double-check").assert;

var why = require("../lib/why.js");

process.env['RUN_WITH_WHYS'] = true;

assert.callback("Simple error generation why", function(end) {

    function caller(){
        try{
            errorGenerator.why("Generate an error")("errorArg");
        }
        catch(err)
        {
            errorTreater.why("Error treatment")(err);
            setTimeout(testExecution,10)
        }
    }

    function testExecution(){
        var executionSummary = why.getGlobalCurrentContext().getExecutionSummary();



        assert.equal(executionSummary.hasOwnProperty("First Call"),true);
        assert.equal(executionSummary["First Call"].calls.hasOwnProperty('Generate an error'),true);
        assert.equal(executionSummary["First Call"].calls.hasOwnProperty('Error treatment'),true);
        assert.equal(executionSummary["First Call"].calls['Generate an error'].hasOwnProperty('exception'),true);
        assert.equal(executionSummary["First Call"].calls['Generate an error']['exception'].logged,true);
        end();
    }

    function errorGenerator(){
        throw new Error("Test error");
    }

    function errorTreater(err){
    }

    caller.why("First Call")();
})
