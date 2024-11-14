const mongoose = require('mongoose');

// info: caught any exception from the server
// errors with misspeled or undefined property
process.on('uncaughtException', (err) => {
  console.error('ERROR:', err.message);
  console.log('UNCAUGHT EXCEPTION.');
  process.exit(1); // 1 - failure code / 0 - success code
});

require('dotenv').config({ path: './config.env' });
const app = require('./app');

// info: use mongoDB link to connect with mongoose module
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// info: handle errors during mongodb connection
// mongoose.connection.on('error', (err) => {
//   console.error('💥ERROR:', err.name, err.message);
//   process.exit(1); // exit the process with failure
// });

// info: connecting to mongodb using mongoose
mongoose.connect(DB).then(() => console.log('DB connected.'));

const server = app.listen(process.env.PORT, () => {
  console.log(`Server start on port ${process.env.PORT}.`);
});

// info: Handle outer errors of the app
// wrong with connection (pass, db, login, connection, net)
process.on('unhandledRejection', (err) => {
  // console.error(err.name, err.message);
  console.log('UNHANDLED: Shutting down...');

  server.close(() => {
    process.exit(1);
  });
});

// info: enable SIGTERM to finish all the processes and requests then it will authomatically use SIGKILL to force shutdown all the left processes if remain
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM Recieved. Shutting down gracefuly...');
  server.close(() => {
    console.log('Closing all remaining processes.');
    process.exit(0);
  });
});
