import request from 'supertest';
import express from 'express';
import { geofenceMiddleware } from '../src/middleware/geofence';

const app = express();
app.use(geofenceMiddleware);
app.get('/ping', (_,res)=>res.json({ok:true}));

describe('geofenceMiddleware', ()=>{
  const OLD_ENV = process.env;
  beforeEach(()=>{ jest.resetModules(); process.env = { ...OLD_ENV }; });
  afterAll(()=>{ process.env = OLD_ENV; });

  it('allows when disabled', async ()=>{
    process.env.GEOFENCE_ENABLED = 'false';
    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
  });

  it('blocks when country is blocked', async ()=>{
    process.env.GEOFENCE_ENABLED = 'true';
    process.env.GEOFENCE_BLOCKED = 'US,CA';
    const res = await request(app).get('/ping').set('X-Geo-Country','US');
    expect(res.status).toBe(451);
  });
});
