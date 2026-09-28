import { initialQuestions } from './data';

const toast = (message) => {
  const old = document.querySelector('[data-testid="compat-toast"]');
  old?.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.dataset.testid = 'compat-toast';
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 2400);
};

const syncQuestions = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('uao-questions') || '[]');
    stored.forEach((question) => {
      if (!initialQuestions.some((item) => item.id === question.id)) initialQuestions.push(question);
    });
  } catch { /* localStorage can be unavailable in private browsing */ }
};

const handleInteractions = (event) => {
  const target = event.target;
  if (target?.dataset?.testid === 'question-subject-filter') {
    const selected = target.value;
    document.querySelectorAll('[data-testid^="question-card-"]').forEach((card) => {
      const subject = card.querySelector('.meta span')?.textContent || '';
      card.style.display = selected === 'Asignatura: todas' || subject === selected ? '' : 'none';
    });
  }
  const button = target?.closest?.('button');
  const testId = button?.dataset?.testid || '';
  if (testId === 'add-file-button') {
    const name = window.prompt('Nombre del archivo o acuerdo');
    if (name) { localStorage.setItem('uao-last-file', name); toast(`“${name}” quedó agregado al grupo.`); }
  }
  if (testId.startsWith('view-file-')) toast('Vista previa disponible en la siguiente versión del archivo.');
  if (testId.startsWith('save-file-') || testId.startsWith('save-resource-')) {
    localStorage.setItem(`uao-${testId}`, 'saved');
    toast('Recurso guardado para después.');
  }
};

export const installInteractionPatches = () => {
  syncQuestions();
  window.setInterval(syncQuestions, 300);
  document.addEventListener('change', handleInteractions);
  document.addEventListener('click', handleInteractions);
};