import e from 'express';
import { parseJsonField } from '../utils/parseJson.js';

export function parseItemFormData(req, res, next) {
    
  req.body.location = parseJsonField(req.body.location, {});
  req.body.reward = parseJsonField(req.body.reward, {});
  req.body.attributes = parseJsonField(req.body.attributes, {});

  next();
}

export function parseClaimFormData(req, res, next) {
    
    
    req.body.evidence = parseJsonField(req.body.evidence, {});
    req.body.attributes = parseJsonField(req.body.attributes, {});
    req.body.contact_info = parseJsonField(req.body.contact_info, {});
    
    next();
}