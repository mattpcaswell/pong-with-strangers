const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const wss = new WebSocket.Server({port: 8080});

const MAX_USERNAME_LEN = 12; // 12 characters
const MIN_HEIGHT = 400;
const MIN_WIDTH = 400;

app.use(express.json());

app.listen(port, () => console.log(`Listening on port ${port}!`));

app.use(express.static('../client'));

wss.on('connection', ws => {
    ws.on('message', message => {
	console.log("ws message: " + message);

	let msg = JSON.parse(message);
	switch (msg.type) {
	    case "username-req":
		username_req(ws, msg);
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
let running_games = [];
let next_game_id = 0;

function username_req(ws, msg) {
    let req_username = msg.username;
    let user_height = Math.max(msg.height, MIN_HEIGHT);
    let user_width  = Math.max(msg.width, MIN_WIDTH);
    let valid_username = true;

    // Check the username fits formatting and is not taken
    if (req_username.length > MAX_USERNAME_LEN || users.has(req_username))
	valid_username = false;

    // valid username. Add to list
    let user = {
	username: req_username,
	ws: ws,
	ready: false,
	height: user_height,
	width: user_width
    };
    users.set(req_username, user);

    ws.send(JSON.stringify({
	type: "username-req-resp",
	username: req_username,
	valid: valid_username,
	height: user_height,
	width:  user_width
    }));

    if (valid_username)
	start_matchmaking(req_username);
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
	    width: Math.min(first_user.width, second_user.width),
	    height: Math.min(first_user.height, second_user.height),
	    x: 100,
	    y: 100,
	    vx: 0,
	    vy: 0,
	    ly: 100,
	    ry: 100
	};
	
	games.set(game_id, game_data);

	console.log("Matched " + first_user.username + " with " + second_user.username);
	console.log("game data: " + JSON.stringify(game_data));
	console.log("first user width: " + JSON.stringify(first_user.width));

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

    game.last_tick_time = Date.now();

    first_user.ws.send(JSON.stringify({
	type: "start",
	is_left: true
    }));
    second_user.ws.send(JSON.stringify({
	type: "start",
	is_left: false
    }));

    // initialize positions
    // ball x, y, velocity x, velocity y
    game.bx = game.width / 2;
    game.by = game.height / 2;
    game.bvx = 50;
    game.bvy = 50

    // left player position and velocity
    game.ly = game.height / 2;
    game.lv = 0;

    // right player position and velocity
    game.ry = game.height / 2;
    game.rv = 0;

    games.set(game_id, game);

    console.log("Game: " + JSON.stringify(game));
    running_games.push(game_id);
}

setInterval(tick_games, 30); // run games at max 30fps
function tick_games() {
    running_games.map(tick_game);
}

function tick_game(game_id) {
    let game = games.get(game_id);

    // calculate and update delta
    let now = Date.now();
    let delta = (now - game.last_tick_time) / 1000;
    game.last_tick_time = now;

    // step players
    game.ly += delta * game.lv;
    game.ry += delta * game.rv;

    game.ly = clamp(game.ly, 0, game.height);
    game.ry = clamp(game.ry, 0, game.height);

    // step ball
    game.bx += delta * game.bvx;
    game.by += delta * game.bvy;

    // bounce ball off walls
    if (game.by >= game.height) {
	// Fix overshoot
	//  overshoot = bally - height
	//  newy = height - overshoot
	//  newy = height - bally + height = 2height - bally
	game.by = (2 * game.height) - game.by;
	game.bvy = -game.bvy; // bounce
    } else if (game.by <= 0) {
	game.by = -game.by;   // Fix overshoot
	game.bvy = -game.bvy; // Bounce
    }


    // bounce ball off sides FOR TESTING TODO: DELETE
    if (game.bx <= 0 || game.bx >= game.width)
	game.bvx = - game.bvx;

    games.set(game_id, game);
    tick_clients(game_id);
}

function tick_clients(game_id) {
    let game = games.get(game_id);
    let ws1 = username_to_ws(game.users[0]);
    let ws2 = username_to_ws(game.users[1]);

    let game_data = {
	type: "update",
	bx: game.bx,
	by: game.by,
	bvx: game.bvx,
	bvy: game.bvy,
	ly: game.ly,
	lv: game.lv,
	ry: game.ry,
	rv: game.rv
    };

    ws1.send(JSON.stringify(game_data));
    ws2.send(JSON.stringify(game_data));
}

function username_to_ws(username) {
    let user = users.get(username);

    if (user == undefined)
	return undefined;

    return user.ws;
}

function clamp(x, min, max) {
    return x >= max ? max : (x <= min ? min : x);
}
