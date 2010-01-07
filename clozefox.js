var manifest = {
  settings: [
    {
      name: "twitter",
      type: "group",
      label: "Twitter",
      settings: [
        { name: "username", type: "text", label: "Username" },
        { name: "password", type: "password", label: "Password" }
      ]
    },
    {
      name: "facebook",
      type: "group",
      label: "Facebook",
      settings: [
        { name: "username", type: "text", label: "Username", default: "jdoe" },
        { name: "password", type: "password", label: "Secret" }
      ]
    },
    { name: "music", type: "boolean", label: "Music", default: true },
    { name: "volume", type: "range", label: "Volume", min: 0, max: 10, default: 5 }
  ]
};

jetpack.future.import("storage.settings");


/*
  Initialize the JetPack storage system and bind myStorage to it.
*/

jetpack.future.import("storage.simple"); 
var myStorage = jetpack.storage.simple; 

/*
  Initialize the JetPack slidebar system and activate it.
*/

var cb; // used for slide later, be careful about this
var initialContent = '<style type="text/css">h4 {font-family: Arial;}</style> <h4>Previous scoress</h4> <div id="content"></div>';

jetpack.future.import('slideBar'); 

jetpack.slideBar.append({
    width: 350,
    icon: 'http://dev.linguapolis.be/jetpack/images/ua_logo.png',
    html: initialContent,
    persist: true,
    onReady: function(slide) {
	cb = slide;
    },
    onSelect: function(slide) {
	displayScoreDetails($(slide.contentDocument).find("#content"));	
    }
});

jetpack.tabs.onFocus(function() {
  let scoreDetails = jetpack.storage.simple.scoreDetails;
  for (let i = 0; i < scoreDetails.length; i++) {
    if (this.url == scoreDetails[i].site)
      cb.notify();
  }
});


/*
  Define the relevant constants. Please be aware that the const is a
  Mozilla-specific extension, it is not supported by IE.  see
  https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Statements/Const
  for details.
*/
const STRATETGY_RANDOM = 1000;
const ENGLISH          = 1000;
const UNKNOWN_LANGUAGE = 9999;
const englishFrequencyList = ["the", "of", "and", "a", "in", "to", "it", "is", "to", "was", 
			    "I", "for", "that", "you", "he", "be", "with", "on", "by", "at"];
const myIcon ="http://dev.linguapolis.be/jetpack/images/uaLogo.ico";



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


    /*
      If the enough amount of text cannot be found or grabbed correctly 
      by the system then immediately stop processing
    */
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

    var pageLanguage = detectLanguage(fListArray);
    if (pageLanguage == ENGLISH) {
	createTest(doc, STRATETGY_RANDOM, ENGLISH);
    }
    else {
	
	var myBody = "ClozeFox could not find the main text of the page or the language of the page could not be detected, sorry!";
	jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
    }     
}


function createTest(doc, strategy, language) {
    switch (strategy) {
	case STRATETGY_RANDOM:
	  createRandomTest(doc, language);
	  break;
	default:
	  console.log("Error: Unknown test strategy!");	  
    }
}


function createRandomTest(doc, language) {
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
    var listOfWords = txt.toLowerCase().split(/[\s,.]+/);
    
    for (var i = 0; i < listOfWords.length; i++) {
	var word = listOfWords[i];

	if (!frequencyList.hasOwnProperty(word)) {
	    frequencyList[word] = 1;	
	}
	else {
	    var wordCount = frequencyList[word];

	    if (typeof wordCount === 'number') {
		frequencyList[word]++;
	    }
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
    var numGaps = 0;
    var percentage = 0;
   
    $(doc).find("select[id='clozefox_answer']").each(function (index) {
	//
	// Why $(this).val(); does not work as expected and
	// returns the option text instead of option value is
	// strange indeed. So I had to use the following workaround.
	//
	var selectedValue = $(this).attr("value");

	if (selectedValue == "trueAnswer") {
	    numCorrectAnswer++;
	}
	numGaps++;
    });

    percentage = (numCorrectAnswer * 100) / numGaps;
    var mBody = numCorrectAnswer + " out of " + numGaps + "! ";
    mBody += "You have achieved %" + percentage;    
    
    jetpack.notifications.show({title: "ClozeFox test score =", body: mBody, icon: myIcon});

    /*
      let keyword is supported only by the Firefox
      for details please see the following documents
      https://developer.mozilla.org/en/New_in_JavaScript_1.7#Block_scope_with_let
      https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Working_with_Closures
    */

    var time = new Date();
    var site = jetpack.tabs.focused.url;
    var pageTitle = jetpack.tabs.focused.contentDocument.title;


    let ctime = time.getMonth() + 1;
    ctime += "/" + time.getDate();
    ctime += " at " + time.getHours();
    ctime += ":" + time.getMinutes();
  
    let scoreDetail = {'site':site, 'time':ctime, 'title':pageTitle, 'score': mBody, 'percentage': percentage};
    let scoreDetails = myStorage.scoreDetails;

    if (!scoreDetails) { // if there is no scoreDetails stored yet
	myStorage.scoreDetails = [scoreDetail];
    } 
    else {
	scoreDetails[scoreDetails.length] = scoreDetail;
	myStorage.scoreDetails = scoreDetails;
    }

    jetpack.storage.simple.sync();
    jetpack.notifications.show("Memo saved!");

}


function displayScoreDetails(content) {    

    let toShow = '';
    let scoreDetails = jetpack.storage.simple.scoreDetails;

    if (!scoreDetails) {
	content.attr('innerHTML', 'No scores saved yet!');
    } 
    else {
	
	jetpack.notifications.show("toShow ENTERED!!!");
	
	for (let i = 0; i < scoreDetails.length; i++) {
	    // toShow += '<img id="scoreDetail' + i;
	    // toShow += '" border="0" src="http://www.kix.in/misc/jetpacks/play.png"/> ';
	    // toShow += '<a href="#" id="url'+ i + '">' + scoreDetail[i].title + '</a>';
	    // toShow += ' on ' + scoreDetails[i].time;
	    //toShow += '<br/>';

	    toShow += "EMRE  " +  scoreDetails[i].time + " score = " + scoreDetails[i].score + "<br/>";
	}
	
	jetpack.notifications.show("toShow = " + toShow.length);
	
	content.attr('innerHTML', toShow);
    }
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


