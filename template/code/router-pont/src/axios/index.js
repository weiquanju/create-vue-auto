import axios from 'axios'
const instance = axios.create({
  timeout: 60000,
  headers: { 'X-Custom': `JDC-${Math.random().toString(32).substring(2)}` }
})

instance.interceptors.request.use(
  function (config) {
    if (!config.headers) {
      config.headers = {}
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    console.log(error)
    const { response = {} } = error
    const { status, data } = response
    switch (status) {
      case 401:
        return Promise.reject(new Error('Unauthorized'))
      default: {
        return Promise.reject(status > 100 && data ? data : error)
      }
    }
  }
)

export default instance
