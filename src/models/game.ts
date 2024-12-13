import mongoose from "mongoose";

const Schema = mongoose.Schema;
const gameSchema = new Schema({
  owner: { type: String, maxLength: 100, required: true },
  players: [{
    type: String, minLength: 6,
    maxLength: 100,
    required: true,
  }],
  amount: { type: Number, required: true },
  winner: { type: String, maxLength: 100, required: true },
  timestamp: { type: Date, default: Date.now },
});
export default mongoose.model("Game", gameSchema);
