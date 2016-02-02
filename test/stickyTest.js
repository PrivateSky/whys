var assert = require("double-check").assert;
var logger = require("double-check").logger;
var why = require("../lib/why.js");


var asyncExample = function (callback){

    setTimeout(callback, 100);
}


nop = function (){

}.why("nop");

assert.callback("Test example", function(end){
    logger.logWhy = function(){
        var dump = why.dump();
        //console.log(dump);
        assert.equal(dump.history.length, 2); //all the calls with identical arguments, get sticky
        assert.equal(dump.history[0].step, " not\nwhy\nnop");
        assert.equal(dump.history[1].step, "Test");
        end();
    }
    //nop.why("Why1").why("Why2")(100);
    nop.why("why").why(" not")(1000);
}.why("Test"));