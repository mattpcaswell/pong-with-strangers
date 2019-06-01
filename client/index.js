let username_input, submit_button, greeting_element;

function setup() {
    createCanvas(windowWidth, windowHeight);

    let midWidth = windowWidth / 2;
    let midHeight = windowWidth / 2;

    username_input = createInput();
    username_input.position(midWidth, midHeight);
    submit_button = createButton('submit');
    submit_button.position(username_input.x + username_input.width, midHeight + 1);
    submit_button.mousePressed(submit_username);
    greeting_element = createElement('h2', 'Choose a username');
    greeting_element.position(midWidth - 10, midHeight - 60);
}

function submit_username() {
    const username = username_input.value();
    username_input.value('');

    if (username == '')
	return;

    // disable the submit button until we hear back from server
    submit_button.html('submitting...');
    submit_button.attribute('disabled', '');


    // Send username to server
    httpPostAsync('http://localhost:3000/username', {username: username}, function(response) {
	response = JSON.parse(response);
	console.log("response: " + response);
	console.log("response.valid: " + response.valid);

	if (!response.valid) {
	    greeting_element.html('Choose a username - Invalid username');
	    submit_button.removeAttribute('disabled');
	    submit_button.html('submit');
	} else {
	    greeting_element.html(response.username + " - Finding a stranger");
	}
    });
}

function httpPostAsync(theUrl, json, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous 
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    console.log("sending: " + json);
    xmlHttp.send(JSON.stringify(json));
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
