import { type RegistrationFormState } from "./registration-types.js";

export const acquisitionChannelOptions = [
  "Venta directa",
  "Referidos",
  "WhatsApp",
  "Sitio web / SEO",
  "Google Ads",
  "Meta Ads",
  "LinkedIn",
  "Outbound",
  "Email",
  "Aliados",
  "Distribuidores",
  "Marketplace",
  "Retail / punto físico",
  "Ferias / eventos",
];

export const demoRegistrationForm: RegistrationFormState = {
  profileName: "Carlos Rodriguez",
  profileEmail: "carlos@empresa-demo.com",
  profileRole: "Gerente comercial",
  profileArea: "Comercial",
  profileCountry: "Colombia",
  peopleManaged: "12",
  companyName: "Movilidad vertical regional",
  sectorCategory: "Mantenimiento de movilidad vertical",
  employeeCount: "120",
  yearsInMarket: "18",
  operatingCountries: "Colombia, Panamá y Costa Rica",
  sellsTo:
    "Administradores de edificios, centros comerciales y operadores de infraestructura",
  revenueModel: "Contratos mensuales de mantenimiento y atención correctiva",
  website: "https://empresa-demo.com",
  acquisitionChannels: ["Venta directa", "Referidos", "Aliados"],
  averageTicket: "Contrato mensual B2B",
  averageSalesCycleDays: "75",
  competitor1: "Kone",
  competitor1Web: "https://www.kone.com",
  competitor2: "Otis",
  competitor2Web: "https://www.otis.com",
  competitor3: "TK Elevator",
  competitor3Web: "https://www.tkelevator.com",
  categoryNotes:
    "La categoría compite por confianza, continuidad operativa y velocidad de respuesta. Los clientes castigan la opacidad cuando no saben qué pasó, quién responde o cuánto tardará el cierre.",
  documents:
    "Notas demo: los clientes grandes piden trazabilidad, evidencia del mantenimiento y menos interrupciones. El equipo comercial percibe que se gana por relación, pero se pierden renovaciones cuando el cliente no ve valor preventivo.",
};
