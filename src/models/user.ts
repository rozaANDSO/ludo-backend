import mongoose from "mongoose";

const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    fname: { type: String, maxLength: 100, required: true },
    lname: { type: String, maxLength: 100, required: true },
    username: {
      type: String,
      minLength: 6,
      maxLength: 100,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      minLength: 3,
      maxLength: 100,
      required: true,
      unique: true,
    },
    number: {
      type: String,
      minLength: 10,
      maxLength: 10,
      required: true,
      unique: true,
    },
    password: { type: String, minLength: 6, maxLength: 100, required: true },
    credit: {
      type: Number,
      default: 1000
    }
  },
);
export default mongoose.model("User", userSchema);