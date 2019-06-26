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
            case "ready":
                // set the user ready
                let user = users.get(msg.username);
                user.ready = true;
                users.set(msg.username, user);

                // check if other user ready
                let game_users = games.get(msg.game_id).users;
                let other_username = msg.username == game_users[0] ? game_users[1] : game_users[0];
                let other_user = users.get(other_username);
                if (other_user.ready)
                    start_game(msg.game_id);

                break;
        }
    });
});

let users = new Map();
let matchmaking_queue = [];
let games = new Map();
let next_game_id = 0;

function new_username(username, ws) {
    // Check the username fits formatting
    if (username.length <= 0 || username.length > MAX_USERNAME_LEN) {
        return false;
    }

    // Check if the username is taken already
    if (users.has(username))
        return false;

    // valid username. Add to list
    users.set(username, { username: username, ws: ws, ready: false });
    return true;
}

function start_matchmaking(username) {
    console.log("starting matchmaking with user " + username);

    matchmaking_queue.push(username);

    if (matchmaking_queue.length > 1) {
        // match the first two people in the queue
        let first_user = users.get(matchmaking_queue.pop());
        let second_user = users.get(matchmaking_queue.pop());

        let game_id = next_game_id++;
        let game_data = {
            users: [first_user.username, second_user.username],
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            ly: 100,
            ry: 100
        };
        
        games.set(game_id, game_data);

        console.log("Matched " + first_user.username + " with " + second_user.username);

        first_user.ws.send(JSON.stringify({
            type: "match",
            username: second_user.username,
            game_id: game_id
        }));
        second_user.ws.send(JSON.stringify({
            type: "match",
            username: first_user.username,
            game_id: game_id
        }));
    }
}

function start_game(game_id) {
    console.log("starting game " + game_id);

    let game = games.get(game_id);
    let first_user = users.get(game.users[0]);
    let second_user = users.get(game.users[1]);

    first_user.ws.send(JSON.stringify({
        type: "start",
        is_left: true
    }));
    second_user.ws.send(JSON.stringify({
        type: "start",
        is_left: false
    }));
}
