import express from 'express';
import { Movie } from '../model/movie.js';
import { User } from '../model/User.js';
import { Booking } from '../model/booking.js';
import { OtpModel } from '../model/OtpModel.js';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

// Forget password - Generate OTP and send to email
router.post('/forget-password', async (req, res) => {
    const { email } = req.body;
    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    try {
        // Check if a document with the provided email already exists
        const existingOtpDoc = await OtpModel.findOne({ email });

        if (existingOtpDoc) {
            // If document exists, update the OTP
            existingOtpDoc.otp = otp;
            await existingOtpDoc.save();
        } else {
            // If document doesn't exist, create a new one
            await OtpModel.create({ email, otp });
        }

        // Send OTP to user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: GMAIL_USER,
            to: email,
            subject: 'Verification OTP',
            text: `Your OTP for email verification is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send('Failed to send OTP');
            } else {
                res.status(200).send('OTP sent successfully');
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate OTP');
    }
});

// Verify OTP endpoint
router.post('/verify-otp-email', async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Retrieve stored OTP for the email from MongoDB
        const storedOtpDoc = await OtpModel.findOne({ email });

        if (storedOtpDoc && storedOtpDoc.otp === otp) {
            // Update user status in the database to mark email as verified (You can implement this part as needed)
            res.status(200).send('OTP verified successfully');
        } else {
            res.status(400).send('Invalid OTP');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error verifying OTP');
    }
});

router.post('/register123', async (req, res) => {
    try {
        const { name, dateOfBirth, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'You already have an account' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            dateOfBirth,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password
        user.password = hashedPassword;
        await user.save();

        // Send response
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

router.get('/fetchAll', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/fetchmovies', async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/bookings', async (req, res) => {
    const { movieTitle, city, name, email, date, time, seats, totalPrice, selectedSeats } = req.body;

    try {
        // Find the movie to validate date, time, and release date
        const movie = await Movie.findOne({ title: movieTitle });

        if (!movie) {
            return res.status(400).json({ error: 'Invalid movie title' });
        }

        // Check if selected date and time are before the movie's release date
        const selectedDateTime = new Date(`${date}T${time}`);
        const releaseDate = new Date(movie.releaseDate);

        if (selectedDateTime < releaseDate) {
            return res.status(400).json({ error: 'Selected date and time are before the movie release date' });
        }

        // Create new booking with auto-incremented `numb`
        const newBooking = new Booking({
            movieTitle,
            city,
            name,
            email,
            date,
            time,
            seats,
            totalPrice,
            selectedSeats // Include selectedSeats in the booking data
        });

        // Save booking to database
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Error submitting booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/emailOtp', async (req, res) => {
    const { email } = req.body;
    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    try {
        // Check if a document with the provided email already exists
        const existingOtpDoc = await OtpModel.findOne({ email });

        if (existingOtpDoc) {
            // If document exists, update the OTP
            existingOtpDoc.otp = otp;
            await existingOtpDoc.save();
        } else {
            // If document doesn't exist, create a new one
            await OtpModel.create({ email, otp });
        }

        // Send OTP to user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS,
            },
        });

        const mailOptions = {
            from: GMAIL_USER,
            to: email,
            subject: 'Verification OTP',
            text: `Your OTP for email verification is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send('Failed to send OTP');
            } else {
                res.status(200).send('OTP sent successfully');
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate OTP');
    }
});

// Add new route to delete a movie by its title
router.delete('/delete/:title', async (req, res) => {
    const { title } = req.params;

    try {
        const deletedMovie = await Movie.findOneAndDelete({ title });

        if (deletedMovie) {
            res.status(200).json({ message: 'Movie deleted successfully', deletedMovie });
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export { router as UserRouter }; 
