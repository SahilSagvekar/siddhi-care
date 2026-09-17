const { getSession } = require('../lib/auth');

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(200).json({ signedIn: false });
    return;
  }
  res.status(200).json({ signedIn: true, email: session.email });
};
