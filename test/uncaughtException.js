var why = require("../lib/why.js");



process.on('uncaughtException', function (error) {
    console.log(error.stack);

});

function f(){
    console.log("Throwing...");
}


function flow(){
    setTimeout.why("sdgds")(f.why("Call setTimeout 100"), 1000);
    throw new Error("Error");
}


flow.why("Start the flow ")();

