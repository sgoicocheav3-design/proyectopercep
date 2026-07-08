/**
 * Recomendaciones de tratamiento para cada enfermedad detectada por el modelo.
 * La clave es el predicted_class exacto que devuelve el backend.
 */
export const TREATMENTS = {
  "Pepper__bell___Bacterial_spot": {
    description: "Enfermedad bacteriana causada por Xanthomonas. Produce manchas oscuras y acuosas en las hojas.",
    steps: [
      "Elimina y desecha las hojas y frutos infectados (no los compostes).",
      "Aplica bactericidas a base de cobre (hidróxido de cobre) cada 7-10 días.",
      "Evita el riego por aspersión; riega solo por goteo o a nivel del suelo.",
      "Desinfecta tus herramientas de jardinería con alcohol antes de usarlas.",
    ],
    prevention: "Usa semillas certificadas y libres de enfermedad para la próxima siembra.",
  },
  "Pepper__bell___healthy": {
    description: "¡Tu planta de pimiento está perfectamente saludable!",
    steps: [
      "Continúa con tu rutina actual de riego y fertilización.",
      "Revisa periódicamente el envés de las hojas para detectar plagas a tiempo.",
      "Mantén buena circulación de aire entre las plantas.",
    ],
    prevention: "Realiza inspecciones visuales cada semana para prevenir enfermedades.",
  },
  "Potato___Early_blight": {
    description: "Enfermedad fúngica causada por Alternaria solani. Aparecen manchas marrones con anillos concéntricos.",
    steps: [
      "Elimina las hojas infectadas de la planta y del suelo.",
      "Aplica fungicidas a base de Mancozeb o Clorotalonil.",
      "Riega temprano en la mañana para que las hojas sequen durante el día.",
      "Mejora el drenaje del suelo para evitar humedad excesiva.",
    ],
    prevention: "Rota los cultivos cada temporada y evita sembrar papa en el mismo lugar dos años seguidos.",
  },
  "Potato___Late_blight": {
    description: "Enfermedad grave causada por Phytophthora infestans. Es la misma enfermedad que causó la Gran Hambruna irlandesa.",
    steps: [
      "Actúa de inmediato: elimina y destruye todas las partes afectadas.",
      "Aplica fungicidas sistémicos a base de Metalaxil o Cobre urgentemente.",
      "Evita completamente mojar el follaje al regar.",
      "Si el brote es grave, considera eliminar toda la planta para proteger las demás.",
    ],
    prevention: "Planta variedades resistentes y aplica fungicidas preventivos en temporada de lluvias.",
  },
  "Potato___healthy": {
    description: "¡Tu planta de papa está perfectamente saludable!",
    steps: [
      "Continúa con tu rutina actual de riego y fertilización.",
      "Asegúrate de que el suelo tenga buen drenaje.",
      "Inspecciona regularmente el follaje en busca de primeros síntomas.",
    ],
    prevention: "Aplica fungicidas preventivos a base de cobre al inicio de la temporada de lluvias.",
  },
  "Tomato_Bacterial_spot": {
    description: "Enfermedad bacteriana que produce pequeñas manchas oscuras y acuosas en hojas y frutos.",
    steps: [
      "Elimina las hojas y frutos con manchas visibles.",
      "Aplica bactericidas a base de cobre (sulfato de cobre o hidróxido de cobre).",
      "Evita trabajar con las plantas cuando están mojadas para no esparcir la bacteria.",
      "Reduce la densidad de siembra para mejorar la ventilación.",
    ],
    prevention: "Usa semillas tratadas y desinfecta el suelo antes de la siembra.",
  },
  "Tomato_Early_blight": {
    description: "Enfermedad fúngica causada por Alternaria solani. Produce manchas café con anillos que parecen un blanco de tiro.",
    steps: [
      "Elimina las hojas bajeras infectadas (las primeras en afectarse).",
      "Aplica fungicidas a base de Mancozeb, Clorotalonil o Cobre.",
      "Mantén el follaje seco regando solo por goteo.",
      "Fertiliza adecuadamente; las plantas estresadas son más vulnerables.",
    ],
    prevention: "Rota los cultivos y elimina los restos de cosecha al final de la temporada.",
  },
  "Tomato_Late_blight": {
    description: "Enfermedad fúngica grave causada por Phytophthora infestans. Se desarrolla rápido en clima húmedo y fresco.",
    steps: [
      "Actúa de inmediato: aplica fungicidas sistémicos con Metalaxil o Dimetomorfo.",
      "Elimina y destruye (quema o entierra) todo el tejido afectado.",
      "No compostes material infectado; se esparcirá la enfermedad.",
      "Aplica tratamientos cada 5-7 días mientras persista el clima húmedo.",
    ],
    prevention: "Planta en lugares con buena ventilación y evita el exceso de nitrógeno.",
  },
  "Tomato_Leaf_Mold": {
    description: "Hongo causado por Passalora fulva. Aparece como manchas amarillas en el haz y pelusa grisácea en el envés.",
    steps: [
      "Mejora urgentemente la ventilación del cultivo (poda de hojas bajeras).",
      "Aplica fungicidas a base de Clorotalonil o Azoxistrobina.",
      "Reduce la humedad relativa del invernadero si cultivas bajo techo.",
      "Elimina las hojas afectadas con sumo cuidado para no esparcir esporas.",
    ],
    prevention: "Mantén la humedad relativa por debajo del 85% y espaciado adecuado entre plantas.",
  },
  "Tomato_Septoria_leaf_spot": {
    description: "Enfermedad fúngica causada por Septoria lycopersici. Produce manchas pequeñas con centro claro y borde oscuro.",
    steps: [
      "Elimina las hojas infectadas, empezando por las más bajas.",
      "Aplica fungicidas a base de Mancozeb o Clorotalonil.",
      "Evita mojar el follaje y aplica un acolchado (mulch) para evitar salpicaduras del suelo.",
      "Repite los tratamientos fungicidas cada 7-10 días.",
    ],
    prevention: "Rota los cultivos al menos 2 años antes de volver a sembrar tomate en el mismo lugar.",
  },
  "Tomato_Spider_mites_Two_spotted_spider_mite": {
    description: "Plaga de ácaros microscópicos (Tetranychus urticae) que chupan la savia y dejan las hojas con aspecto bronceado.",
    steps: [
      "Aplica acaricidas específicos como Abamectina o Bifenazato.",
      "También puedes usar jabón potásico o aceite de Neem como alternativa orgánica.",
      "Aumenta la humedad alrededor de las plantas (los ácaros odian la humedad).",
      "Revisa el envés de las hojas con frecuencia donde se esconden.",
    ],
    prevention: "Evita el exceso de nitrógeno y los periodos de sequía prolongada que favorecen la plaga.",
  },
  "Tomato__Target_Spot": {
    description: "Enfermedad fúngica causada por Corynespora cassiicola. Las manchas tienen aspecto de diana o blanco de tiro.",
    steps: [
      "Elimina las hojas con manchas evidentes.",
      "Aplica fungicidas a base de Azoxistrobina o Mancozeb.",
      "Mejora la ventilación podando hojas interiores para reducir la humedad.",
      "Riega al nivel del suelo, nunca por aspersión.",
    ],
    prevention: "Mantén las plantas bien nutridas y realiza podas de mantenimiento regulares.",
  },
  "Tomato__Tomato_YellowLeaf__Curl_Virus": {
    description: "Virus transmitido por la mosca blanca (Bemisia tabaci). Las hojas se enrollan hacia arriba y se vuelven amarillas.",
    steps: [
      "No existe cura para el virus; elimina las plantas infectadas para proteger las sanas.",
      "Controla urgentemente la mosca blanca con insecticidas (Imidacloprid o Spinosad).",
      "Instala mallas anti-insectos si cultivas en invernadero.",
      "Coloca trampas amarillas pegajosas para monitorear y atrapar moscas blancas.",
    ],
    prevention: "Usa variedades de tomate resistentes al virus y elimina las malas hierbas que sirven de refugio a la mosca blanca.",
  },
  "Tomato__Tomato_mosaic_virus": {
    description: "Virus muy contagioso que produce un moteado amarillo-verde en las hojas y deforma los frutos.",
    steps: [
      "No existe cura; elimina y destruye las plantas infectadas de inmediato.",
      "Desinfecta todas tus herramientas con lejía (cloro diluido al 10%) antes y después de usarlas.",
      "Lávate las manos antes de manipular plantas sanas después de tocar infectadas.",
      "No fumes cerca de las plantas (el tabaco puede portar este virus).",
    ],
    prevention: "Usa semillas certificadas y variedades resistentes al mosaico del tomate.",
  },
  "Tomato_healthy": {
    description: "¡Tu planta de tomate está perfectamente saludable!",
    steps: [
      "Continúa con tu rutina actual de riego y fertilización.",
      "Realiza podas de mantenimiento para mejorar la ventilación.",
      "Inspecciona el envés de las hojas cada semana para detectar plagas a tiempo.",
    ],
    prevention: "Aplica fungicidas preventivos a base de cobre al inicio de la temporada de lluvias.",
  },
};
