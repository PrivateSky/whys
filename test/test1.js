/**
 * Created by ctalmacel on 2/24/16.
 */


require("../lib/why.js");

function f1() {
    f2.why("f1 to f2")();
}

function f2(){
    function call() {
        f3();
    };
    setTimeout.why("Frist timeout")(call.why("from f2"),10);
}

function f3(){
    setTimeout.why("Timeout")(f4.why("F3 to F4"));
   // setTimeout(f4.why("F3 to F4"));
}

function f4(){
    console.log();
}

f1.why("FirstCallOfF1")("FirstCallOfF1 args");
