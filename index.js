let username_input, submit_button;

function setup() {
    // create canvas
    createCanvas(windowWidth, windowHeight);

    username_input = createInput();
    username_input.position(20, 65);

    submit_button = createButton('submit');
    submit_button.position(username_input.x + username_input.width, 65);
    submit_button.mousePressed(submit_username);

    let greeting = createElement('h2', 'Choose a username');
    greeting.position(20, 5);

    textAlign(CENTER);
    textSize(50);
}

function submit_username() {
    const username = username_input.value();
    username_input.value('');

    if (username == '')
	return;

    // disable the submit button until we hear back from server
    submit_button.html('Submitting...');
    submit_button.attribute('disabled', '');
    

    for (let i = 0; i < 200; i++) {
	push();
	fill(random(255), 255, 255);
	translate(random(width), random(height));
	rotate(random(2 * PI));
	text(username, 0, 0);
	pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
