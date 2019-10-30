import express from 'express';
import bodyParser from 'body-parser';
import redis from 'redis';
import cors from 'cors';

import {statusRoutes, webhookRoutes} from './routes';
import Request from './services/request.service';
import {CONFIG} from './constants';

// App
const app = express();

/**
 * The redis configuration
 */
const redisClient = redis.createClient(CONFIG.REDIS);

/**
 * Axios service
 */
const api = new Request();

//Middlewares
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
app.use(cors());
app.use(statusRoutes());
app.use(webhookRoutes(redisClient, api));

export default app

