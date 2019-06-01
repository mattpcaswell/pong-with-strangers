const express = require('express');
const app = express();
const port = 3000;

const MAX_USERNAME_LEN = 12; // 12 characters

app.use(express.json());

app.post('/username', (req, res) => {
    let requested_username = req.body.username;
    let is_valid = new_username(requested_username);
    console.log("requested username " + requested_username + " is " + (is_valid ? "valid." : "invalid."));

    res.json({
	username: requested_username,
	valid: is_valid
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.use(express.static('../client'));

let users = new Map();
function new_username(username) {
    // Check the username fits formatting
    if (username.length <= 0 || username.length > MAX_USERNAME_LEN) {
	return false;
    }

    // Check if the username is taken already
    if (users.has(username))
	return false;

    // valid username. Add to list
    users.set(username, { username: username });
    return true;
}
