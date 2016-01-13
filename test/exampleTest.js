var assert = require("semantic-firewall").assert;
var logger = require("semantic-firewall").logger;
var why = require("../lib/why.js");


logger.record = function(record){  //you have to integrate with your own logging system by overriding this functions
   console.log("Failed assert:",JSON.stringify(record));
}

function nop(){  //do nothing but can be recorded in the why history

}

function func(callback){
    nop.why("Nop recording")();
    callback(null, why.dump());   // why.dump() takes the current execution context
};


assert.callback("Test example", function(end){
    func.why("Demonstrate attaching descriptions at runtime")( function(err, result){
        console.log(result);
        assert.equal(result.whystack.length, 3);
        end();
    }.why("Callback for func"));
}.why("Test callback"));
