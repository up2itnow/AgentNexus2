import { Request, Response, NextFunction } from 'express';

/*
  Geofencing middleware (Phase 1):
  - If GEOFENCE_ENABLED=true, block requests when country is in GEOFENCE_BLOCKED (CSV list).
  - Country is read from X-Geo-Country header (for proxy integration) or from env DEFAULT_GEO_COUNTRY for local testing.
*/
export function geofenceMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.GEOFENCE_ENABLED !== 'true') return next();
    const blocked = (process.env.GEOFENCE_BLOCKED || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const country = (req.header('X-Geo-Country') || process.env.DEFAULT_GEO_COUNTRY || '').toUpperCase();
    if (!country || blocked.length === 0) return next();
    if (blocked.includes(country)) {
      return res.status(451).json({ success: false, error: { code: 'GEOFENCE_BLOCKED', message: `Access not available in ${country}` }});
    }
    return next();
  } catch (e) {
    return next();
  }
}
