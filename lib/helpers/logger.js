import bunyan from 'bunyan'
import { bunyan as config } from '../../config'

export default bunyan.createLogger(config)
