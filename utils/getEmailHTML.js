function getEmailHTML(resetToken, req) {
  // use 'req' to get the protocol and 'reset token' to get the full url
  const resetURL = ;
  // create any message you want to tell to the user
  const message = ;

  // return those two
  return { resetURL, message };
}

module.exports = { getEmailHTML };
