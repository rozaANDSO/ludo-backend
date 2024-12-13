import { Server } from "socket.io";
import { Lobby, Positions } from "../types/roza";
import {
  BASE_POSITIONS,
  HOME_ENTRANCE,
  HOME_POSITIONS,
  PLAYERS,
  SAFE_POSITIONS,
  START_POSITIONS,
  STATE,
} from "./constants";
import { getIncrementedPosition, hasPlayerWon } from "./helpers";

import game from "../../models/game";
import user from "../../models/user";

type Player = {
  name: string;
  active: boolean;
};

export default class Ludo {
  private lobbyId: string;
  private playersMap: { [key: string]: string };
  private lobbyStarted: number; //0 1 2
  private lobbyOwner: string;
  private players: string[];
  private positions: Positions;
  private diceValue: number;
  private turn;
  password: string;
  amount: number;
  private diceState: string;
  private elgibles: number[];
  constructor(id: string, owner: string, amount: number, password: string) {
    this.lobbyStarted = 0;
    this.amount = amount;
    this.password = password;
    this.players = [];
    this.positions = new Positions();
    this.diceValue = 6;
    this.turn = 0;
    this.diceState = STATE.DICE_NOT_ROLLED;
    this.elgibles = [];
    this.playersMap = {};
    this.lobbyId = id;
    this.lobbyOwner = owner;
  } //

  public diceClick(io: any, username: string) {
    if (
      this.players.indexOf(username) != this.turn ||
      this.diceState == STATE.DICE_ROLLED
    ) {
      return;
    }
    //1 + Math.floor(Math.random() * 6);
    const randomNo = Math.floor(Math.random() * 6 + 1);
    this.diceValue = randomNo;
    io.to(this.lobbyId).emit("dice_value", this.diceValue);
    this.diceState = STATE.DICE_ROLLED;
    io.to(this.lobbyId).emit("dice_state", STATE.DICE_ROLLED);
    this.checkForEligiblePieces(io);
  }
  checkForEligiblePieces(io: any) {
    //
    const player = PLAYERS[this.turn];
    const eligiblePieces = this.getEligiblePieces(player);
    this.elgibles = eligiblePieces;
    if (eligiblePieces.length) {
      io.to(this.lobbyId).emit("highlight", { player, eligiblePieces });
    } else {
      this.incrementTurn(io);
    }
  }
  incrementTurn(io: any) {
    if (this.turn === this.players.length - 1) {
      this.turn = 0;
    } else {
      this.turn++;
    }
    io.to(this.lobbyId).emit("turn", this.turn);
    this.diceState = STATE.DICE_NOT_ROLLED;
    io.to(this.lobbyId).emit("dice_state", STATE.DICE_NOT_ROLLED);
  }
  private getEligiblePieces(player: string) {
    return [0, 1, 2, 3].filter((piece) => {
      const currentPosition = this.positions[player][piece];

      if (currentPosition === HOME_POSITIONS[player]) {
        return false;
      }

      if (
        BASE_POSITIONS[player].includes(currentPosition) &&
        this.diceValue !== 6
      ) {
        return false;
      }

      if (
        HOME_ENTRANCE[player].includes(currentPosition) &&
        this.diceValue > HOME_POSITIONS[player] - currentPosition
      ) {
        return false;
      }

      return true;
    });
  }

  public startGame(io: any, username: string) {
    if (this.lobbyOwner !== username) {
      return;
    }
    //@ts-ignore
    this.positions = structuredClone(BASE_POSITIONS);

    PLAYERS.forEach((player) => {
      [0, 1, 2, 3].forEach((piece) => {
        this.setPiecePosition(player, piece, this.positions[player][piece], io);
      });
    }); ////
    this.lobbyStarted = 1;
    this.turn = 0;
    io.to(this.lobbyId).emit("turn", 0);
    this.diceState = STATE.DICE_NOT_ROLLED;
    io.to(this.lobbyId).emit("dice_state", STATE.DICE_NOT_ROLLED);
    io.to(this.lobbyId).emit("reset", this.lobbyInfo());
  }

  public handlePieceClick(
    ///////////////////////////////////////////////////
    player: string,
    piece: number,
    io: Server,
    username: string,
    games: {
      [key: string]: Ludo;
    }
  ) {
    if (
      this.players.indexOf(username) != this.turn ||
      this.diceState == STATE.DICE_NOT_ROLLED
    ) {
      // console.log("not your turn", this.turn);
      return;
    }
    if (!this.elgibles.includes(piece)) {
      // console.log("not eligible piece");
      return;
    }
    console.log(this.lobbyId);
    const currentPosition = this.positions[player][+piece];

    if (BASE_POSITIONS[player].includes(currentPosition)) {
      this.diceState = STATE.DICE_NOT_ROLLED;
      io.to(this.lobbyId).emit("dice_state", STATE.DICE_NOT_ROLLED);
      this.setPiecePosition(player, piece, START_POSITIONS[player], io);

      this.incrementTurn;
      io.to(this.lobbyId).emit("unhighlight");

      return;
    }
    this.diceState = STATE.DICE_NOT_ROLLED;
    io.to(this.lobbyId).emit("dice_state", STATE.DICE_NOT_ROLLED);
    io.to(this.lobbyId).emit("unhighlight");

    this.movePiece(player, piece, this.diceValue, io, games);
  }
  //
  private setPiecePosition(
    player: string,
    piece: number,
    newPosition: number, //check home base
    io: Server
  ) {
    this.positions[player][piece] = newPosition;
    io.to(this.lobbyId).emit("position_ui", { player, piece, newPosition });
  }

  private movePiece(
    player: string,
    piece: number,
    moveBy: number,
    io: any,
    games: {
      [key: string]: any;
    }
  ) {
    const interval = setInterval(async () => {
      this.incrementPiecePosition(player, piece, io);
      moveBy--;

      if (moveBy === 0) {
        clearInterval(interval);

        if (hasPlayerWon(this.positions, player)) {
          io.to(this.lobbyId).emit("player_won", player);
          io.to(this.lobbyId).emit("game_ended", this.playersMap[player]);
          const winner = player == "P1" ? this.players[0] : this.players[1];
          // await addWinningGame(player, this.amount, this.lobbyOwner, this.players)
          //clear the object

          delete games[this.lobbyId]; ///////////////////////////////////////////////game end

          await new game({
            amount: this.amount,
            owner: this.lobbyOwner,
            players: this.players,
            winner,
          }).save();
          await user.findOneAndUpdate(
            { username: winner },
            { $inc: { credit: this.amount * 2 } }
          );
          //save to database

          // /
          return;
        }

        const isKill = this.checkForKill(player, piece, io);

        if (isKill || this.diceValue === 6) {
          this.diceState = STATE.DICE_NOT_ROLLED;
          io.to(this.lobbyId).emit("dice_state", STATE.DICE_NOT_ROLLED);
          return;
        }
        ///
        if (HOME_POSITIONS[player] == this.positions[player][piece]) {
          return;
        }
        // this.positions[player][piece]
        ///
        this.incrementTurn(io);
      }
    }, 200);
    io.to(this.lobbyId).emit("unhighlight");
  }

  private checkForKill(player: string, piece: number, io: any) {
    const currentPosition = this.player[player][piece];
    let kill = false;

    [0, 1, 2, 3].forEach((piece) => {
      PLAYERS.filter((p) => {
        if (p == player) {
          return false;
        } else {
          return true;
        }
      }).forEach((opponent) => {
        const opponentPosition = this.positions[opponent][piece];

        if (
          currentPosition === opponentPosition &&
          !SAFE_POSITIONS.includes(currentPosition)
        ) {
          this.setPiecePosition(
            opponent,
            piece,
            BASE_POSITIONS[opponent][piece],
            io
          );
          kill = true;
        }
      });
    });
    return kill;
  }
  //
  private incrementPiecePosition(player: string, piece: number, io: any) {
    this.setPiecePosition(
      player,
      piece,
      getIncrementedPosition(this.positions, player, piece),
      io
    );
  } //

  public addPlayer(player: string, io: any) {
    this.players.push(player);
    this.playersMap[`P${this.players.length}`] = player;
    io.to(this.lobbyId).emit("dis_con", this.lobbyInfo());
  }
  public removePlayer(player: string) {
    this.players = this.players.filter((p) => p !== player);
  } ////
  public lobbyInfo(): Lobby {
    return {
      lobbyId: this.lobbyId,
      owner: this.lobbyOwner,
      players: this.players,
      started: this.lobbyStarted,
      amount: this.amount,
      state: this.diceState,
      turn: this.turn,
      positions: this.positions,
      password: this.password ? true : false,
    };
  }
}
