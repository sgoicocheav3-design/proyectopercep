// Base de conocimiento estatica sobre las 15 clases que el modelo reconoce
// (ver CLASS_NAMES en src/common/config.py - debe mantenerse en sync si esa
// lista cambia). No depende de ningun backend: alimenta al motor de
// respuestas de lib/plantAssistant.js para que el AI Coach pueda contestar
// preguntas de texto ademas de analizar fotos.

export const CROPS = {
  tomato: { label: 'Tomate', aliases: ['tomate', 'tomates', 'jitomate'] },
  potato: { label: 'Papa', aliases: ['papa', 'papas', 'patata', 'patatas'] },
  pepper: { label: 'Pimiento', aliases: ['pimiento', 'pimientos', 'pimenton', 'pimentón', 'chile', 'aji', 'ají'] },
};

export const CONDITIONS = {
  healthy: {
    label: 'Planta sana',
    aliases: ['sana', 'saludable', 'salud', 'cuidado general', 'mantener sana'],
    symptoms: 'Hojas de color verde uniforme, sin manchas, deformaciones ni marchitez.',
    causes: 'No aplica: es el estado deseado de la planta.',
    prevention: [
      'Riego regular en la base, evitando mojar el follaje.',
      'Buen espaciado entre plantas para que circule el aire.',
      'Suelo bien drenado y con materia organica.',
      'Revisar hojas cada semana para detectar problemas a tiempo.',
    ],
    treatment: [
      'No requiere tratamiento; mantener las practicas de prevencion.',
    ],
  },
  bacterial_spot: {
    label: 'Mancha bacteriana',
    aliases: ['mancha bacteriana', 'bacterial spot', 'bacteriana', 'manchas negras'],
    symptoms: 'Pequeñas manchas oscuras y acuosas en hojas y frutos, a veces con halo amarillo; las hojas pueden caer.',
    causes: 'Bacterias del genero Xanthomonas, favorecidas por clima calido y humedo, y por salpicaduras de agua o herramientas contaminadas.',
    prevention: [
      'Usar semillas y plantines certificados libres de la bacteria.',
      'Evitar riego por aspersion; regar en la base.',
      'Rotar cultivos (no sembrar solanaceas en el mismo suelo 2 años seguidos).',
      'Desinfectar herramientas de poda entre plantas.',
    ],
    treatment: [
      'Aplicar productos a base de cobre apenas se detecten los primeros sintomas.',
      'Retirar y destruir las hojas y frutos afectados.',
      'No hay cura una vez muy avanzada: priorizar prevencion para el siguiente ciclo.',
    ],
  },
  early_blight: {
    label: 'Tizón temprano',
    aliases: ['tizon temprano', 'tizón temprano', 'early blight', 'alternaria'],
    symptoms: 'Manchas marrones con anillos concentricos ("diana") en hojas inferiores primero, que luego amarillean y caen.',
    causes: 'Hongo Alternaria solani, favorecido por humedad prolongada en el follaje y estres de la planta.',
    prevention: [
      'Rotacion de cultivos de al menos 2 años.',
      'Espaciado adecuado y poda para mejorar ventilacion.',
      'Evitar riego por aspersion, especialmente al final del dia.',
      'Fertilizacion balanceada (evitar exceso de nitrogeno).',
    ],
    treatment: [
      'Fungicidas a base de clorotalonil o cobre en las primeras señales.',
      'Eliminar hojas inferiores afectadas y restos de cosecha.',
      'Aplicar cada 7-10 dias en clima humedo hasta controlar el brote.',
    ],
  },
  late_blight: {
    label: 'Tizón tardío',
    aliases: ['tizon tardio', 'tizón tardío', 'late blight', 'phytophthora'],
    symptoms: 'Manchas grandes de aspecto aceitoso y color verde oscuro a marron en hojas y tallos, con moho blanquecino en el reverso en clima humedo; puede matar la planta en pocos dias.',
    causes: 'Oomiceto Phytophthora infestans (el mismo que causo la hambruna de la papa en Irlanda), se propaga muy rapido con humedad alta y temperaturas frescas.',
    prevention: [
      'Evitar riego por aspersion; regar temprano en la mañana.',
      'Usar variedades resistentes cuando sea posible.',
      'Buen espaciado para reducir humedad entre plantas.',
      'Fungicidas preventivos si el pronostico anuncia clima humedo y fresco.',
    ],
    treatment: [
      'Es la enfermedad mas agresiva de esta lista: actuar de inmediato.',
      'Retirar y destruir (no compostar) las plantas muy afectadas.',
      'Fungicidas sistemicos especificos para Phytophthora en los primeros sintomas.',
    ],
  },
  leaf_mold: {
    label: 'Moho de la hoja',
    aliases: ['moho de la hoja', 'leaf mold', 'moho foliar'],
    symptoms: 'Manchas amarillas en el haz de la hoja con un moho aterciopelado gris-verdoso oliva en el reverso.',
    causes: 'Hongo Fulvia fulva (Passalora fulva), favorecido por alta humedad y poca ventilacion, muy comun en invernadero.',
    prevention: [
      'Ventilar bien el invernadero o espaciar las plantas al aire libre.',
      'Reducir la humedad ambiental (evitar riego por aspersion).',
      'Usar variedades resistentes si estan disponibles.',
    ],
    treatment: [
      'Fungicidas a base de clorotalonil o azufre.',
      'Eliminar hojas afectadas y mejorar la circulacion de aire.',
    ],
  },
  septoria_leaf_spot: {
    label: 'Mancha foliar por Septoria',
    aliases: ['septoria', 'mancha foliar', 'septoria leaf spot'],
    symptoms: 'Muchas manchas pequeñas circulares con centro grisaceo y borde oscuro, principalmente en hojas inferiores.',
    causes: 'Hongo Septoria lycopersici, se propaga por salpicaduras de agua y persiste en restos de cultivo.',
    prevention: [
      'Rotacion de cultivos y eliminacion de restos de plantas al final de temporada.',
      'Regar en la base, no por aspersion.',
      'Mulch (acolchado) para evitar que la tierra salpique las hojas bajas.',
    ],
    treatment: [
      'Fungicidas a base de cobre o clorotalonil.',
      'Retirar hojas afectadas apenas aparezcan.',
    ],
  },
  spider_mites: {
    label: 'Ácaros (araña roja)',
    aliases: ['acaro', 'ácaro', 'araña roja', 'spider mites', 'acaros'],
    symptoms: 'Punteado amarillento fino en las hojas, telarañas muy finas en el reverso, hojas que se vuelven bronceadas y caen en infestaciones fuertes.',
    causes: 'El acaro Tetranychus urticae, favorecido por clima caluroso y seco, y estres hidrico de la planta.',
    prevention: [
      'Mantener buena humedad ambiental (los acaros prosperan en clima seco).',
      'Revisar el reverso de las hojas regularmente.',
      'Evitar exceso de fertilizante nitrogenado.',
    ],
    treatment: [
      'Aplicar jabon potasico o aceite de neem sobre el reverso de las hojas.',
      'Acaricidas especificos en infestaciones severas.',
      'Introducir depredadores naturales (acaros depredadores) si es viable.',
    ],
  },
  target_spot: {
    label: 'Mancha diana',
    aliases: ['mancha diana', 'target spot', 'corynespora'],
    symptoms: 'Manchas marrones con anillos concentricos similares al tizón temprano, pero mas grandes y con centro a veces perforado; afecta hojas, tallos y frutos.',
    causes: 'Hongo Corynespora cassiicola, favorecido por humedad alta y temperaturas calidas.',
    prevention: [
      'Rotacion de cultivos y buena ventilacion entre plantas.',
      'Evitar riego por aspersion.',
      'Eliminar restos vegetales infectados.',
    ],
    treatment: [
      'Fungicidas a base de clorotalonil o azoxistrobina.',
      'Retirar hojas y frutos afectados para reducir la propagacion.',
    ],
  },
  yellow_leaf_curl_virus: {
    label: 'Virus del rizado amarillo',
    aliases: ['rizado amarillo', 'yellow leaf curl', 'tylcv', 'virus del rizado'],
    symptoms: 'Hojas pequeñas, engrosadas y enrolladas hacia arriba, amarillamiento en los bordes, planta achaparrada con floracion reducida.',
    causes: 'Un virus (geminivirus) transmitido por la mosca blanca (Bemisia tabaci); no se contagia por contacto entre plantas.',
    prevention: [
      'Controlar la mosca blanca con trampas amarillas pegajosas o insecticidas especificos.',
      'Usar mallas anti-insectos en semilleros e invernaderos.',
      'Variedades resistentes cuando esten disponibles.',
      'Eliminar malezas hospederas cerca del cultivo.',
    ],
    treatment: [
      'No existe cura una vez infectada la planta: hay que retirarla para evitar que sea fuente de contagio.',
      'El control real es sobre el vector (mosca blanca), no sobre la planta enferma.',
    ],
  },
  mosaic_virus: {
    label: 'Virus del mosaico',
    aliases: ['mosaico', 'mosaic virus', 'virus del mosaico'],
    symptoms: 'Patron de manchas verde claro y verde oscuro tipo mosaico en las hojas, hojas rizadas o deformadas, crecimiento reducido.',
    causes: 'Tobamovirus, muy estable y facil de transmitir por contacto (manos, herramientas, ropa) incluso desde restos de tabaco.',
    prevention: [
      'Lavarse las manos y desinfectar herramientas antes de manipular las plantas.',
      'No fumar ni manipular tabaco cerca de las plantas (el virus sobrevive en el tabaco).',
      'Usar semillas certificadas libres de virus.',
      'Eliminar malezas que puedan ser reservorio del virus.',
    ],
    treatment: [
      'No tiene cura: retirar y destruir las plantas infectadas para evitar contagio.',
      'Desinfectar herramientas y manos despues de tocar plantas sospechosas.',
    ],
  },
};

// Mapea el string crudo que devuelve el modelo (predicted_class) a un
// cultivo + condicion de esta base de conocimiento. Debe reflejar
// exactamente CLASS_NAMES de src/common/config.py.
export const RAW_CLASS_TO_CONDITION = {
  Pepper__bell___Bacterial_spot: { crop: 'pepper', condition: 'bacterial_spot' },
  Pepper__bell___healthy: { crop: 'pepper', condition: 'healthy' },
  Potato___Early_blight: { crop: 'potato', condition: 'early_blight' },
  Potato___Late_blight: { crop: 'potato', condition: 'late_blight' },
  Potato___healthy: { crop: 'potato', condition: 'healthy' },
  Tomato_Bacterial_spot: { crop: 'tomato', condition: 'bacterial_spot' },
  Tomato_Early_blight: { crop: 'tomato', condition: 'early_blight' },
  Tomato_Late_blight: { crop: 'tomato', condition: 'late_blight' },
  Tomato_Leaf_Mold: { crop: 'tomato', condition: 'leaf_mold' },
  Tomato_Septoria_leaf_spot: { crop: 'tomato', condition: 'septoria_leaf_spot' },
  Tomato_Spider_mites_Two_spotted_spider_mite: { crop: 'tomato', condition: 'spider_mites' },
  Tomato__Target_Spot: { crop: 'tomato', condition: 'target_spot' },
  Tomato__Tomato_YellowLeaf__Curl_Virus: { crop: 'tomato', condition: 'yellow_leaf_curl_virus' },
  Tomato__Tomato_mosaic_virus: { crop: 'tomato', condition: 'mosaic_virus' },
  Tomato_healthy: { crop: 'tomato', condition: 'healthy' },
};
