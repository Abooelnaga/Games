// variable game.
var game_btn = [5,15,16,17,18,19,20,21,22,23,33,47,58,59,60,61,62,63,64,65,75,89,102,103,104,105,106,107,108,
    119,133,144 ,145,146,147,148,149,150,161];
var game_id = [24,66,109,151,117,175];
var ltter = ["ا","أ","ب","ج","د","ه","و","ز","ح","ح","ط","ي","ك","ل","م","ن","ص","ف","س","ق","ر","ش","ت","ث","خ","ذ","ض","ظ","غ","ئ","ؤ","ة","ء"];
var word1_btn = [[23,22,21,20,19,18,17,16,15],["م","د","ا","ئ","ن","ص","ا","ل","ح"]];
var word2_btn = [[65,64,63,62,61,60,59,58],["ا","ل","ط","ا","س","ي","ل","ي"]];
var word3_btn = [[108,107,106,105,104,103,102],["ا","ل","ب","ت","ر","ا","ء"]];
var word4_btn = [[150,149,148,147,146,145,144],["ر","و","ه","ي","ن","ج","ا"]];
var word5_btn = [[103,89,75,61,47,33,19,5],["ا","ل","أ","س","ت","ا","ن","ة"]];
var word6_btn = [[161,147,133,119,105],["ب","ي","ر","و","ت"]];
var words = [word1_btn,word2_btn,word3_btn,word4_btn,word5_btn,word6_btn];
var local = "";
score = [0,0,0,0,0,0];
//buttons div.
var k=1;
for(var i = 0 ; i < 14 ; i++){
    for(var j = 0 ; j < 14 ; j++){
        document.getElementById('buttons').innerHTML += '<button id="b'+k+'"></button>';
        if(game_btn.includes(k) == false) {
            var idbtn = 'b'+k
            if(game_id.includes(k) == false) {
                 document.getElementById(idbtn).style.backgroundColor = "rgba(0, 0, 0, 0.01)"
                 document.getElementById(idbtn).disabled = true;
            }else {
                document.getElementById(idbtn).style.backgroundColor = "#000"
                document.getElementById(idbtn).style.color = "#fff"
                document.getElementById(idbtn).innerHTML = game_id.indexOf(k)+1
                document.getElementById(idbtn).disabled = true;
            }
        }
        k += 1;
    }
}
k=0;
// button Letter.------------------------------------------------------------------------------------------
for(var i = 0 ; i < 11 ; i++){
    for(var j = 0 ; j < 3 ; j++){
        document.getElementById('Letter').innerHTML += '<button id="l'+(k+1)+'"></button>';
        document.getElementById('l'+(k+1)).innerHTML = ltter[k];
        k += 1;
    }
}
// button onclick.--------------------------------------------------------------------------------------
game_btn.forEach(myclick_btn)
for(var i = 0;i < 33;i++){
    myclick_letter(i);
}
document.getElementById('remove').onclick = ()=> {
    document.getElementById(local).style.backgroundColor = "#fff";
    document.getElementById(local).innerHTML = "";
};
function myclick_btn(value ,index ,game_btn){
    document.getElementById('b'+value).onclick = ()=> {
        if(local != "") {
           document.getElementById(local).style.backgroundColor = "#fff"
        }
        local = 'b'+value
        document.getElementById('b'+value).style.backgroundColor = "orange"
   };
}
function myclick_letter(value){
    document.getElementById('l'+(value + 1)).onclick = ()=> {
        document.getElementById(local).innerHTML = document.getElementById('l'+(value + 1)).innerHTML;
        document.getElementById(local).style.backgroundColor = "red";
        for(var i=0;i<6;i++){
            word_solution(words[i],i);
        }
        if(score.includes(0) == false){
            document.getElementById('result').innerHTML = 'لقد أنهيت اللعبة بنجاح';
        }
   };
}
function word_solution(word_btn,j){
    var a = false;
    for(var i =0;i< word_btn[0].length;i++) {
        var lt_btn = document.getElementById('b'+word_btn[0][i]);
        if(lt_btn.innerHTML != word_btn[1][i]){
            a= false;
            break;
        }else{
            a= true;
        }
    }
    //alert(a);
    if(a === true){
        for(var i =0;i< word_btn[0].length;i++) {
            document.getElementById('b'+word_btn[0][i]).style.backgroundColor= "yellow";
            document.getElementById('b'+word_btn[0][i]).disabled=true;
            local = "";
        }
        score[j] = 1;
    }
}
