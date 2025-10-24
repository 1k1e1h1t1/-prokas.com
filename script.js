document.addEventListener('DOMContentLoaded', function () {
	console.log('DOM повністю завантажений і оброблений');
	const heroVideo = document.querySelector('#hero-video');
	const heroSection = document.querySelector('.hero-hero');
	let heroIO = null;
	if (heroVideo && 'IntersectionObserver' in window) {
		heroIO = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const sourceEl = heroVideo.querySelector('source');
					const src = sourceEl?.getAttribute('data-src');
					if (src) {
						sourceEl.setAttribute('src', src);
						heroVideo.load();
						heroVideo.addEventListener('error', function onVideoError() {
							heroVideo.style.display = 'none';
						}, { once: true });
						try { heroIO.unobserve(entry.target); } catch (e) { /* ignore */ }
					}
				}
			});
		}, { root: null, threshold: 0.25 });
		heroIO.observe(heroSection);
	}
	if (heroSection) {
		const multiplier = 0.22;
		let ticking = false;
		function updateParallax() {
			const rect = heroSection.getBoundingClientRect();
			const offset = rect.top * multiplier;
			heroSection.style.transform = `translateY(${offset}px)`;
			ticking = false;
		}
		window.addEventListener('scroll', function () {
			if (!ticking) {
				window.requestAnimationFrame(updateParallax);
				ticking = true;
			}
		}, { passive: true });
		updateParallax();
	}
	const header = document.querySelector('#main-heading');
	if (header) {
		header.style.color = 'blue';
	}

	const button = document.querySelector('#demo-button');
	if (button) {
		button.addEventListener('click', function () {
			if (header) header.textContent = 'Ви натиснули кнопку!';
			if (header) header.style.color = 'red';
		});
	}

	
	const toggleProjects = document.querySelector('#toggle-projects');
	const projectsList = document.querySelector('#projects-list');
	if (toggleProjects && projectsList) {
		toggleProjects.addEventListener('click', function () {
			const isHidden = projectsList.hasAttribute('hidden');
			if (isHidden) {
				projectsList.removeAttribute('hidden');
				toggleProjects.textContent = 'Сховати мої сайти';
			} else {
				projectsList.setAttribute('hidden', '');
				toggleProjects.textContent = 'Показати мої сайти';
			}
		});
	}

	const projectForm = document.querySelector('#project-form');
	const projectNameInput = document.querySelector('#project-name');
	const projectUrlInput = document.querySelector('#project-url');

	function loadProjects() {
		try {
			const raw = localStorage.getItem('projects');
			return raw ? JSON.parse(raw) : [];
		} catch (e) {
			console.warn('Failed to load projects', e);
			return [];
		}
	}

	function saveProjects(list) {
		try {
			localStorage.setItem('projects', JSON.stringify(list));
		} catch (e) {
			console.warn('Failed to save projects', e);
		}
	}

	function renderProjects() {
		const list = loadProjects();
		projectsList.innerHTML = '';
		if (list.length === 0) {
			const li = document.createElement('li');
			li.textContent = 'Поки немає проектів.';
			projectsList.appendChild(li);
			return;
		}
		list.forEach(p => {
			const li = document.createElement('li');
			li.className = 'project-card';
			const icon = document.createElement('div');
			icon.className = 'project-icon';
			let iconHtml = '<i class="fa-solid fa-globe"></i>';
			if (p.type === 'blog') iconHtml = '<i class="fa-solid fa-pen-nib"></i>';
			if (p.type === 'app') iconHtml = '<i class="fa-solid fa-mobile-screen-button"></i>';
			if (p.type === 'other') iconHtml = '<i class="fa-solid fa-ellipsis"></i>';
			icon.innerHTML = iconHtml;
			const body = document.createElement('div');
			body.className = 'project-body';
			const a = document.createElement('a');
			a.href = p.url;
			a.textContent = p.name;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';
			const desc = document.createElement('div');
			desc.className = 'project-desc';
			desc.textContent = p.desc || '';
			const meta = document.createElement('div');
			meta.className = 'project-meta';
			meta.textContent = p.date ? `Додано: ${p.date}` : '';
			body.appendChild(a);
			body.appendChild(desc);
			body.appendChild(meta);
			li.appendChild(icon);
			li.appendChild(body);
			projectsList.appendChild(li);
		});
	}

	if (projectForm) {
		projectForm.addEventListener('submit', function (e) {
			e.preventDefault();
			const addBtn = document.querySelector('#add-project');
			if (addBtn) addBtn.classList.add('loading');
			const name = projectNameInput.value.trim();
			const url = projectUrlInput.value.trim();
			const desc = document.querySelector('#project-desc').value.trim();
			const type = document.querySelector('#project-type').value;
			if (!name || !url) {
				if (addBtn) addBtn.classList.remove('loading');
				return;
			}
			const list = loadProjects();
			list.push({ name, url, desc, type, date: new Date().toLocaleString() });
			saveProjects(list);
			renderProjects();
			projectForm.reset();
			if (projectsList.hasAttribute('hidden')) {
				projectsList.removeAttribute('hidden');
				toggleProjects.textContent = 'Сховати мої сайти';
			}
			setTimeout(() => { if (addBtn) addBtn.classList.remove('loading'); }, 700);
		});

		const clearBtn = document.querySelector('#clear-projects');
		if (clearBtn) {
			clearBtn.addEventListener('click', function () {
				localStorage.removeItem('projects');
				renderProjects();
			});
		}

		
		const exportBtn = document.querySelector('#export-projects');
		const importBtn = document.querySelector('#import-projects');
		const importFile = document.querySelector('#import-file');
		if (exportBtn) {
			exportBtn.addEventListener('click', function () {
				const data = localStorage.getItem('projects') || '[]';
				const blob = new Blob([data], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'projects.json';
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			});
		}
		if (importBtn && importFile) {
			importBtn.addEventListener('click', function () { importFile.click(); });
			importFile.addEventListener('change', function (e) {
				const f = e.target.files[0];
				if (!f) return;
				const reader = new FileReader();
				reader.onload = function (ev) {
					try {
						const arr = JSON.parse(ev.target.result);
						if (Array.isArray(arr)) {
							saveProjects(arr);
							renderProjects();
						} else {
							alert('Файл має містити масив проектів');
						}
					} catch (err) {
						alert('Помилка при читанні файлу');
					}
				};
				reader.readAsText(f);
			});
		}
		renderProjects();
	}
	const emailLink = document.querySelector('#email-link');
	if (emailLink) {
		emailLink.addEventListener('click', function (e) {
			e.preventDefault();
			const user = emailLink.getAttribute('data-user');
			const domain = emailLink.getAttribute('data-domain');
			const email = `${user}@${domain}`;
			emailLink.href = `mailto:${email}`;
			emailLink.textContent = email;
		});
	}
	const themeToggle = document.querySelector('#theme-toggle');
	const root = document.documentElement;
	function applyTheme(t) {
		if (t === 'dark') {
			root.style.setProperty('--card-bg', 'rgba(10,10,20,0.75)');
			root.style.setProperty('--muted', '#e6e6e6');
			document.body.classList.add('dark');
		} else {
			root.style.setProperty('--card-bg', 'rgba(255,255,255,0.95)');
			root.style.setProperty('--muted', '#222');
			document.body.classList.remove('dark');
		}
	}
	const savedTheme = localStorage.getItem('theme') || 'light';
	applyTheme(savedTheme);
	const themeIcon = document.querySelector('#theme-icon');
	if (themeIcon) {
		themeIcon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
	}
	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			const current = localStorage.getItem('theme') || 'light';
			const next = current === 'light' ? 'dark' : 'light';
			localStorage.setItem('theme', next);
			applyTheme(next);
			const icon = document.querySelector('#theme-icon');
			if (icon) {
				icon.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
			}
		});
		const themeReset = document.querySelector('#theme-reset');
		if (themeReset) {
			themeReset.addEventListener('click', function () {
				localStorage.removeItem('theme');
				applyTheme('light');
			});
		}
	}

	const observer = new MutationObserver(() => {
	window.addEventListener('beforeunload', function () {
		try { observer.disconnect(); } catch (e) { }
		try { if (heroIO) heroIO.disconnect(); } catch (e) { }
	}, { passive: true });
		const items = document.querySelectorAll('#projects-list li');
		items.forEach((it, i) => {
			it.style.animation = `fadeInUp 360ms ease ${i * 60}ms both`;
		});
	});
	const projListEl = document.querySelector('#projects-list');
	if (projListEl) observer.observe(projListEl, { childList: true });
});