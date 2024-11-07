const mongoose = require('mongoose');

// ^ caught any exception from the server
// errors with misspeled or undefined property
process.on('uncaughtException', (err) => {
  console.error('ERROR:', err.message);
  console.error('STACK:', err.stack);
  console.log('UNCAUGHT EXCEPTION.');
  process.exit(1); // 1 - failure code / 0 - success code
});

require('dotenv').config({ path: './config.env' });
const app = require('./app');

// * use mongoDB link to connect with mongoose module
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// * handle errors during mongodb connection
// mongoose.connection.on('error', (err) => {
//   console.error('💥ERROR:', err.name, err.message);
//   process.exit(1); // exit the process with failure
// });

// * connecting to mongodb using mongoose
mongoose.connect(DB).then(() => console.log('DB connected.'));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`Server start on port ${port}.`);
});

// ^ Handle outer errors of the app
// wrong with connection (pass, db, login, connection, net)
process.on('unhandledRejection', (err) => {
  // console.error(err.name, err.message);
  console.log('UNHANDLED: Shutting down...');

  server.close(() => {
    process.exit(1);
  });
});
