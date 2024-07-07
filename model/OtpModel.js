import { mongoose } from "mongoose";

  const OtpSchema = new mongoose.Schema({
    email:{type: String},
    otp:{type: String},
});

const Otp = mongoose.model("otps", OtpSchema)

export {Otp as OtpModel}
