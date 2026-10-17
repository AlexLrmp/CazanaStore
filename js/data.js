/* Datos demo extendidos para Cazana Store.
   Se toman como referencia visual de Figma; no representan inventario real. */
window.CazanaData = Object.freeze([
  {
    id:'h1',slug:'cafetera-espresso-premium',name:'Cafetera Espresso Premium 1200W',category:'hogar',subcategory:'Cocina',price:89.99,originalPrice:119.99,rating:4.8,reviewCount:142,isBestseller:true,isOffer:true,image:'assets/cafe.jpg',fallback:'assets/cafe.jpg',stock:true,
    description:'Cafetera espresso compacta para preparar bebidas con crema perfecta y un look premium en tu cocina.',
    details:['Sistema de 15 bares','Espumador manual para cappuccino','Depósito removible de 1.2L','Acabado premium fácil de limpiar'],
    gallery:['assets/cafe.jpg','assets/h1-detail-2.jpg','assets/h1-detail-3.jpg'],
    reviews:[
      {name:'María García',city:'Lima, Perú',rating:5,text:'Diseño elegante y café muy bueno. Llegó rápido y se ve aún mejor en persona.'},
      {name:'Carlos Rodríguez',city:'Bogotá, Colombia',rating:5,text:'La uso todos los días. Fácil de limpiar y la crema queda excelente.'}
    ]
  },
  {
    id:'h2',slug:'set-sabanas-egipcias',name:'Set de Sábanas Egipcias 1000 Hilos',category:'hogar',subcategory:'Dormitorio',price:129.99,rating:4.9,reviewCount:89,isBestseller:true,image:'assets/sabanas.jpg',fallback:'assets/sabanas.jpg',stock:true,
    description:'Sábanas de tacto suave y acabado elegante para elevar el descanso diario.',
    details:['1000 hilos','Tacto sedoso','Incluye funda y sábanas','Ideal para dormitorio principal'],
    gallery:['assets/sabanas.jpg','assets/h2-detail-2.jpg','assets/h2-detail-3.jpg'],
    reviews:[{name:'Ana Torres',city:'Santiago, Chile',rating:5,text:'Desde la primera noche se siente la diferencia. Muy buena calidad.'}]
  },
  {
    id:'h5',slug:'juego-ollas-inox',name:'Juego de Ollas Inox 12 Piezas',category:'hogar',subcategory:'Cocina',price:149.99,originalPrice:189.99,rating:4.8,reviewCount:156,isBestseller:true,isOffer:true,image:'assets/ollas.jpg',fallback:'assets/ollas.jpg',stock:true,
    description:'Juego de ollas de acero inoxidable con estética moderna y funcionalidad para el día a día.',
    details:['12 piezas','Acero inoxidable','Tapas resistentes al calor','Apto para uso intensivo'],
    gallery:['assets/ollas.jpg','assets/h5-detail-2.jpg','assets/h5-detail-3.jpg'],
    reviews:[{name:'Luis Hernández',city:'Buenos Aires, Argentina',rating:5,text:'Muy completo. Buen peso y se nota la calidad del material.'}]
  },
  {
    id:'t1',slug:'auriculares-noise-cancelling',name:'Auriculares Noise Cancelling Pro X',category:'tecnologia',subcategory:'Audio',price:199.99,originalPrice:249.99,rating:4.9,reviewCount:318,isBestseller:true,isOffer:true,image:'assets/audifonos.jpg',fallback:'assets/audifonos.jpg',stock:true,
    description:'Auriculares inalámbricos de perfil premium con cancelación activa de ruido y comodidad prolongada.',
    details:['Cancelación activa de ruido','Hasta 30 horas de batería','Bluetooth multipunto','Controles táctiles y estuche premium'],
    gallery:['assets/audifonos.jpg','assets/t1-detail-2.jpg','assets/t1-detail-3.jpg'],
    reviews:[
      {name:'Luis Hernández',city:'Buenos Aires, Argentina',rating:5,text:'Superaron mis expectativas. La cancelación de ruido es increíble y el acabado se ve premium.'},
      {name:'Paola Ruiz',city:'Lima, Perú',rating:4,text:'Muy cómodos para trabajar varias horas y el sonido es envolvente.'}
    ]
  },
  {
    id:'t2',slug:'smartwatch-serie-7',name:'Smartwatch Serie 7 Ultra AMOLED',category:'tecnologia',subcategory:'Wearables',price:249.99,rating:4.7,reviewCount:241,isNew:true,image:'assets/reloj.jpg',fallback:'assets/reloj.jpg',stock:true,
    description:'Smartwatch elegante con pantalla AMOLED, monitoreo diario y diseño minimalista.',
    details:['Pantalla AMOLED','Monitoreo de actividad','Correas intercambiables','Resistencia básica al agua'],
    gallery:['assets/reloj.jpg','assets/t2-detail-2.jpg','assets/t2-detail-3.jpg'],
    reviews:[{name:'Marcos Díaz',city:'Arequipa, Perú',rating:5,text:'Se ve sofisticado y la pantalla luce excelente.'}]
  },
  {
    id:'h6',slug:'lampara-piso-led',name:'Lámpara de Piso LED Regulable',category:'hogar',subcategory:'Iluminación',price:89.99,rating:4.7,reviewCount:78,isNew:true,image:'assets/sofa.jpg',fallback:'assets/sofa.jpg',stock:true,
    description:'Lámpara decorativa de líneas limpias para salas, dormitorios y rincones de lectura.',
    details:['Luz regulable','Diseño contemporáneo','Base estable','Ideal para interiores'],
    gallery:['assets/sofa.jpg','assets/h6-detail-2.jpg','assets/h6-detail-3.jpg'],
    reviews:[{name:'Fernanda P.',city:'Quito, Ecuador',rating:4,text:'Bonita, discreta y aporta bastante al ambiente.'}]
  },
  {
    id:'h4',slug:'aspiradora-robot',name:'Aspiradora Robot Smart WiFi',category:'hogar',subcategory:'Limpieza',price:299.99,rating:4.7,reviewCount:67,isNew:true,image:'assets/aspiradora.jpg',fallback:'assets/aspiradora.jpg',stock:true,
    description:'Robot aspirador para mantenimiento diario del hogar con conectividad Wi‑Fi.',
    details:['Conectividad Wi‑Fi','Programación diaria','Perfil bajo','Fácil mantenimiento'],
    gallery:['assets/aspiradora.jpg','assets/h4-detail-2.jpg','assets/h4-detail-3.jpg'],
    reviews:[{name:'Jorge M.',city:'Lima, Perú',rating:4,text:'Práctica para mantener limpio a diario.'}]
  },
  {
    id:'t4',slug:'tablet-2k',name:'Tablet 10.4″ 2K 256GB + Lápiz',category:'tecnologia',subcategory:'Tablets',price:329.99,rating:4.8,reviewCount:124,isNew:true,image:'assets/tablet.jpg',fallback:'assets/tablet.jpg',stock:true,
    description:'Tablet versátil para productividad, estudio y entretenimiento con lápiz incluido.',
    details:['Pantalla 2K','256 GB','Incluye lápiz','Ideal para productividad y contenido'],
    gallery:['assets/tablet.jpg','assets/t4-detail-2.jpg','assets/t4-detail-3.jpg'],
    reviews:[{name:'Sofía N.',city:'Medellín, Colombia',rating:5,text:'Muy práctica y liviana, perfecta para trabajar y estudiar.'}]
  },
  {
    id:'h3',slug:'licuadora-1500',name:'Licuadora de Alta Potencia 1500W',category:'hogar',subcategory:'Cocina',price:74.99,originalPrice:94.99,rating:4.6,reviewCount:203,isOffer:true,image:'assets/ollas.jpg',fallback:'assets/ollas.jpg',stock:true,
    description:'Licuadora potente para preparar smoothies, salsas y mezclas con rapidez.',
    details:['1500W','Vaso resistente','Velocidades múltiples','Base estable'],
    gallery:['assets/ollas.jpg','assets/h3-detail-2.jpg','assets/h3-detail-3.jpg'],
    reviews:[{name:'Laura C.',city:'Lima, Perú',rating:4,text:'Buena potencia para el uso diario.'}]
  },
  {
    id:'t5',slug:'laptop-14',name:'Laptop Ultradelgada 14″ Core i7',category:'tecnologia',subcategory:'Computadoras',price:749.99,originalPrice:899.99,rating:4.6,reviewCount:88,isOffer:true,image:'assets/cat-tecnologia.jpg',fallback:'assets/cat-tecnologia.jpg',stock:true,
    description:'Portátil ligera con perfil elegante, ideal para trabajo y estudio.',
    details:['14 pulgadas','Perfil delgado','Procesador Core i7','Diseño premium'],
    gallery:['assets/cat-tecnologia.jpg','assets/t5-detail-2.jpg','assets/t5-detail-3.jpg'],
    reviews:[{name:'Diego P.',city:'Lima, Perú',rating:4,text:'Buena presencia y rendimiento sólido para oficina.'}]
  },
  {
    id:'t3',slug:'parlante-bluetooth',name:'Parlante Bluetooth 360° Waterproof',category:'tecnologia',subcategory:'Audio',price:79.99,originalPrice:99.99,rating:4.6,reviewCount:100,isOffer:true,image:'assets/audifonos.jpg',fallback:'assets/audifonos.jpg',stock:true,
    description:'Parlante portátil con sonido envolvente y diseño compacto.',
    details:['Sonido 360°','Waterproof','Diseño portátil','Conexión inalámbrica'],
    gallery:['assets/audifonos.jpg','assets/t3-detail-2.jpg','assets/t3-detail-3.jpg'],
    reviews:[{name:'Kevin S.',city:'Cusco, Perú',rating:4,text:'Muy buena potencia para su tamaño.'}]
  },
  {
    id:'t6',slug:'camara-wifi',name:'Cámara de Seguridad WiFi 4K',category:'tecnologia',subcategory:'Seguridad',price:89.99,rating:4.8,reviewCount:75,isNew:true,image:'assets/cat-tecnologia.jpg',fallback:'assets/cat-tecnologia.jpg',stock:true,
    description:'Cámara doméstica de seguridad con conectividad Wi‑Fi y visual limpio.',
    details:['Resolución 4K','Conectividad Wi‑Fi','Vista remota','Ideal para interiores'],
    gallery:['assets/cat-tecnologia.jpg','assets/t6-detail-2.jpg','assets/t6-detail-3.jpg'],
    reviews:[{name:'Renzo T.',city:'Lima, Perú',rating:5,text:'Buena relación entre diseño y funcionalidad.'}]
  }
]);
