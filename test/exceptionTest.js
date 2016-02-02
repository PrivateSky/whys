var assert = require("double-check").assert;
var why = require("../lib/why.js");

var logger = require("double-check").logger;

logger.logWhy = function(){
}


var f1 = function(callback){
    throw new Error("Test error");
    //callback(null, why.dump());
}.why("Call f1");


var f2 = function(flag, callback){
    f1(callback);
}.why("Call f2");


assert.callback("Test with exception", function(end){
    logger.record = function(record){
        //console.log(JSON.stringify(record));
        end();
    }

    f2.why("Forced context")(true, function(err, result){
        console.log("Should not be called!!!", result);
        assert.equal(result.whystack.length, 4);
        end();
    });
}.why(" Test with true argument"));
