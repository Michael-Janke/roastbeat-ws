const WebSocket = require('ws');
import Player from './player'
import Game from './game'

const wss = new WebSocket.Server({ port: 8080 });

let games = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
  	console.log(message);
    try {
    	let messageObject = JSON.parse(message);

	    switch(messageObject.command) {
	    	case "CREATE_GAME": createGame(ws); break;
	    	case "JOIN_GAME": joinGame(ws, messageObject.name, messageObject.pin); break;
	    	case "ANSWER": answer(ws, messageObject.question, messageObject.answer); break;
	    	case "UPDATE_GAME": updateGame(ws, messageObject.state, message.question); break;
	    	case "LEAVE_GAME": leaveGame(ws); break;
	    	default:
	    		throw(messageObject.command + " command not defined");
	    }
  	} catch (e) {
  		ws.send(JSON.stringify({
	    	command: "ERROR",
	    	error: e.message
	    }));
  	}
  });
});

//{"command":"CREATE_GAME"}
function createGame(client) {
	let game = new Game(client);
    client.send(JSON.stringify({
    	command: "READ_PIN",
    	pin: game.pin
    }));
  	games[game.pin] = game;
  	console.log("your pin is:" + game.pin);

  	broadcastGameState(game);
}

/*
{"command":"CREATE_GAME"}
{"command":"JOIN_GAME", "pin": 0, "name": "Michael"}
*/
function joinGame(client, name, pin) {

	let game = games[pin];
	let player = new Player(name, game, client);
    console.log(game.state);
	if(game.state != "LOBBY") {
		throw ("Game is already started");
	}
    console.log("asfdsf");
	game.players.push(player);

	broadcastGameState(game);

  	console.log(name + " joined " + pin);
}

/*
{"command":"CREATE_GAME"}
{"command":"JOIN_GAME", "pin": 0, "name": "Michael"}
{"command":"LEAVE_GAME"}
*/
function leaveGame(client) {
	let gameWithPlayer = undefined;
	let name = "";
	Object.values(games).forEach((game) => {
		game.players.forEach((player, index) => {
			if(player.socket == client) {
				name = player.name;
				game.players.splice(index,1);
				gameWithPlayer = game;
			}
		});
	});

	broadcastGameState(gameWithPlayer);

  	console.log(name + " left the game");
}

//{"command":"ANSWER", "question": 0, "answer": 0}
function answer(client, question, answer) {
	let cgame = undefined;
	let cplayer = undefined;
	Object.values(games).forEach((game) => {
		game.players.forEach((player, index) => {
			if(player.socket == client) {
				cplayer = player;
				cgame = game;
			}
		});
	});

	cgame.creator.send(JSON.stringify({
		command: "READ_ANSWER",
		question: question,
		answer: answer,
		player: cplayer.name
	}));
	cgame.state = "QUESTION_ANSWERED";

	broadcastGameState(cgame);

  	console.log(cplayer.name + " left the game");
}

/*
{"command":"CREATE_GAME"}
{"command":"JOIN_GAME", "pin": 0, "name": "Michael"}
{"command":"UPDATE_GAME", "state": "READY", "question": {"song":"test"}}
*/

function updateGame(client, state, question) {
	let game = Object.values(games).filter((game) => game.creator == client)[0];
	game.state = state || game.state;
	game.question = question || game.question;

	broadcastGameState(game);

  	console.log(game.pin + " state changed");
}

function broadcastGameState(game) {
    console.log("asdfasdf");
	game.players.forEach(
		(player) => player.socket.send(JSON.stringify({
			"command" : "READ_GAME_STATE",
			"player" : game.players.map((player) => ({
				"name": player.name, 
				"score": player.score
			})),
			"state" : game.state,
			"question" : game.question,
		}))
	)
	game.creator.send(JSON.stringify({
			"command" : "READ_GAME_STATE",
			"player" : game.players.map((player) => ({
				"name": player.name, 
				"score": player.score
			})),
			"state" : game.state,
			"question" : game.question,
		}));
}

