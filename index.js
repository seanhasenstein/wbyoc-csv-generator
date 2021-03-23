require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const initialValue = {
  1: '',
  2: '',
  3: '',
  4: '',
  5: '',
  6: '',
  7: '',
  8: '',
  9: '',
  10: '',
  11: '',
  12: '',
  13: '',
  14: '',
  15: '',
  16: '',
};

function removeNonDigits(input) {
  return input.replace(/\D/g, '');
}

function formatPhoneNumber(input) {
  const digits = removeNonDigits(input);
  const digitsArray = digits.split('');
  return digitsArray
    .map((v, i) => {
      if (i === 0) return `(${v}`;
      if (i === 2) return `${v}) `;
      if (i === 5) return `${v}-`;
      return v;
    })
    .join('');
}

const d = new Date();
const year = d.getFullYear();
const month = d.getMonth() + 1;
const day = d.getDate();
const hour = d.getHours();
const min = d.getMinutes();
const sec = d.getSeconds();

const url = process.env.MONGODB_URL;
const dbName = 'wbyoc';

const app = express();
const port = 5000;

const timestamp = `${year}-${month}-${day}-${hour}:${min}:${sec}`;

const csvWriter = createCsvWriter({
  path: `./dist/registrations/wbyoc-2021-registrations-${timestamp}.csv`,
  header: [
    { id: 'id', title: 'ID' },
    { id: 'firstName', title: 'FIRST NAME' },
    { id: 'lastName', title: 'LAST NAME' },
    { id: 'email', title: 'EMAIL' },
    { id: 'phone', title: 'PHONE' },
    { id: 'city', title: 'CITY' },
    { id: 'state', title: 'STATE' },
    { id: '1', title: 'KAU WC SAT/SUN' },
    { id: '2', title: 'KAU MC SAT/SUN' },
    { id: '3', title: 'KAU HS FRI' },
    { id: '4', title: 'KAU HS SAT AM' },
    { id: '5', title: 'KAU HS SAT PM (2P)' },
    { id: '6', title: 'KAU HS SAT PM (3P)' },
    { id: '7', title: 'KAU HS SUN (2P)' },
    { id: '8', title: 'KAU HS SUN (3P)' },
    { id: '9', title: 'PLY WC SAT/SUN' },
    { id: '10', title: 'PLY MC SAT/SUN' },
    { id: '11', title: 'PLY HS FRI' },
    { id: '12', title: 'PLY HS SAT AM' },
    { id: '13', title: 'PLY HS SAT PM (2P)' },
    { id: '14', title: 'PLY HS SAT PM (3P)' },
    { id: '15', title: 'PLY HS SUN (2P)' },
    { id: '16', title: 'PLY HS SUN (3P)' },
    { id: 'wiaaClass', title: 'WIAA CLASS' },
    { id: 'wiaaNumber', title: 'WIAA NUMBER' },
    { id: 'associations', title: 'ASSOCIATIONS' },
    { id: 'hsCrewDeal', title: 'HS CREW DEAL' },
    { id: 'crewMember1', title: 'CREW MEMBER 1' },
    { id: 'crewMember2', title: 'CREW MEMBER 2' },
    { id: 'total', title: 'TOTAL' },
    { id: 'paymentMethod', title: 'PMT METHOD' },
    { id: 'paymentStatus', title: 'PMT STATUS' },
    { id: 'stripeId', title: 'TRANSACTION ID' },
    { id: 'createdAt', title: 'TIMESTAMP' },
  ],
});

app.get('/', async (_req, res) => {
  try {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect(async () => {
      const db = client.db(dbName);
      console.log('Connected to MongoDb successfully');
      const collection = db.collection('registrations');
      const results = await collection.find({}).toArray();

      const records = results.map(r => {
        const sessions = r.sessions.reduce(
          (acc, currVal) => {
            acc[currVal.id] = 'x';
            return acc;
          },
          { ...initialValue }
        );

        return {
          id: r._id,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: formatPhoneNumber(r.phone),
          city: r.address.city,
          state: r.address.state,
          ...sessions,
          wiaaClass: r.wiaaInformation.wiaaClass,
          wiaaNumber: r.wiaaInformation.wiaaNumber,
          associations: r.wiaaInformation.associations,
          hsCrewDeal: r.hsCrewDeal ? 'x' : '',
          crewMember1: r.hsCrewDeal ? r.crewMembers[0] : '',
          crewMember2: r.hsCrewDeal ? r.crewMembers[1] : '',
          total: (r.total / 100).toFixed(2),
          paymentMethod: r.paymentMethod,
          paymentStatus: r.paymentStatus,
          stripeId: r.stripeId,
          createdAt: r.createdAt,
        };
      });

      const sessionTotals = results.reduce(
        (acc, currVal) => {
          currVal.sessions.forEach(s => {
            acc[s.id] = Number(acc[s.id]) + 1;
          });
          return acc;
        },
        { ...initialValue }
      );

      const bottomFooter = {
        id: 'SESSION',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        1: 'KAU WC SAT/SUN',
        2: 'KAU MC SAT/SUN',
        3: 'KAU HS FRI',
        4: 'KAU HS SAT AM',
        5: 'KAU HS SAT PM (2P)',
        6: 'KAU HS SAT PM (3P)',
        7: 'KAU HS SUN (2P)',
        8: 'KAU HS SUN (3P)',
        9: 'PLY WC SAT/SUN',
        10: 'PLY MC SAT/SUN',
        11: 'PLY HS FRI',
        12: 'PLY HS SAT AM',
        13: 'PLY HS SAT PM (2P)',
        14: 'PLY HS SAT PM (3P)',
        15: 'PLY HS SUN (2P)',
        16: 'PLY HS SUN (3P)',
      };

      const totalsRow = {
        id: 'TOTALS',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        ...sessionTotals,
      };

      records.push(bottomFooter);
      records.push(totalsRow);

      await csvWriter.writeRecords(records);

      await client.close();
      res.send({ data: results });
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
