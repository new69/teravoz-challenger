import app from './app';
import {CONFIG} from './constants';

app.listen(CONFIG.SERVER.PORT, CONFIG.SERVER.HOST);

