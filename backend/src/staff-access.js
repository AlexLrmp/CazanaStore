'use strict';
// Politica de acceso a la intranet. La seguridad se aplica tambien en las APIs.
const homeByRole = Object.freeze({
  owner:'/staff', admin:'/staff', inventory:'/staff',
  support:'/staff/atencion', accounting:'/staff/sin-modulo'
});
const adminRoles = new Set(['owner','admin','inventory']);
const supportRoles = new Set(['owner','admin','support']);
const inventoryTabs = new Set(['overview','analytics','orders','inventory']);
function homeFor(role){return homeByRole[role]||null;}
function canOpenAdmin(role){return adminRoles.has(role);}
function canOpenSupport(role){return supportRoles.has(role);}
function canOpenAdminTab(role,tab){return adminRoles.has(role) && (role!=='inventory'||inventoryTabs.has(tab));}
module.exports={homeFor,canOpenAdmin,canOpenSupport,canOpenAdminTab};
