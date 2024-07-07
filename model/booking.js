import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';
import dotenv from 'dotenv';

dotenv.config();

const connection = mongoose.createConnection(process.env.MONGODB_URI);
const AutoIncrement = AutoIncrementFactory(connection);

const bookingSchema = new mongoose.Schema({
  numb: { type: Number },
  movieTitle: { type: String, required: true },
  city: { type: String },
  name: { type: String },
  email: { type: String },
  date: { type: Date },
  time: { type: String },
  seats: { type: Number },
  totalPrice: { type: Number },
  selectedSeats: { type: [String] } // Assuming selectedSeats are stored as an array of strings
});

// Apply the auto-increment plugin to the bookingSchema
bookingSchema.plugin(AutoIncrement, { id: 'booking_seq', inc_field: 'numb' });

const Booking = connection.model('Booking', bookingSchema);

export { Booking };
