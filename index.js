require('dotenv').config();
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const initialValue = {
  'Kau Fri June 18 (Session 1)': '',
  'Kau Sat June 19 morn/aft (Session 2)': '',
  'Kau Sat June 19 aft/eve (Session 3)': '',
  'Kau Sun June 20 (Session 4)': '',
  'Ply Fri July 9 (Session 5)': '',
  'Ply HS Sat July 10 morn/aft (Session 6)': '',
  'Ply Sat July 10 aft/eve (Session 7)': '',
  'Ply Sun July 11 (Session 8)': '',
  'Will not attend camp this summer': '',
};

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
  path: `./dist/wbyoc-pre-camp-survey-${timestamp}.csv`,
  header: [
    { id: 'id', title: 'ID' },
    { id: 'name', title: 'NAME' },
    { id: 'email', title: 'EMAIL' },
    { id: 'phone', title: 'PHONE' },
    { id: 'wiaaNumber', title: 'WIAA NUMBER' },
    { id: 'Kau Fri June 18 (Session 1)', title: 'KAU FRI' },
    { id: 'Kau Sat June 19 morn/aft (Session 2)', title: 'KAU SAT AM' },
    { id: 'Kau Sat June 19 aft/eve (Session 3)', title: 'KAU SAT PM' },
    { id: 'Kau Sun June 20 (Session 4)', title: 'KAU SUN' },
    { id: 'Ply Fri July 9 (Session 5)', title: 'PLY FRI' },
    { id: 'Ply HS Sat July 10 morn/aft (Session 6)', title: 'PLY SAT AM' },
    { id: 'Ply Sat July 10 aft/eve (Session 7)', title: 'PLY SAT PM' },
    { id: 'Ply Sun July 11 (Session 8)', title: 'PLY SUN' },
    { id: 'Will not attend camp this summer', title: 'WILL NOT ATTEND' },
  ],
});

app.get('/', async (_req, res) => {
  try {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect(async () => {
      const db = client.db(dbName);
      console.log('Connected to MongoDb successfully');
      const collection = db.collection('questionnaires');
      const results = await collection.find({}).toArray();

      const records = results.map(r => {
        const sessions = r.sessions.reduce(
          (acc, currVal) => {
            acc[currVal] = 'x';
            return acc;
          },
          { ...initialValue }
        );

        return {
          id: r._id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          wiaaNumber: r.wiaaNumber,
          ...sessions,
        };
      });

      const sessionTotals = results.reduce(
        (acc, currVal) => {
          currVal.sessions.forEach(s => {
            acc[s] = Number(acc[s]) + 1;
          });
          return acc;
        },
        { ...initialValue }
      );

      const totalsRow = {
        id: 'TOTALS',
        name: '',
        email: '',
        phone: '',
        wiaaNumber: '',
        ...sessionTotals,
      };

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
