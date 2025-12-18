import app from "./app.js";
import connect_to_db from "./src/db/mysql.db.js";

const port = process.env.PORT || 5000;

connect_to_db()
    .then((db) => {
        app.locals.database = db;
        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to database:", err);
        process.exit(1);
    });