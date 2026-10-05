const User = require('../models/userModel');

// Only these fields are ever returned to the client
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email });

// POST /api/v1/users/signup
exports.signup = async (req, res) => {
  // Destructure only the fields we expect - nothing else from the body reaches the DB
  const { name, email, password, passwordConfirmation } = req.body;
  const user = await User.create({ name, email, password, passwordConfirmation });

  res.status(201).json({ status: 'success', data: { user: publicUser(user) } });
};

// POST /api/v1/users/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1) Both fields present? (the `return` stops Express from trying to respond twice)
  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
  }

  // 2) Find the user. String() stops someone sending {"$gt": ""} as the email (NoSQL injection).
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // 3) Same message for "no such user" and "wrong password" - don't reveal which emails exist
  if (!user || !(await user.isPasswordMatch(String(password)))) {
    return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
  }

  // 4) Authenticated! ...but we give the client NOTHING to prove it later.
  //    No session, no cookie, no token. The next request is anonymous again.
  res.status(200).json({
    status: 'success',
    message: 'Credentials are valid. (The server will not remember this.)',
    data: { user: publicUser(user) }
  });
};
