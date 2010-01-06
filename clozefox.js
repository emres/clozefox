var STRATETGY_RANDOM = 1000;
var ENGLISH          = 1000;
var UNKNOWN_LANGUAGE = 9999;
var englishFrequencyList = ["the", "of", "and", "a", "in", "to", "it", "is", "to", "was", 
			    "I", "for", "that", "you", "he", "be", "with", "on", "by", "at"];

var myIcon ="http://dev.linguapolis.be/jetpack/images/uaLogo.ico";

function detectBiggestDiv() { 
    var MIN_TEXT_LENGTH = 90;
    results = [];
    wholeText = "";
   
    var doc = jetpack.tabs.focused.contentDocument; 

    // $(doc).find("div div:only-child").css("border", "3px blue solid");
    // $(doc).find("div div:only-child").each(function (index) {

    $(doc).find("div > p").each(function (index) {	
	var textStr = $(this).text();
	/*
         We need the pieces of text that are long and in natural language,
         and not some JS code snippets
        */
	if (textStr.length > MIN_TEXT_LENGTH && textStr.indexOf("<script") <= 0) {    
	    $(this).attr("id", "clozefox_paragraph_" + index);
	    results.push(index);
	    wholeText = wholeText + " " + textStr;
	}
    });

    // for(var i = 0; i < results.length; i++) {
    // 	$(doc).find("#clozefox_paragraph_" + results[i]).remove();
    // }     


    //
    // If the enough amount of text cannot be found or grabbed correctly 
    // by the system then immediately stop processing
    //
    if (wholeText.length <= 100) {
	var myBody = "ClozeFox could not find enough text on the page.";
	jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
	return false;
    }

    var fList;
    var fListArray = new Array();

    fList = calculateFrequencyList(wholeText);

    for (var item in fList) {	
	fListArray.push([item, fList[item]]);
    }   

    fListArray.sort(function (x, y) {return x[1] - y[1]});
    fListArray.reverse();

    // console.log("___________________ARRAY SORTED______________________");
    // var j = 0;
    // for(var i = 0; i < fListArray.length; i++) {
    // 	if (j > 20) break;
    // 	console.log('SORTED: ' +  fListArray[i][0] + ' --> ' + fListArray[i][1]);	
    // 	j++;
    // }

    // console.log("___________________MATCHING WORDS______________________");
    // console.log(detectLanguage(fListArray));
    

    // 
    // If the found text is in some language try to create the test,
    // otherwise notify the user that the page cannot be turned into a
    // cloze test because of the unknown language
    //
    var pageLanguage = detectLanguage(fListArray);
    if (pageLanguage == ENGLISH) {
	createTest(doc, STRATETGY_RANDOM, ENGLISH);
    }
    else {
	
	var myBody = "The language of the page could not be detected, sorry!";
	jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
    }     
}


function createTest(doc, strategy, language) {

    var idCounter = 1;    

    $(doc).find("[id^=clozefox_paragraph]").each(function (index) {
	var textStr = $(this).text();
	var listOfWords = textStr.split(" ");
	
	var l = listOfWords.length;
	for (var i = 0; i < l; i++) {

	    if (idCounter > 50) break;

	    if ((i % 7) === 0) {
		currentWord = listOfWords[i]
		listOfWords[i] = "<select id=\"clozefox_answer\"> <option value=\"wrongAnswer\">distractor</option>" 
		listOfWords[i] += "<option value=\"trueAnswer\">" + currentWord + "</option></select>";
		idCounter++;
	    }
	}

	textStr = listOfWords.join(" ");
	$(this).html(textStr);
    });
}

function calculateFrequencyList(txt) {
    var frequencyList = new Array();
    var listOfWords = txt.split(" ");
    
    for (var i = 0; i < listOfWords.length; i++) {
	var word = listOfWords[i].toLowerCase();

	if (!frequencyList.hasOwnProperty(word)) {
	    frequencyList[word] = 1;	
	}
	else {
	    var wordCount = frequencyList[word];

	    if(isNaN(wordCount)) {
		console.log("_____________ NaN Detected! ___________________");
		console.log("_____________ wordCount = " + wordCount);		
		console.log(word + ' --- ' + frequencyList.items[word]);
		wordCount = 1;
	    }	    
	    frequencyList[word]++;
	}

    }

    return frequencyList;
}



function detectLanguage(fListArray) {

    var numOfMatchingWords = 0;
    var l = englishFrequencyList.length;

    for (var i = 0; i < l; i++) {
	for (var j = 0; j < l; j++) {
	    // console.log("englishFrequencyList[" + i + "] = " + englishFrequencyList[i] + " " + "fListArray[" + j + "] = " + fListArray[j]);
	    if (englishFrequencyList[i] == fListArray[j][0]) {
		numOfMatchingWords++;
	    }
	}
    }

    if(numOfMatchingWords > 8) {
	return ENGLISH;
    }
    else {
	return UNKNOWN_LANGUAGE;
    }
}


function calculateScore() {
    var doc = jetpack.tabs.focused.contentDocument;
    var numCorrectAnswer = 0;

    $(doc).find("select[id='clozefox_answer']").css("border", "3px blue solid");

    $(doc).find("select[id='clozefox_answer']").each(function (index) {
	// var selectedValue = $(this).text();
	var selectedValue = $(this).attr("value");

	if (selectedValue == "trueAnswer") {
	    numCorrectAnswer++;
	}
	//jetpack.notifications.show({title: "Selected value =", body: selectedValue, icon: myIcon});
    });
    
    jetpack.notifications.show({title: "ClozeFox test score =", body: numCorrectAnswer, icon: myIcon});
}

jetpack.statusBar.append({ 
    html: "Run ClozeFox!", 
    width: 75, 
    onReady: function(widget){ 
	$(widget).click(detectBiggestDiv); 
    } 
});

jetpack.statusBar.append({ 
    html: "Calculate score", 
    width: 80, 
    onReady: function(widget){ 
	$(widget).click(calculateScore); 
    } 
});


