import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelectorAll(".nav a");
const whatsappForm = document.querySelector("#whatsapp-form");
const formStatus = document.querySelector("#form-status");
const brandMark = document.querySelector(".brand-mark");
const adminOverlay = document.querySelector("#admin-overlay");
const adminClose = document.querySelector("#admin-close");
const adminLogin = document.querySelector("#admin-login");
const adminContent = document.querySelector("#admin-content");
const adminRefresh = document.querySelector("#admin-refresh");
const adminList = document.querySelector("#admin-list");
const adminCount = document.querySelector("#admin-count");
const adminStatus = document.querySelector("#admin-status");
const whatsappNumber = "56992232617";

const firebaseConfig = window.ZATA_FIREBASE_CONFIG || {};
const collectionName = window.ZATA_FIREBASE_COLLECTION || "solicitudes_portafolio";
const adminCode = window.ZATA_ADMIN_CODE || "";
const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const db = firebaseReady ? getFirestore(initializeApp(firebaseConfig)) : null;

let logoTapCount = 0;
let logoTapTimer = null;

const setStatus = (element, message, type = "") => {
  if (!element) return;
  element.textContent = message;
  element.className = `form-status${type ? ` is-${type}` : ""}`;
};

const getLeadFromForm = () => {
  const formData = new FormData(whatsappForm);
  return {
    nombre: String(formData.get("name") || "").trim(),
    tipoProyecto: String(formData.get("projectType") || "").trim(),
    etapaIdea: String(formData.get("stage") || "").trim(),
    objetivoPrincipal: String(formData.get("goal") || "").trim(),
    usuariosEsperados: String(formData.get("users") || "").trim() || "Por definir",
    plazoIdeal: String(formData.get("timeline") || "").trim() || "Por definir",
    presupuestoEstimado: String(formData.get("budget") || "").trim() || "Por definir",
    problema: String(formData.get("message") || "").trim(),
    integraciones:
      formData
        .getAll("integrations")
        .map((value) => String(value).trim())
        .filter(Boolean) || [],
  };
};

const buildWhatsappMessage = (lead) =>
  [
    "Hola Zata Lab, quiero aterrizar un proyecto de software.",
    "",
    `Nombre: ${lead.nombre}`,
    `Tipo de proyecto: ${lead.tipoProyecto}`,
    `Etapa de la idea: ${lead.etapaIdea}`,
    `Objetivo principal: ${lead.objetivoPrincipal}`,
    `Usuarios esperados: ${lead.usuariosEsperados}`,
    `Plazo ideal: ${lead.plazoIdeal}`,
    `Presupuesto estimado: ${lead.presupuestoEstimado}`,
    "",
    "Problema que quiero resolver:",
    lead.problema,
    "",
    "Herramientas o integraciones:",
    lead.integraciones.length ? lead.integraciones.join(", ") : "Por definir",
  ].join("\n");

const saveLead = async (lead) => {
  if (!db) {
    return { saved: false, reason: "Firebase no esta configurado todavia." };
  }

  await addDoc(collection(db, collectionName), {
    ...lead,
    estado: "nuevo",
    origen: "portafolio",
    creadoEn: serverTimestamp(),
    creadoEnLocal: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });

  return { saved: true };
};

const formatDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderLeads = (leads) => {
  if (!adminList || !adminCount) return;
  adminCount.textContent = `${leads.length} ${leads.length === 1 ? "solicitud" : "solicitudes"}`;

  if (!leads.length) {
    adminList.innerHTML = '<article class="lead-card"><p>No hay solicitudes guardadas todavia.</p></article>';
    return;
  }

  adminList.innerHTML = leads
    .map(
      (lead) => `
        <article class="lead-card">
          <header>
            <div>
              <h3>${escapeHtml(lead.nombre || "Sin nombre")}</h3>
              <p>${escapeHtml(lead.tipoProyecto || "Proyecto sin clasificar")}</p>
            </div>
            <time>${escapeHtml(formatDate(lead.creadoEn || lead.creadoEnLocal))}</time>
          </header>
          <div class="lead-grid">
            <span><strong>Etapa:</strong> ${escapeHtml(lead.etapaIdea || "Por definir")}</span>
            <span><strong>Objetivo:</strong> ${escapeHtml(lead.objetivoPrincipal || "Por definir")}</span>
            <span><strong>Usuarios:</strong> ${escapeHtml(lead.usuariosEsperados || "Por definir")}</span>
            <span><strong>Plazo:</strong> ${escapeHtml(lead.plazoIdeal || "Por definir")}</span>
            <span><strong>Presupuesto:</strong> ${escapeHtml(lead.presupuestoEstimado || "Por definir")}</span>
            <span><strong>Integraciones:</strong> ${escapeHtml((lead.integraciones || []).join(", ") || "Por definir")}</span>
          </div>
          <p><strong>Problema:</strong> ${escapeHtml(lead.problema || "Sin descripcion")}</p>
        </article>
      `,
    )
    .join("");
};

const loadLeads = async () => {
  if (!db) {
    setStatus(adminStatus, "Firebase no esta configurado. Completa firebase-config.js para leer solicitudes.", "warning");
    renderLeads([]);
    return;
  }

  setStatus(adminStatus, "Cargando solicitudes...");
  const leadsQuery = query(collection(db, collectionName), orderBy("creadoEn", "desc"), limit(50));
  const snapshot = await getDocs(leadsQuery);
  renderLeads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  setStatus(adminStatus, "Solicitudes actualizadas.", "ok");
};

const openAdminPanel = () => {
  adminOverlay?.classList.add("open");
  adminOverlay?.setAttribute("aria-hidden", "false");
  setStatus(
    adminStatus,
    firebaseReady
      ? "Ingresa la clave para revisar solicitudes."
      : "Firebase aun no esta configurado. El panel quedara listo al completar firebase-config.js.",
    firebaseReady ? "" : "warning",
  );
};

const closeAdminPanel = () => {
  adminOverlay?.classList.remove("open");
  adminOverlay?.setAttribute("aria-hidden", "true");
};

menuButton?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

whatsappForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const lead = getLeadFromForm();
  const whatsappMessage = buildWhatsappMessage(lead);
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  setStatus(formStatus, "Preparando solicitud...");

  try {
    const result = await saveLead(lead);
    setStatus(
      formStatus,
      result.saved
        ? "Solicitud guardada. Abriendo WhatsApp..."
        : "WhatsApp se abrira, pero Firebase aun no esta configurado.",
      result.saved ? "ok" : "warning",
    );
  } catch (error) {
    console.error("No se pudo guardar la solicitud en Firestore", error);
    setStatus(formStatus, "No se pudo guardar en Firebase, pero WhatsApp se abrira igual.", "warning");
  }

  window.open(url, "_blank", "noopener,noreferrer");
});

brandMark?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  logoTapCount += 1;
  clearTimeout(logoTapTimer);
  logoTapTimer = setTimeout(() => {
    logoTapCount = 0;
  }, 1300);

  if (logoTapCount >= 5) {
    logoTapCount = 0;
    openAdminPanel();
  }
});

adminClose?.addEventListener("click", closeAdminPanel);
adminOverlay?.addEventListener("click", (event) => {
  if (event.target === adminOverlay) closeAdminPanel();
});

adminLogin?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = String(new FormData(adminLogin).get("adminCode") || "").trim();

  if (!adminCode) {
    setStatus(adminStatus, "Define ZATA_ADMIN_CODE en firebase-config.js para habilitar el acceso.", "warning");
    return;
  }

  if (code !== adminCode) {
    setStatus(adminStatus, "Clave incorrecta.", "error");
    return;
  }

  adminLogin.hidden = true;
  adminContent.hidden = false;
  await loadLeads();
});

adminRefresh?.addEventListener("click", loadLeads);
