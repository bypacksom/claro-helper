// Plantillas SGA y WhatsApp para Mesa Multiskill HITSS.
// El texto se mantiene tal cual lo dicta operación. Las variables se interpolan
// con {SOT}, {DIA_FRANJA}, {CLIENTE}, {NUMERO}, {CONTRATA}, {ADP}, {SUBMOTIVO}.

export type TemplateCategory =
  | "Confirmación"
  | "Habilitación"
  | "Ciclo de llamadas"
  | "Rechazo - Comercial"
  | "Rescate Comercial"
  | "Fuera de TOA";

export interface SgaTemplate {
  id: string;
  label: string;
  category: TemplateCategory;
  body: string;
  submotivos?: string[];
  /** Sub-campos adicionales que el usuario complete a mano (ej. dirección correcta). */
  extraNote?: string;
}

export const ADP_OPTIONS = [
  "Jhostin Baldeon",
  "Javier Carrion",
  "Patrick Coras",
  "Fredy Laredo",
  "Angel Potesta",
  "Edwin Zorrilla",
  "Angie Mori",
  "Jesus Cerna",
  "Jeferson Bautista",
  "Angelo Palomino",
  "Antony Bernaloa",
  "Paul Carrasco",
  "Xiavier Capa",
  "LEE MAURICIO",
  "Carlos Chiroque",
  "Otro",
] as const;

/** Firma usada en respuestas WhatsApp según el ADP activo. */
export function adpSignature(adp: string): string {
  if (adp === "Patrick Coras") return "P.R";
  if (adp === "Javier Carrion") return "J.C";
  if (adp === "Fredy Laredo") return "F.L";
  if (adp === "Angel Potesta") return "D.P";
  if (adp === "Edwin Zorrilla") return "E.Z";
  if (adp === "Angie Mori") return "A.M";
  if (adp === "Jesus Cerna") return "I.C";
  if (adp === "Jeferson Bautista") return "J.B";
  if (adp === "Angelo Palomino") return "A.P";
  if (adp === "Antony Bernaloa") return "A.B";
  if (adp === "Paul Carrasco") return "P.C";
  if (adp === "Xiavier Capa") return "X.C";
  if (adp === "LEE MAURICIO") return "L.M.";
  if (adp === "Carlos Chiroque") return "C.C.";
  return "J.L";
}

export const FRANJAS_INFO: { value: string; label: string }[] = [
  { value: "AM0", label: "AM0 · 07:00 – 09:00" },
  { value: "AM1", label: "AM1 · 09:00 – 13:00" },
  { value: "PM1", label: "PM1 · 14:00 – 18:00" },
  { value: "PM3", label: "PM3 · 18:00 – 20:00" },
];

export const SGA_TEMPLATES: SgaTemplate[] = [
  {
    id: "confirma-visita",
    label: "Confirma visita en llamada",
    category: "Confirmación",
    body: `MESA MULTISKILL HITSS - CONFIRMA VISITA
SOT: {SOT}
DÍA Y FRANJA: {DIA_FRANJA}
CLIENTE: {CLIENTE}
NUMERO: {NUMERO}
CONTRATA: {CONTRATA}
ID DE LLAMADA: 
REALIZADO POR: {ADP}`,
  },
  {
    id: "adelanto-visita",
    label: "Adelanto de visita",
    category: "Confirmación",
    body: `MESA MULTISKILL HITSS - ADELANTA VISITA
SOT: {SOT}
DÍA Y FRANJA: {DIA_FRANJA}
CLIENTE: {CLIENTE}
NUMERO: {NUMERO}
CONTRATA: {CONTRATA}
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "mantiene-fecha",
    label: "Mantiene fecha programada",
    category: "Confirmación",
    body: `MESA MULTISKILL HITSS - MANTIENE FECHA DE VISITA
SOT: {SOT}
DÍA Y FRANJA: {DIA_FRANJA}
CLIENTE: {CLIENTE}
NUMERO: {NUMERO}
CONTRATA: {CONTRATA}
ID DE LLAMADA: 
REALIZADO POR: {ADP}`,
  },
  {
    id: "habilitacion-franjas",
    label: "Habilitación de franjas",
    category: "Habilitación",
    body: `MESA MULTISKILL HITSS - FORMATO PARA HABILITAR FRANJA
📥 SOT: {SOT}
🪚 PLANO: {PLANO}
📅 FECHA Y FRANJA: {DIA_FRANJA}
📧 Motivo: SIN FRANJAS DISPONIBLES
🚨‍ Sup acargo: NICOL MALASQUEZ`,
  },
  {
    id: "ciclo-llamadas",
    label: "Ciclo de llamadas",
    category: "Ciclo de llamadas",
    submotivos: [
      "Buzón de voz",
      "No contesta",
      "Número no existe",
      "Apagado",
      "Corta llamada",
    ],
    body: `MESA MULTISKILL HITSS - CICLO DE LLAMADAS
CICLO DE LLAMADA NRO: 1
CANTIDAD DE LLAMADAS: 3
NUMERO: {NUMERO}
MOTIVO: FALTA DE CONTACTO
SUB-MOTIVO: {SUBMOTIVO}
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-no-desea-mesa",
    label: "Rechazo: Cliente no desea servicio - Mesa",
    category: "Rechazo - Comercial",
    submotivos: [
      "Cliente ya tiene servicio de otro operador",
      "Titular no ha contratado ningún servicio a Claro",
      "Demora en la atención de la solicitud, ya no desea esperar",
      "Cliente no desea servicio por motivos personales",
    ],
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZO EN MESA
PERSONA QUE CONTESTA: 
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: CLIENTE NO DESEA EL SERVICIO - MESA
SUBMOTIVO DE RECHAZO: {SUBMOTIVO}
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-duplicidad-mesa",
    label: "Rechazo: Por duplicidad - Mesa",
    category: "Rechazo - Comercial",
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: RECHAZADO POR DUPLICIDAD
PERSONA QUE CONTESTA: [NO APLICA]
NUMERO DE CONTACTO: [NO APLICA]
SUBMOTIVO DE RECHAZO: se atendió con otra SOT
SE PROCEDE AL RECHAZO DE LA SOLICITUD POR DUPLICIDAD DE SOT, SE ATENDIÓ CON LA SOT: (VALIDAR CON DNI O EN HISTORIAL DEL CLIENTE)
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-facil-tec-mesa",
    label: "Rechazo: Facilidades técnicas del cliente - Mesa",
    category: "Rechazo - Comercial",
    submotivos: [
      "Dueño de Casa y/o Edificio no autoriza la instalación",
      "Al momento de la instalación no hay acceso al techo",
      "Al momento de la instalación se valida ducterías obstruidas",
      "Cliente cuenta con SOT de suspensión y/o baja",
    ],
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
PERSONA QUE CONTESTA: 
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: FACILIDADES TÉCNICAS DEL CLIENTE
SUBMOTIVO DE RECHAZO: {SUBMOTIVO}
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-falta-contacto-mesa",
    label: "Rechazo: Falta de contacto - Mesa",
    category: "Rechazo - Comercial",
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZO EN MESA
PERSONA QUE CONTESTA: 
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: FALTA DE CONTACTO
SUBMOTIVO DE RECHAZO: No hay contacto con el cliente (números errados)
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-direccion-mesa",
    label: "Rechazo: Mal ingreso de dirección - Mesa",
    category: "Rechazo - Comercial",
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
PERSONA QUE CONTESTA: NOMBRE
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: MAL INGRESO DE DIRECCIÓN
DIRECCIÓN CORRECTA: 
SUBMOTIVO DE RECHAZO: 
*Dirección registrada en el sistema es errada. (número, lt, mz, nombre calle, distrito)
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-mala-oferta-mesa",
    label: "Rechazo: Mala oferta - Mesa",
    category: "Rechazo - Comercial",
    submotivos: [
      "Tecnología incorrecta FTTH/HFC/OVERLAP Instalación/Post Venta",
      "Velocidad de Internet no es acorde a lo solicitado por el cliente",
      "Cantidad o Modelo de Decos no es acorde a lo solicitado",
      "Cliente solicitó atención PostVenta (Decos adicionales, traslados, etc.)",
      "Cliente solicita adicionar la telefonía",
      "Decodificadores descontinuados (Básico HD, Básico, Standard, DVR)",
    ],
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
PERSONA QUE CONTESTA: TITULAR/ FAMILIAR + NOMBRE
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: MALA OFERTA
SUBMOTIVO DE RECHAZO: {SUBMOTIVO}
PAQUETE INGRESADO: XXXXX
PAQUETE CORRECTO: XXXXXXX
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-mudanza-mesa",
    label: "Rechazo: Mudanza o viaje - Mesa",
    category: "Rechazo - Comercial",
    submotivos: [
      "Cliente salió de viaje y en el domicilio no tienen conocimiento de la instalación",
      "Cliente no vive en esta dirección, se mudó",
      "Cliente indica que pronto se mudará o viajará y rechaza instalación",
    ],
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
PERSONA QUE CONTESTA: 
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: MUDANZA O VIAJE
SUBMOTIVO DE RECHAZO: {SUBMOTIVO}
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-sot-errores-mesa",
    label: "Rechazo: SOT con errores de sistema - Mesa",
    category: "Rechazo - Comercial",
    submotivos: [
      "Sin workflow, sin tareas generadas",
      "Campaña mal configurada, no figura etiquetas correctas",
      "Solicitud mal generada (sin reservas, duplicidad, sin Co_id, sin CustomerID, sin plano, etc.)",
    ],
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
MOTIVO DEL RECHAZO: SOT CON ERRORES EN EL SISTEMA
SUBMOTIVO DE RECHAZO: {SUBMOTIVO}
**SE PROCEDE AL RECHAZO DE LA SOLICITUD POR TENER ERRORES DE SISTEMAS:
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rech-fraude-mesa",
    label: "Rechazo: Posible fraude - Mesa",
    category: "Rechazo - Comercial",
    body: `MESA MULTISKILL HITSS
RECHAZO EN MESA / CAMPO: RECHAZADO EN MESA
PERSONA QUE CONTESTA: 
NUMERO DE CONTACTO: {NUMERO}
MOTIVO DEL RECHAZO: POSIBLE FRAUDE
SUBMOTIVO DE RECHAZO: Cliente ya tiene un servicio activo en la misma dirección
CUSTOMER ID: (Solicitar DNI)
AUTORIZADO POR: 
ID DE LLAMADA: 
REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
  {
    id: "rescate-comercial",
    label: "Rescate comercial - Confirma visita",
    category: "Rescate Comercial",
    body: `***********RESCATE COMERCIAL***********
MESA MULTISKILL HITSS - CONFIRMA VISITA
SOT: {SOT}
DÍA Y FRANJA: {DIA_FRANJA}
CLIENTE: {CLIENTE}
NUMERO: {NUMERO}
CONTRATA: {CONTRATA}
ID DE LLAMADA: 
REALIZADO POR: {ADP}
Rescate Comercial  / Se procederá con el levantamiento el mismo día confirmado con el cliente.`,
  },
  {
    id: "fuera-toa",
    label: "Fuera de TOA",
    category: "Fuera de TOA",
    body: `*FUERA DE TOA*
📥 SOT: {SOT}
⚙️ SUB TIPO: {SUBTIPO}
🏡 DIRECCIÓN: {DIRECCION}
📍 DISTRITO: {DISTRITO}
⚒️ SERVICIO: {SERVICIO}
🪚 PLANO: {PLANO}
👨‍💻 CLIENTE: {CLIENTE}
🔣 COD CLIENTE: {COD_CLIENTE}
📱 CELULAR DEL CLIENTE: {NUMERO}
📅 FECHA Y FRANJA: {DIA_FRANJA}
✍️ REALIZADO POR: {ADP} - ADP MULTISKILL HITSS`,
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Confirmación",
  "Habilitación",
  "Ciclo de llamadas",
  "Rechazo - Comercial",
  "Rescate Comercial",
  "Fuera de TOA",
];

export function renderTemplate(
  tpl: SgaTemplate,
  vars: {
    SOT?: string;
    DIA_FRANJA?: string;
    CLIENTE?: string;
    NUMERO?: string;
    CONTRATA?: string;
    ADP?: string;
    SUBMOTIVO?: string;
    SUBTIPO?: string;
    DIRECCION?: string;
    DISTRITO?: string;
    SERVICIO?: string;
    PLANO?: string;
    COD_CLIENTE?: string;
  },
): string {
  return tpl.body.replace(/\{(SOT|DIA_FRANJA|CLIENTE|NUMERO|CONTRATA|ADP|SUBMOTIVO|SUBTIPO|DIRECCION|DISTRITO|SERVICIO|PLANO|COD_CLIENTE)\}/g, (_, k) => {
    const v = (vars as Record<string, string | undefined>)[k];
    return v && v.trim() ? v : "";
  });
}

// ============================================================
// Plantillas rápidas para WhatsApp (respuesta al asesor)
// ============================================================

export interface WspTemplate {
  id: string;
  label: string;
  /** Usa {SOT} y opcionalmente {SUBMOTIVO} */
  body: string;
  needsSubmotivo?: boolean;
}

export const WSP_TEMPLATES: WspTemplate[] = [
  {
    id: "los-5-rechazos",
    label: "❌ los 5 rechazos",
    body: `Buen día,  @

SOT:{SOT} fue rechazada por la mesa de cobertura de instalaciones, Geodir. Por favor derivar al buzón de Análisis rechazó por cobertura Red HFC.

Considerar que deben ser enviado al buzón de analisis_rechazoporcoberturaredhfc@claro.com.pe los casos rechazados por:

Rechazo - Falta de infraestructura de red
Rechazo - Edificio no liberado
Rechazo - Factibilidad Técnica.
Rechazo - Red Saturada
Rechazo - Transacción no autorizada

Recordar por favor llenar esta plantilla al momento del envió del correo.
* Numero de SOT:
* Coordenadas confirmadas con el cliente:
* Dirección:
* Distrito:
* Tipo de vivienda - Casa/Edificio residencial:
* Nodo/Plano:
* Tipo de Rechazo: (Falta de Infraestructura de Red/Factibilidad Técnica/Edificio no Liberado/Fat Saturada)
* Imágenes de la ubicación del domicilio dentro de los mapas de cobertura.
{FIRMA}`,
  },
  { id: "ruta", label: "🚗 Técnico en ruta", body: "@ 🚗Estimado SOT: {SOT}. Técnico en ruta a la dirección. {FIRMA}" },
  { id: "no-contesta", label: "📵 Cliente no contesta", body: "@ 📵 Estimado. SOT:{SOT} ,nos comunicamos con el cliente para coordinar la visita; sin embargo, no obtuvimos respuesta del cliente. Agradeceremos nos indiquen en qué horario podemos volver a contactarlo. {FIRMA}" },
  { id: "confirma-visita", label: "✅ Cliente confirma visita", body: "@ ✅Estimado SOT: {SOT}. Cliente confirma Visita - {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "en-atencion", label: "⏳ En proceso de atención", body: "@ ⏳ Estimado SOT: {SOT}. Cliente en proceso Atención. {FIRMA}" },
  { id: "rechazado", label: "❌ Cliente rechazado", body: "@ ❌ Estimado SOT: {SOT}. Cliente Rechazado – {SUBMOTIVO} {FIRMA}", needsSubmotivo: true },
  { id: "instalado", label: "🏠✅ Cliente instalado", body: "@ 🏠✅Estimado SOT: {SOT}. Cliente Instalado✅ {FIRMA}" },
  { id: "sot-iniciado", label: "✅ SOT iniciada", body: "@ ✅Estimado SOT: {SOT}. SOT INICIADO {FIRMA}" },
  { id: "confirmo-visita", label: "✅ Confirmó visita (validado)", body: "@ ✅ Estimado SOT: {SOT}, se valida que cliente confirmó Visita - {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "mantenimientos", label: "⏳ Contrata atendiendo mantenimientos", body: "@⏳Estimado SOT: {SOT}. Cliente en proceso Atención, la contrata se está haciendo cargo de los mantenimientos. {FIRMA}" },
  { id: "postventa", label: "⏳ Contrata atendiendo Postventa", body: "@⏳Estimado SOT: {SOT}. Cliente en proceso Atención, la contrata se está haciendo cargo de las Postventa Junior. {FIRMA}" },
  { id: "cobertura", label: "⏳ Plantilla de cobertura solicitada", body: "@⏳Estimado SOT: {SOT}, cliente en proceso Atención {FIRMA}." },
  { id: "escala-sup", label: "⏫ Escalado con supervisor", body: "@ Estimado, la SOT : {SOT} se encuentra en revisión para el requerimiento solicitado . Estamos solicitando priorizar su atención. En breve le compartiremos una actualización del estado. {FIRMA}" },
  { id: "sin-franja", label: "🟡 Sin franja disponible", body: "@ Estimado SOT: {SOT}, se mantiene la fecha, no hay disponibilidad de franja. {FIRMA}" },
  { id: "adelanto-ok", label: "✅ Procede adelanto", body: "@ Estimado SOT: {SOT}. Procede adelanto, nueva fecha - {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "mantiene-franja", label: "✅ Mantiene franja - enrutada", body: "@ Estimado SOT: {SOT}. Se mantiene la franja, SOT enrutada. {FIRMA}" },
  { id: "reprog", label: "🔁 Reprogramó visita", body: "@ Estimado SOT: {SOT}. Se llamó al cliente y se reprogramó la visita {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "adelanto-llamada", label: "✅ Adelanto tras llamada", body: "@ Estimado SOT: {SOT}. Se llamó al cliente y procede adelanto, nueva fecha - {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "reprog-enrutada", label: "🔁 Reprogramada y enrutada", body: "@ Estimado SOT: {SOT}. Se reprogramó la visita {SUBMOTIVO}. SOT enrutada. {FIRMA}", needsSubmotivo: true },
  { id: "reprog-ausente", label: "🔁 Reprogramada - cliente ausente", body: "@ Estimado SOT: {SOT}. Se reprogramó la visita {SUBMOTIVO}. Cliente ausente. {FIRMA}", needsSubmotivo: true },
  { id: "reprog-cliente", label: "🔁 Reprogramada por cliente", body: "@ Estimado SOT: {SOT}. Se reprogramó la visita {SUBMOTIVO}. Reagendado por cliente. {FIRMA}", needsSubmotivo: true },
  { id: "enrutada", label: "✅ SOT enrutada", body: "@ Estimado SOT: {SOT}. SOT enrutada {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
  { id: "a365", label: "🛠️ Mesa A365 a cargo", body: "@ Estimado SOT: {SOT}. Caso escalado. 🛠️ La mesa A365 está a cargo de la gestión de las SOT correspondientes a tal departamento y contratista. {FIRMA}" },
  { id: "planta-externa", label: "⏳ Derivado a planta externa", body: "@ Estimado SOT: {SOT}. ⏳ Cliente en proceso Atención - se encuentra en estado Derivado Planta Externa, por lo tanto, estaremos a la espera de la confirmación del área correspondiente para derivar a campo. {FIRMA}" },
  { id: "contratista", label: "🛠️ Escalado a contratista", body: "@ Estimado SOT: {SOT}. Caso escalado a la contratista. 🛠️ En Hitss quedamos a cargo del monitoreo para asegurar su cumplimiento. {FIRMA}" },
  { id: "mesa-depto", label: "⏳ Escalado a mesa del departamento", body: "@ Estimado SOT: {SOT}. ⏳ Cliente en proceso Atención - Se escaló caso a la mesa del departamento. {FIRMA}" },
  { id: "equipos", label: "📦 En espera de equipos", body: "@ Estimado. SOT: {SOT} ,se encuentra EN ESPERA DE EQUIPOS, se consultará a la contrata cuando se tendrá el stock y según lo indicado se coordinará la visita con el titular para efectuar la instalación. {FIRMA}" },
  { id: "accesorios", label: "🛠️ Escalado contratista - accesorios", body: "@ Estimado SOT: {SOT}. Caso escalado a la contratista. 🛠️ En Hitss quedamos a cargo del monitoreo para asegurar su cumplimiento para los casos de accesorios adicionales. {FIRMA}" },
  { id: "cuota-completa", label: "📅 Mantiene fecha - cuota completa", body: "@ SOT: {SOT}. Estimado, por el momento se mantiene fecha de agendamiento según a disposición del SGA. Se verifica que la cuota asignada hasta la fecha se encuentra completa. En caso de tener caídas se priorizará el adelanto de visita. {FIRMA}" },
  { id: "seguimiento-instalado", label: "👀 Seguimiento - Cliente instalado", body: "@ Estimado SOT: {SOT}. Realizando seguimiento a la SOT, se verifica que cliente instalado. {FIRMA}" },
  { id: "seguimiento-rechazada", label: "👀 Seguimiento - SOT rechazada", body: "@ Estimado SOT: {SOT}. Realizando seguimiento a la SOT, se verifica que esta rechazada por {SUBMOTIVO}. {FIRMA}", needsSubmotivo: true },
];

export function renderWsp(
  tpl: WspTemplate,
  vars: { SOT?: string; SUBMOTIVO?: string; FIRMA?: string },
): string {
  return tpl.body.replace(/\{(SOT|SUBMOTIVO|FIRMA)\}/g, (_, k) => {
    const v = (vars as Record<string, string | undefined>)[k];
    return v && v.trim() ? v : "";
  });
}
