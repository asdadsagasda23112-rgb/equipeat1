async function fetchProofs() {
  const response = await fetch('/api/proofs');
  if (!response.ok) {
    return [];
  }
  return response.json();
}

function createProofCard(proof) {
  const card = document.createElement('div');
  card.className = 'proof-card group overflow-hidden';

  const titleWrapper = document.createElement('div');
  titleWrapper.className = 'flex items-start justify-between gap-3';

  const title = document.createElement('h3');
  title.textContent = proof.motive;
  title.className = 'text-xl font-semibold text-white';
  titleWrapper.appendChild(title);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.textContent = 'Excluir';
  deleteButton.className = 'rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-pink-300 transition hover:border-pink-300 hover:bg-pink-500/10 hover:text-pink-100';
  deleteButton.addEventListener('click', () => deleteProof(proof.id, card));
  titleWrapper.appendChild(deleteButton);

  card.appendChild(titleWrapper);

  const date = document.createElement('p');
  date.textContent = `Registrado em: ${new Date(proof.createdAt).toLocaleString('pt-BR')}`;
  date.className = 'mt-3 text-sm text-purple-200/75';
  card.appendChild(date);

  const desc = document.createElement('p');
  desc.textContent = proof.description;
  desc.className = 'mt-4 text-sm leading-7 text-purple-100/85';
  card.appendChild(desc);

  if (proof.mediaLink) {
    const link = document.createElement('p');
    link.className = 'mt-4 text-sm text-purple-200/90';
    link.innerHTML = `Link da mídia: <a href="${proof.mediaLink}" target="_blank" rel="noreferrer" class="text-indigo-300 underline decoration-purple-500/60">Abrir</a>`;
    card.appendChild(link);
  }

  if (proof.mediaFileUrl) {
    const preview = document.createElement('div');
    preview.className = 'media-preview mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_24px_70px_rgba(0,0,0,0.25)]';

    const filename = document.createElement('p');
    filename.textContent = `Arquivo enviado: ${proof.mediaFileName}`;
    filename.className = 'px-4 pt-4 text-sm text-purple-100/75';
    preview.appendChild(filename);

    const extension = proof.mediaFileName.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
      const video = document.createElement('video');
      video.src = proof.mediaFileUrl;
      video.controls = true;
      video.className = 'w-full h-auto';
      preview.appendChild(video);
    } else {
      const image = document.createElement('img');
      image.src = proof.mediaFileUrl;
      image.alt = proof.mediaFileName;
      image.className = 'w-full h-auto object-cover';
      preview.appendChild(image);
    }

    card.appendChild(preview);
  }

  return card;
}

async function renderProofs() {
  const proofList = document.getElementById('proof-list');
  proofList.innerHTML = '<p class="text-sm text-purple-200/80">Carregando provas...</p>';
  const proofs = await fetchProofs();

  if (!proofs.length) {
    proofList.innerHTML = '<p class="text-sm text-purple-200/80">Nenhuma prova registrada ainda.</p>';
    return;
  }

  proofList.innerHTML = '';
  proofs.forEach((proof) => proofList.appendChild(createProofCard(proof)));
}

async function deleteProof(id, card) {
  const confirmed = window.confirm('Deseja realmente apagar este registro?');
  if (!confirmed) {
    return;
  }

  card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  card.style.transform = 'scale(0.96)';
  card.style.opacity = '0.2';

  const response = await fetch(`/api/proofs/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    alert('Falha ao apagar registro.');
    card.style.transform = '';
    card.style.opacity = '';
    return;
  }

  card.remove();
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('proof-form');
  const formData = new FormData(form);

  const response = await fetch('/api/proofs', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    alert(errorData.error || 'Erro ao salvar prova.');
    return;
  }

  closeModal();
  form.reset();
  await renderProofs();
}

function openModal() {
  document.getElementById('proof-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('proof-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

const form = document.getElementById('proof-form');
form.addEventListener('submit', handleSubmit);

document.getElementById('open-form').addEventListener('click', openModal);
document.getElementById('close-modal').addEventListener('click', closeModal);

document.getElementById('proof-modal').addEventListener('click', (event) => {
  if (event.target.id === 'proof-modal') {
    closeModal();
  }
});

renderProofs();
