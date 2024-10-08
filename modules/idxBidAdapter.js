import { registerBidder } from '../src/adapters/bidderFactory.js'
import { BANNER } from '../src/mediaTypes.js'
import { isArray, isNumber } from '../src/utils.js'
import { interpretResponse } from '../libraries/precisoUtils/bidUtils.js';

const BIDDER_CODE = 'idx'
const ENDPOINT_URL = 'https://dev-event.dxmdp.com/rest/api/v1/bid'
const SUPPORTED_MEDIA_TYPES = [ BANNER ]

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: SUPPORTED_MEDIA_TYPES,
  isBidRequestValid: function (bid) {
    return isArray(bid.mediaTypes?.banner?.sizes) && bid.mediaTypes.banner.sizes.every(size => {
      return isArray(size) && size.length === 2 && isNumber(size[0]) && isNumber(size[1])
    })
  },
  buildRequests: function (bidRequests, bidderRequest) {
    const payload = {
      id: bidderRequest.bidderRequestId,
      imp: bidRequests.map(request => {
        const { bidId, sizes } = request

        const item = {
          id: bidId,
        }

        if (request.mediaTypes.banner) {
          item.banner = {
            format: (request.mediaTypes.banner.sizes || sizes).map(size => {
              return { w: size[0], h: size[1] }
            }),
          }
        }

        return item
      }),
    }

    const payloadString = JSON.stringify(payload)

    return {
      method: 'POST',
      url: ENDPOINT_URL,
      data: payloadString,
      bidderRequest,
      options: {
        withCredentials: false,
        contentType: 'application/json'
      }
    }
  },
  interpretResponse,
}

registerBidder(spec)
