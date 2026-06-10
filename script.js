const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelectorAll(".nav a");
const whatsappForm = document.querySelector("#whatsapp-form");
const whatsappNumber = "56992232617";

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

whatsappForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(whatsappForm);
  const name = String(formData.get("name") || "").trim();
  const projectType = String(formData.get("projectType") || "").trim();
  const stage = String(formData.get("stage") || "").trim();
  const goal = String(formData.get("goal") || "").trim();
  const users = String(formData.get("users") || "").trim() || "Por definir";
  const timeline = String(formData.get("timeline") || "").trim() || "Por definir";
  const budget = String(formData.get("budget") || "").trim() || "Por definir";
  const message = String(formData.get("message") || "").trim();
  const integrations = String(formData.get("integrations") || "").trim() || "Por definir";

  const whatsappMessage = [
    "Hola Zata Lab, quiero aterrizar un proyecto de software.",
    "",
    `Nombre: ${name}`,
    `Tipo de proyecto: ${projectType}`,
    `Etapa de la idea: ${stage}`,
    `Objetivo principal: ${goal}`,
    `Usuarios esperados: ${users}`,
    `Plazo ideal: ${timeline}`,
    `Presupuesto estimado: ${budget}`,
    "",
    "Problema que quiero resolver:",
    message,
    "",
    "Herramientas o integraciones:",
    integrations,
  ].join("\n");

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});
