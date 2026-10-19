'use strict';
const { z } = require('zod');
const normalizePhone = value => String(value ?? '').replace(/\D/g, '');
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa un slug sin espacios ni tildes').max(140);
const imagePath = z.string().trim().max(500).refine(s => !s || (/^assets\/[a-zA-Z0-9._/-]+$/.test(s) && !s.includes('..')), 'La foto debe apuntar a assets/');
const baseProductSchema = z.object({
  sku: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9_-]+$/).transform(v=>v.toUpperCase()),
  slug,
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(80),
  subcategory: z.string().trim().max(90).default(''),
  description: z.string().max(5000).default(''),
  details: z.array(z.string().trim().min(1).max(250)).max(30).default([]),
  priceCents: z.number().int().min(0).max(1000000000),
  originalPriceCents: z.number().int().min(0).max(1000000000).nullable().optional(),
  stockQty: z.number().int().min(0).max(1000000).default(0),
  image: imagePath.default(''),
  gallery: z.array(imagePath).max(12).default([]),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isOffer: z.boolean().default(false),
  active: z.boolean().default(true)
}).strict();
const productBody = baseProductSchema.superRefine((data,ctx)=>{
  if(data.isOffer && (data.originalPriceCents == null || data.originalPriceCents <= data.priceCents))
    ctx.addIssue({ code:'custom', message:'Para una oferta, el precio anterior debe superar al precio actual', path:['originalPriceCents'] });
});
const productPatch = baseProductSchema.omit({ stockQty: true }).partial().strict();
const registerBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform(v=>v.toLowerCase()),
  password: z.string().min(10).max(128),
  marketingConsent: z.boolean().default(false)
}).strict();
const loginBody = z.object({ email: z.string().trim().email().max(254).transform(v=>v.toLowerCase()), password: z.string().min(1).max(128) }).strict();
const staffLoginBody = z.object({ employeeCode: z.string().trim().min(4).max(32).transform(v=>v.toUpperCase()), password: z.string().min(1).max(128) }).strict();
const settingsPatch = z.object({
  whatsappNumber: z.string().transform(normalizePhone).refine(s => s.length >= 8 && s.length <= 15, 'Número inválido'),
  whatsappContactName: z.string().trim().min(1).max(80)
}).partial().strict();
const stockBody = z.object({ delta: z.number().int().min(-100000).max(100000).refine(x=>x!==0), reason: z.string().trim().min(3).max(250) }).strict();
const orderBody = z.object({
  requestId:z.string().uuid(),
  items:z.array(z.object({productId:z.string().min(1).max(140),quantity:z.number().int().min(1).max(20)}).strict()).min(1).max(20),
  shipping:z.object({
    fullName:z.string().trim().min(3).max(120), phone:z.string().trim().regex(/^[+0-9 ()-]{7,25}$/),
    address:z.string().trim().min(6).max(220),city:z.string().trim().min(2).max(100),
    region:z.string().trim().min(2).max(100),reference:z.string().trim().max(220).default('')
  }).strict(),
  notes:z.string().trim().max(500).default('')
}).strict().superRefine((data,ctx)=>{
  const ids=data.items.map(i=>i.productId);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'No repitas artículos en la solicitud.',path:['items']});
});
const orderStatusBody = z.object({status:z.enum(['confirmed','preparing','shipped','delivered','cancelled']),note:z.string().trim().max(250).default('')}).strict();
function parse(schema, data) { const r=schema.safeParse(data); if(!r.success) {const e=new Error('Revisa los datos enviados.');e.status=400;e.details=r.error.flatten();throw e;}return r.data; }
module.exports={normalizePhone,productBody,productPatch,registerBody,loginBody,staffLoginBody,settingsPatch,stockBody,orderBody,orderStatusBody,parse};
