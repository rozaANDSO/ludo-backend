import mongoose, { Schema, Document } from 'mongoose';


export interface Feedback extends Document {
  username: string;
  message: string;
  date: Date; 
}


const FeedbackSchema: Schema = new Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now } 
});


export default mongoose.model<Feedback>('Feedback', FeedbackSchema);
