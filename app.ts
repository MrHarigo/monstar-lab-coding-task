import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  const dotenvResult = dotenv.config();
  if (dotenvResult.error) {
    throw dotenvResult.error;
  }
}

import * as express from 'express';
import * as http from 'http';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import * as cors from 'cors';
import {CommonRoutesConfig} from './src/common/common.routes.config';
import {UsersRoutes} from './src/users/users.routes.config';
import {AuthRoutes} from './src/auth/auth.routes.config';
import {MoviesRoutes} from './src/movies/movies.routes.config';
import {FavoritesRoutes} from './src/favorites/favorites.routes.config';
import debug from 'debug';
import * as helmet from 'helmet';

const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('./swagger-config.yaml');

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({all: true})
  ),
};

if (!process.env.DEBUG) {
  loggerOptions.meta = false; // when not debugging, make terse
  if (typeof global.it === 'function') {
    loggerOptions.level = 'http'; // for non-debug test runs, squelch entirely
  }
}

app.use(expressWinston.logger(loggerOptions));

routes.push(new UsersRoutes(app));
routes.push(new AuthRoutes(app));
routes.push(new MoviesRoutes(app));
routes.push(new FavoritesRoutes(app));

const runningMessage = `Server running at http://localhost:${
  process.env.PORT || 3000
}`;
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send(runningMessage);
});
export default server.listen(process.env.PORT || 3000, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });
  console.log(runningMessage);
});
