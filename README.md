# tracker
why module provides a novel method for tracking errors and for tracking execution of complex asynchrounous Java Script (node.js code).
 This library is created for helping debugging of complex SwarmESB systems but it can be used in other projects. 

The why module works by adding a why function the the Function prototype. Basically for every call of an "important" function you can explain "why" that function get called
 
For example you can do things like:
 
 Example 1:
 
    var a = function().why("Because i want so"); // a will be a function but at each call the why subsystem will know why it got called
  
 Example 2:
  
    function async(function(){}.why("Because this is a callback and asynchronously called sometimes");
 
 Example 3:
 
     function f(){}
     f.why("Specific call of f")();
 

Commented example:

    var assert = require("semantic-firewall").assert;
    var logger = require("semantic-firewall").logger;
    var why = require("../lib/why.js");
    
    
    logger.record = function(record){ //you have to integrate with your own logging system by overriding this functions
       console.log("Failed assert:",JSON.stringify(record));
    }
    
    function nop(){  //do nothing but shown in the why history
    
    }
    
    function func(callback){
        nop.why("For something")();
        callback(null, why.dump()); // take current execution context
    };
    
    
    assert.callback("Test example", function(end){
        func.why("Demonstrate attaching descriptions to future calls")( function(err, result){
            console.log(result);
            assert.equal(result.whystack.length, 2);
            end();
        });
    }.why("Attach another description"));


The output of the commented example will be like bellow:
   
    { whystack: 
       [ { step: 'Demonstrate attaching descriptions to future calls',
           args: [Object],
           other: undefined },
         { step: 'Attach another description',
           args: [Object],
           other: undefined } ],
      history: [ { step: 'For something', args: [], other: undefined } ],
      exceptionContextSource: undefined }
    [Pass] Test example

By calling  why.dump() you can get informations about the set of calls explained with "why" that happened before calling the dump function. 
You do not have to put the why() calls everywhere but only on important steps of your asynchronous, multiple microserices algorithms and workflows.
 
 
 Observations:
 When all the related asynchronous calls are done, the why implementations will call the logger.logWhy function. You are responsible of properly implementing a logWhy function.
 
 In the swarm enabled systems (see SwarmESB project), the why functions handles also the accounting of swarm contexts so you do not have to call the S function for callbacks. 
  
 