export const prototypeMatrix = [
        {
          id: "service_storyboard",
          ideaType: "Servicio / experiencia",
          method: "Concept test narrativo",
          artifact: "Storyboard de experiencia",
          summary: "Prueba deseo, claridad y objeciones antes de operar la experiencia.",
          buildFields: [
            ["Usuario principal", "Quién vive la experiencia y qué presión trae."],
            ["Situación actual dolorosa", "El momento real que hace visible el problema."],
            ["Aparición de la solución", "Cómo entra la nueva mecánica en la historia."],
            ["Cambio esperado", "Qué debería hacer distinto el usuario."],
            ["Objeción probable", "Qué parte puede no creer o no aceptar."],
            ["Siguiente paso observable", "Qué acción confirma interés real."]
          ],
          output: ["Storyboard de 5 a 7 escenas", "Guion para narrarlo", "Pregunta por escena", "Cierre con decisión observable"],
          questions: ["¿Qué escena se parece más a tu realidad?", "¿Qué parte te haría querer probarlo?", "¿Qué no te parece creíble?", "¿Qué tendría que pasar para usarlo?"],
          register: ["Escena más clara", "Escena más débil", "Objeción principal", "Nivel de interés", "Acepta siguiente paso", "Frase textual relevante"],
          decision: ["Avanzar si entiende la propuesta y acepta siguiente paso.", "Iterar si hay interés pero confusión.", "Replantear si no reconoce el problema o no ve valor."]
        },
        {
          id: "service_wizard",
          ideaType: "Servicio / experiencia",
          method: "Wizard of Oz",
          artifact: "Guion de simulación de servicio",
          summary: "Permite vivir el servicio con operación manual antes de automatizar o escalar.",
          buildFields: [
            ["Momento inicial", "Desde dónde entra el usuario."],
            ["Experiencia visible", "Qué ve, recibe y hace el usuario."],
            ["Backstage manual", "Qué opera el equipo detrás de escena."],
            ["Entregable visible", "Qué prueba que el servicio ocurrió."],
            ["Roles internos", "Quién opera, observa y decide."],
            ["Límites", "Qué no se promete en la simulación."]
          ],
          output: ["Guion frontstage", "Guion backstage", "Checklist del operador", "Bitácora de sesión", "Cierre con compromiso"],
          questions: ["¿Qué parte se sintió real?", "¿Dónde necesitaste ayuda?", "¿Qué fue más valioso?", "¿Lo usarías otra vez?"],
          register: ["Paso completado o bloqueado", "Ayuda requerida", "Fricción observada", "Tiempo aproximado", "Compromiso posterior", "Comentarios del operador"],
          decision: ["Avanzar si completa el recorrido y pide continuidad.", "Iterar si funciona pero requiere demasiada ayuda.", "Replantear si no produce valor percibido."]
        },
        {
          id: "digital_clickable",
          ideaType: "Producto digital / interfaz",
          method: "Test clickable moderado",
          artifact: "Brief de prototipo clickable",
          summary: "Define el flujo mínimo para observar comprensión, confianza y ejecución de una tarea crítica.",
          buildFields: [
            ["Tarea crítica", "La acción que el usuario debe completar."],
            ["Usuario objetivo", "A quién se le probará el flujo."],
            ["Contexto de entrada", "Qué sabe o necesita antes de entrar."],
            ["Pantallas mínimas", "Las vistas estrictamente necesarias."],
            ["Interacción crítica", "El punto donde debe observarse fricción."],
            ["Estados", "Éxito, error, vacío y duda."]
          ],
          output: ["Mapa de flujo", "Lista de pantallas", "Contenido por pantalla", "Microcopy base", "Guion de prueba moderada", "Registro de tarea"],
          questions: ["¿Qué esperabas que pasara aquí?", "¿Dónde dudaste?", "¿Qué información faltó?", "¿Qué necesitarías para confiar?"],
          register: ["Tarea completada", "Pantalla de fricción", "Ayuda requerida", "Duda principal", "Tiempo aproximado", "Nivel de confianza"],
          decision: ["Avanzar si completa la tarea sin ayuda crítica.", "Iterar si entiende el valor pero se pierde en el flujo.", "Replantear si la tarea no importa o no genera confianza."]
        },
        {
          id: "digital_smoke",
          ideaType: "Producto digital / interfaz",
          method: "Smoke test",
          artifact: "Landing brief / video demo + CTA",
          summary: "Mide tracción real con una promesa clara, objeciones resueltas y un CTA observable.",
          buildFields: [
            ["Audiencia", "Quién verá primero la prueba."],
            ["Problema urgente", "Qué tensión activa el interés."],
            ["Promesa principal", "Qué mejora se ofrece."],
            ["Prueba o respaldo", "Qué reduce duda antes del CTA."],
            ["Objeciones", "Qué preguntas debe responder la pieza."],
            ["CTA medible", "Qué acción cuenta como señal real."]
          ],
          output: ["Estructura de landing", "Copy de hero", "Bloques de beneficio", "FAQ de objeciones", "CTA", "Eventos a medir", "Guion opcional de video demo"],
          questions: ["¿Qué crees que ofrece?", "¿Para quién es?", "¿Qué te haría dejar tus datos?", "¿Qué te frena?"],
          register: ["Visitas cualificadas", "Clics en CTA", "Registros o solicitudes", "Objeción dominante", "Comprensión de la promesa", "Fuente o canal"],
          decision: ["Avanzar si hay conversión o compromiso real.", "Iterar si hay clics pero baja comprensión.", "Replantear si no hay interés ni claridad."]
        },
        {
          id: "process_blueprint",
          ideaType: "Proceso / operación",
          method: "Blueprint walkthrough",
          artifact: "Blueprint antes/después",
          summary: "Contrasta el proceso actual contra el propuesto para detectar bloqueos antes de tocar operación.",
          buildFields: [
            ["Proceso actual", "Cómo se hace hoy."],
            ["Proceso propuesto", "Qué cambia en la nueva mecánica."],
            ["Roles", "Quién participa, aprueba u opera."],
            ["Momentos críticos", "Dónde puede fallar."],
            ["Dependencias", "Sistemas, áreas o permisos necesarios."],
            ["Métrica esperada", "Qué debería mejorar."]
          ],
          output: ["Blueprint actual", "Blueprint propuesto", "Tabla de roles", "Supuestos críticos", "Guion de walkthrough", "Registro de objeciones"],
          questions: ["¿Qué paso no funcionaría en la realidad?", "¿Qué dependencia falta?", "¿Qué riesgo estás viendo?", "¿Qué mejora sí vale la pena?"],
          register: ["Paso cuestionado", "Riesgo detectado", "Dependencia faltante", "Mejora percibida", "Rol afectado", "Acepta piloto"],
          decision: ["Avanzar si responsables ven mejora y no hay bloqueo estructural.", "Iterar si aparecen dependencias corregibles.", "Replantear si rompe operación o clima."]
        },
        {
          id: "process_pilot",
          ideaType: "Proceso / operación",
          method: "Piloto controlado",
          artifact: "Plan de piloto + bitácora",
          summary: "Prueba la idea en un perímetro seguro con métrica, roles y regla de salida.",
          buildFields: [
            ["Alcance mínimo", "Qué caso entra y qué queda fuera."],
            ["Unidad piloto", "Dónde se ejecuta sin afectar clientes críticos."],
            ["Roles", "Quién opera, observa y decide."],
            ["Duración", "Ventana de prueba, idealmente 30 días."],
            ["Línea base", "Contra qué se compara."],
            ["Regla de salida", "Cuándo ajustar o detener."]
          ],
          output: ["Plan de piloto", "Checklist operativo", "Bitácora de ejecución", "Matriz de incidentes", "Criterios de avance, ajuste o freno"],
          questions: ["¿Qué se desvió del diseño?", "¿Qué bloqueó la ejecución?", "¿Qué mejoró realmente?", "¿Qué condición impediría escalar?"],
          register: ["Caso piloto", "Ejecutado como diseñado", "Desvíos", "Incidentes", "Métrica diaria", "Comentarios del equipo", "Recomendación de continuidad"],
          decision: ["Avanzar si mejora la métrica sin dañar operación.", "Iterar si hay valor pero fricción operativa.", "Replantear si exige más recursos de los aceptables."]
        },
        {
          id: "commercial_offer",
          ideaType: "Modelo comercial / acceso",
          method: "Offer test",
          artifact: "Ficha de oferta",
          summary: "Prueba paquete, precio, garantía y claridad de compra antes de rediseñar el modelo completo.",
          buildFields: [
            ["Comprador", "Quién decide o paga."],
            ["Problema económico", "Qué costo, riesgo o pérdida reduce."],
            ["Paquete", "Qué incluye y qué excluye."],
            ["Precio o condición", "Qué se tensiona."],
            ["Garantía", "Qué reduce riesgo percibido."],
            ["CTA comercial", "Qué acción indica avance real."]
          ],
          output: ["Ficha de oferta", "Mensaje comercial", "Comparación contra alternativa actual", "FAQ", "Registro de intención"],
          questions: ["¿Qué entiendes que incluye?", "¿Qué parte te parece más valiosa?", "¿Qué precio o condición te parece razonable?", "¿Qué te impediría comprar o aprobar?"],
          register: ["Claridad de oferta", "Objeción de precio", "Objeción de confianza", "Intención de compra", "Solicita reunión o cotización", "Condición requerida para avanzar"],
          decision: ["Avanzar si hay señal comercial concreta.", "Iterar si gusta el valor pero falla precio o paquete.", "Replantear si no se entiende o no se diferencia."]
        },
        {
          id: "commercial_concierge",
          ideaType: "Modelo comercial / acceso",
          method: "Concierge test comercial",
          artifact: "Guion de venta / simulación comercial",
          summary: "Simula venta consultiva para validar urgencia, pagador, evidencia requerida y siguiente paso.",
          buildFields: [
            ["Cliente objetivo", "Cuenta o perfil que representa el mercado."],
            ["Dolor comprador", "Qué prioridad activa conversación."],
            ["Promesa", "Qué resultado se ofrece."],
            ["Secuencia", "Cómo avanza la conversación."],
            ["Evidencia", "Qué se muestra para ganar confianza."],
            ["Cierre esperado", "Qué siguiente paso cuenta."]
          ],
          output: ["Guion de venta", "Script de conversación", "Demo verbal o visual", "Respuestas a objeciones", "Registro de avance comercial"],
          questions: ["¿Esto resolvería una prioridad real?", "¿Quién tendría que aprobarlo?", "¿Qué evidencia necesitas?", "¿Cuál sería el siguiente paso razonable?"],
          register: ["Etapa alcanzada", "Objeción principal", "Stakeholder requerido", "Solicita propuesta, reunión o piloto", "Condiciones de compra", "Nivel de urgencia"],
          decision: ["Avanzar si obtiene siguiente paso comercial real.", "Iterar si hay interés pero faltan pruebas.", "Replantear si no hay urgencia ni pagador claro."]
        },
        {
          id: "physical_visual",
          ideaType: "Producto físico / tangible",
          method: "Concept visual test",
          artifact: "Ficha visual / video de uso simulado",
          summary: "Vuelve tangible el concepto para probar uso imaginado, confianza y objeciones físicas.",
          buildFields: [
            ["Usuario", "Quién evaluará el objeto o pieza."],
            ["Contexto de uso", "Dónde aparece y para qué."],
            ["Atributos visibles", "Qué debe entenderse al verlo."],
            ["Escala y materialidad", "Tamaño, textura o referencia."],
            ["Beneficio esperado", "Qué cambia para el usuario."],
            ["Escena de uso", "Qué mostraría una imagen o video."]
          ],
          output: ["Ficha visual", "Brief de render o foto", "Guion de video de uso simulado", "Preguntas de reacción", "Registro de interés"],
          questions: ["¿Dónde lo usarías?", "¿Qué atributo te da más confianza?", "¿Qué no te parece viable?", "¿Lo pedirías, probarías o comprarías?"],
          register: ["Atributo más valorado", "Duda física", "Objeción de precio", "Contexto de uso imaginado", "Intención real", "Alternativa actual"],
          decision: ["Avanzar si entiende uso y pide probar o comprar.", "Iterar si gusta pero hay dudas de forma o material.", "Replantear si no ve utilidad o no confía en el objeto."]
        },
        {
          id: "physical_mockup",
          ideaType: "Producto físico / tangible",
          method: "Prueba manipulable mínima",
          artifact: "Brief de mockup + protocolo de uso",
          summary: "Define qué debe ser real y qué puede simularse para observar uso físico sin sobredesarrollar.",
          buildFields: [
            ["Tarea física", "Qué debe intentar completar el usuario."],
            ["Partes reales", "Qué no puede simularse."],
            ["Partes simuladas", "Qué puede ser maqueta."],
            ["Materiales", "Con qué se construye el mockup."],
            ["Límites de seguridad", "Qué no se debe probar todavía."],
            ["Puntos de observación", "Qué comportamientos importan."]
          ],
          output: ["Brief de construcción del mockup", "Lista de materiales", "Protocolo de manipulación", "Checklist de observación", "Registro de uso"],
          questions: ["¿Qué parte fue clara?", "¿Qué parte fue incómoda?", "¿Qué te generó duda?", "¿Lo usarías con esta calidad?"],
          register: ["Tarea completada", "Esfuerzo percibido", "Problema físico", "Calidad percibida", "Riesgo de seguridad", "Intención de uso o compra"],
          decision: ["Avanzar si la tarea se completa y la calidad sostiene valor.", "Iterar si hay fricción física corregible.", "Replantear si el objeto no resuelve o genera riesgo."]
        }
      ];;

const prototypeInterpretationGuidance = {
        service_storyboard: {
          validates: ["Deseo inicial", "Claridad de la experiencia", "Relevancia del problema", "Objeciones tempranas", "Disposición a un siguiente paso"],
          doesNotValidate: ["Operación real", "Escalabilidad del servicio", "Costo de entrega", "Adopción sostenida"],
          advanceSignals: ["El usuario reconoce una escena como propia", "Explica el valor sin ayuda", "Pide probar o conocer el siguiente paso", "La objeción principal es específica y corregible"],
          stopSignals: ["No reconoce el problema", "Necesita explicación larga para entender la propuesta", "La objeción destruye el supuesto central", "No acepta ningún siguiente paso"],
          falsePositive: "El usuario dice que le gusta la historia por cortesía, pero no haría nada después.",
          falseNegative: "El storyboard está mal narrado o demasiado abstracto y oculta una idea que sí podría interesar.",
          avoidMisread: ["Cerrar siempre con una acción observable, no solo opinión", "Pedir que el usuario explique la propuesta con sus palabras", "Separar confusión del artefacto de rechazo real de la idea"],
          evidenceScope: {
            sample: "5 a 7 usuarios o compradores representativos en 1 semana.",
            sampleTargetMin: 5,
            sampleTargetMax: 7,
            validates: "Si el problema se reconoce, si la historia se entiende y si la propuesta genera un siguiente paso observable.",
            doesNotValidate: "No valida operación real, escalabilidad, costo de entrega ni adopción sostenida.",
            thresholds: {
              advance: "Avanzar si 4 de 5 entienden la propuesta y al menos 3 aceptan un siguiente paso concreto.",
              iterate: "Iterar si hay interés, pero 2 o más personas confunden escenas, valor o condición de uso.",
              rethink: "Replantear si menos de 2 reconocen el problema o nadie acepta una acción posterior."
            }
          }
        },
        service_wizard: {
          validates: ["Comprensión del recorrido", "Valor percibido al vivir la experiencia", "Fricciones operativas visibles", "Confianza durante el servicio", "Compromiso de continuidad"],
          doesNotValidate: ["Automatización final", "Escalamiento operativo", "Economía unitaria completa", "Permanencia de largo plazo"],
          advanceSignals: ["Completa el recorrido", "La ayuda requerida es baja o manejable", "El entregable visible produce valor", "Acepta repetir o continuar el piloto"],
          stopSignals: ["La simulación requiere intervención excesiva", "El usuario no percibe diferencia frente a la alternativa actual", "El equipo no puede operar el backstage mínimo", "Aparecen riesgos de seguridad o confianza"],
          falsePositive: "La experiencia funciona porque el equipo compensa manualmente con esfuerzo extraordinario imposible de sostener.",
          falseNegative: "Un operador mal preparado genera fricción artificial y hace parecer débil una mecánica prometedora.",
          avoidMisread: ["Registrar cuánta ayuda fue necesaria", "Distinguir falla del guion de falla del concepto", "Probar con más de un operador o sesión si el resultado es ambiguo"],
          evidenceScope: {
            sample: "4 a 6 sesiones reales o simuladas con usuarios objetivo durante 1 a 2 semanas.",
            sampleTargetMin: 4,
            sampleTargetMax: 6,
            validates: "Si la experiencia produce valor percibido, si el usuario completa el recorrido y si el backstage manual es operable.",
            doesNotValidate: "No valida automatización, escalamiento, economía unitaria completa ni permanencia de largo plazo.",
            thresholds: {
              advance: "Avanzar si 4 sesiones completan el recorrido y al menos 3 usuarios piden repetir, continuar o probar en contexto real.",
              iterate: "Iterar si hay valor, pero la ayuda manual o la fricción aparece en más de 2 sesiones.",
              rethink: "Replantear si la mayoría no percibe diferencia o el equipo no puede operar el backstage mínimo."
            }
          }
        },
        digital_clickable: {
          validates: ["Comprensión de la tarea", "Flujo principal", "Confianza en la interfaz", "Fricciones de navegación", "Valor percibido de la solución digital"],
          doesNotValidate: ["Performance técnica", "Integraciones reales", "Adopción sostenida", "Viabilidad de backend", "Seguridad productiva"],
          advanceSignals: ["Completa la tarea crítica sin ayuda fuerte", "Entiende qué información necesita entregar o recibir", "Identifica valor en el flujo", "La fricción se concentra en detalles corregibles"],
          stopSignals: ["No entiende la tarea", "No confía en el flujo aun con explicación", "La tarea no le parece prioritaria", "Rechaza entregar datos o avanzar"],
          falsePositive: "El usuario completa el flujo porque el moderador lo guía demasiado, no porque la interfaz sea clara.",
          falseNegative: "El prototipo tiene baja fidelidad o microcopy pobre y produce dudas que el producto real resolvería.",
          avoidMisread: ["Medir ayuda requerida", "Pedir pensamiento en voz alta", "No explicar la pantalla antes de observar", "Distinguir problema de contenido de problema de arquitectura"],
          evidenceScope: {
            sample: "5 a 8 usuarios objetivo en pruebas moderadas de 20 a 30 minutos.",
            sampleTargetMin: 5,
            sampleTargetMax: 8,
            validates: "Si el flujo se entiende, si la tarea crítica se completa y si la interfaz genera confianza suficiente.",
            doesNotValidate: "No valida performance técnica, integraciones reales, backend, seguridad productiva ni retención.",
            thresholds: {
              advance: "Avanzar si 6 de 8 completan la tarea crítica sin ayuda fuerte y explican el valor correctamente.",
              iterate: "Iterar si completan la tarea, pero 3 o más se pierden en la misma pantalla o microcopy.",
              rethink: "Replantear si menos de la mitad completa la tarea o la tarea no se percibe importante."
            }
          }
        },
        digital_smoke: {
          validates: ["Atracción de la promesa", "Claridad del posicionamiento", "Interés medible por CTA", "Objeciones tempranas", "Canal de adquisición inicial"],
          doesNotValidate: ["Uso real del producto", "Retención", "Experiencia completa", "Viabilidad técnica", "Satisfacción posterior"],
          advanceSignals: ["Clics o registros cualificados", "Comprensión correcta de la promesa", "Preguntas de compra o acceso", "Objeciones concentradas en detalles corregibles"],
          stopSignals: ["Tráfico cualificado sin acciones", "Confusión sobre qué se ofrece", "Objeción central de confianza o valor", "Interés de audiencia equivocada"],
          falsePositive: "El CTA recibe clics por curiosidad o incentivo, no por intención real de usar o comprar.",
          falseNegative: "El canal o copy atrae mal tráfico y hace parecer débil una propuesta con potencial.",
          avoidMisread: ["Calificar la fuente del tráfico", "Medir acción de compromiso, no solo visitas", "Preguntar qué entendió antes de interpretar conversión", "Separar problema de canal de problema de propuesta"],
          evidenceScope: {
            sample: "100 a 300 visitas cualificadas o 30 a 50 contactos directos durante 1 a 2 semanas.",
            sampleTargetMin: 100,
            sampleTargetMax: 300,
            validates: "Si la promesa atrae interés medible, si se entiende la oferta y si el CTA produce compromiso inicial.",
            doesNotValidate: "No valida uso real, retención, satisfacción posterior, viabilidad técnica ni experiencia completa.",
            thresholds: {
              advance: "Avanzar si al menos 8 a 12% de tráfico cualificado hace CTA o 5 contactos piden acceso/reunión.",
              iterate: "Iterar si hay clics o interés, pero baja comprensión, mala fuente o objeciones repetidas de confianza.",
              rethink: "Replantear si no hay acciones cualificadas ni comprensión de la promesa después de ajustar copy/canal."
            }
          }
        },
        process_blueprint: {
          validates: ["Lógica del proceso propuesto", "Percepción de mejora", "Dependencias críticas", "Riesgo operativo antes de ejecutar", "Alineación entre roles"],
          doesNotValidate: ["Ejecución real sostenida", "Cambio cultural", "Cumplimiento en campo", "Impacto cuantitativo final"],
          advanceSignals: ["Responsables reconocen mejora", "No aparecen bloqueos estructurales", "Las dependencias son resolubles", "Aceptan un piloto acotado"],
          stopSignals: ["Un rol crítico rechaza el flujo", "Aparece una dependencia imposible de resolver", "El cambio aumenta riesgo operativo", "La mejora percibida no compensa la fricción"],
          falsePositive: "El proceso parece viable en sala, pero quienes lo operan no estaban representados.",
          falseNegative: "La sesión se concentra en excepciones extremas y bloquea una mejora válida para casos comunes.",
          avoidMisread: ["Incluir roles que ejecutan, no solo decisores", "Separar caso típico de excepción", "Marcar dependencias por nivel de control", "No convertir objeciones políticas en imposibilidad técnica sin validar"],
          evidenceScope: {
            sample: "2 a 3 sesiones con 4 a 6 roles críticos, cubriendo al menos un caso típico y una excepción.",
            sampleTargetMin: 2,
            sampleTargetMax: 3,
            validates: "Si el proceso propuesto es comprensible, si los roles ven mejora y si las dependencias son resolubles.",
            doesNotValidate: "No valida ejecución sostenida, cambio cultural, cumplimiento en campo ni impacto cuantitativo final.",
            thresholds: {
              advance: "Avanzar si roles críticos aceptan un piloto y no aparecen bloqueos estructurales de operación o seguridad.",
              iterate: "Iterar si hay valor, pero aparecen dependencias, roles difusos o ajustes necesarios en el flujo.",
              rethink: "Replantear si un rol crítico bloquea la lógica o el proceso aumenta riesgo operativo."
            }
          }
        },
        process_pilot: {
          validates: ["Ejecución real en perímetro acotado", "Mejora operativa inicial", "Fricciones del equipo", "Riesgos de implementación", "Continuidad bajo condiciones reales"],
          doesNotValidate: ["Escalamiento total", "Permanencia organizacional", "Impacto financiero completo", "Funcionamiento en todos los segmentos"],
          advanceSignals: ["Se ejecuta como fue diseñado", "La métrica principal mejora sin daño colateral", "El equipo puede sostener la rutina", "Los incidentes son manejables"],
          stopSignals: ["Afecta clientes críticos o seguridad", "Requiere recursos no disponibles", "Empeora clima u operación", "La métrica no mejora y aumenta carga"],
          falsePositive: "El piloto mejora porque recibe atención excepcional que no existiría al escalar.",
          falseNegative: "La primera semana falla por curva de aprendizaje, aunque la mecánica podría estabilizarse.",
          avoidMisread: ["Definir línea base", "Registrar carga operativa", "Separar curva de aprendizaje de falla estructural", "Usar regla de salida antes de iniciar"],
          evidenceScope: {
            sample: "1 a 3 unidades piloto o 10 a 20 casos reales durante 2 a 4 semanas.",
            sampleTargetMin: 1,
            sampleTargetMax: 3,
            validates: "Si la mecánica puede ejecutarse en condiciones reales, si mejora una métrica inicial y si no daña operación.",
            doesNotValidate: "No valida escalamiento total, permanencia organizacional, impacto financiero completo ni todos los segmentos.",
            thresholds: {
              advance: "Avanzar si la métrica principal mejora y no hay incidentes críticos ni carga operativa inaceptable.",
              iterate: "Iterar si hay mejora parcial, pero aparecen fricciones operativas corregibles o curva de aprendizaje.",
              rethink: "Replantear si afecta seguridad, clientes críticos, clima o exige recursos fuera de restricción."
            }
          }
        },
        commercial_offer: {
          validates: ["Claridad de paquete", "Valor percibido", "Sensibilidad a precio o condición", "Objeciones de compra", "Interés comercial inicial"],
          doesNotValidate: ["Cierre de venta sostenido", "Retención", "Margen real completo", "Capacidad de entrega a escala"],
          advanceSignals: ["Solicita cotización, reunión o piloto", "Identifica valor diferencial", "Acepta una condición comercial concreta", "La objeción es negociable"],
          stopSignals: ["No entiende qué incluye", "No identifica pagador o aprobador", "El precio se percibe injustificado", "La oferta no se diferencia de alternativas"],
          falsePositive: "El comprador elogia la oferta para mantener la relación, pero no tiene urgencia ni presupuesto.",
          falseNegative: "La oferta falla por empaque o precio inicial, no por ausencia de valor.",
          avoidMisread: ["Pedir siguiente paso concreto", "Identificar pagador y proceso de aprobación", "Separar objeción de precio de objeción de valor", "No tomar intención verbal como compra"],
          evidenceScope: {
            sample: "5 a 8 conversaciones con compradores o aprobadores reales durante 1 a 2 semanas.",
            sampleTargetMin: 5,
            sampleTargetMax: 8,
            validates: "Si el paquete se entiende, si el valor justifica conversación comercial y si aparece intención de siguiente paso.",
            doesNotValidate: "No valida cierre sostenido, retención, margen real completo ni capacidad de entrega a escala.",
            thresholds: {
              advance: "Avanzar si al menos 3 compradores piden propuesta, reunión con decisor o piloto con condición concreta.",
              iterate: "Iterar si hay valor, pero se repiten dudas de paquete, precio, garantía o evidencia requerida.",
              rethink: "Replantear si no aparece pagador claro o la oferta no se diferencia del contrato actual."
            }
          }
        },
        commercial_concierge: {
          validates: ["Urgencia comercial", "Pagador real", "Evidencia necesaria para comprar", "Secuencia de venta", "Compromiso de siguiente paso"],
          doesNotValidate: ["Escalabilidad del canal", "Costo de adquisición final", "Retención", "Capacidad operacional completa"],
          advanceSignals: ["Consigue reunión con decisor", "Pide propuesta o piloto", "Declara condición de compra concreta", "El dolor aparece como prioridad actual"],
          stopSignals: ["No hay urgencia", "No aparece pagador claro", "La evidencia requerida es inviable", "La conversación no avanza de curiosidad a compromiso"],
          falsePositive: "El vendedor obtiene interés por relación personal, no por fuerza de la propuesta.",
          falseNegative: "Un guion débil o mal vendedor impide detectar una necesidad real.",
          avoidMisread: ["Registrar quién decide y quién influye", "Medir avance de etapa, no simpatía", "Usar el mismo guion con varias cuentas", "Distinguir curiosidad de presupuesto o prioridad"],
          evidenceScope: {
            sample: "5 a 7 simulaciones o conversaciones comerciales con cuentas objetivo en 2 semanas.",
            sampleTargetMin: 5,
            sampleTargetMax: 7,
            validates: "Si existe urgencia comercial, si aparece pagador real y si la secuencia logra un compromiso verificable.",
            doesNotValidate: "No valida escalabilidad del canal, costo de adquisición final, retención ni capacidad operacional completa.",
            thresholds: {
              advance: "Avanzar si 3 cuentas aceptan siguiente paso con decisor, propuesta o piloto definido.",
              iterate: "Iterar si hay dolor y urgencia, pero falta evidencia, guion o claridad de cierre.",
              rethink: "Replantear si no aparece pagador, presupuesto, urgencia o avance más allá de curiosidad."
            }
          }
        },
        physical_visual: {
          validates: ["Comprensión del concepto físico", "Uso imaginado", "Reacción a atributos visibles", "Confianza inicial", "Objeciones de forma, material o precio"],
          doesNotValidate: ["Uso real", "Durabilidad", "Ergonomía real", "Producción", "Seguridad técnica"],
          advanceSignals: ["El usuario imagina contexto de uso concreto", "Pide probar o comprar", "Valora atributos visibles", "Las dudas son de forma o detalle corregible"],
          stopSignals: ["No entiende para qué sirve", "No confía en el objeto", "No ve ventaja frente a alternativa actual", "La objeción física afecta el supuesto central"],
          falsePositive: "Un render atractivo genera deseo estético sin intención real de uso o compra.",
          falseNegative: "Una visualización pobre hace parecer inviable un objeto que funcionaría con mejor representación.",
          avoidMisread: ["Preguntar uso concreto, no solo gusto", "Mostrar escala y contexto", "Comparar con alternativa actual", "No confundir estética con validación"],
          evidenceScope: {
            sample: "6 a 10 usuarios objetivo reaccionando a ficha visual o video en 1 semana.",
            sampleTargetMin: 6,
            sampleTargetMax: 10,
            validates: "Si el concepto físico se entiende, si el uso imaginado tiene sentido y si atributos visibles generan confianza.",
            doesNotValidate: "No valida uso real, durabilidad, ergonomía real, producción ni seguridad técnica.",
            thresholds: {
              advance: "Avanzar si 6 de 10 entienden uso y al menos 4 piden probar, comprar o ver una versión física.",
              iterate: "Iterar si gusta el beneficio, pero aparecen dudas de forma, material, escala o contexto de uso.",
              rethink: "Replantear si la mayoría no ve utilidad, no confía o prefiere claramente la alternativa actual."
            }
          }
        },
        physical_mockup: {
          validates: ["Uso físico básico", "Ergonomía inicial", "Calidad percibida", "Fricción manipulable", "Disposición a usar con limitaciones"],
          doesNotValidate: ["Producción industrial", "Certificación", "Durabilidad final", "Costo unitario final", "Seguridad completa"],
          advanceSignals: ["Completa la tarea física", "La fricción es corregible", "La calidad percibida sostiene valor", "No aparecen riesgos críticos", "Acepta usar o probar de nuevo"],
          stopSignals: ["No completa la tarea", "Aparece riesgo de seguridad", "El esfuerzo percibido supera el beneficio", "La calidad mínima destruye confianza"],
          falsePositive: "El usuario tolera el mockup por novedad o acompañamiento, pero no lo usaría en contexto real.",
          falseNegative: "La baja fidelidad del mockup introduce incomodidades que no existirían en una versión mejor construida.",
          avoidMisread: ["Definir qué partes son reales y cuáles simuladas", "Observar tarea, no solo opinión", "Separar problema de material de problema de concepto", "No probar condiciones de seguridad fuera del alcance"],
          evidenceScope: {
            sample: "5 a 8 usuarios realizando una tarea física controlada con el mockup.",
            sampleTargetMin: 5,
            sampleTargetMax: 8,
            validates: "Si la tarea física básica se completa, si la ergonomía inicial es aceptable y si la calidad mínima sostiene valor.",
            doesNotValidate: "No valida producción industrial, certificación, durabilidad final, costo unitario ni seguridad completa.",
            thresholds: {
              advance: "Avanzar si 5 de 8 completan la tarea sin riesgo crítico y expresan disposición a usar o probar de nuevo.",
              iterate: "Iterar si completan la tarea, pero hay fricción física, material o calidad corregible.",
              rethink: "Replantear si no completa la tarea, genera riesgo o la calidad mínima destruye confianza."
            }
          }
        }
      };;

const prototypeClosedQuestionGuidance = {
  service_storyboard: [
    ["recognized_scene", "¿Reconoció una escena como propia?", ["Sí", "Parcial", "No"], "Reconocimiento del problema"],
    ["explained_value", "¿Explicó el valor con sus propias palabras?", ["Sí", "Parcial", "No"], "Claridad y valor percibido"],
    ["accepted_next_step", "¿Aceptó un siguiente paso concreto?", ["Sí", "No", "Dudoso"], "Compromiso observable"],
    ["main_objection", "¿La objeción principal fue corregible o bloqueante?", ["Corregible", "Bloqueante", "No apareció"], "Calidad de objeción"],
  ],
  service_wizard: [
    ["completed_journey", "¿Completó el recorrido?", ["Sí", "Con ayuda", "No"], "Ejecución del servicio"],
    ["help_level", "¿Cuánta ayuda necesitó?", ["Baja", "Media", "Alta"], "Fricción operativa"],
    ["perceived_value", "¿Percibió valor diferencial durante la experiencia?", ["Sí", "Parcial", "No"], "Valor vivido"],
    ["continuity_commitment", "¿Pidió repetir, continuar o probar en contexto real?", ["Sí", "No", "Dudoso"], "Compromiso de continuidad"],
  ],
  digital_clickable: [
    ["completed_task", "¿Completó la tarea crítica?", ["Sin ayuda fuerte", "Con ayuda", "No"], "Comprensión del flujo"],
    ["trusted_flow", "¿El flujo generó confianza suficiente?", ["Sí", "Parcial", "No"], "Confianza en interfaz"],
    ["friction_location", "¿La fricción se concentró en un punto corregible?", ["Sí", "No", "No hubo fricción"], "Fricción corregible"],
    ["task_priority", "¿La tarea se percibió importante?", ["Sí", "Parcial", "No"], "Relevancia de la tarea"],
  ],
  digital_smoke: [
    ["qualified_action", "¿Hubo acción cualificada en el CTA?", ["Sí", "No", "Dudoso"], "Compromiso medible"],
    ["promise_understood", "¿Entendió correctamente la promesa?", ["Sí", "Parcial", "No"], "Claridad de posicionamiento"],
    ["right_audience", "¿La señal vino de audiencia correcta?", ["Sí", "No", "No sabemos"], "Calidad de fuente"],
    ["objection_type", "¿La objeción principal fue corregible o central?", ["Corregible", "Central", "No apareció"], "Calidad de objeción"],
  ],
  process_blueprint: [
    ["critical_roles_accept", "¿Los roles críticos aceptaron un piloto acotado?", ["Sí", "Parcial", "No"], "Alineación entre roles"],
    ["structural_blocker", "¿Apareció un bloqueo estructural?", ["No", "Sí", "No sabemos"], "Riesgo operativo"],
    ["dependencies_resolvable", "¿Las dependencias parecen resolubles?", ["Sí", "Parcial", "No"], "Dependencias"],
    ["improvement_perceived", "¿Los responsables percibieron mejora real?", ["Sí", "Parcial", "No"], "Mejora percibida"],
  ],
  process_pilot: [
    ["executed_as_designed", "¿Se ejecutó como fue diseñado?", ["Sí", "Parcial", "No"], "Ejecución real"],
    ["main_metric_improved", "¿Mejoró la métrica principal?", ["Sí", "Parcial", "No"], "Mejora operativa"],
    ["critical_incident", "¿Apareció incidente crítico de seguridad, cliente o clima?", ["No", "Sí", "No sabemos"], "Riesgo de freno"],
    ["operational_load", "¿La carga operativa fue aceptable?", ["Sí", "Límite", "No"], "Sostenibilidad operativa"],
  ],
  commercial_offer: [
    ["asked_next_step", "¿Pidió reunión, propuesta, piloto o siguiente paso concreto?", ["Sí", "No", "Dudoso"], "Compromiso comercial observable"],
    ["identified_differential_value", "¿Identificó valor diferencial frente al contrato actual?", ["Sí", "Parcial", "No"], "Diferenciación percibida"],
    ["clear_payer_approver", "¿Apareció pagador o aprobador claro?", ["Sí", "No", "No sabemos"], "Pagador real"],
    ["objection_quality", "¿La objeción principal fue corregible o bloqueante?", ["Corregible", "Bloqueante", "No apareció"], "Calidad de objeción"],
    ["interest_quality", "¿El interés fue compromiso observable o cortesía?", ["Compromiso observable", "Cortesía", "Dudoso"], "Riesgo de falso positivo"],
  ],
  commercial_concierge: [
    ["advanced_stage", "¿La conversación avanzó a una etapa comercial real?", ["Sí", "No", "Dudoso"], "Avance comercial"],
    ["real_payer", "¿Apareció pagador o decisor real?", ["Sí", "No", "No sabemos"], "Pagador real"],
    ["current_urgency", "¿El dolor apareció como prioridad actual?", ["Sí", "Parcial", "No"], "Urgencia"],
    ["evidence_viable", "¿La evidencia requerida para comprar es viable?", ["Sí", "Parcial", "No"], "Evidencia requerida"],
  ],
  physical_visual: [
    ["understood_use", "¿Entendió el uso del concepto físico?", ["Sí", "Parcial", "No"], "Comprensión del objeto"],
    ["imagined_context", "¿Imaginó un contexto de uso concreto?", ["Sí", "No", "Dudoso"], "Uso imaginado"],
    ["asked_to_try_buy", "¿Pidió probar, comprar o ver una versión física?", ["Sí", "No", "Dudoso"], "Intención real"],
    ["physical_objection", "¿La objeción física fue corregible o central?", ["Corregible", "Central", "No apareció"], "Calidad de objeción física"],
  ],
  physical_mockup: [
    ["completed_physical_task", "¿Completó la tarea física?", ["Sí", "Con fricción", "No"], "Uso físico básico"],
    ["safety_risk", "¿Apareció riesgo de seguridad?", ["No", "Sí", "No sabemos"], "Seguridad"],
    ["quality_sustains_value", "¿La calidad percibida sostuvo el valor?", ["Sí", "Parcial", "No"], "Calidad percibida"],
    ["willing_to_use_again", "¿Aceptaría usar o probar de nuevo?", ["Sí", "No", "Dudoso"], "Disposición de uso"],
  ],
} as const;

function closedQuestionsFor(routeId: keyof typeof prototypeClosedQuestionGuidance) {
  return prototypeClosedQuestionGuidance[routeId].map(([id, label, options, evidenceRole]) => ({
    id,
    label,
    type: "choice",
    options: [...options],
    evidenceRole,
  }));
}

const prototypeEvidenceMetricGuidance = {
  service_storyboard: [
    ["accepted_next_step", "Siguiente paso aceptado", ["Sí"], ">=60%", "30%-59%", "<30%", "Mide compromiso observable después de entender la historia, no agrado declarado."],
    ["recognized_scene", "Reconocimiento del problema", ["Sí"], ">=70%", "40%-69%", "<40%", "Mide si la historia parte de una situación que el usuario reconoce como propia."],
  ],
  service_wizard: [
    ["continuity_commitment", "Compromiso de continuidad", ["Sí"], ">=60%", "30%-59%", "<30%", "Mide si la experiencia vivida genera deseo de repetir, continuar o probar en contexto real."],
    ["completed_journey", "Recorrido completado", ["Sí"], ">=70%", "40%-69%", "<40%", "Mide ejecución observable del servicio, separando valor de ayuda excesiva."],
  ],
  digital_clickable: [
    ["completed_task", "Tarea crítica completada", ["Sin ayuda fuerte"], ">=75%", "40%-74%", "<40%", "Mide comprensión operativa del flujo, no preferencia estética por la interfaz."],
    ["trusted_flow", "Confianza suficiente", ["Sí"], ">=60%", "30%-59%", "<30%", "Mide si el usuario confiaría lo bastante para avanzar en la tarea."],
  ],
  digital_smoke: [
    ["qualified_action", "Acción cualificada en CTA", ["Sí"], ">=8%-12% de tráfico cualificado o 5 contactos", "Hay clics/interés pero baja comprensión", "Sin acciones cualificadas", "Mide tracción observable; debe leerse junto con calidad de audiencia y comprensión de promesa."],
    ["promise_understood", "Promesa entendida", ["Sí"], ">=70%", "40%-69%", "<40%", "Mide claridad del posicionamiento antes de interpretar conversión."],
  ],
  process_blueprint: [
    ["critical_roles_accept", "Roles críticos aceptan piloto", ["Sí"], ">=70%", "40%-69%", "<40%", "Mide alineación mínima para pasar del mapa a una prueba acotada."],
    ["structural_blocker", "Sin bloqueo estructural", ["No"], ">=80%", "50%-79%", "<50%", "Mide si la objeción principal no rompe operación, seguridad o clima."],
  ],
  process_pilot: [
    ["main_metric_improved", "Métrica principal mejora", ["Sí"], ">=60% de casos o mejora clara de línea base", "Mejora parcial con fricción corregible", "Sin mejora o con daño colateral", "Mide impacto operativo inicial dentro del perímetro seguro."],
    ["critical_incident", "Sin incidente crítico", ["No"], "100%", "Incidentes menores controlables", "Cualquier incidente crítico", "Mide condición de seguridad para no avanzar con daño operativo."],
  ],
  commercial_offer: [
    ["asked_next_step", "Siguiente paso concreto", ["Sí"], ">=60% o 3 de 5 compradores", "30%-59%", "<30%", "Mide compromiso comercial observable, no agrado ni cortesía."],
    ["identified_differential_value", "Valor diferencial identificado", ["Sí"], ">=60%", "30%-59%", "<30%", "Mide si la oferta se diferencia del contrato o alternativa actual."],
    ["clear_payer_approver", "Pagador o aprobador claro", ["Sí"], ">=50%", "20%-49%", "<20%", "Mide si existe camino real de aprobación."],
  ],
  commercial_concierge: [
    ["advanced_stage", "Avance de etapa comercial", ["Sí"], ">=60% o 3 de 5 cuentas", "30%-59%", "<30%", "Mide avance verificable de etapa, no simpatía en conversación."],
    ["real_payer", "Pagador o decisor real", ["Sí"], ">=50%", "20%-49%", "<20%", "Mide si la conversación llega a quien puede decidir o pagar."],
  ],
  physical_visual: [
    ["asked_to_try_buy", "Intención de probar o comprar", ["Sí"], ">=40% o 4 de 10 usuarios", "20%-39%", "<20%", "Mide intención observable frente al concepto físico, no gusto estético."],
    ["understood_use", "Uso entendido", ["Sí"], ">=60%", "30%-59%", "<30%", "Mide si el objeto comunica utilidad en contexto."],
  ],
  physical_mockup: [
    ["completed_physical_task", "Tarea física completada", ["Sí"], ">=60% o 5 de 8 usuarios", "30%-59%", "<30%", "Mide uso físico básico bajo condiciones controladas."],
    ["safety_risk", "Sin riesgo de seguridad", ["No"], "100%", "Riesgo menor controlable", "Cualquier riesgo crítico", "Mide condición mínima para no avanzar con daño físico o reputacional."],
  ],
} as const;

function evidenceMetricsFor(routeId: keyof typeof prototypeEvidenceMetricGuidance) {
  return prototypeEvidenceMetricGuidance[routeId].map(
    ([questionId, label, advanceValues, advance, iterate, rethink, interpretation]) => ({
      questionId,
      label,
      advanceValues: [...advanceValues],
      advance,
      iterate,
      rethink,
      interpretation,
    }),
  );
}

prototypeMatrix.forEach((route) => {
  Object.assign(
    route,
    prototypeInterpretationGuidance[
      route.id as keyof typeof prototypeInterpretationGuidance
    ],
    {
      closedQuestions: closedQuestionsFor(
        route.id as keyof typeof prototypeClosedQuestionGuidance,
      ),
      evidenceMetrics: evidenceMetricsFor(
        route.id as keyof typeof prototypeEvidenceMetricGuidance,
      ),
    },
  );
});

export const prototypeIdeaTypes = [...new Set(prototypeMatrix.map((route) => route.ideaType))];

export type PrototypeMatrixRoute = (typeof prototypeMatrix)[number];
