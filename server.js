// MongoDB driver
const mongoose = require('mongoose');
// Obsługa zmiennych środowiskowych
const dotenv = require('dotenv');

// 122. Catching Uncaught Exceptions
// ex. console.log(x);
// Obsługa tego musi być przed kodem
process.on('uncaughtException', err => {
    console.log('UNCAUGHT REJECTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Plik konfiguracyjny
dotenv.config({ path: './config.env' });
// Instancja express
const app = require('./app');

// Przygotowanie connect string
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// Nawiązanie połączenia z DB
mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('DB connection: succesful');
    });

// Server config
const port = process.env.PORT || 8080;

// Server start
const server = app.listen(port, () => {
    // Clear the console
    process.stdout.write('\x1Bc');

    console.log(`App running on port: ${port}`);
    console.log(`Mode: ${process.env.NODE_ENV}`);
});

// 121. Errors Outside Express: Unhandled Rejections
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);

    server.close(() => {
        process.exit(1);
    });
});
