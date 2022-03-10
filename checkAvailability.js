const rp = require('request-promise');
const cheerio = require('cheerio');


module.exports = function checkAvailability(uri) {
    function checkStatus(data) {
        return {
            pickup: data.pickup.status,
            shipping: data.shipping.status,
            onlineRemaining: data.shipping.quantityRemaining,
            locations: data.pickup.locations,
        };
    };
    
    const options = {
        uri,
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
