var quiztitle = "QuizToon!";
var quizdesc = "Metti alla prova le tue conoscenze!";
var quiz = [];
var questionsSelected = [];
var numberOfQuestionsPerQuiz = 4;
var progressIndicator = 100;
var totalScore = 0;
var secondsToAnswer = 10;
var barWidth;
var theTimer;
var chain = 1;
var previousCorrect = false;
var possScore = 0;
var perfectScore = 1000000;
var scoreboard;
var timePassed = 0;
var myVar;
/**
    * Set the information about your questions here. The correct answer string needs to match
    * the correct choice exactly, as it does string matching. (case sensitive)
    *
    */

/******* No need to edit below this line *********/
jQuery(document).ready(function($){
  var currentquestion = 0, score = 0, submt=true, picked;
      
  function caricaPunteggi(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'score.json', true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {    
        callback(xobj.responseText);
      }
    };
    xobj.send(null);  
  }
  function caricaDomande(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'domande.json', true);
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {    
        callback(xobj.responseText);
      }
    };
    xobj.send(null);  
  }
  /**
         * This will add the individual choices for each question to the ul#choice-block
         *
         * @param {choices} array The choices from each question
         */
  function addChoices(choices){
    if(typeof choices !== "undefined" && $.type(choices) == "array"){
      $('#choice-block').empty();
      for(var i=0;i<choices.length; i++){
        $(document.createElement('li')).addClass('choice choice-box').attr('data-index', i).text(choices[i]).appendTo('#choice-block');                    
      }
    }
  }
  ///////////////////////////
  function progress(timeleft, timetotal, $element, newQuestion) {
    if(newQuestion == true){             
      clearTimeout(theTimer);      
    }    
    var progressBarWidth = timeleft * $element.width() / timetotal;
    possScore = timetotal - timeleft;
    $element.find('div').animate({ width: progressBarWidth }, 500).html(Math.floor(timeleft/60) + ":"+ timeleft%60);
    if(timeleft > 0) {
      theTimer = setTimeout(function() {
        progress(timeleft - 1, timetotal, $element, false);
      }, 1000);
    }
  };
  //////////////////////
  /**
         * Resets all of the fields to prepare for next question
         */
  function nextQuestion(){
    submt = true;
    possScore = 0;
    $('#explanation').empty();
    $('#question').text(quiz[currentquestion]['question']);
    $('#pager').text('Domanda ' + Number(currentquestion + 1) + ' di ' + quiz.length);
    if(quiz[currentquestion].hasOwnProperty('image') && quiz[currentquestion]['image'] != ""){
      if($('#question-image').length == 0){
        $(document.createElement('img')).addClass('question-image').attr('id', 'question-image').attr('src', quiz[currentquestion]['image']).insertAfter('#question');
      } else {
        $('#question-image').attr('src', quiz[currentquestion]['image']);
      }
    } else {
      $('#question-image').remove();      
    }
    progress(secondsToAnswer,secondsToAnswer, $('#progressBar'), true);
    addChoices(quiz[currentquestion]['choices']);
    setupButtons();
  }

  /**
         * After a selection is submitted, checks if its the right answer
         *
         * @param {choice} number The li zero-based index of the choice picked
         */
  function processQuestion(choice){
    if(quiz[currentquestion]['choices'][choice] == quiz[currentquestion]['correct']){
      if (previousCorrect){
        chain++;
      }
      score++;
      currentquestion++;      
      previousCorrect = true;
      if(currentquestion == quiz.length){
        calculatePoints(true);
      }
      else{
        calculatePoints(false);
      }
    } else {      
      chain = 1;
      currentquestion++;
      previousCorrect = false;
    }    
    if(currentquestion == quiz.length){
      if($('#question-image').length != 0){
        $('#question-image').remove();
      }
      endQuiz();
    } else {      
      nextQuestion();
    }    
  }

  /**
         * Sets up the event listeners for each button.
         */
  function setupButtons(){    
    $('.choice').on('click', function(){
      picked = $(this).attr('data-index');
      $('.choice').removeAttr('style').off('mouseout mouseover');
      $(this).css({'border-color':'#222','font-weight':700,'background-color':'#2274e5', 'color':'white'});
      if(submt){
        submt=false;
        $('#submitbutton').css({'color':'#000'}).on('click', function(){
          $('.choice').off('click');
          $(this).off('click');
          processQuestion(picked);
        });
      }
    })
  }

  //Randomize bar colors
  function RandomizeBarColors(){
    var bar1 = document.getElementById('progressBar');
    var bar2 = document.getElementById('secBar');
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }        
    var color2 = '#';
    for (var i = 0; i < 6; i++) {
      color2 += letters[Math.floor(Math.random() * 16)];
    }
    bar1.style.backgroundColor = color;
    bar2.style.backgroundColor = color2;
  }


  /**
         * Quiz ends, display a message.
         */
  function endQuiz(){
    clearInterval(myVar);
    $('#explanation').empty();
    $('#question').empty();
    $('#choice-block').empty();
    $('#submitbutton').remove();
    document.getElementById("progressBar").style.display = "none";
    document.getElementById("secBar").style.display = "none";
    $('#question').text("Hai risposto correttamente a " + score + " domande su " + quiz.length + ".");
    $(document.createElement('h2')).css({'text-align':'center', 'font-size':'2em'}).text('Hai totalizzato ' + totalScore + ' punti').insertAfter('#question');
    createScoreBoard();
  }

  //////////////////////////////
  function calculatePoints(theEnd){
    var curTimer = theTimer / currentquestion;
    var partScore = 10000 / (curTimer - possScore);
    totalScore += partScore;
    if(theEnd){
      totalScore = Math.round(totalScore + (perfectScore / theTimer) * score);
    }
  }

  /**
         * Runs the first time and creates all of the elements for the quiz
         */
  function splashPage(){
    $(document.createElement('div')).attr('id', 'splashdiv').appendTo('#frame');
    $(document.createElement('h1')).text(quiztitle).attr('id', 'textlogosplash').appendTo('#splashdiv');
    $(document.createElement('img')).attr('id', 'imageLogo').attr('src','http://www.lineadiretta24.it/wp-content/uploads/2017/04/robot-anni-70-e-80-860x450_c.jpg').appendTo('#splashdiv');
    $(document.createElement('h3')).text(quizdesc).attr('id', 'descQuiz').appendTo('#splashdiv');
    $(document.createElement('button')).text("Inizia").attr('id', 'buttonStart').click(function(){startQuiz()}).appendTo('#splashdiv');
  }

  function createScoreBoard(){
    var isHighscore = false;
    for(var i = 0; i < scoreboard.length; i++ ){
      //controlla che sia entrato nella leaderboard
      if(totalScore > scoreboard[i].points){
        isHighscore = true;
      }
    }
    if(isHighscore){
      addSelfToLeaderboard();
    }
    scoreboard.sort(function(a, b) {
      return parseFloat(b.points) - parseFloat(a.points);
    });
    $(document.createElement('div')).attr('id', 'leaderboard').appendTo('#frame');
    $(document.createElement('h1')).text("Leader Board").attr('id', 'leadbTitle').appendTo('#leaderboard');
    //Description row
    $(document.createElement('div')).attr('id', 'descRow').addClass('leadRow').appendTo('#leaderboard');  
    $(document.createElement('div')).attr('id', 'firstCelldesc').appendTo('#descRow');
    $(document.createElement('p')).text("Nome").appendTo('#firstCelldesc');
    $(document.createElement('div')).attr('id', 'secondCelldesc').appendTo('#descRow');
    $(document.createElement('p')).text("Punteggio").appendTo('#secondCelldesc');
    $(document.createElement('div')).attr('id', 'thirdCelldesc').appendTo('#descRow');
    $(document.createElement('p')).text("Tempo").appendTo('#thirdCelldesc');
    //Scores
    for(var i = 0; i < scoreboard.length; i++ ){
      if(i % 2 == 0){
        $(document.createElement('div')).attr('id', 'leadRow'+[i]).addClass('leadRow').appendTo('#leaderboard');  
      }
      else{
        $(document.createElement('div')).attr('id', 'leadRow'+[i]).addClass('oddRows').addClass('leadRow').appendTo('#leaderboard');  
      }      
      $(document.createElement('div')).attr('id', 'firstCell'+[i]).appendTo('#leadRow'+[i]);
      $(document.createElement('p')).text(scoreboard[i].name).appendTo('#firstCell' +[i]);
      $(document.createElement('div')).attr('id', 'secondCell'+[i]).appendTo('#leadRow'+[i]);
      $(document.createElement('p')).text(scoreboard[i].points).appendTo('#secondCell' +[i]);
      $(document.createElement('div')).attr('id', 'thirdCell'+[i]).appendTo('#leadRow'+[i]);
      $(document.createElement('p')).text(scoreboard[i].time).appendTo('#thirdCell' +[i]);
      
    }
  }
  
  function addSelfToLeaderboard(){
    $(document.createElement('h2')).attr('id','greetings').text('Complimenti! Sei entrato nella Leaderboard!').insertAfter('#question');
    var name = prompt("Inserisci il tuo nome!");
    if (name == null) {
      name = "Giocatore Anonimo";
    }
    scoreboard.push({name: name, points: Math.round(totalScore), time: timePassed});
  }  
  function startQuiz(){
    document.getElementById("splashdiv").style.display = "none";
    init();
  }
  function init(){
    myVar = setInterval(function(){timePassed++}, 1000);
    //load the questions
    for(var i = 0; i < numberOfQuestionsPerQuiz; i++){
      var randomNumber = Math.floor(Math.random() * (quizQuestions.length));
      if(!questionsSelected.includes(randomNumber)){        
        questionsSelected.push(randomNumber);
        quiz.push(quizQuestions[randomNumber]);  
      }
      else {
        i--;
      }      
    }
    $(document.createElement('div')).attr('id','quizContainer').appendTo('#frame');
    //add title
    if(typeof quiztitle !== "undefined" && $.type(quiztitle) === "string"){
      $(document.createElement('h1')).text(quiztitle).appendTo('#quizContainer');
    } else {
      $(document.createElement('h1')).text("Quiz").appendTo('#quizContainer');
    }

    //add pager and questions
    if(typeof quiz !== "undefined" && $.type(quiz) === "array"){
      //add pager
      $(document.createElement('div')).addClass('bar').attr('id', 'infoBar').appendTo('#quizContainer');
      $(document.createElement('p')).addClass('pager').attr('id','pager').text('Domanda 1 di ' + quiz.length).appendTo('#infoBar');
      $(document.createElement('div')).attr('id','progressBar').appendTo('#infoBar'); $(document.createElement('div')).addClass('bar').attr('id', 'secBar').appendTo('#progressBar');
      //add first question
      $(document.createElement('h2')).addClass('question').attr('id', 'question').text(quiz[0]['question']).appendTo('#quizContainer');
      //add image if present
      if(quiz[0].hasOwnProperty('image') && quiz[0]['image'] != ""){
        $(document.createElement('img')).addClass('question-image').attr('id', 'question-image').attr('src', quiz[0]['image']).appendTo('#quizContainer');
      }
      $(document.createElement('p')).addClass('explanation').attr('id','explanation').html('&nbsp;').appendTo('#quizContainer');



      //questions holder
      $(document.createElement('ul')).attr('id', 'choice-block').appendTo('#quizContainer');

      //add choices
      addChoices(quiz[0]['choices']);

      //add submit button
      $(document.createElement('div')).addClass('choice-box').attr('id', 'submitbutton').text('Conferma').css({'font-weight':700,'color':'#222'}).appendTo('#quizContainer');
      barWidth = document.getElementById('progressBar').offsetWidth;      
      setupButtons();
      progress(secondsToAnswer,secondsToAnswer, $('#progressBar'), true);
      RandomizeBarColors();
    }
  }
  splashPage();
  caricaPunteggi(function(response) {
    scoreboard = JSON.parse(response);
   });
  caricaDomande(function(response) {
    quizQuestions = JSON.parse(response);
  });
});
