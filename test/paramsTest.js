var assert = require("semantic-firewall").assert;
var why = require("../lib/why.js");


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

        assert.equal(result.whystack.length, 4);
        end();
    });
}.why(" Test with true argument"));




assert.callback("Test with false argument", function(end){
    f2.why("Forced context")(false, function(err, result){
        //console.log(result);
        console.log(JSON.stringify(result));
        assert.equal(result.whystack.length, 3);
        //assert.equal(result, "abcd");
        end();
    });
});

