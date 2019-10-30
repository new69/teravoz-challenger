import axios from 'axios';
import { deepMerge, basePrefix } from '../helpers';
import {CONFIG} from '../constants';


/**
 * Base request handler for Teravoz API
 * with `get`, `post`, `put` and `delete` methods
 */
export default class Request {
  /**
   * Initialize request handler
   *
   * @param {object} settings - Settings
   */
  constructor(settings = {}) {
    this.settings = settings;
  }

  /**
   * Set API url
   *
   * @param {string} url - Base URL, example: 'https://api.teravoz.com.br/'
   */
  setUrl(url) {
    this.settings.url = url;
  }

  /**
   * Get header with auth data
   *
   * @returns {object}
   */
  getHeaders() {
    if (this.settings.url !== CONFIG.BASEURL) {
      return;
    }
    let headers = {'Content-Type': 'application/json'};

    if (CONFIG.USERNAME && CONFIG.PASSWORD) {
      const auth = `${CONFIG.USERNAME}:${CONFIG.PASSWORD}`;
      headers.Authorization = `BASIC ${Buffer.from(auth).toString('base64')}`;
    }

    return headers;
  }

  /**
   * Create new request promise
   *
   * @param {object} options - request options.
   *
   * @returns {Promise}
   */
  request(options = {}) {
    let promise =
      new Promise((resolve, reject) => {
        try {
          if (!this.settings.url) {
            this.setUrl(CONFIG.BASEURL);
          }

          let request = {
            headers: this.getHeaders()
          };

          request = deepMerge(request, options);
          request.responseType = 'json';

          axios(basePrefix(this.settings.url, request)).then(response => {
            resolve(response.data);
          }, err => {
            reject(err);
          });
        }catch (error) {
          reject(error);
        }
      });

    return promise;
  }

  /**
   * Get resource
   *
   * @param {string} path    - Request get to endpoint e.g. /api-path/1
   * @param {object} [query] - Optional request parameters.
   *
   * @returns {Promise}
   */
  get(path, query) {
    let request = {
      method: 'get',
      url   : path,
      params: query,
    };

    return this.request(request);
  }

  /**
   * Post resource
   *
   * @param {string} path    - Request post to endpoint e.g. /api-path
   * @param {object} data    - Data to be posted.
   * @param {object} [query] - Optional request parameters.
   *
   * @returns {Promise}
   */
  post(path, data, query) {
    let request = {
      method: 'post',
      url   : path,
      params: query,
      data
    };

    return this.request(request);
  }

  /**
   * Put resource
   *
   * @param {string} path    - Request put to end endpoint e.g. /api-path/1
   * @param {object} data    - Data to be updated.
   * @param {object} [query] - Optional request parameters.
   *
   * @returns {Promise}
   */
  put(path, data, query) {
    let request = {
      method: 'put',
      url   : path,
      params: query,
      data
    };

    return this.request(request);
  }

  /**
   * Delete resource
   *
   * @param {string} path    - Request delete to endpoint e.g. /api-path/1
   * @param {object} [data]  - Data to be deleted.
   * @param {object} [query] - Optional request parameters.
   *
   * @returns {Promise}
   */
  delete(path, data, query) {
    let request = {
      method: 'delete',
      url   : path,
      params: query,
      data
    };

    return this.request(request);
  }
}

