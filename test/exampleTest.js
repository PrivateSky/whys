var assert = require("semantic-firewall").assert;
var logger = require("semantic-firewall").logger;
var why = require("../lib/why.js");


logger.record = function(record){
    console.log(JSON.stringify(record));
}

function func(callback){
    callback(null, why.dump());
};


assert.callback("Test example", function(end){
    func.why("Demonstrate attaching descriptions to future calls")( function(err, result){
        console.log(result);
        assert.equal(result.stack.length, 1);
        end();
    });
}.why("Attach another description"));