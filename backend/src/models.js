'use strict';
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const customerAddressSchema = new Schema({
  label: {type:String,required:true,trim:true,maxlength:35},
  fullName: {type:String,required:true,trim:true,maxlength:120},
  phone: {type:String,required:true,trim:true,maxlength:25},
  address: {type:String,required:true,trim:true,maxlength:220},
  city: {type:String,required:true,trim:true,maxlength:100},
  region: {type:String,required:true,trim:true,maxlength:100},
  reference: {type:String,default:'',trim:true,maxlength:220},
  isDefault: {type:Boolean,default:false}
}, {versionKey:false});

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: {type:String,default:'',trim:true,maxlength:25},
  addresses: {type:[customerAddressSchema],default:[]},
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer','support','inventory','accounting','admin','owner'], default: 'customer' },
  employeeCode: { type: String, uppercase: true, trim: true, maxlength: 32 },
  active: { type: Boolean, default: true },
  marketingConsent: { type: Boolean, default: false },
  marketingConsentAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });
userSchema.index({ employeeCode: 1 }, { unique: true, partialFilterExpression: { employeeCode: { $type: 'string' } } });

const sessionSchema = new Schema({
  tokenHash: { type: String, unique: true, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, versionKey: false });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const productSchema = new Schema({
  legacyId: { type: String, unique: true, sparse: true, maxlength: 32 },
  sku: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 60 },
  slug: { type: String, required: true, lowercase: true, unique: true, trim: true, maxlength: 140 },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  subcategory: { type: String, default: '', trim: true, maxlength: 90 },
  description: { type: String, default: '', maxlength: 5000 },
  details: { type: [String], default: [] },
  priceCents: { type: Number, required: true, min: 0 },
  originalPriceCents: { type: Number, default: null, min: 0 },
  currency: { type: String, enum: ['PEN'], default: 'PEN' },
  stockQty: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
  gallery: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  isNew: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  isOffer: { type: Boolean, default: false },
  // Ratings reales se calcularán posteriormente desde reseñas verificadas.
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });
productSchema.index({ category: 1, active: 1, createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

const settingsSchema = new Schema({
  key: { type: String, unique: true, default: 'main' },
  whatsappNumber: { type: String, default: process.env.WHATSAPP_NUMBER || '51986803872' },
  whatsappContactName: { type: String, default: process.env.WHATSAPP_CONTACT_NAME || 'Percy' }
}, { timestamps: true, versionKey: false });

const stockMovementSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  actorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  delta: { type: Number, required: true },
  reason: { type: String, required: true, maxlength: 250 },
  resultingQty: { type: Number, required: true }
}, { timestamps: true, versionKey: false });

const auditSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  action: { type: String, required: true, maxlength: 80 },
  resource: { type: String, required: true, maxlength: 100 },
  resourceId: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false });
auditSchema.index({ createdAt: -1 });


// Pedidos reales: sin pasarela ni captura de tarjetas. Valores en centavos (PEN).
const orderLineSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: {type: String, required: true}, name: {type: String, required: true},
  image: {type: String, default: ''}, quantity: {type: Number, required: true, min: 1, max: 20},
  unitPriceCents: {type: Number, required: true, min: 0}, lineTotalCents: {type: Number, required: true, min: 0}
}, {_id:false});
const orderSchema = new Schema({
  customerId: {type: Schema.Types.ObjectId, ref:'User', required:true, index:true},
  requestId: {type: String, required:true, maxlength:80},
  items: {type:[orderLineSchema], validate:v=>Array.isArray(v)&&v.length>0&&v.length<=20},
  shipping: {
    fullName:{type:String,required:true,maxlength:120},phone:{type:String,required:true,maxlength:25},
    address:{type:String,required:true,maxlength:220},city:{type:String,required:true,maxlength:100},
    region:{type:String,required:true,maxlength:100},reference:{type:String,default:'',maxlength:220}
  },
  customerEmail: {type:String,required:true,maxlength:254},
  notes: {type:String,default:'',maxlength:500},
  subtotalCents: {type:Number,required:true,min:0},totalCents: {type:Number,required:true,min:0},
  currency:{type:String,enum:['PEN'],default:'PEN'},
  status:{type:String,enum:['pending','confirmed','preparing','shipped','delivered','cancelled'],default:'pending'},
  paymentStatus:{type:String,enum:['not_collected'],default:'not_collected'},
  statusHistory:[{status:String,at:Date,actorId:Schema.Types.ObjectId,note:String}],
  cancelledAt:{type:Date,default:null}
}, {timestamps:true,versionKey:false});
orderSchema.index({customerId:1,requestId:1},{unique:true});
orderSchema.index({createdAt:-1});
orderSchema.index({status:1,createdAt:-1});

module.exports = {
  User: model('User', userSchema),
  Session: model('Session', sessionSchema),
  Product: model('Product', productSchema),
  SiteSettings: model('SiteSettings', settingsSchema),
  StockMovement: model('StockMovement', stockMovementSchema),
  AuditLog: model('AuditLog', auditSchema),
  Order: model('Order', orderSchema)
};
