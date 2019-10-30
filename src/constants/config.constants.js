export const CONFIG = Object.freeze({
  BASEURL: 'https://api.teravoz.com.br/',
  SERVER: {
    PORT: 8080,
    HOST: '0.0.0.0'
  },
  USERNAME: '',
  PASSWORD: '',
  CACHE_NAME: 'call:data',
  REDIS: {
    host:'redis'
  },
  BEFORE_THAN: {
    'call.standby': 'call.new',
    'call.waiting': 'call.standby',
    'actor.entered': 'call.waiting',
    'call.ongoing': 'actor.entered',
    'actor.left': 'call.ongoing',
    'call.finished': 'actor.left'
  },
  FIELDS: [
    'type',
    'call_id',
    'code',
    'direction',
    'our_number',
    'their_number',
    'timestamp'
  ]
});
