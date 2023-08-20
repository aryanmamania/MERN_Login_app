import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required :  [true, "PLease provide unique Username"],
        unique: [true, "UserName exist"]
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        unique: false,
    },
    email: {
        type: String,
        required: [true, "Please Provide a unique email"],
        unique: true,
    },
    firstName: {type: String},
    lastName: {type: String},
    mobile: {type: Number},
    address: {type: String},
    profile: {type: String},
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);