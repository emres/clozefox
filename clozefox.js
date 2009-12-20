function detectBiggestDiv() { 
    var MIN_TEXT_LENGTH = 90;
    results = [];
   
    var doc = jetpack.tabs.focused.contentDocument; 

    // $(doc).find("div div:only-child").css("border", "3px blue solid");

    /* $(doc).find("div div:only-child").each(function (index) {
    */

    $(doc).find("div > p").each(function (index) {	
	var textStr = $(this).text();
	/*
         We need the pieces of text that are long and in natural language,
         not some JS code snippets
        */
	if(textStr.length > MIN_TEXT_LENGTH && textStr.indexOf("<script") <= 0) {    
	    console.log(textStr);
	    console.log(textStr.length);
	    console.log(index);
	    $(this).remove();
	    results.push(index);
	}
    });

    /*
    for(var i = 0; i < results.length; i++) {
	$(doc).find("div > p").eq(results[i]).remove();
    }
    */
   
}

jetpack.statusBar.append({ 
    html: "Boom<i>!</i>", 
    width: 45, 
    onReady: function(widget){ 
	$(widget).click(detectBiggestDiv); 
    } 
});

var walkDOM = function walk(node, func) {
    func(node);
    node = node.firstChild;
    while(node) {
	walk(node, func);
	node = node.nextSibling;
    }
};

var getDivByTextLength = function () {
    var ELEMENT_NODE = 1;
    var TEXT_NODE    = 3;
    var results = [];

    walkDOM(document.body, function(node) {
	if (node.nodeType === ELEMENT_NODE) {
	    results.push(node);
	}
    });
    
    return results;
};



/*
http://www.nytimes.com/2009/12/14/business/economy/14samuelson.html?_r=1&hp
*/