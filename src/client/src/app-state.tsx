import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type PhaseId } from "./workspace-data.js";

export type RegistrationRecord = {
  id: string;
  cycleId: string;
  companyId: string;
  licenseId: string;
  output?: RegistrationOutput;
};

export type RegistrationOutput = {
  contextForDiagnosis: {
    profileLicense: {
      licenseId: string;
      name: string;
      role: string;
      area: string;
      email: string;
      country: string;
      peopleManaged?: number;
    };
    company: {
      companyId: string;
      name: string;
      sectorCategory: string;
      employeeCount?: number;
      yearsInMarket?: number;
      operatingCountries: string[];
      sellsTo: string;
      revenueModel: string;
      website?: string;
      acquisitionChannels: string[];
    };
    category: {
      averageTicket?: string;
      averageSalesCycleDays?: number;
      competitors: Array<{ name: string; website: string }>;
      notes?: string;
    };
    uploadedDocuments: Array<{
      id: string;
      name: string;
      mimeType?: string;
      sizeBytes?: number;
      sourceUrl?: string;
      extractionStatus?: "EXTRACTED" | "TEXT_PROVIDED" | "UNSUPPORTED" | "EMPTY";
      summary?: string;
      extractedText?: string;
    }>;
  };
  categoryInformation?: unknown;
  competitorEvaluationFrame?: unknown;
  readiness?: {
    isReadyForDiagnosis: boolean;
    blockingIssues: string[];
    warnings: string[];
  };
};

export type DiagnosisOutput = {
  recommendedChallenge: string;
  whyThisChallenge: string;
  symptoms: string[];
  causes: string[];
  tensions: string[];
  metrics: string[];
  restrictions: string[];
  notWorthAttackingYet: string[];
  assumptionToQuestion: string;
  ideationBrief: string;
};

export type DialogMessage = {
  role: "assistant" | "user";
  content: string;
};

export type DiagnosisCorrection = {
  section:
    | "symptoms"
    | "causes"
    | "tensions"
    | "metrics"
    | "restrictions"
    | "notWorthAttackingYet";
  clarification: string;
};

export type SignalsOutput = {
  searchDepth: "standard";
  generatedAt: string;
  analisisSocialListening: SignalsAnalysisSection;
  analisisTendencias: SignalsAnalysisSection;
  analisisCompetidores: SignalsAnalysisSection;
  gaps: SignalGap[];
  insights: SignalInsight[];
  memoriaEmpresa: {
    companyPatterns: string[];
    previousLearnings: string[];
    avoidRepeating: string[];
  };
  internal: {
    fuentesConsultadas: string[];
    senalesBase: SignalEvidence[];
    vaciosDeEvidencia: string[];
  };
};

export type SignalsAnalysisSection = {
  summary: string;
  findings: string[];
  evidenceIds: string[];
  limitations: string[];
};

export type SignalGap = {
  title: string;
  estadoActualEmpresa: string;
  potencialMercado: string;
  brecha: string;
  evidenciaMercado: string;
  evidenceIds: string[];
  evidenceBase: "fuerte" | "media" | "indirecta";
  implicationForIdeation: string;
};

export type SignalInsight = {
  title: string;
  cliente: string;
  comportamientoObservado: string;
  motivacionODeseo: string;
  verdadAccionable: string;
  evidenceIds: string[];
  evidenceBase: "fuerte" | "media" | "indirecta";
  promptParaIdeacion: string;
};

export type SignalEvidence = {
  id: string;
  lens: "SOCIAL_LISTENING" | "TREND" | "COMPETITOR" | "CUSTOMER_INSIGHT";
  title: string;
  observedText: string;
  sourceLabel: string;
  sourceUrl?: string;
  sourceDate?: string;
  query?: string;
  frictionType: string;
  relationToDiagnosis: string;
  usefulnessForIdeation: string;
  isNegative: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type IdeationRouteOption = {
  id: IdeationRuptureType;
  title: string;
  verb: string;
  guidingQuestion: string;
  riskLevel: string;
  description: string;
};

export type IdeationOptions = {
  ruptureTypes: IdeationRouteOption[];
  gaps: SignalGap[];
  insights: SignalInsight[];
};

export type IdeationRuptureType =
  | "RUPTURA_MODERADA"
  | "RUPTURA_FUERTE"
  | "RUPTURA_RADICAL_CONTROLADA";

export type IdeationSelection = {
  ruptureType: IdeationRuptureType | null;
  gapTitle: string | null;
  insightTitle: string | null;
};

export type CompleteIdeationSelection = {
  ruptureType: IdeationRuptureType;
  gapTitle: string;
  insightTitle: string;
};

export type IdeationRoute = {
  id: string;
  title: string;
  ruptureType: IdeationRuptureType;
  verb: "mejorar" | "transformar" | "romper";
  guidingQuestion: string;
  riskLevel: "bajo" | "medio" | "alto_controlado";
  purpose: string;
  usesGapTitles: string[];
  usesInsightTitles: string[];
};

export type IdeationIdea = {
  id: string;
  routeId: string;
  source: "ai" | "user";
  selectedForEvaluation: boolean;
  idea: string;
  tipoDeIdea?: PrototypeIdeaType;
  supuestoQueRompe: string;
  mecanicaConcreta: string;
  porQueFunciona?: string;
  casoAnalogo?: string;
  metricaQueMueve?: string;
  primerPasoEjecutable?: string;
  antiPatronesAEvitar?: string[];
};

export type IdeationSet = {
  id: string;
  selection: CompleteIdeationSelection;
  route: IdeationRoute;
  ideas: IdeationIdea[];
};

export type EvaluationScoreKey =
  | "potential"
  | "differentiation"
  | "restrictionFit"
  | "costTime"
  | "riskControl"
  | "validability"
  | "learning";

export type EvaluationScores = Record<EvaluationScoreKey, number>;

export type PrototypeIdeaType =
  | "Servicio / experiencia"
  | "Producto digital / interfaz"
  | "Proceso / operación"
  | "Modelo comercial / acceso"
  | "Producto físico / tangible";

export type PrototypeClassification = {
  ideaId?: string;
  ideaType: PrototypeIdeaType;
  rationale: string;
  evaluationDecision: {
    criticalAssumptions: string;
    firstThingToTest: string;
    risksToWatch: string;
  };
};

export type PrototypeEvidenceScope = {
  sample: string;
  sampleTargetMin: number;
  sampleTargetMax: number;
  validates: string;
  doesNotValidate: string;
  thresholds: {
    advance: string;
    iterate: string;
    rethink: string;
  };
};

export type PrototypeEvidenceMetric = {
  questionId: string;
  label: string;
  advanceValues: string[];
  advance: string;
  iterate: string;
  rethink: string;
  interpretation: string;
};

export type PrototypeClosedQuestion = {
  id: string;
  label: string;
  type: "choice";
  options: string[];
  evidenceRole: string;
};

export type PrototypeRoute = {
  id: string;
  ideaType: PrototypeIdeaType;
  method: string;
  artifact: string;
  summary: string;
  buildFields: Array<[string, string]>;
  output: string[];
  questions: string[];
  register: string[];
  decision: string[];
  validates: string[];
  doesNotValidate: string[];
  advanceSignals: string[];
  stopSignals: string[];
  falsePositive: string;
  falseNegative: string;
  avoidMisread: string[];
  evidenceScope: PrototypeEvidenceScope;
  evidenceMetrics: PrototypeEvidenceMetric[];
  closedQuestions?: PrototypeClosedQuestion[];
};

export type PrototypeArtifact = {
  title: string;
  artifactType: string;
  method: string;
  objective: string;
  howToUse: string;
  validates: string[];
  doesNotValidate: string[];
  artifact: Array<{ label: string; content: string }>;
  testQuestions: string[];
  advanceSignals: string[];
  stopSignals: string[];
  falsePositive: string;
  falseNegative: string;
  avoidMisread: string[];
  decisionReading: {
    advance: string;
    iterate: string;
    rethink: string;
  };
  evidenceScope: PrototypeEvidenceScope;
  limits: string[];
  nextStep: string;
};

export type PrototypeArtifactState = {
  routeId: string;
  artifact: PrototypeArtifact;
};

export type ResultRecord = {
  id: string;
  closedValues: Record<string, string>;
  values: Record<string, string>;
  notes?: string;
  createdAt: string;
};

export type EvidenceReading = {
  decision: "Avanzar" | "Iterar" | "Replantear";
  confidence: "Baja" | "Media" | "Alta";
  testedAssumption: string;
  methodologicalRoute:
    | "advance"
    | "iterate"
    | "discard"
    | "invalidate_challenge"
    | "invalidate_signal";
  methodologicalRationale: string;
  rationale: string;
  evidenceSupports: string[];
  weakOrMissingEvidence: string[];
  falsePositiveRisk: string;
  falseNegativeRisk: string;
  learning: string;
  nextStep: string;
};

export type MethodologicalOverride = {
  from: EvidenceReading["methodologicalRoute"];
  to: EvidenceReading["methodologicalRoute"];
  reason: string;
  changedAt: string;
};

export type PlaybookEvidenceChain = {
  prototype: string;
  result: string;
  reading: string;
  action: string;
};

export type PlaybookPlanItem = {
  horizon: string;
  objective: string;
  actions: string[];
  owner: string;
  decisionMetric: string;
};

export type PlaybookMetric = {
  label: string;
  target: string;
  evidenceSource: string;
};

export type PlaybookRisk = {
  risk: string;
  control: string;
};

export type PlaybookOutput = {
  executiveDecision: string;
  validatedMove: string;
  whyNow: string;
  evidenceChain: PlaybookEvidenceChain;
  operatingPrinciple: string;
  implementationPlan: PlaybookPlanItem[];
  owners: string[];
  requiredResources: string[];
  metricsToMonitor: PlaybookMetric[];
  risksAndControls: PlaybookRisk[];
  reviewCadence: string;
  stopOrIterateConditions: string[];
  whatNotToRepeat: string[];
  exportSummary: string;
};

export type CycleMemory = {
  title: string;
  status: "closed";
  visibility: "company_readonly";
  methodologicalRoute: EvidenceReading["methodologicalRoute"];
  decision: string;
  problem: string;
  diagnosisSummary: string;
  signalSummary: string;
  selectedIdea: string;
  prototypeArtifact: string;
  evidenceReading: string;
  nextRecommendedMove: string;
  keyLearnings: string[];
  validatedAssumptions: string[];
  unresolvedAssumptions: string[];
  risks: string[];
  patternsToAvoid: string[];
};

export type PlaybookOverride = {
  reason: string;
  changedBy?: string;
  changedAt?: string;
};

export type PlaybookPhaseRecord = {
  id: string;
  cycleId: string;
  companyId: string | null;
  licenseId: string | null;
  recommendedRoute: EvidenceReading["methodologicalRoute"];
  methodologicalRoute: EvidenceReading["methodologicalRoute"];
  override: PlaybookOverride | null;
  playbook: PlaybookOutput | null;
  memory: CycleMemory;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
};

type AppState = {
  activePhaseId: PhaseId;
  cycleId: string;
  diagnosis: DiagnosisOutput | null;
  diagnosisMessages: DialogMessage[];
  diagnosisCorrections: DiagnosisCorrection[];
  registration: RegistrationRecord | null;
  registrationId: string | null;
  signals: SignalsOutput | null;
  ideationOptions: IdeationOptions | null;
  ideationSelection: IdeationSelection;
  ideationSets: IdeationSet[];
  evaluationConfirmed: boolean;
  evaluationScores: Record<string, EvaluationScores>;
  evaluationWinnerId: string | null;
  prototypeClassification: PrototypeClassification | null;
  prototypeIdeaType: PrototypeIdeaType | null;
  prototypeArtifact: PrototypeArtifactState | null;
  prototypeBuilderValues: Record<string, Record<string, string>>;
  prototypeRouteId: string | null;
  evidenceReading: EvidenceReading | null;
  methodologicalRoute: EvidenceReading["methodologicalRoute"] | null;
  methodologicalOverride: MethodologicalOverride | null;
  resultsRecords: ResultRecord[];
  playbookRecord: PlaybookPhaseRecord | null;
  setActivePhaseId: (phaseId: PhaseId) => void;
  setDiagnosis: (diagnosis: DiagnosisOutput) => void;
  setDiagnosisCorrections: (corrections: DiagnosisCorrection[]) => void;
  setDiagnosisMessages: (messages: DialogMessage[]) => void;
  setRegistrationId: (registrationId: string) => void;
  setRegistration: (registration: RegistrationRecord) => void;
  setSignals: (signals: SignalsOutput) => void;
  setIdeationOptions: (options: IdeationOptions) => void;
  setIdeationSelection: (selection: IdeationSelection) => void;
  setIdeationSets: (sets: IdeationSet[]) => void;
  setEvaluationConfirmed: (confirmed: boolean) => void;
  setEvaluationScores: (scores: Record<string, EvaluationScores>) => void;
  setEvaluationWinnerId: (winnerId: string | null) => void;
  setPrototypeClassification: (
    classification: PrototypeClassification | null,
  ) => void;
  setPrototypeIdeaType: (ideaType: PrototypeIdeaType | null) => void;
  setPrototypeArtifact: (artifact: PrototypeArtifactState | null) => void;
  setPrototypeBuilderValues: (
    values: Record<string, Record<string, string>>,
  ) => void;
  setPrototypeRouteId: (routeId: string | null) => void;
  setEvidenceReading: (reading: EvidenceReading | null) => void;
  setMethodologicalRoute: (
    route: EvidenceReading["methodologicalRoute"] | null,
  ) => void;
  setMethodologicalOverride: (override: MethodologicalOverride | null) => void;
  setResultsRecords: (records: ResultRecord[]) => void;
  setPlaybookRecord: (record: PlaybookPhaseRecord | null) => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activePhaseId, setActivePhaseId] = useState<PhaseId>("registration");
  const [cycleId] = useState(createClientCycleId);
  const [diagnosis, setDiagnosis] = useState<DiagnosisOutput | null>(null);
  const [diagnosisMessages, setDiagnosisMessages] = useState<DialogMessage[]>(
    [],
  );
  const [diagnosisCorrections, setDiagnosisCorrections] = useState<
    DiagnosisCorrection[]
  >([]);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationRecord | null>(
    null,
  );
  const [signals, setSignals] = useState<SignalsOutput | null>(null);
  const [ideationOptions, setIdeationOptions] =
    useState<IdeationOptions | null>(null);
  const [ideationSelection, setIdeationSelection] =
    useState<IdeationSelection>({
      ruptureType: null,
      gapTitle: null,
      insightTitle: null,
    });
  const [ideationSets, setIdeationSets] = useState<IdeationSet[]>([]);
  const [evaluationConfirmed, setEvaluationConfirmed] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState<
    Record<string, EvaluationScores>
  >({});
  const [evaluationWinnerId, setEvaluationWinnerId] = useState<string | null>(
    null,
  );
  const [prototypeClassification, setPrototypeClassification] =
    useState<PrototypeClassification | null>(null);
  const [prototypeIdeaType, setPrototypeIdeaType] =
    useState<PrototypeIdeaType | null>(null);
  const [prototypeArtifact, setPrototypeArtifact] =
    useState<PrototypeArtifactState | null>(null);
  const [prototypeBuilderValues, setPrototypeBuilderValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [prototypeRouteId, setPrototypeRouteId] = useState<string | null>(null);
  const [resultsRecords, setResultsRecords] = useState<ResultRecord[]>([]);
  const [evidenceReading, setEvidenceReading] = useState<EvidenceReading | null>(
    null,
  );
  const [methodologicalRoute, setMethodologicalRoute] = useState<
    EvidenceReading["methodologicalRoute"] | null
  >(null);
  const [methodologicalOverride, setMethodologicalOverride] =
    useState<MethodologicalOverride | null>(null);
  const [playbookRecord, setPlaybookRecord] =
    useState<PlaybookPhaseRecord | null>(null);

  const value = useMemo<AppState>(
    () => ({
      activePhaseId,
      cycleId,
      diagnosis,
      diagnosisCorrections,
      diagnosisMessages,
      registration,
      registrationId,
      signals,
      ideationOptions,
      ideationSelection,
      ideationSets,
      evaluationConfirmed,
      evaluationScores,
      evaluationWinnerId,
      prototypeClassification,
      prototypeIdeaType,
      prototypeArtifact,
      prototypeBuilderValues,
      prototypeRouteId,
      evidenceReading,
      methodologicalRoute,
      methodologicalOverride,
      resultsRecords,
      playbookRecord,
      setActivePhaseId,
      setDiagnosis,
      setDiagnosisCorrections,
      setDiagnosisMessages,
      setRegistrationId,
      setRegistration,
      setSignals,
      setIdeationOptions,
      setIdeationSelection,
      setIdeationSets,
      setEvaluationConfirmed,
      setEvaluationScores,
      setEvaluationWinnerId,
      setPrototypeClassification,
      setPrototypeIdeaType,
      setPrototypeArtifact,
      setPrototypeBuilderValues,
      setPrototypeRouteId,
      setEvidenceReading,
      setMethodologicalRoute,
      setMethodologicalOverride,
      setResultsRecords,
      setPlaybookRecord,
    }),
    [
      activePhaseId,
      cycleId,
      diagnosis,
      diagnosisCorrections,
      diagnosisMessages,
      registration,
      registrationId,
      signals,
      ideationOptions,
      ideationSelection,
      ideationSets,
      evaluationConfirmed,
      evaluationScores,
      evaluationWinnerId,
      prototypeClassification,
      prototypeIdeaType,
      prototypeArtifact,
      prototypeBuilderValues,
      prototypeRouteId,
      evidenceReading,
      methodologicalRoute,
      methodologicalOverride,
      resultsRecords,
      playbookRecord,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

function createClientCycleId() {
  const storageKey = "nucleo.currentCycleId";
  const fallback = `cycle_${crypto.randomUUID()}`;

  try {
    const existing = window.localStorage.getItem(storageKey);

    if (existing) return existing;

    window.localStorage.setItem(storageKey, fallback);
  } catch {
    return fallback;
  }

  return fallback;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}
