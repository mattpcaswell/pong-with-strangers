const ws_url = "ws://localhost:8080";
const ws = new WebSocket(ws_url);
let username = "";
let game_id;

ws.onopen = () => { console.log("ws connection opened"); }

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
            game_id = msg.game_id;
            username_input.hide();
            submit_button.hide();
            ready_button.show();
            break;
        case "start":
            is_left = msg.is_left;
            start_pong();
            break;
    }
}

ws.onerror = error => { console.log("!!!!! ws error: " + JSON.stringify(error)); }

let username_input, submit_button, greeting_element, ready_button;

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

    ready_button = createButton('ready');
    ready_button.position(username_input.x + username_input.width - 40, midHeight + 1);
    ready_button.mousePressed(ready);
    ready_button.hide();
}

function draw() {
    background(10);
    
    // center line
    stroke(255);
    strokeWeight(10);
    line(windowWidth / 2, 0, windowWidth / 2, windowHeight);

    let paddle_padding = 20;
    let paddle_width = 5;
    let paddle_height = 100;
    // left paddle
    rect(paddle_padding, (windowHeight / 2) - (paddle_height / 2), paddle_width, paddle_height);

    // right paddle
    rect(windowWidth - paddle_padding, (windowHeight / 2) - (paddle_height / 2), paddle_width, paddle_height);

    // left score
    fill(255);
    textSize(32);
    text(0, 80, 80);

    // right score
    text(1, windowWidth - 100, 80);
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

function ready() {
    ready_button.attribute('disabled', '');
    ws.send(JSON.stringify({
        type: "ready",
        username: username,
        game_id: game_id
    }));
}

function start_pong() {
    username_input.hide();
    submit_button.hide();
    greeting_element.hide();
    ready_button.hide();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
