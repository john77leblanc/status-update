const rp = require('request-promise');
const cheerio = require('cheerio');


module.exports = function checkAvailability() {
    function checkStatus(data) {
        return {
            pickup: data.pickup.status,
            shipping: data.shipping.status,
        };
    };
    
    const options = {
        uri: 'https://www.bestbuy.ca/ecomm-api/availability/products?accept=application%2Fvnd.bestbuy.standardproduct.v1%2Bjson&accept-language=en-CA&locations=964%7C236&postalCode=K7M&skus=15689336',
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    
    return rp(options)
        .then($ => {
            const data = JSON.parse($('body').text().trim());
            
            return checkStatus(data.availabilities[0]);
        })
        .catch(error => error);
};
