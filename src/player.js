class Player {
    constructor(name, game, socket) {
        this.name = name;
        this.game = game;
        this.socket = socket;
        this.score = 0;
    }
}

export default Player;