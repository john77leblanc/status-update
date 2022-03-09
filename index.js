const fs = require("fs");
const duration = require('dayjs/plugin/duration');
const dayjs = require("dayjs");
dayjs.extend(duration);

const email = require("./email");
const checkAvailability = require("./checkAvailability");
const repeater = require("./repeater");

const time = 600000;
const interval = 1000;
let clock = time;

function log(message) {
    fs.appendFileSync('log.txt', `${message}\n`, 'utf8');
}

async function getStatus() {
    const response = await checkAvailability();
    const available = response.pickup === 'InStock' || response.shipping === 'InStock';

    const time = dayjs().format('MM/DD HH:mm:ss');

    log(`STATUS - ${time} | Pickup: "${response?.pickup}" - Shipping: "${response?.shipping}"`);

    if (response?.error) {
        log(`--- ERROR --- ${response.error}`);
        email.send("Error", response.error);
    }

    if (available === true) {
        log('--- FOUND AVAILABLE STOCK')
        email.send("PS5 Available", "Stock found!");
    }
};

process.stdout.write("Running script\n");

fs.stat('log.txt', function(err, stat) {
    if(err) {
        // file does not exist
        fs.writeFileSync('log.txt', '');
    }
});

getStatus();
repeater(() => {
    if (clock === 0) {
        clock = time;
        getStatus();
    } else {
        clock -= interval;
    }

    const timer = dayjs.duration(clock/1000, 'seconds').format('mm:ss');

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Checking again in ${timer}`);
}, interval);
