import express from 'express';

// we'll talk about this in a minute:
import serverRenderer from './middleware/renderer';

const PORT = 3000;
const path = require('path');

// initialize the application and create the routes
const app = express();
const router = express.Router();

// root (/) should always serve our server rendered page
router.use('^/$', serverRenderer);

// other static resources should just be served as they are
router.use(express.static(
        path.resolve(__dirname, '..', 'build'),
        {
                maxAge: '30d'
        },
));

// tell the app to use the above rules
app.use(router);

// start the app
app.listen(PORT, (error) => {
        if (error) {
                return console.log('something bad happened', error);
        }

        console.log("listening on " + PORT + "...");
});