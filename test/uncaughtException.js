var why = require("whys");



process.on('uncaughtException', function (error) {
    console.log(error.stack);

});

function f(){
    console.log("Throwing...");
    throw new Error("Error");
}


function flow(){
    throw new Error("Error");
    setTimeout(f.why("Call setTimeout 100"), 1000);
}


flow.why("Start the flow ")();

