var STRATETGY_RANDOM = 1000;
var ENGLISH          = 1000;
var UNKNOWN_LANGUAGE = 9999;
var englishFrequencyList = ["the", "of", "and", "a", "in", "to", "it", "is", "to", "was", 
			    "I", "for", "that", "you", "he", "be", "with", "on", "by", "at"];

function detectBiggestDiv() { 
    var MIN_TEXT_LENGTH = 90;
    results = [];
    wholeText = "";
   
    var doc = jetpack.tabs.focused.contentDocument; 

    console.log("It works??\n");

    // $(doc).find("div div:only-child").css("border", "3px blue solid");
    // $(doc).find("div div:only-child").each(function (index) {

    $(doc).find("div > p").each(function (index) {	
	var textStr = $(this).text();
	/*
         We need the pieces of text that are long and in natural language,
         and not some JS code snippets
        */
	if(textStr.length > MIN_TEXT_LENGTH && textStr.indexOf("<script") <= 0) {    
	    console.log(index);	   
	    console.log(textStr.length);
	    console.log(textStr);
	    $(this).attr("id", "clozefox_paragraph_" + index);
	    results.push(index);

	    wholeText = wholeText + " " + textStr;
	}
    });

    var fList;
    var fListArray = new Array();

    fList = calculateFrequencyList(wholeText);

    for (var item in fList) {	
	fListArray.push([item, fList[item]]);
    }   

    fListArray.sort(function (x, y) {return x[1] - y[1]});
    fListArray.reverse();

    console.log("___________________ARRAY SORTED______________________");

    // var j = 0;
    // for(var i = 0; i < fListArray.length; i++) {
    // 	if (j > 20) break;
    // 	console.log('SORTED: ' +  fListArray[i][0] + ' --> ' + fListArray[i][1]);	
    // 	j++;
    // }

    // console.log("___________________MATCHING WORDS______________________");
    // console.log(detectLanguage(fListArray));
    
    createTest(doc, STRATETGY_RANDOM);

    // for(var i = 0; i < results.length; i++) {
    // 	$(doc).find("#clozefox_paragraph_" + results[i]).remove();
    // }      
}



function createTest(doc, strategy) {

    var idCounter = 1;    

    $(doc).find("[id^=clozefox_paragraph]").each(function (index) {
	var textStr = $(this).text();
	var listOfWords = textStr.split(" ");
	
	var l = listOfWords.length;
	for(var i = 0; i < l; i++) {

	    if(idCounter > 50) break;

	    if((i % 7) === 0) {
		currentWord = listOfWords[i]
		listOfWords[i] = "<select id=1> <option>distractor</option> <option value=\"true\">" + currentWord + "</option> </select>";
		idCounter++;
	    }
	}

	textStr = listOfWords.join(" ");
	$(this).html(textStr);
	console.log($(this).html());
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

    for(var i = 0; i < l; i++) {
	for(var j = 0; j < l; j++) {
	    // console.log("englishFrequencyList[" + i + "] = " + englishFrequencyList[i] + " " + "fListArray[" + j + "] = " + fListArray[j]);
	    if(englishFrequencyList[i] == fListArray[j][0]) {
		numOfMatchingWords++;
	    }
	}
    }

    if(numOfMatchingWords > 10) {
	return ENGLISH;
    }
    else {
	return UNKNOWN_LANGUAGE;
    }
}


jetpack.statusBar.append({ 
    html: "Run ClozeFox!", 
    width: 80, 
    onReady: function(widget){ 
	$(widget).click(detectBiggestDiv); 
    } 
});


