const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide your email.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email.']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false // never returned by queries unless asked for with .select('+password')
    },
    // Only exists long enough to be validated; it is never stored
    passwordConfirmation: {
      type: String,
      required: [
        function () {
          return this.isModified('password');
        },
        'Please confirm your password.'
      ],
      validate: {
        validator(value) {
          return value === this.password;
        },
        message: 'Passwords do not match.'
      }
    }
  },
  { timestamps: true }
);

// Hash the password before saving. Validation runs first, so the rules above
// see the plain-text password; the database only ever sees the hash.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  this.passwordConfirmation = undefined;
});

// bcrypt re-hashes the candidate with the salt stored inside the hash and compares
userSchema.methods.isPasswordMatch = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
