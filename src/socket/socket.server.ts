import { Server } from "socket.io";
import http from "http";
import Ludo from "../utils/game/Ludo";
import { v4 as uuidv4 } from "uuid";
import deserializeSocket from "../middleware/deserializeUser";
import user from "../models/user";
import { ErrorEvent, LobbyEmit } from "../utils/types/roza";

const socketServer = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>
) => {
  const io = new Server(server, {
    cookie: true,
    cors: {
      origin: [
        "http://localhost:5173",
        "https://marvelous-starlight-d53fef.netlify.app",
        "https://nextludo.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const games: {
    [key: string]: Ludo;
  } = {};
  io.use(deserializeSocket);
  try {
    io.on("connection", (socket: any) => {
      console.log(socket.id, "lobby");
      //
      for (const key in games) {
        if (
          games.hasOwnProperty(key) &&
          games[key].lobbyInfo().players.includes(socket.request.user)
        ) {
          socket.emit("already_game", "you already have a game");
        }
      }
      //

      //@ts-ignore
      socket.on("lobbies", (search, ack) => {
        let playerLobby;
        for (const key in games) {
          if (
            games.hasOwnProperty(key) &&
            games[key].lobbyInfo().players.includes(socket.request.user)
          ) {
            socket.emit("already_game", games[key].lobbyInfo());
          }
          socket.join(games[key].lobbyInfo().lobbyId);
        }

        const list = [];
        if (search) {
          //
          for (const key in games) {
            if (
              games.hasOwnProperty(key) &&
              games[key].lobbyInfo().owner == search
            ) {
              list.push(games[key].lobbyInfo());
            }
          }
          if (list.length == 0) {
            const err: ErrorEvent = {
              title: "not found",
              description: "there are no lobbies with that username",
            };
            socket.emit("error_emit", err);
          }
          ack(list);
          return;
        }
        for (const key in games) {
          if (
            games.hasOwnProperty(key) &&
            games[key].lobbyInfo().players.length == 1
          ) {
            list.push(games[key].lobbyInfo());
          }
        }
        ack(list);
      });
      socket.on("lobby_data", (lobbyId: string, ack: any) => {
        for (const key in games) {
          if (
            games.hasOwnProperty(key) &&
            games[key].lobbyInfo().lobbyId == lobbyId
          ) {
            ack(games[key].lobbyInfo());
          }
        }
      });
      socket.on("user", async (ack: any) => {
        try {
          //@ts-ignore////
          const username = socket.request.user;
          if (!username) {
            ack(null);
            return;
          }
          const userData = await user.findOne({ username });
          if (!userData) {
            ack(null);
            return;
          }
          ack(userData);
        } catch (err) {
          console.error(err);
        }
      });
      socket.on("user_data", async (ack: any) => {
        //@ts-ignore////
        const username = socket.request.user;
        const userData = await user.findOne({ username });
        if (!userData) {
          const err: ErrorEvent = {
            title: "not found",
            description: "user data couldn't be found",
          };
          socket.emit("error_emit", err);
          return;
        }
        //@ts-ignore
        userData.password = null;
        ack(userData);
      });
      socket.on("create", async (amount: any, password: any, ack: any) => {
        //check if user has the required amount

        //@ts-ignore////
        const username = socket.request.user;

        const userData = await user.findOne({ username });

        if (!userData) {
          const err: ErrorEvent = {
            title: "not found",
            description: "user data couldn't be found",
          };
          socket.emit("error_emit", err);

          return;
        }
        if (userData.credit < amount) {
          const err: ErrorEvent = {
            title: "You don't have enough credits",
            description: "Add credits to your account to play",
          };
          socket.emit("error_emit", err);
          return;
        }
        userData.credit = userData.credit - amount;
        await userData.save();
        const roomId = uuidv4();
        //@ts-ignore////
        socket.request.lobby = roomId;
        const ludo = new Ludo(roomId, username, amount, password);
        ludo.addPlayer(username, io);
        games[roomId] = ludo;
        socket.join(roomId);
        const emit: LobbyEmit = {
          code: 200,
          msg: "lobby created",
          lobby: ludo.lobbyInfo(),
        };
        ack(emit);
      });
      socket.on("join", async (lobbyId: any, password: any, ack: any) => {
        ///////////////join game
        const game = games[lobbyId];

        if (!game) {
          const err: ErrorEvent = {
            title: "lobby doesn't exist",
            description: "",
          };
          socket.emit("error_emit", err);
          return;
        }
        if (game.password !== "") {
          if (game.password !== password) {
            const err: ErrorEvent = {
              title: "Incorrect password",
              description: "password doesn't match",
            };
            socket.emit("error_emit", err);
            return;
          }
        }
        //@ts-ignore////
        const name = socket.request.user;
        //@ts-ignore////
        socket.request.lobby = lobbyId;
        if (game.lobbyInfo().players.includes(name)) {
          const err: ErrorEvent = {
            title: "you own this game",
            description: "you can't enter a game you created",
          };
          socket.emit("error_emit", err);
          return;
        }
        if (game.lobbyInfo().started != 0) {
          const err: ErrorEvent = {
            title: "Unable to join",
            description: "Game already started",
          };
          socket.emit("error_emit", err);
          return;
        }

        //@ts-ignore////
        if (game.lobbyInfo().players >= 2) {
          const err: ErrorEvent = {
            title: "Unable to Join",
            description: "lobby full",
          };
          socket.emit("error_emit", err);
          return;
        }
        //@ts-ignore////
        const username = socket.request.user;
        const userData = await user.findOne({ username });
        if (!userData) {
          const err: ErrorEvent = {
            title: "not found",
            description: "user data couldn't be found",
          };
          socket.emit("error_emit", err);
          return;
        }
        //
        if (userData?.credit < game.amount) {
          const err: ErrorEvent = {
            title: "not found",
            description: "you don't have enough credits",
          };
          socket.emit("error_emit", err);
          return;
        }
        userData.credit = userData.credit - game.amount;
        await userData.save(); ///////////////////////////////////////////update game
        //

        games[lobbyId].addPlayer(name, io);

        socket.join(lobbyId);

        const emit: LobbyEmit = {
          code: 200,
          msg: "joined",
          lobby: game.lobbyInfo(),
        };
        ack(emit);
      }); //
      //gamestart///c
      socket.on("start_reset", (lobbyId: string) => {
        //@ts-ignore////
        const name = socket.request.user;
        const game = games[lobbyId];
        if (!game) {
          const err: ErrorEvent = {
            title: "lobby doesn't exist",
            description: "",
          };
          socket.emit("error_emit", err);
          return;
        }
        if (game.lobbyInfo().players.length <= 1) {
          const err: ErrorEvent = {
            title: "Unable to start",
            description: "there is only one player",
          };
          socket.emit("error_emit", err);
          return;
        }

        game.startGame(io, name);
      });
      socket.on("dice_roll", (lobbyId: string) => {
        const ludo = games[lobbyId];
        if (!ludo) {
          const err: ErrorEvent = {
            title: "lobby doesn't exist",
            description: "",
          };
          socket.emit("error_emit", err);
          return;
        }
        //@ts-ignore
        games[lobbyId].diceClick(io, socket.request.user);
      });
      socket.on(
        "piece_click",
        (lobbyId: string, player: string, piece: string) => {
          const ludo = games[lobbyId];
          if (!ludo) {
            const err: ErrorEvent = {
              title: "lobby doesn't exist",
              description: "",
            };
            socket.emit("error_emit", err);
            return;
          }
          if (![0, 1, 2, 3].includes(+piece)) {
            const err: ErrorEvent = {
              title: "Unkown piece",
              description: "",
            };
            socket.emit("error_emit", err);
            return;
          }
          //@ts-ignore
          ludo.handlePieceClick(player, +piece, io, socket.request.user, games);
        }
      );
      socket.on("disconnect", () => {
        // //@ts-ignore/////
        // const name = socket.request.user;
        // //@ts-ignore////
        // const lobbyId = socket.request.lobby;
        // if (!name || !lobbyId) {
        //   return;
        // }
        // const ludo = games[lobbyId];
        // if (!ludo) {
        //   return;
        // }
        // if (ludo.lobbyInfo().owner == name && ludo.lobbyInfo().started == 0) {
        //   delete games[lobbyId];
        //   return;
        // }
        // if (ludo.lobbyInfo().started != 0) {
        //   const players = games[lobbyId].lobbyInfo().players
        //   const winner = players[0] == name ? players[1] : players[0]
        //   return;
        // }
      });
    });
  } catch (err) {
    console.error(err);
  }
};
export default socketServer;
///
