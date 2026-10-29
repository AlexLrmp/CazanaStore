'use strict';
const mongoose=require('mongoose');
const {Schema}=mongoose;
const chatMessageSchema=new Schema({
  sender:{type:String,enum:['visitor','staff'],required:true},
  text:{type:String,required:true,maxlength:1200},
  at:{type:Date,default:Date.now},
  actorId:{type:Schema.Types.ObjectId,ref:'User',default:null}
},{_id:false,versionKey:false});
const chatThreadSchema=new Schema({
  tokenHash:{type:String,required:true,unique:true,index:true,select:false},
  customerId:{type:Schema.Types.ObjectId,ref:'User',default:undefined},
  name:{type:String,required:true,trim:true,maxlength:80},
  email:{type:String,default:'',trim:true,lowercase:true,maxlength:180},
  status:{type:String,enum:['open','closed'],default:'open'},
  assignedTo:{type:Schema.Types.ObjectId,ref:'User',default:null,index:true},
  assignedAt:{type:Date,default:null},
  priority:{type:String,enum:['normal','high'],default:'normal'},
  internalNote:{type:String,default:'',maxlength:400},
  messages:{type:[chatMessageSchema],default:[]},
  lastMessageAt:{type:Date,default:Date.now,index:true},
  unreadForStaff:{type:Boolean,default:true},
  unreadForVisitor:{type:Boolean,default:false},
  expiresAt:{type:Date,required:true}
},{timestamps:true,versionKey:false});
// CAZANA-CHAT-POR-CUENTA-2026. No se asignan chats de visitantes a clientes por coincidencia de email.
chatThreadSchema.index({customerId:1},{unique:true,partialFilterExpression:{customerId:{$type:'objectId'}}});
chatThreadSchema.index({status:1,lastMessageAt:-1});
chatThreadSchema.index({status:1,assignedTo:1,lastMessageAt:-1});
chatThreadSchema.index({expiresAt:1},{expireAfterSeconds:0});
module.exports=mongoose.models.CazanaChatThread||mongoose.model('CazanaChatThread',chatThreadSchema);
