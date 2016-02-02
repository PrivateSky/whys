var assert = require("double-check").assert;
var why = require("../lib/why.js");
var logger = require("double-check").logger;

logger.logWhy = function(){
}

function nop(){

}

var f1 = function(callback){
    //throw new Error("Test error");
    nop.why("Nop for history")();
    callback(null, why.dump());
}.why("Call f1");


var f2 = function(flag, callback){
    f1(callback);
}.why("Call f2");



assert.callback("Test with true argument", function(end){
    f2.why("Forced context")(true, function(err, result){

        assert.equal(result.whystack.length, 3);
        end();
    });
}.why(" Test with true argument"));




assert.callback("Test with false argument", function(end){
    f2.why("Forced context")(false, function(err, result){
        //console.log(JSON.stringify(result));
        assert.equal(result.whystack.length, 2);
        //assert.equal(result, "abcd");
        end();
    });
});

