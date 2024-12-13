import { BASE_POSITIONS, initalPos } from "../game/constants";

export class Positions {
  P1: string[];
  P2: number[];
  P3: number[];
  P4: number[];
  constructor() {
    this.P1 = new Array(...BASE_POSITIONS.P1);
    this.P2 = new Array(...BASE_POSITIONS.P2);
    this.P3 = new Array(...BASE_POSITIONS.P3);
    this.P4 = new Array(...BASE_POSITIONS.P4);
  }
}
export type LobbyEmit = {
  //sent from server
  code: 200;
  msg: string;
  lobby: Lobby;
  //
};
export type Lobby = {
  lobbyId: string;
  owner: string;
  players: string[];
  started: number;
  amount: number;
  state: string;
  turn: number;
  positions: Positions;
  password: boolean;
};
export type ErrorEvent = {
  title: string;
  description: string;
};
