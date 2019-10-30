import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import {CONFIG} from './constants';
import {statusRoutes, webhookRoutes} from './routes';


// App
const app = express();

//Middlewares
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
app.use(cors());

// Routes
app.get('/', statusRoutes.checkStatus);
app.get('/webhook', webhookRoutes.getStatus);
app.post('/webhook', webhookRoutes.callStatus);

app.listen(CONFIG.SERVER.PORT, CONFIG.SERVER.HOST);

