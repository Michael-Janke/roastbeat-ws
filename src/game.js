var lastPin = 0;
function generatePin() {
	return lastPin++;
}

class Game {
    constructor(client) {
        this.players = [];
        this.pin = generatePin();
        this.state = "LOBBY";
        this.creator = client;
    }
}

export default Game;