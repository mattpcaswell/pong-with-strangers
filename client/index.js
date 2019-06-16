const ws_url = "ws://localhost:8080";
const ws = new WebSocket(ws_url);
let username = "";

ws.onopen = () => {
    console.log("ws connection opened");
}

ws.onmessage = message => {
    console.log("ws message: " + message.data);
    msg = JSON.parse(message.data);

    switch (msg.type) {
        case "username-req-resp":
            if (!msg.valid) {
                greeting_element.html('Choose a username - Invalid username');
                submit_button.removeAttribute('disabled');
                submit_button.html('submit');
                username = "";
            } else {
                username = msg.username
                greeting_element.html(username + " - Finding a stranger");
            }
            break;
        case "match":
            greeting_element.html(username + " - Matched with " + msg.username);
            break;
    }
}

ws.onerror = error => {
    console.log("!!!!! ws error: " + JSON.stringify(error));
}

let username_input, submit_button, greeting_element;

function setup() {
    createCanvas(windowWidth, windowHeight);

    let midWidth = (windowWidth / 2) - 150;
    let midHeight = (windowHeight / 2) - 20;

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
    ws.send(JSON.stringify({ type: "username-req", username: username }));
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
