
import mongoose from "mongoose";
import AutoIncrementFactory from 'mongoose-sequence';
import dotenv from 'dotenv';

dotenv.config();

const connection = mongoose.createConnection(process.env.MONGODB_URI);
const AutoIncrement = AutoIncrementFactory(connection);


const UserSchema = new mongoose.Schema({
    _id: { type: Number }, // Use this field for auto-incremented ID
    title: { type: String, required: true },
    description: { type: String },
    genre: { type: String },
    releaseDate: { type: Date },
    showtimes: [{ type: String }], // array of showtimes (e.g., "10:00 AM", "1:00 PM", etc.)
    imgUrl: { type: String } // URL to the movie's poster or image
});

// Apply the auto-increment plugin to the UserSchema
UserSchema.plugin(AutoIncrement, { id: 'user_seq', inc_field: '_id' });

const UserModel = connection.model('Movie', UserSchema);

export { UserModel as Movie };