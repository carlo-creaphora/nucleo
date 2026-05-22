export function renderHomePage() {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nucleo</title>
    <style>
      :root {
        --ink: #05060f;
        --muted: rgba(5, 6, 15, 0.62);
        --line: rgba(5, 6, 15, 0.12);
        --panel: rgba(255, 255, 255, 0.78);
        --warm: #f7f4ee;
        --accent: #111827;
        --soft: #eef4ff;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 20% 0%, rgba(125, 178, 255, 0.34), transparent 34%),
          radial-gradient(circle at 84% 12%, rgba(116, 224, 239, 0.20), transparent 30%),
          linear-gradient(180deg, #ffffff 0%, #f8fafc 44%, #f1f5f9 100%);
      }
      button, input, textarea { font: inherit; }
      button { cursor: pointer; }
      .shell {
        width: min(1440px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 56px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
      }
      .brand {
        display: flex;
        align-items: baseline;
        gap: 14px;
      }
      .brand h1 {
        margin: 0;
        font-size: clamp(42px, 7vw, 104px);
        line-height: 0.88;
        letter-spacing: 0;
        font-weight: 900;
      }
      .brand span {
        color: var(--muted);
        font-size: 14px;
        font-weight: 650;
      }
      .status {
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.72);
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }
      .layout {
        display: grid;
        grid-template-columns: 340px minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }
      .sidebar, .workspace, .panel {
        border: 1px solid var(--line);
        background: var(--panel);
        backdrop-filter: blur(14px);
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
      }
      .sidebar, .workspace { border-radius: 18px; }
      .sidebar { padding: 18px; position: sticky; top: 18px; }
      .step {
        width: 100%;
        display: grid;
        grid-template-columns: 34px 1fr;
        gap: 12px;
        align-items: center;
        border: 0;
        border-radius: 12px;
        padding: 12px;
        background: transparent;
        text-align: left;
        color: var(--muted);
      }
      .step + .step { margin-top: 6px; }
      .step strong { display: block; color: var(--ink); font-size: 14px; }
      .step span:last-child { font-size: 12px; }
      .num {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #edf0f6;
        font-weight: 800;
        color: var(--ink);
      }
      .step.active { background: #f3f6fb; }
      .step.done .num { background: #111827; color: white; }
      .sidebar-note {
        margin: 18px 4px 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }
      .workspace { min-height: 680px; overflow: hidden; }
      .section {
        display: none;
        padding: clamp(18px, 3vw, 34px);
      }
      .section.active { display: block; }
      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }
      .section h2 {
        margin: 0;
        font-size: clamp(28px, 4vw, 54px);
        line-height: 0.98;
        letter-spacing: 0;
      }
      .section p {
        margin: 10px 0 0;
        max-width: 740px;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .full { grid-column: 1 / -1; }
      label {
        display: block;
        font-size: 12px;
        font-weight: 800;
        color: rgba(5, 6, 15, 0.55);
        text-transform: uppercase;
      }
      input, textarea {
        width: 100%;
        margin-top: 8px;
        border: 1px solid rgba(5, 6, 15, 0.14);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.82);
        color: var(--ink);
        padding: 12px 13px;
        outline: none;
      }
      textarea { min-height: 96px; resize: vertical; line-height: 1.45; }
      input:focus, textarea:focus { border-color: rgba(5, 6, 15, 0.42); background: white; }
      .group-title {
        grid-column: 1 / -1;
        margin-top: 10px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
        font-size: 13px;
        color: var(--ink);
        font-weight: 850;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 22px;
        flex-wrap: wrap;
      }
      .btn {
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: white;
        color: var(--ink);
        padding: 0 18px;
        font-weight: 800;
      }
      .btn.primary { background: #05060f; color: white; border-color: #05060f; }
      .btn:disabled { opacity: 0.48; cursor: not-allowed; }
      .chat-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        gap: 16px;
      }
      .panel {
        border-radius: 16px;
        padding: 16px;
      }
      .messages {
        height: 430px;
        overflow: auto;
        padding-right: 4px;
      }
      .msg {
        max-width: 86%;
        margin-bottom: 12px;
        border-radius: 16px;
        padding: 12px 14px;
        line-height: 1.48;
        font-size: 15px;
      }
      .msg.assistant { background: #eef4ff; }
      .msg.user { margin-left: auto; background: #05060f; color: white; }
      .composer {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        margin-top: 14px;
      }
      .composer textarea { min-height: 72px; }
      .result {
        display: grid;
        gap: 10px;
        max-height: 565px;
        overflow: auto;
      }
      .result-item {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: rgba(255,255,255,0.76);
        padding: 12px;
      }
      .result-item strong {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
      }
      .result-item div, .result-item ul {
        margin: 0;
        color: var(--muted);
        line-height: 1.48;
        font-size: 14px;
      }
      .result-item ul { padding-left: 18px; }
      .loading {
        display: none;
        color: var(--muted);
        font-size: 13px;
        font-weight: 800;
      }
      .loading.active { display: inline; }
      .error {
        display: none;
        margin-top: 12px;
        border: 1px solid #fecaca;
        border-radius: 12px;
        background: #fff1f2;
        color: #991b1b;
        padding: 12px;
        font-size: 14px;
      }
      .error.active { display: block; }
      @media (max-width: 920px) {
        .layout, .chat-layout, .grid { grid-template-columns: 1fr; }
        .sidebar { position: static; }
        .section-head { display: block; }
        .composer { grid-template-columns: 1fr; }
        .msg { max-width: 100%; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topbar">
        <div class="brand">
          <h1>Núcleo</h1>
          <span>Registro + Diagnóstico</span>
        </div>
        <div class="status">IA real en producción</div>
      </header>

      <div class="layout">
        <aside class="sidebar">
          <button id="step-registration" class="step active" type="button">
            <span class="num">1</span>
            <span><strong>Registro</strong><span>Perfil, empresa y categoría</span></span>
          </button>
          <button id="step-diagnosis" class="step" type="button">
            <span class="num">2</span>
            <span><strong>Diagnóstico</strong><span>Preguntas IA y reto real</span></span>
          </button>
          <p class="sidebar-note">Este demo usa la API pública de Núcleo. Registro prepara el contexto y Diagnóstico reinterpreta el problema declarado.</p>
        </aside>

        <section class="workspace">
          <div id="registration-section" class="section active">
            <div class="section-head">
              <div>
                <h2>Contexto inicial</h2>
                <p>Completa el perfil de licencia, empresa y categoría. Estos datos viajan al diagnóstico para que la IA no empiece desde cero.</p>
              </div>
              <button id="fill-demo" class="btn" type="button">Llenar demo</button>
            </div>
            <form id="registration-form" class="grid">
              <div class="group-title">Perfil / licencia</div>
              <label>Nombre<input name="profileName" required /></label>
              <label>Email<input name="profileEmail" type="email" required /></label>
              <label>Cargo<input name="profileRole" required /></label>
              <label>Área<input name="profileArea" required /></label>
              <label>País<input name="profileCountry" required /></label>
              <label>Personas a cargo<input name="peopleManaged" type="number" min="0" value="0" /></label>

              <div class="group-title">Empresa</div>
              <label>Nombre empresa<input name="companyName" required /></label>
              <label>Sector / categoría<input name="sectorCategory" required /></label>
              <label>Número empleados<input name="employeeCount" type="number" min="1" /></label>
              <label>Años en mercado<input name="yearsInMarket" type="number" min="0" /></label>
              <label>Países donde opera<input name="operatingCountries" placeholder="Colombia, Panamá" required /></label>
              <label>A quién le vende<input name="sellsTo" required /></label>
              <label>Modelo de cobro<input name="revenueModel" required /></label>
              <label>Web<input name="website" type="url" placeholder="https://..." /></label>
              <label class="full">Canales de adquisición<input name="acquisitionChannels" placeholder="referidos, venta consultiva" /></label>

              <div class="group-title">Categoría</div>
              <label>Ticket promedio<input name="averageTicket" /></label>
              <label>Ciclo venta promedio días<input name="averageSalesCycleDays" type="number" min="0" /></label>
              <label>Competidor 1<input name="competitor1" /></label>
              <label>Web competidor 1<input name="competitor1Web" type="url" /></label>
              <label>Competidor 2<input name="competitor2" /></label>
              <label>Web competidor 2<input name="competitor2Web" type="url" /></label>
              <label>Competidor 3<input name="competitor3" /></label>
              <label>Web competidor 3<input name="competitor3Web" type="url" /></label>
              <label class="full">Notas de categoría<textarea name="categoryNotes"></textarea></label>
              <label class="full">Documentos o notas cargadas<textarea name="documents" placeholder="Pega aquí resumen de documentos, contexto interno o enlaces relevantes."></textarea></label>
            </form>
            <div class="actions">
              <button id="start-diagnosis" class="btn primary" type="button">Guardar registro y diagnosticar</button>
            </div>
          </div>

          <div id="diagnosis-section" class="section">
            <div class="section-head">
              <div>
                <h2>Diagnóstico estratégico</h2>
                <p>Describe el problema como lo dirías en una reunión. La IA hará preguntas y luego entregará el reto recomendado.</p>
              </div>
              <span id="loading" class="loading">Pensando...</span>
            </div>
            <div class="chat-layout">
              <div class="panel">
                <div id="messages" class="messages"></div>
                <div class="composer">
                  <textarea id="user-message" placeholder="Escribe tu respuesta o describe el reto..."></textarea>
                  <button id="send-message" class="btn primary" type="button">Enviar</button>
                </div>
                <div class="actions">
                  <button id="complete-diagnosis" class="btn" type="button">Cerrar diagnóstico</button>
                </div>
                <div id="error" class="error"></div>
              </div>
              <aside class="panel">
                <h3 style="margin:0 0 12px;">Resultado</h3>
                <div id="result" class="result">
                  <p style="color: var(--muted); line-height: 1.6;">Cuando cierres el diagnóstico, aquí aparecerán los 10 outputs contratados.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>

    <script>
      const state = {
        registration: null,
        messages: [],
        cycleId: "cycle-" + Date.now()
      };

      const $ = (id) => document.getElementById(id);
      const form = $("registration-form");
      const loading = $("loading");
      const errorBox = $("error");

      $("fill-demo").addEventListener("click", () => {
        const data = {
          profileName: "Ana Gómez",
          profileEmail: "ana@example.com",
          profileRole: "Líder Comercial",
          profileArea: "Comercial",
          profileCountry: "Colombia",
          peopleManaged: "4",
          companyName: "Empresa Demo",
          sectorCategory: "Servicios B2B",
          employeeCount: "80",
          yearsInMarket: "10",
          operatingCountries: "Colombia",
          sellsTo: "Empresas medianas",
          revenueModel: "Mensualidad",
          website: "https://example.com",
          acquisitionChannels: "referidos, venta consultiva",
          averageTicket: "USD 1000",
          averageSalesCycleDays: "30",
          competitor1: "Competidor 1",
          competitor1Web: "https://competidor1.com",
          competitor2: "Competidor 2",
          competitor2Web: "https://competidor2.com",
          competitor3: "Competidor 3",
          competitor3Web: "https://competidor3.com",
          categoryNotes: "Los clientes comparan por confianza, casos previos y claridad del retorno antes de comprar.",
          documents: "Aprendizaje previo: los webinars y descuentos no mejoraron la calidad de leads."
        };
        for (const [key, value] of Object.entries(data)) {
          if (form.elements[key]) form.elements[key].value = value;
        }
      });

      $("start-diagnosis").addEventListener("click", () => {
        if (!form.reportValidity()) return;
        state.registration = readRegistration();
        setStep("diagnosis");
        if (state.messages.length === 0) {
          addMessage("assistant", "Cuéntame el reto como lo dirías en una reunión. Necesito entender qué está pasando antes de buscar ideas.");
        }
      });

      $("step-registration").addEventListener("click", () => setStep("registration"));
      $("step-diagnosis").addEventListener("click", () => {
        if (state.registration) setStep("diagnosis");
      });
      $("send-message").addEventListener("click", sendMessage);
      $("complete-diagnosis").addEventListener("click", completeDiagnosis);

      function setStep(step) {
        $("registration-section").classList.toggle("active", step === "registration");
        $("diagnosis-section").classList.toggle("active", step === "diagnosis");
        $("step-registration").classList.toggle("active", step === "registration");
        $("step-diagnosis").classList.toggle("active", step === "diagnosis");
        $("step-registration").classList.toggle("done", Boolean(state.registration));
      }

      function readRegistration() {
        const value = (name) => form.elements[name]?.value?.trim() || "";
        const numberValue = (name) => {
          const raw = value(name);
          return raw ? Number(raw) : undefined;
        };
        const list = (name) => value(name).split(",").map((item) => item.trim()).filter(Boolean);
        const competitors = [
          [value("competitor1"), value("competitor1Web")],
          [value("competitor2"), value("competitor2Web")],
          [value("competitor3"), value("competitor3Web")]
        ].filter((item) => item[0] && item[1]).map((item) => ({ name: item[0], website: item[1] }));
        const documents = value("documents") ? [{ id: "doc-1", name: "Notas cargadas", summary: value("documents") }] : [];

        return {
          profileLicense: {
            licenseId: "license-demo",
            name: value("profileName"),
            role: value("profileRole"),
            area: value("profileArea"),
            email: value("profileEmail"),
            country: value("profileCountry"),
            peopleManaged: numberValue("peopleManaged")
          },
          company: {
            companyId: slug(value("companyName")) || "company-demo",
            name: value("companyName"),
            sectorCategory: value("sectorCategory"),
            employeeCount: numberValue("employeeCount"),
            yearsInMarket: numberValue("yearsInMarket"),
            operatingCountries: list("operatingCountries"),
            sellsTo: value("sellsTo"),
            revenueModel: value("revenueModel"),
            website: value("website") || undefined,
            acquisitionChannels: list("acquisitionChannels")
          },
          category: {
            averageTicket: value("averageTicket") || undefined,
            averageSalesCycleDays: numberValue("averageSalesCycleDays"),
            competitors,
            notes: value("categoryNotes") || undefined
          },
          uploadedDocuments: documents
        };
      }

      async function sendMessage() {
        const textarea = $("user-message");
        const content = textarea.value.trim();
        if (!content || !state.registration) return;
        textarea.value = "";
        addMessage("user", content);
        await requestQuestion();
      }

      async function requestQuestion() {
        setLoading(true);
        setError("");
        try {
          const response = await fetch("/api/diagnosis/question", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(buildPayload())
          });
          const data = await parseResponse(response);
          if (data.diagnosis) {
            renderDiagnosis(data.diagnosis);
            addMessage("assistant", "Ya tengo suficiente contexto. Cerré el diagnóstico y dejé el resultado a la derecha.");
          } else if (data.question) {
            addMessage("assistant", data.question.question);
          }
        } catch (error) {
          setError(error.message || "No se pudo consultar la IA.");
        } finally {
          setLoading(false);
        }
      }

      async function completeDiagnosis() {
        if (!state.registration || state.messages.filter((item) => item.role === "user").length === 0) {
          setError("Escribe al menos una respuesta de diagnóstico antes de cerrar.");
          return;
        }
        setLoading(true);
        setError("");
        try {
          const response = await fetch("/api/diagnosis/complete", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(buildPayload())
          });
          const data = await parseResponse(response);
          renderDiagnosis(data.diagnosis);
          addMessage("assistant", "Diagnóstico cerrado. Revisa el reto recomendado y el brief para ideación.");
        } catch (error) {
          setError(error.message || "No se pudo cerrar el diagnóstico.");
        } finally {
          setLoading(false);
        }
      }

      function buildPayload() {
        return {
          cycleId: state.cycleId,
          ...state.registration,
          dialogMessages: state.messages.map((item) => ({ role: item.role, content: item.content })),
          userClarifications: [],
          previousCycleLearnings: [],
          correctedSections: []
        };
      }

      function addMessage(role, content) {
        state.messages.push({ role, content });
        const node = document.createElement("div");
        node.className = "msg " + role;
        node.textContent = content;
        $("messages").appendChild(node);
        $("messages").scrollTop = $("messages").scrollHeight;
      }

      function renderDiagnosis(diagnosis) {
        const items = [
          ["Reto recomendado", diagnosis.recommendedChallenge],
          ["Por qué es más correcto", diagnosis.whyThisChallenge],
          ["Síntomas", diagnosis.symptoms],
          ["Causas", diagnosis.causes],
          ["Tensiones", diagnosis.tensions],
          ["Métricas", diagnosis.metrics],
          ["Restricciones", diagnosis.restrictions],
          ["Qué no conviene atacar todavía", diagnosis.notWorthAttackingYet],
          ["Supuesto a cuestionar", diagnosis.assumptionToQuestion],
          ["Brief para ideación", diagnosis.ideationBrief]
        ];
        $("result").innerHTML = "";
        for (const [label, value] of items) {
          const box = document.createElement("div");
          box.className = "result-item";
          const title = document.createElement("strong");
          title.textContent = label;
          box.appendChild(title);
          if (Array.isArray(value)) {
            const ul = document.createElement("ul");
            for (const item of value.length ? value : ["Sin dato declarado"]) {
              const li = document.createElement("li");
              li.textContent = item;
              ul.appendChild(li);
            }
            box.appendChild(ul);
          } else {
            const text = document.createElement("div");
            text.textContent = value || "Sin dato declarado";
            box.appendChild(text);
          }
          $("result").appendChild(box);
        }
      }

      async function parseResponse(response) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || "Error de API");
        return data;
      }

      function setLoading(active) {
        loading.classList.toggle("active", active);
        $("send-message").disabled = active;
        $("complete-diagnosis").disabled = active;
      }

      function setError(message) {
        errorBox.textContent = message;
        errorBox.classList.toggle("active", Boolean(message));
      }

      function slug(value) {
        return value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
    </script>
  </body>
</html>`;
}

