import mongoose from "mongoose";
import AutoIncrementFactory from 'mongoose-sequence';
import dotenv from 'dotenv';

dotenv.config();

const connection = mongoose.createConnection(process.env.MONGODB_URI);
const AutoIncrement = AutoIncrementFactory(connection);

const UserSchema = new mongoose.Schema({
    n: { type: Number }, // Use this field for auto-incremented ID
    name: { type: String , required:true},
    dateOfBirth: { type: Date, required:true },
    email: { type: String ,unique: true, required:true },
    password: { type: String, required:true},
    createdAt: { type: Date, default: Date.now } // Default value set to current time 
});

// Virtual for IST time
UserSchema.virtual('createdAtIST').get(function() {
    return this.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
});

// Apply the auto-increment plugin to the UserSchema
UserSchema.plugin(AutoIncrement, { id: 'user1', inc_field: 'n' });

const UserModel = connection.model("User", UserSchema);

export { UserModel as User };
