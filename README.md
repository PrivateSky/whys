# tracker
Error tracker: a new method of tracking errors in Java Script 

Ideea principala este de a executa adauga informatii de context pentru toate functiile publice (API-urile) si toate functiile care pot constitui pasi relevanti in timpul executiei. Un context va retine informatii despre stiva executiei curente si despre parametrii curenti cu care a fost apelat.  
In momentul aparitiei unei errori sau in orice moment, se poat obtine stiva de contexte si informatiile adiacente relevante. 

Pentru implementare am propus crearea unor functii ajutatoare:
  declareTopLevelContext(contextName, logContextDescription, callback)
  declareStep(stepName, stepContextDescription, callback) 
  printContexts() will print a stack with context names and actual parameters
  dumpContext()  will print an aray with all the available informations

Exemplu de  folosire

  var  step1 = declareTopLevelContext("Step1", "Deocument step1 ",
    function(param){
      console.log("step1");
    });
    
  var  step1 = declareTopLevelContext("Step1", "Document step2 ",
    function(param){
      console.log("step2");
    });

  var  mainUseCase = declareTopLevelContext("Main use case", "Declare informations about the the main use case ",
    function(param){
    });
    
  
    










