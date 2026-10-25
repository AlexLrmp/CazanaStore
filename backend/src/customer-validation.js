'use strict';
// Validaciones de datos de cuenta. No aceptar campos arbitrarios del navegador.
const { z } = require('zod');
const { parse } = require('./validation');
const phone = z.string().trim().max(25).refine(v => !v || /^[+0-9 ()-]{7,25}$/.test(v), 'Introduce un teléfono válido.');
const profilePatch = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: phone.optional(),
  marketingConsent: z.boolean().optional()
}).strict().refine(v => Object.keys(v).length > 0, 'No hay cambios que guardar.');
const addressBase = z.object({
  label: z.string().trim().min(1).max(35),
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().regex(/^[+0-9 ()-]{7,25}$/),
  address: z.string().trim().min(6).max(220),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  reference: z.string().trim().max(220).default(''),
  isDefault: z.boolean().default(false)
}).strict();
const addressPatch = addressBase.partial().strict().refine(v=>Object.keys(v).length>0,'No hay cambios que guardar.');
module.exports = { profilePatch, addressBase, addressPatch, parse };
