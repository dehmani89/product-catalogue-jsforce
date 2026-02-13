const Pool = require('./nodejs/node_modules/pg').Pool;

module.exports = connectToDatabase = () => {

    const env = process.env.ENV;
    const region = process.env.REGION;
    const dbUserName = process.env.DB_USER_NAME;
    const dbPassword = process.env.DB_PASSWORD;
    const dbHost = process.env.DB_HOST;
    const dbName = process.env.DB_NAME;
    const dbPort = 5432;

    try {
        return new Pool({
            user: dbUserName,
            host: dbHost,
            database: dbName,
            password: dbPassword,
            port: dbPort,
            idleTimeoutMillis: 5000,
            allowExitOnIdle: true
        });
    } catch (err) {
        console.error('Error connecting to database\n' + err);
        throw new Error(err);
    }
};
