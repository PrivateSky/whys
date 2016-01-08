# tracker
Error tracker: 
 - a method of tracking errors in Java Script (node.js code)
 - a method to handle asynchronous code  


Concepts:
    executionStep:  a call of a function or a synchronously set of calls that can be grouped toghether and contribute to a specific purpose 
    executionContext: a set of ExecutionSteps 
     

var f1 = executionStep(function(){
        printContexts();
    });
     
var f2 = executionStep(function(){
        f1();
    });






Ideea principala este de a executa adauga informatii de context pentru toate functiile publice (API-urile) 
toate functiile care pot constitui pasi relevanti in timpul executiei. 
Un context va retine informatii despre stiva executiei curente si despre parametrii curenti cu care a fost apelat.
  
In momentul aparitiei unei errori sau in orice moment, se poate obtine stiva de contexte si informatiile adiacente relevante. 

Pentru implementare am propus crearea unor functii ajutatoare:
  declareTopLevelContext(contextName, logContextDescription, callback)
  declareStep(stepName, stepContextDescription, callback) 
  printContexts() will print a stack with context names and actual parameters
  dumpContext()  will print an aray with all the available informations
   
  setValue(name, value) : seteaza o valoare in context
  getValue(name) : returneaza o valoare in context


Exemplu de  folosire

    var  step1 = declareTopLevelContext("Step1", "Deocument step1 ",
      function(param, continuation){
        console.log("step1",continuation);
      });
      
    var  step2 = declareTopLevelContext("Step1", "Document step2 ",
      function(param, callback){
        console.log("step2", param);
        printContexts();
        callback(getValue("finalCallStep2"));
      });
  
    var  mainUseCase = declareTopLevelContext("Main use case", "Declare informations about the the main use case ",
      function(){
      setValue("finalCallStep2",dumpContext);
      step1(true,step2);
      });
      
  
    mainUseCase(step1);






