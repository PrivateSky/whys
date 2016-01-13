var assert = require("semantic-firewall").assert;
var logger = require("semantic-firewall").logger;
var why = require("../lib/why.js");


var asyncExample = function (callback){

    setTimeout(callback, 100);
}



logger.record = function(record){
   console.log("Recording failed assert:",record.data.whystack, record.stack);
}

function nop(){

}

function func(callback){
    nop.why("Nop something")();

    asyncExample.why("AsyncExample call")(function(){
        callback(null, why.dump())
        }.why("Anonymous callback "));
}



assert.callback("Test example", function(end){
    func.why("Demonstrate attaching descriptions to future calls")( function(err, result){
        //console.log(result);
        assert.notequal(result.whystack, null);
        assert.equal(result.whystack.length, 2);
        end();
    }.why("Test callback"));
}.why("Attach test description"));