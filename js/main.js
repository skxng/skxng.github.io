'use strict';

/* ==========================================================================
   Portfolio de Kingston Luthi — scripts
   --------------------------------------------------------------------------
   1. En-tête : ligne de séparation au défilement
   2. Menu mobile
   3. Apparition des blocs au défilement
   4. Fenêtre vidéo des projets
   5. Âge et année calculés automatiquement
   ========================================================================== */

// Signale au CSS que JavaScript est actif : les animations d'apparition
// ne s'appliquent qu'à cette condition (sans JS, tout le contenu reste visible).
document.documentElement.classList.add('js');

// Respecte le réglage « réduire les animations » du système d'exploitation.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* --------------------------------------------------------------------------
   1. En-tête : ligne de séparation au défilement
   -------------------------------------------------------------------------- */

const header = document.querySelector('.site-header');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });


/* --------------------------------------------------------------------------
   2. Menu mobile
   -------------------------------------------------------------------------- */

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');

// Ouvre ou ferme le menu et met à jour les attributs d'accessibilité.
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  mobileNav.hidden = !open;
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

// Un clic sur un lien du menu le referme.
mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

// La touche Échap referme le menu et redonne le focus au bouton.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});

// Si la fenêtre repasse en grand format, on ferme le menu mobile.
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});


/* --------------------------------------------------------------------------
   3. Apparition des blocs au défilement
   Les éléments marqués [data-reveal] apparaissent en douceur.
   -------------------------------------------------------------------------- */

const revealItems = document.querySelectorAll('[data-reveal]');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // L'animation ne se joue qu'une fois.
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}


/* --------------------------------------------------------------------------
   4. Fenêtre vidéo des projets
   Le titre, le texte et la vidéo sont lus directement dans le HTML de chaque
   carte : pour modifier un projet, il suffit d'éditer index.html.
   Pour utiliser YouTube à la place du MP4, ajouter sur le bouton du projet :
   data-youtube="https://www.youtube.com/watch?v=IDENTIFIANT"
   -------------------------------------------------------------------------- */

const dialog = document.getElementById('video-dialog');
const player = document.getElementById('dialog-player');
const dialogTitle = document.getElementById('dialog-title');
const dialogText = document.getElementById('dialog-text');
const dialogCounter = document.getElementById('dialog-counter');
const projectButtons = Array.from(document.querySelectorAll('.project-button'));

let currentIndex = 0;

// Transforme un lien YouTube classique en lien « embed » sans cookies.
// Renvoie null si l'adresse n'est pas reconnue (la vidéo MP4 est alors utilisée).
function toYoutubeEmbed(url) {
  try {
    const parsed = new URL(url);
    let id = null;

    if (parsed.hostname === 'youtu.be') {
      id = parsed.pathname.slice(1);
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(parsed.hostname)) {
      id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    }

    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1` : null;
  } catch {
    return null;
  }
}

// Crée le lecteur adapté : YouTube ou fichier MP4 local.
function createPlayer(button, title) {
  const embed = button.dataset.youtube ? toYoutubeEmbed(button.dataset.youtube) : null;

  if (embed) {
    const frame = document.createElement('iframe');
    frame.src = embed;
    frame.title = `Vidéo : ${title}`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    return frame;
  }

  const video = document.createElement('video');
  video.src = button.dataset.video;
  video.poster = button.dataset.poster || '';
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', title);
  return video;
}

// Affiche le projet n° index dans la fenêtre.
function showProject(index) {
  // Navigation en boucle : après le dernier projet, on revient au premier.
  currentIndex = (index + projectButtons.length) % projectButtons.length;

  const button = projectButtons[currentIndex];
  const card = button.closest('.project-card');
  const title = button.textContent.trim();

  dialogTitle.textContent = title;
  dialogText.textContent = card.querySelector('.project-text').textContent.trim();
  dialogCounter.textContent = `${currentIndex + 1} / ${projectButtons.length}`;

  player.replaceChildren(createPlayer(button, title));
}

// Ouverture au clic sur une carte.
projectButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    showProject(index);
    dialog.showModal();
  });
});

// Boutons « précédent » et « suivant ».
dialog.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => showProject(currentIndex + Number(button.dataset.step)));
});

// Flèches du clavier pour passer d'un projet à l'autre.
dialog.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLVideoElement) return; // Laisse les flèches au lecteur vidéo.
  if (event.key === 'ArrowLeft') showProject(currentIndex - 1);
  if (event.key === 'ArrowRight') showProject(currentIndex + 1);
});

// Fermeture : bouton ✕, clic à l'extérieur de la fenêtre ou touche Échap (natif).
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

// À la fermeture : on arrête la vidéo et on redonne le focus à la carte d'origine.
dialog.addEventListener('close', () => {
  player.replaceChildren();
  projectButtons[currentIndex]?.focus();
});


/* --------------------------------------------------------------------------
   5. Âge et année calculés automatiquement
   Évite d'avoir à mettre à jour le site chaque année.
   -------------------------------------------------------------------------- */

// Âge à partir de la date de naissance (attribut data-birth="AAAA-MM-JJ").
document.querySelectorAll('[data-birth]').forEach((element) => {
  const [year, month, day] = element.dataset.birth.split('-').map(Number);
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // getMonth() commence à 0 (janvier)
  let age = today.getFullYear() - year;

  // L'anniversaire n'est pas encore passé cette année (mois pas atteint, ou bon mois mais jour pas atteint).
  if (currentMonth < month || (currentMonth === month && today.getDate() < day)) {
    age -= 1;
  }

  element.textContent = String(age);
});

// Année du pied de page.
document.getElementById('year').textContent = String(new Date().getFullYear());
