const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const wss = new WebSocket.Server({port: 8080});

const MAX_USERNAME_LEN = 12; // 12 characters

app.use(express.json());

app.listen(port, () => console.log(`Listening on port ${port}!`));

app.use(express.static('../client'));

wss.on('connection', ws => {
    ws.on('message', message => {
        console.log("ws message: " + message);

        let msg = JSON.parse(message);
        switch (msg.type) {
            case "username-req":
                let requested_username = msg.username;
                let is_valid = new_username(requested_username, ws);
                console.log("requested username " + requested_username + " is " + (is_valid ? "valid." : "invalid."));

                ws.send(JSON.stringify({
                    type: "username-req-resp",
                    username: requested_username,
                    valid: is_valid
                }));

                if (is_valid)
                    start_matchmaking(requested_username);
                break;
        }
    });
});

let users = new Map();
let matchmaking_queue = [];

function new_username(username, ws) {
    // Check the username fits formatting
    if (username.length <= 0 || username.length > MAX_USERNAME_LEN) {
        return false;
    }

    // Check if the username is taken already
    if (users.has(username))
        return false;

    // valid username. Add to list
    users.set(username, { username: username, ws: ws });
    return true;
}

function start_matchmaking(username) {
    console.log("starting matchmaking with user " + username);

    matchmaking_queue.push(username);

    if (matchmaking_queue.length > 1) {
        // match the first two people in the queue
        let first_user = users.get(matchmaking_queue.pop());
        let second_user = users.get(matchmaking_queue.pop());

        console.log("Matched " + first_user.username + " with " + second_user.username);

        first_user.ws.send(JSON.stringify({
            type: "match",
            username: second_user.username
        }));
        second_user.ws.send(JSON.stringify({
            type: "match",
            username: first_user.username
        }));
    }
}
