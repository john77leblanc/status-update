const fs = require("fs");
const path = require("path");

const duration = require('dayjs/plugin/duration');
const dayjs = require("dayjs");
dayjs.extend(duration);

const email = require("./email");
const checkAvailability = require("./checkAvailability");
const repeater = require("./repeater");

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
products.forEach(product => {
    product.inStock = false;
    product.updateSent = false;
});

const maxChars = products.reduce((max, element) => element.name.length > max ? element.name.length : max, 0);

const time = dayjs.duration({minutes: 10}).asMilliseconds();
const interval = 1000;
let clock = time;

function log(message = '') {
    const date = dayjs().format('MM-DD');
    const file = path.join(__dirname, '/logs', `log-${date}.txt`);

    try {
        fs.statSync(file);
    }
    catch(err) {
        fs.writeFileSync(file, `LOGS ${date}`);
    }

    fs.appendFileSync(file, `\n${message}`, 'utf8');
}

const space = (text, chars = 15) => " ".repeat(chars - text.length);

function sendUpdate(product, title, message) {
    product.updateSent = !product.updateSent;
    email.send(title, message);
    log(`\tEmail sent\n\t${"-".repeat(20)}\n`);
}

async function getStatus() {

    const statusTime = dayjs().format('MM/DD HH:mm:ss');
    log(`\nSTATUS - ${statusTime}`);

    products.forEach(async (product) => {
        const response = await checkAvailability(product.uri);
        product.inStock = response.pickup === 'InStock' || response.shipping === 'InStock';

        let logMessage = `\t${product.name}${space(product.name, maxChars)}\t|\tPickup: "${response.pickup}"${space(response.pickup)}Shipping: "${response.shipping}"`;
        if (response.onlineRemaining) logMessage += `${space(response.shipping)}Online Quantity: ${response.onlineRemaining}`;

        log(logMessage);

        if (response?.error) {
            log(`--- ERROR --- ${product.name}\n${"-".repeat(20)}\n${response.error}\n${"-".repeat(20)}`);
            email.send(`Error with ${product.name}`, response.error);
        }

        if (product.inStock && !product.updateSent) {
            const availabilities = Object.keys(response).filter(key => response[key] === 'InStock').join(', ');
            const locations = response.locations.reduce((message, location) => {
                if (location.quantityOnHand) {
                    message.push(`\t${location.name}\tQuantity: ${location.quantityOnHand}`);
                }
                return message;
            }, []).join('\n');

            log(`\n\t--- ${product.name} IS NOW AVAILABLE ---\n\tFor: ${availabilities}\n\tStores:\n${locations}\n\t${"-".repeat(20)}`);

            const title = `${product.name} is Now Available`;
            const message = `${statusTime}\n\n${product.name} is now available for:\n\t${availabilities}\n\nStores:\n${locations}\n\nOnline quantity: ${response.onlineRemaining}`;

            sendUpdate(product, title, message);
        }

        if (!product.inStock && product.updateSent) {
            log(`\n\t--- ${product.name} no longer available ---\n`);

            const title = `${product.name} is no Longer Available`;
            const message = `${product.name} is not available anymore.`;
            sendUpdate(product, title, message);
        }
    });
};

process.stdout.write("Running script\n\n");
process.stdout.write(`Checking for: ${products.map(product => product.name).join(', ')}\n\n`);


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
