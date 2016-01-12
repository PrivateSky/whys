# tracker
why module provides a novel method for tracking errors and for tracking execution of complex Java Script (node.js code) 

The why module works by adding a why function the the Function prototype. Basically for every call of an "important" function you can explain "why" that function will be called
 
 For example you can do things like:
 
 Example 1:
 
    var a = function().why("Because i want so"); // a will be a function but at each call we will know why got called
  
 Example 2:
  
    function async(function(){}.why("Because thsi is a callback and asynchronously called sometimes");
 
 Example 3:
 
     function f(){}
     f.why("special call of f")();
 

Commented example:

    var assert = require("semantic-firewall").assert;
    var logger = require("semantic-firewall").logger;
    var why = require("../lib/why.js");
    
    
    logger.record = function(record){ //you have to integrate with your own logging system by overriding this functions
       console.log("Failed assert:",JSON.stringify(record));
    }
    
    function nop(){  //do nothing but shown in history
    
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


The output of teh commented example will be like bellow:
   
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
You do not have to put the why() calls everywhere but only on important steps of your alghoritm
 