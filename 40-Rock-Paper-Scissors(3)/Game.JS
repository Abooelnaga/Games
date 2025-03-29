var gameContainer = document.querySelector(".container");
var userResult = document.querySelector(".userResult");
var cpuResult = document.querySelector(".cpuResult");
var result = document.querySelector(".result");
var User_score = document.getElementById("User_result");
var PC_score = document.getElementById("PC_result");




var optionImages = document.querySelectorAll(".optionImages");

var lastClickedImage = null; // Variable to keep track of the last clicked image
var PC_result=0;
var User_result=0;



// var userImg ;

function imgHoverin(e) {
    e.style.cssText = "opacity: 0.5";
}

function imgHoverout(e) {
    e.style.cssText = "opacity: 1";
}
var selectedImg;

function handleImageClick(e) {
    var selectedImg = e.target.src;
    var userImg = userResult.querySelector("img");
    gameContainer.classList.add("Start");

    setTimeout(function () {
        gameContainer.classList.remove("Start");


    if (userImg) {
        userImg.src = selectedImg;

        if (selectedImg.includes("477919-200.png")) {
            userImg.style.transform = "rotate(15deg)";
        }else if (selectedImg.includes("477914-200.png"))
        {
            userImg.style.transform = "rotate(90deg)";

        }
    }

    let cpuImages = ["477912-200.png", "477914-200.png", "477919-200.png"];
  
   
    let randomNum = Math.floor(Math.random() * 3);
    console.log(randomNum);
    
    let cpuResultImg = cpuResult.querySelector("img");
    
    console.log("Before CPU Image Change:", cpuResultImg.src);
    
    cpuResultImg.src = cpuImages[randomNum];
    // rotateY(45deg)

    if (cpuResultImg.src.includes("477919-200.png")) {
        cpuResultImg.style.transform = "rotateY(200deg) ";
    }
    if (selectedImg.includes("477914-200.png"))
        {
            userImg.style.transform = "rotate(50deg)";

        }
    
    console.log("After CPU Image Change:", cpuResultImg.src);

    setTimeout(function () {
        console.log(cpuResult.src);
    }, 100);



    var GameResult;
    if (cpuResultImg.src ===  userImg.src) {
        GameResult="تعادل!";
        console.log("تعادل!");
    } else if (cpuResultImg.src.includes("477914-200.png") && userImg.src.includes("477919-200.png")) {
        GameResult="فاز الكمبيوتر";
        PC_result +=1;
        console.log("فاز الكمبيوتر...");
    } else if (cpuResultImg.src.includes("477912-200.png") && userImg.src.includes("477914-200.png")) {
        GameResult="فاز الكمبيوتر";
        PC_result +=1;
        console.log("فاز الكمبيوتر...");
    } else if (cpuResultImg.src.includes("477919-200.png") && userImg.src.includes("477912-200.png")) {
        GameResult="فاز الكمبيوتر";
        PC_result +=1;
        console.log("فاز الكمبيوتر...");
    } else {
        GameResult="فاز المستخدم";
        User_result +=1;
        console.log("فاز المستخدم...");
    }


    result.innerHTML=GameResult;
    // PC_score.innerHTML=PC_result;
    // User_score.innerHTML=userResult;
    PC_score.innerHTML = PC_result;
    User_score.innerHTML = User_result;

    if (User_result ==10)
    {
        GameResult="Congrats User Wins";
        result.innerHTML=GameResult;
        User_result=0;
        User_score.innerHTML = User_result;
        PC_result=0;
        PC_score.innerHTML = PC_result;





    }else if (PC_result==10)
    {
        GameResult="Cry cause  PC Wins";
        result.innerHTML=GameResult;
        User_result=0;
        User_score.innerHTML = User_result;
        PC_result=0;
        PC_score.innerHTML = PC_result;


    }
   
       
    }, 1000);




    if (lastClickedImage) {
        imgHoverout(lastClickedImage);
        // console.log(lastClickedImage);

    }

    imgHoverin(e.target);

    lastClickedImage = e.target;
    // console.log(lastClickedImage);

}
var index;
for ( index = 0; index < optionImages.length; index++) {
    optionImages[index].addEventListener("click", handleImageClick);
    // optionImages[index].addEventListener("click", handleImageClick(optionImages[index]));   
}






function RemoveChoice(e) {
    // Reset variables and scores
    User_result = 0;
    PC_result = 0;
    GameResult = "لنلعب مرة أخرى!";

    PC_score.innerHTML = PC_result;
    User_score.innerHTML = User_result;
    result.innerHTML = GameResult;

    if (lastClickedImage) {
        imgHoverout(lastClickedImage);
        lastClickedImage = null;
    }
}
window.onload = function(){
    window.scrollTo(918, 895);
}