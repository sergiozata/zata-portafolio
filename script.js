import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelectorAll(".nav a");
const contactForm = document.querySelector("#contact-form");
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
  const formData = new FormData(contactForm);
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

const saveLead = async (lead) => {
  if (!db) {
    throw new Error("Firebase no esta configurado todavia.");
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

const updateLead = async (id, data) => {
  if (!db) throw new Error("Firebase no esta configurado todavia.");
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    actualizadoEn: serverTimestamp(),
  });
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
            <div class="lead-side">
              <span class="status-badge status-${escapeHtml(lead.estado || "nuevo")}">${escapeHtml(lead.estado || "nuevo")}</span>
              <time>${escapeHtml(formatDate(lead.creadoEn || lead.creadoEnLocal))}</time>
            </div>
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
          ${
            lead.notaInterna
              ? `<p><strong>Nota interna:</strong> ${escapeHtml(lead.notaInterna)}</p>`
              : ""
          }
          <div class="lead-actions">
            <button type="button" data-action="estado" data-id="${escapeHtml(lead.id)}" data-status="aprobado">Aprobar</button>
            <button type="button" data-action="estado" data-id="${escapeHtml(lead.id)}" data-status="en_revision">Revisar</button>
            <button type="button" data-action="estado" data-id="${escapeHtml(lead.id)}" data-status="rechazado">Rechazar</button>
            <button type="button" data-action="nota" data-id="${escapeHtml(lead.id)}" data-note="${escapeHtml(lead.notaInterna || "")}">Editar nota</button>
          </div>
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

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const lead = getLeadFromForm();

  setStatus(formStatus, "Guardando solicitud...");

  try {
    await saveLead(lead);
    contactForm.reset();
    setStatus(formStatus, "Solicitud guardada. La revisaremos desde el panel interno.", "ok");
  } catch (error) {
    console.error("No se pudo guardar la solicitud en Firestore", error);
    setStatus(formStatus, "No se pudo guardar. Revisa la configuracion de Firebase.", "error");
  }
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

adminList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id) return;

  try {
    if (action === "estado") {
      await updateLead(id, { estado: button.dataset.status || "en_revision" });
      setStatus(adminStatus, "Estado actualizado.", "ok");
    }

    if (action === "nota") {
      const note = window.prompt("Nota interna para esta solicitud:", button.dataset.note || "");
      if (note === null) return;
      await updateLead(id, { notaInterna: note.trim() });
      setStatus(adminStatus, "Nota interna actualizada.", "ok");
    }

    await loadLeads();
  } catch (error) {
    console.error("No se pudo actualizar la solicitud", error);
    setStatus(adminStatus, "No se pudo actualizar la solicitud.", "error");
  }
});
