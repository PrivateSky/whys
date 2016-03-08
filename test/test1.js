/**
 * Created by ctalmacel on 2/24/16.
 */


require("../lib/why.js");

function f1() {

    try {
        f2.why("f1 to f2")();
    }
    catch(err){}
}

function f2(){
    setTimeout.why("Frist timeout")(f4.why("from f2").why("from f22"),10);
    //throw new Error("Some error")
}


function f4(){
}

f1.why("FirstCallOfF1")("FirstCallOfF1");
