const canvas2 = document.getElementById('starfield');
  const ctx2 = canvas2.getContext('2d');

  const STAR_COUNT = 500; // Количество звезд
  const SPEED = 1.2;      // Скорость полета
  let stars = [];

  // Базовая виртуальная область для генерации координат (чтобы они не зависели от окна)
  const VIRTUAL_BOUNDS = 2000; 

  function resizeCanvas() {
    canvas2.width = window.innerWidth;
    canvas2.height = window.innerHeight;
    // ТЕПЕРЬ ТУТ НЕТ СБРОСА ЗВЕЗД. Они продолжают лететь!
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Star {
    constructor() {
      this.reset();
      // Распределяем звезды случайно по глубине при первом старте
      this.z = Math.random() * VIRTUAL_BOUNDS; 
    }

    reset() {
      // Генерируем координаты в фиксированном виртуальном пространстве VIRTUAL_BOUNDS.
      // Это гарантирует, что изменение размера окна никак не повлияет на положение звезд.
      this.x = (Math.random() - 0.5) * VIRTUAL_BOUNDS;
      this.y = (Math.random() - 0.5) * VIRTUAL_BOUNDS;
      this.z = VIRTUAL_BOUNDS; 
    }

    update() {
      this.z -= SPEED;
      if (this.z <= 0) {
        this.reset();
      }
    }

    draw() {
      const cx = canvas2.width / 2;
      const cy = canvas2.height / 2;

      // Константа FOV (поле зрения) делает так, что звезды всегда круглые
      const fov = 400; 

      const px = (this.x / this.z) * fov + cx;
      const py = (this.y / this.z) * fov + cy;

      // Размер и плавное появление/затухание рассчитываем от максимальной виртуальной глубины
      const radius = (1 - this.z / VIRTUAL_BOUNDS) * 3;
      let alpha = (1 - this.z / VIRTUAL_BOUNDS);
      
      // Если звезда вышла за рамки текущего размера экрана — просто не рисуем её в этом кадре
      if (px < 0 || px > canvas2.width || py < 0 || py > canvas2.height) {
        return;
      }

      ctx2.beginPath();
      ctx2.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx2.arc(px, py, radius, 0, Math.PI * 2);
      ctx2.fill();
    }
  }

  function init() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star());
    }
  }

  function loop() {
    // Не забывайте менять этот цвет, если меняете фон сайта
    ctx2.fillStyle = '#000000'; 
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

    for (let star of stars) {
      star.update();
      star.draw();
    }

    requestAnimationFrame(loop);
  }

  init();
  loop();

// 1. Скрипт Фона с Планетой и Нодами (Canvas)
        const canvas = document.getElementById('planet-canvas');
        const ctx = canvas.getContext('2d');
        let width, height, planetRadius;

        let nodes = [];
        const nodeCount = 400; // Количество точек
        const rotationSpeed = 0.0002; // Скорость вращения

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Планета большая, смещена вниз и вправо для асимметрии в духе Web3
            planetRadius = Math.max(width, height) * 0.8; 
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--line-color');
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--node-color');
        }

        // Генерация случайных точек на поверхности сферы
        function createNodes() {
            nodes = [];
            for (let i = 0; i < nodeCount; i++) {
                const phi = Math.acos(-1 + (2 * i) / nodeCount);
                const theta = Math.sqrt(nodeCount * Math.PI) * phi;
                
                nodes.push({
                    x: Math.cos(theta) * Math.sin(phi),
                    y: Math.sin(theta) * Math.sin(phi),
                    z: Math.cos(phi),
                    // Немного случайного смещения, чтобы не было слишком идеально
                    offset: Math.random() * 0.1,
                    blinkPhase: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.0002 + Math.random() * 0.0002
                });
            }
        }

        let currentRotation = 0;

        function draw() {
            ctx.clearRect(0, 0, width, height);
            
            // Центр планеты смещен (вниз и вправо)
            const centerX = width * 0.6;
            const centerY = height * 0.7;

            // 1. Рисуем тень/тело планеты (очень тонкий градиент)
            const gradient = ctx.createRadialGradient(centerX, centerY, planetRadius * 0.8, centerX, centerY, planetRadius);
            gradient.addColorStop(0, 'rgba(10, 10, 10, 0)'); // Прозрачный центр
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.03)'); // Легкий контур
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            currentRotation += rotationSpeed;

            const projectedNodes = [];

            // 2. Проецируем и рисуем 3D точки
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                // Вращение вокруг оси Y
                const cosRY = Math.cos(currentRotation);
                const sinRY = Math.sin(currentRotation);
                
                let x = node.x * cosRY - node.z * sinRY;
                let y = node.y;
                let z = node.x * sinRY + node.z * cosRY;

                // Вращение вокруг оси X (небольшой наклон планеты)
                const tilt = 0.5;
                const cosRX = Math.cos(tilt);
                const sinRX = Math.sin(tilt);
                
                let ky = y * cosRX - z * sinRX;
                let kz = y * sinRX + z * cosRX;
                y = ky;
                z = kz;

                // Рисуем только те, что "спереди" (z > 0), чтобы скрыть заднюю сторону
                if (z > -0.2) {
                    // Масштабирование для перспективы
                    const scale = (z + 1.5) / 2.5; 
                    const px = x * planetRadius * scale + centerX;
                    const py = y * planetRadius * scale + centerY;
                    
                    // Альфа зависит от глубины z (дальше = прозрачнее)
                    // Вычисляем текущее мигание с помощью синусоиды и времени
                    const time = Date.now();
                    const blink = Math.sin(time * node.blinkSpeed + node.blinkPhase);
                    
                    // Базовая прозрачность от глубины (перспектива)
                    const baseAlpha = (z + 0.2) / 1.2;

                    const alpha = baseAlpha * (0.7 + 0.3 * blink);
                    
                    projectedNodes.push({ x: px, y: py, alpha: alpha });

                    // Рисуем точку
                    ctx.beginPath();
                    // Размер точки тоже зависит от перспективы
                    ctx.arc(px, py, 2.3 * scale, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    ctx.fill();
                    
                    if (z > 0.5) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                        ctx.fill();
                        ctx.shadowBlur = 0; // Сброс
                    }
                }
            }

            // 3. Рисуем линии между близкими точками
            ctx.lineWidth = 0.6;
            for (let i = 0; i < projectedNodes.length; i++) {
                for (let j = i + 1; j < projectedNodes.length; j++) {
                    const p1 = projectedNodes[i];
                    const p2 = projectedNodes[j];
                    
                    const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
                    
                    const maxDist = planetRadius * 0.3;
                    if (dist < maxDist) {
                        const lineAlpha = (1 - dist / maxDist) * 0.09 * Math.min(p1.alpha, p2.alpha);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => {
            resize();
            createNodes();
        });
        
        resize();
        createNodes();
        draw();


        // 2. Логика Интерфейса
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-node-btn');
    const testnetSection = document.getElementById('testnet');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            testnetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const copyButtons = document.querySelectorAll('.copy-btn');

copyButtons.forEach(button => {
  button.addEventListener('click', () => {
    // 1. Находим блок с кодом, который находится в том же terminal-box
    const terminalBox = button.closest('.terminal-box');
    const codeElement = terminalBox.querySelector('.code');
    const textToCopy = codeElement.textContent || codeElement.innerText;

    // 2. Копируем текст в буфер обмена
    navigator.clipboard.writeText(textToCopy.trim())
      .then(() => {
        // Сохраняем исходную иконку (две папки)
        const originalSVG = button.innerHTML;

        // 3. Заменяем внутренности SVG на галочку (сохраняя размеры 24x24 и stroke)
        button.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="success-check">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        button.classList.add('copied'); // Добавляем класс для смены цвета кнопки (если нужно)

        // 4. Через 2 секунды возвращаем старую иконку документов
        setTimeout(() => {
          button.innerHTML = originalSVG;
          button.classList.remove('copied');
        }, 2000);
      })
      .catch(err => {
        console.error('Не удалось скопировать код: ', err);
      });
  });
});

});

AOS.init({
    offset: 100,
    duration: 1000,
  });

  const buttonHome = document.getElementById('buttonHome');
  const buttonConnection = document.getElementById('buttonConnection');
  const buttonMain = document.getElementById('buttonMain');

  const mainSection = document.querySelector('.MAIN');
  const connectionSection = document.querySelector('.CONNECTION');
  const homeSection = document.querySelector('.HOMEactive');

  buttonHome.addEventListener('click', () => {
    buttonHome.classList.remove('home-button-');
    buttonHome.classList.add('home-button-active');
    buttonConnection.classList.remove('connection-button-active');
    buttonMain.classList.remove('main-button-active');

    mainSection.classList.remove('MAINactive');
    connectionSection.classList.remove('CONNECTIONactive');
    homeSection.classList.add('HOMEactive');
  });

  buttonConnection.addEventListener('click', () => {
    buttonHome.classList.remove('home-button-active');
    buttonHome.classList.add('home-button-');
    buttonConnection.classList.add('connection-button-active');
    buttonMain.classList.remove('main-button-active');

    mainSection.classList.remove('MAINactive');
    homeSection.classList.remove('HOMEactive');
    homeSection.classList.add('HOME');
    connectionSection.classList.add('CONNECTIONactive');
  });

  buttonMain.addEventListener('click', () => {
    buttonHome.classList.remove('home-button-active');
    buttonHome.classList.add('home-button-');
    buttonConnection.classList.remove('connection-button-active');
    buttonMain.classList.add('main-button-active');

    homeSection.classList.remove('HOMEactive');
    homeSection.classList.add('HOME');
    connectionSection.classList.remove('CONNECTIONactive');
    mainSection.classList.add('MAINactive');
  });

const tg = window.Telegram.WebApp;

// Повідомляємо Telegram, що додаток готовий до відображення (прибирає спалеш-скрін)
tg.ready();

// Розширюємо додаток на весь екран смартфона
tg.expand();
