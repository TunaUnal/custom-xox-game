const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());


app.get('/', (req,res) => {
	res.send("Hello");
})


const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	}
});

const rooms = [];

function createEmptyGame() {
	return {
		board: Array(9).fill(null),
		moveHistory: [],
		turn: 'X', // Maça her zaman X'tir.
		win: { isWin: false, winner: null, line: null },
		restartGame: 0
	};
}

function swapRoles(room) {
	if (room.users.length === 2) {
		[room.users[0].userRole, room.users[1].userRole] = [room.users[1].userRole, room.users[0].userRole];
	}

}

function genCode(len = 4) {
	const chars = 'ABCDEFGHJKLMNPRSTUVXYZ123456789';
	let s = '';
	while (s.length < len) s += chars[Math.floor(Math.random() * chars.length)];
	return s;
}

io.on('connection', (socket) => {
	console.log('New connection:', socket.id);

	socket.on('createRoom', user => {
		socket.data.username = user.username;

		const code = genCode();
		const newUser = { id: user.id, sid: socket.id, username: user.username, userRole: "X" }

		rooms.push({
			id: code,
			users: [newUser],
			owner: socket.id,
			game: {
				number: 1,
				board: Array(9).fill(null),
				moveHistory: [],
				turn: 'X', // Oda sahibi X başlar.
				win: { isWin: false, winner: null, line: null },
				restartGame: 0
			},
			gameHistory: {
				total: {},
				history: []
			}
		});

		socket.join(code);		// Odayı oluşturan kullanıcıyı kurduğu odaya dahil ettik.
		socket.data.userRoom = code;

		const room = rooms.find(room => room.id == code)

		socket.emit('roomCreated', newUser, room);
		console.log(`🔨 Room ${code} created by ${user.username}`);
	});

	socket.on('joinRoom', ({ user, roomCode }) => {
		socket.data.username = user.username;

		const room = rooms.find(room => room.id == roomCode)

		if (!room) {
			return socket.emit('err', 'Oda bulunamadı.');
		}

		if (room.users.length >= 2) {
			return socket.emit('err', 'Oda dolu.');
		}

		let role = room.users[0].userRole == 'X' ? 'O' : 'X'

		const newUser = { id: user.id, sid: socket.id, username: user.username, userRole: role }

		room.users.push(newUser) // Kullanıcıyı room değişkenine ekledik
		socket.join(roomCode); // Kullanıcıyı odaya dahil ettik

		socket.data.userRoom = roomCode;

		socket.emit('roomJoined', newUser, room);
		io.to(roomCode).emit('someoneJoined', newUser.username, room);

		console.log(`🚪 ${user.username} joined room ${roomCode}`);

		if (room.users.length === 2) {
			io.to(room.id).emit('gameStart', { turn: 'X' });
		}
	});

	socket.on('makeMove', ({ index, roomCode }) => {

		const room = rooms.find(r => r.id === roomCode);
		if (!room || !room.game) return;

		const me = room.users.find(u => u.sid === socket.id);
		if (!me || me.userRole !== room.game.turn) return;

		console.log(me.username + " put " + me.userRole + " at cell of " + index)

		// Hamleyi tahtaya işle
		room.game.board[index] = me.userRole;

		// Yeni hamleyi geçmişe kaydet
		room.game.moveHistory.push({ index, symbol: me.userRole });

		// Eğer 7. taşa gelindiyse ilkini sil.
		if (room.game.moveHistory.length >= 7) {
			const oldest = room.game.moveHistory.shift();
			console.log("Deleted " + room.game.board[oldest.index] + " at cell of + " + oldest.index)
			room.game.board[oldest.index] = null;
		}

		// Oyun sırasını değiştir
		room.game.turn = room.game.turn === 'X' ? 'O' : 'X';

		// Sonucu (oyunu) odaya gönder
		io.to(roomCode).emit('boardUpdate', room.game);

		// Kazanma kontrolü
		const result = checkWinAtMove(room.game.board, index, 3);
		if (result) {
			// Kazanan var: tüm odadakilere gameOver bildir
			winnerUser = room.users.find(usr => usr.userRole == result.player);
			room.game.win = { isWin: true, winner: winnerUser, line: result.line }

			room.gameHistory.total[room.game.win.winner.sid] = (room.gameHistory.total[room.game.win.winner.sid] || 0) + 1

			io.to(roomCode).emit('gameOver', room.game, room.gameHistory);
			return;
		}

	});

	socket.on('restartGame', () => {

		const room = rooms.find(room => room.id == socket.data.userRoom);
		if (!room) {
			socket.emit('err', "Oda Bulunamadı");
			console.log("no room")
			return;
		}

		const user = room.users.find(usr => usr.sid == socket.id);
		if (!user) {
			socket.emit('err', "Kullanıcı Bulunamadı");
			console.log("no user");
			return;
		}

		if ((room.game.restartGame != 0) && (room.game.restartGame != user.sid)) {
			swapRoles(room)
			room.game = createEmptyGame();
			io.to(room.id).emit('gameRestart', room);
		} else {
			room.game.restartGame = user.sid;
		}

	})

	socket.on('quitRoom', () => {

		const room = rooms.find(room => room.id == socket.data.userRoom);
		if (!room) {
			socket.emit('err', "Oda Bulunamadı");
			console.log("no room")
			return;
		}

		const user = room.users.find(usr => usr.sid == socket.id);
		if (!user) {
			socket.emit('err', "Kullanıcı Bulunamadı");
			console.log("no user");
			return;
		}

		socket.leave(room.id);
		room.users = room.users.filter(u => u.sid !== user.sid);

		delete socket.data.userRoom; // Oda bilgisini temizle

		if (room.users.length == 0) {
			//Odayı tamamen sil
			const idx = rooms.findIndex(r => r.id === room.id);
			rooms.splice(idx, 1);
		} else {
			let youAreNowOwner = false;

			//Eğer ayrılan kişi oda sahibi ise;
			if (room.owner == user.sid) {
				//Odada kalan diğer kişiyi oda sahibi yaptık.
				room.owner = room.users[0].sid
				youAreNowOwner = true
			}

			io.to(room.id).emit('someoneLeaved', room, user.username, youAreNowOwner);
		}
		socket.emit('roomLeaved')

	})

	socket.on('kickUser', () => {
		const room = rooms.find(room => room.id == socket.data.userRoom);
		if (!room) {
			socket.emit('err', "Oda Bulunamadı");
			console.log("no room")
			return;
		}

		const user = room.users.find(usr => usr.sid == socket.id);
		if (!user) {
			socket.emit('err', "Kullanıcı Bulunamadı");
			console.log("no user");
			return;
		}

		if (room.owner != user.sid) {
			socket.emit('err', "Yetkin yok, oda sahibi değilsin");
			console.log("not allowed");
			return;
		}

		const kickedUser = room.users.find(usr => usr.sid != user.sid)

		const targetSocket = io.sockets.sockets.get(kickedUser.sid);

		if (targetSocket) {
			targetSocket.leave(room.id);      // Kullanıcı odadan çıkarılır
			targetSocket.emit('roomKicked');      // Ona "Atıldın" mesajı gönderilir
		}

		room.users = room.users.filter(usr => usr.sid != kickedUser.sid)
		io.to(room.id).emit('userKicked', room, kickedUser.username);

	})

	socket.on('disconnect', (reason) => {
		console.log(socket.data.username, ' disconnect');
		if (socket.data.username) {
			const roomCode = socket.data.userRoom;
			if (!roomCode) { console.log("HATA | Oyuncu çıktı ama oda kodu yok."); return; };
			const idx = rooms.findIndex(room => room.id == socket.data.userRoom)
			if (idx == -1) { console.log("HATA | Oyuncu çıktı ama odayı bulamadım."); return; };

			const room = rooms[idx];
			room.users = room.users.filter(u => u.username !== socket.data.username)

			//Eğer odada kimse kalmamışsa odayı kapat.
			if (room.users.length === 0) {
				rooms.splice(idx, 1);
			} else {
				io.to(socket.data.userRoom).emit('someoneLeaved', room);
			}
		}
	});
});

server.listen(3000, () => {
	console.log('Sunucu 3000 portunda çalışıyor.');
});

/**
 * Son hamlenin konumuna göre tahtada K kadar yatay/dikey/çapraz aynı sembol var mı bakar.
 *
 * @param {'X'|'O'|null} board[]   - 9 elemanlı 1D dizi, index 0…8
 * @param {number} idx             - Son hamlenin index'i (0…8)
 * @param {number} K               - Kaç aynı sembol olunca kazanırız (3 için klasik XOX)
 * @returns {{ player: 'X'|'O', line: number[] } | null}
 */
function checkWinAtMove(board, idx, K = 3) {
	const N = 3;                       // 3×3 tahta
	const player = board[idx];        // 'X' veya 'O'
	if (!player) return null;

	// idx → satır r, sütun c
	const r = Math.floor(idx / N);
	const c = idx % N;

	// 4 ana yön (dr, dc)
	const directions = [
		[0, 1],   // yatay
		[1, 0],   // dikey
		[1, 1],   // çapraz ↘
		[1, -1],  // çapraz ↙
	];

	for (let [dr, dc] of directions) {
		let count = 1;
		// kazanan üçlüyü tutacak geçici dizi
		const lineIndices = [idx];

		// pozitif yönde say
		let rr = r + dr, cc = c + dc;
		while (
			rr >= 0 && rr < N &&
			cc >= 0 && cc < N &&
			board[rr * N + cc] === player
		) {
			count++;
			lineIndices.push(rr * N + cc);
			rr += dr;
			cc += dc;
		}

		// negatif yönde say
		rr = r - dr; cc = c - dc;
		while (
			rr >= 0 && rr < N &&
			cc >= 0 && cc < N &&
			board[rr * N + cc] === player
		) {
			count++;
			lineIndices.push(rr * N + cc);
			rr -= dr;
			cc -= dc;
		}

		if (count >= K) {
			return { player, line: lineIndices };
		}
	}

	return null;
}
