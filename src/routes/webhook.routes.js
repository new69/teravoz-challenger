import redis from 'redis';

import Request from '../services/request.service';
import {CONFIG} from '../constants';

const _beforeThan = {
  'call.standby': 'call.new',
  'call.waiting': 'call.standby',
  'actor.entered': 'call.waiting',
  'call.ongoing': 'actor.entered',
  'actor.left': 'call.ongoing',
  'call.finished': 'actor.left'
};

/**
 * The redis configuration
 */
const redisClient = redis.createClient({
  host: 'redis',
  prot: 6379
});

/**
 * Get the call last status
 *
 * @param {object} req - The request data
 * @param {object} res - The response data
 *
 * @returns {Json}
 */
const getStatus = (req, res) => {
  redisClient.get(CONFIG.CACHE_NAME, (err, cache) => {
    if (!cache) {
      res.json({});
      return;
    }

    const customers = JSON.parse(cache);
    res.json({data: customers.filter(item => item.type !== 'call.finished')});
  });
};

/**
 * Receive data from Teravoz API
 *
 * @param {object} req - The request data
 * @param {object} res - The response data
 *
 * @returns {Json}
 */
const callStatus = (req, res) => {
  const type = req.body.type;
  let clientData = req.body;

  let cacheData = [];
  switch(type) {
    case 'call.new':
      redisClient.get(CONFIG.CACHE_NAME, (err, customers) => {
        if (!customers) {
          clientData.destination = '900';
          cacheData.push(clientData);
          redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(cacheData));

          res.json({data: cacheData});
          return;
        }

        cacheData = JSON.parse(customers);
        const exists  = cacheData.some(item => item.their_number === clientData.their_number);
        const updated = {...clientData, destination: exists ? '901' : '900'};
        let nextCache = cacheData.filter(item => item.call_id !== clientData.call_id);

        nextCache.push(updated);
        redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
        res.json({data: updated});
      });
      break;

    case 'call.standby':
      redisClient.get(CONFIG.CACHE_NAME, (err, cache) => {
        if (!_validate(cache, clientData, _beforeThan[type])) {
          res.status(404).send({message: 'Call not found'});
          return;
        }

        const customers = JSON.parse(cache);
        let customer = customers.filter(item => item.call_id === clientData.call_id);
        const params = {
          type: 'delegate',
          call_id: customer[0].call_id,
          destination: customer[0].destination
        };

        const api = new Request();
        api.post('actions', params, {})
          .then(response => {
            const updated = {...customer[0], type: clientData.type};
            let nextCache = customers.filter(item => item.call_id !== clientData.call_id);

            nextCache.push(updated);
            redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
            res.json(response);
          })
          .catch(err => {
            res.json({error: err.response.data});
          });
      });
      break;

    default:
      redisClient.get(CONFIG.CACHE_NAME, (err, cache) => {
        if (!_validate(cache, clientData, _beforeThan[type])) {
          res.status(404).send({message: 'Call not found'});
          return;
        }

        const customers = JSON.parse(cache);
        let customer = customers.filter(item => item.call_id === clientData.call_id);
        let nextCache = customers.filter(item => item.call_id !== clientData.call_id);
        const updated = {...customer[0], type: clientData.type};

        nextCache.push(updated);
        redisClient.setex(CONFIG.CACHE_NAME, 3600, JSON.stringify(nextCache));
        res.json({data: updated});
      });
  }
};

const _validate = (cache, bodyData, actionBefore) => {
  if (!cache) {
    return false;
  }

  const customers = JSON.parse(cache);
  let customer = customers.filter(item => item.call_id === bodyData.call_id);

  if (customer.length <= 0) {
    return false;
  }

  if (customer[0].type !== actionBefore) {
    return false;
  }

  return true;
};

export const webhookRoutes = {
  callStatus,
  getStatus
};

