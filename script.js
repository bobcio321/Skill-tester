let globalStats = {
    testsCompleted: 0,
    bestScore: null
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadGlobalStats();
    setupMenuCards();
    setupBackButtons();
}

function loadGlobalStats() {
    const saved = localStorage.getItem('skillTesterStats');
    if (saved) {
        globalStats = JSON.parse(saved);
        updateGlobalStatsDisplay();
    }
}

function saveGlobalStats() {
    localStorage.setItem('skillTesterStats', JSON.stringify(globalStats));
    updateGlobalStatsDisplay();
}

function updateGlobalStatsDisplay() {
    const totalTests = document.getElementById('total-tests');
    const bestScore = document.getElementById('best-score');
    if (totalTests) totalTests.textContent = globalStats.testsCompleted;
    if (bestScore) bestScore.textContent = globalStats.bestScore || '-';
}

function setupMenuCards() {
    const cards = document.querySelectorAll('.test-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const testType = card.getAttribute('data-test');
            startTest(testType);
        });
    });
    
    const footerLinks = document.querySelectorAll('.footer-section a');
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const testType = link.getAttribute('href').substring(1);
            startTest(testType);
        });
    });
}

function setupBackButtons() {
    document.getElementById('back-from-reaction').addEventListener('click', showMenu);
    document.getElementById('back-from-memory').addEventListener('click', showMenu);
    document.getElementById('back-from-typing').addEventListener('click', showMenu);
    document.getElementById('back-from-number').addEventListener('click', showMenu);
}

function startTest(testType) {
    hideAll();
    document.getElementById(`${testType}-test`).classList.remove('hidden');
    
    switch(testType) {
        case 'reaction': initReactionTest(); break;
        case 'memory': initMemoryTest(); break;
        case 'typing': initTypingTest(); break;
        case 'number': initNumberTest(); break;
    }
}

function showMenu() {
    hideAll();
    document.getElementById('menu').classList.remove('hidden');
}

function hideAll() {
    const screens = document.querySelectorAll('.menu-screen, .test-screen');
    screens.forEach(screen => screen.classList.add('hidden'));
}

let reactionState = {
    state: 'ready',
    startTime: 0,
    timeout: null,
    results: []
};

function initReactionTest() {
    reactionState = {
        state: 'ready',
        startTime: 0,
        timeout: null,
        results: loadTestResults('reaction') || []
    };
    
    const box = document.getElementById('reaction-box');
    const text = document.getElementById('reaction-text');
    
    box.className = 'reaction-box';
    text.textContent = 'Click to Start';
    
    updateReactionStats();
    
    box.onclick = handleReactionClick;
}

function handleReactionClick() {
    const box = document.getElementById('reaction-box');
    const text = document.getElementById('reaction-text');
    
    if (reactionState.state === 'ready') {

        reactionState.state = 'waiting';
        box.className = 'reaction-box waiting';
        text.textContent = 'Wait for green...';
        
        const delay = 500 + Math.random() * 3000;
        reactionState.timeout = setTimeout(() => {
            reactionState.state = 'go';
            reactionState.startTime = Date.now();
            box.className = 'reaction-box ready';
            text.textContent = 'CLICK NOW!';
        }, delay);
        
    } else if (reactionState.state === 'waiting') {

        clearTimeout(reactionState.timeout);
        reactionState.state = 'ready';
        box.className = 'reaction-box too-early';
        text.textContent = 'Too early! Click to try again';
        
    } else if (reactionState.state === 'go') {

        const time = Date.now() - reactionState.startTime;
        reactionState.results.push(time);
        saveTestResults('reaction', reactionState.results);
        
        reactionState.state = 'ready';
        box.className = 'reaction-box';
        text.textContent = `${time}ms - Click to try again`;
        
        updateReactionStats();
        updateGlobalStats('reaction', time);
    }
}

function updateReactionStats() {
    const statsDiv = document.getElementById('reaction-stats');
    if (reactionState.results.length > 0) {
        statsDiv.classList.remove('hidden');
        
        const last = reactionState.results[reactionState.results.length - 1];
        const avg = Math.round(reactionState.results.reduce((a, b) => a + b) / reactionState.results.length);
        const best = Math.min(...reactionState.results);
        
        document.getElementById('last-reaction').textContent = `${last}ms`;
        document.getElementById('avg-reaction').textContent = `${avg}ms`;
        document.getElementById('best-reaction').textContent = `${best}ms`;
    } else {
        statsDiv.classList.add('hidden');
    }
}


let memoryState = {
    level: 1,
    sequence: [],
    userSequence: [],
    isShowing: false,
    cells: []
};

function initMemoryTest() {
    memoryState = {
        level: 1,
        sequence: [],
        userSequence: [],
        isShowing: false,
        cells: []
    };
    
    createMemoryGrid();
    updateMemoryUI();
    
    document.getElementById('memory-start-btn').onclick = startMemoryTest;
}

function createMemoryGrid() {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'memory-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleMemoryCellClick(i));
        grid.appendChild(cell);
        memoryState.cells.push(cell);
    }
}

function updateMemoryUI() {
    document.getElementById('memory-level').textContent = memoryState.level;
    document.getElementById('sequence-length').textContent = memoryState.level + 2;
    document.getElementById('memory-start-btn').textContent = `Start Level ${memoryState.level}`;
}

function startMemoryTest() {
    document.getElementById('memory-start-btn').style.display = 'none';
    document.getElementById('memory-message').textContent = '';
    document.getElementById('memory-message').className = 'test-message';
    
    memoryState.sequence = [];
    memoryState.userSequence = [];
    
    const length = memoryState.level + 2;
    for (let i = 0; i < length; i++) {
        memoryState.sequence.push(Math.floor(Math.random() * 9));
    }
    
    showMemorySequence();
}

function showMemorySequence() {
    memoryState.isShowing = true;
    let index = 0;
    
    const interval = setInterval(() => {
        if (index > 0) {
            memoryState.cells[memoryState.sequence[index - 1]].classList.remove('active');
        }
        
        if (index < memoryState.sequence.length) {
            memoryState.cells[memoryState.sequence[index]].classList.add('active');
            index++;
        } else {
            clearInterval(interval);
            memoryState.cells[memoryState.sequence[memoryState.sequence.length - 1]].classList.remove('active');
            memoryState.isShowing = false;
            
            document.getElementById('memory-message').textContent = 'Now repeat the sequence!';
            document.getElementById('memory-message').className = 'test-message';
        }
    }, 700);
}

function handleMemoryCellClick(index) {
    if (memoryState.isShowing) return;
    
    memoryState.userSequence.push(index);
    const cell = memoryState.cells[index];
    
    cell.classList.add('active');
    setTimeout(() => cell.classList.remove('active'), 200);
    
    const currentStep = memoryState.userSequence.length - 1;
    
    if (memoryState.userSequence[currentStep] !== memoryState.sequence[currentStep]) {
 
        cell.classList.add('wrong');
        setTimeout(() => cell.classList.remove('wrong'), 500);
        
        const msg = document.getElementById('memory-message');
        msg.textContent = `Wrong! You reached level ${memoryState.level}. Try again?`;
        msg.className = 'test-message error';
        
        document.getElementById('memory-start-btn').style.display = 'block';
        
        updateGlobalStats('memory', memoryState.level);
        memoryState.level = 1;
        updateMemoryUI();
        
    } else if (memoryState.userSequence.length === memoryState.sequence.length) {
    
        cell.classList.add('correct');
        setTimeout(() => cell.classList.remove('correct'), 500);
        
        const msg = document.getElementById('memory-message');
        msg.textContent = `Perfect! Level ${memoryState.level} complete!`;
        msg.className = 'test-message success';
        
        memoryState.level++;
        updateMemoryUI();
        
        setTimeout(() => {
            document.getElementById('memory-start-btn').style.display = 'block';
        }, 1000);
        
        updateGlobalStats('memory', memoryState.level);
    }
}


const typingTexts = [
    "The quick brown fox jumps over the lazy dog and runs through the forest.",
    "Practice makes perfect when you dedicate time and effort to improve your skills.",
    "Technology has revolutionized the way we communicate and share information globally.",
    "A journey of a thousand miles begins with a single step forward into the unknown.",
    "Success is not final, failure is not fatal, it is the courage to continue that counts."
];

let typingState = {
    targetText: '',
    startTime: 0,
    timer: null,
    isActive: false,
    lastTextIndex: -1
};

function initTypingTest() {
    typingState = {
        targetText: '',
        startTime: 0,
        timer: null,
        isActive: false,
        lastTextIndex: typingState.lastTextIndex || -1
    };
    
    const input = document.getElementById('typing-input');
    input.value = '';
    input.disabled = true;
    
    document.getElementById('typing-text').textContent = '';
    document.getElementById('typing-time').textContent = '0s';
    document.getElementById('typing-wpm').textContent = '0';
    document.getElementById('typing-accuracy').textContent = '100%';
    
    document.getElementById('typing-start-btn').onclick = startTypingTest;
    document.getElementById('typing-start-btn').style.display = 'block';
}

function startTypingTest() {

    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * typingTexts.length);
    } while (randomIndex === typingState.lastTextIndex && typingTexts.length > 1);
    
    typingState.lastTextIndex = randomIndex;
    typingState.targetText = typingTexts[randomIndex];
    typingState.startTime = Date.now();
    typingState.isActive = true;
    
    const textDisplay = document.getElementById('typing-text');
    textDisplay.textContent = typingState.targetText;
    
    const input = document.getElementById('typing-input');
    input.value = '';
    input.disabled = false;
    input.placeholder = 'Type here...';
    input.focus();
    
    document.getElementById('typing-start-btn').style.display = 'none';
    
    typingState.timer = setInterval(updateTypingStats, 100);
    
    input.oninput = handleTypingInput;
}

function handleTypingInput() {
    const input = document.getElementById('typing-input');
    const userText = input.value;
    const textDisplay = document.getElementById('typing-text');
    
    let html = '';
    for (let i = 0; i < typingState.targetText.length; i++) {
        if (i < userText.length) {
            if (userText[i] === typingState.targetText[i]) {
                html += `<span class="correct">${typingState.targetText[i]}</span>`;
            } else {
                html += `<span class="incorrect">${typingState.targetText[i]}</span>`;
            }
        } else if (i === userText.length) {
            html += `<span class="current">${typingState.targetText[i]}</span>`;
        } else {
            html += typingState.targetText[i];
        }
    }
    textDisplay.innerHTML = html;
    
    if (userText === typingState.targetText) {
        finishTypingTest();
    }
}

function updateTypingStats() {
    if (!typingState.isActive) return;
    
    const input = document.getElementById('typing-input');
    const userText = input.value;
    
    const timeElapsed = (Date.now() - typingState.startTime) / 1000;
    document.getElementById('typing-time').textContent = `${timeElapsed.toFixed(1)}s`;
    
    const wordsTyped = userText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const wpm = Math.round((wordsTyped / timeElapsed) * 60) || 0;
    document.getElementById('typing-wpm').textContent = wpm;
    
    let correct = 0;
    const length = Math.min(userText.length, typingState.targetText.length);
    for (let i = 0; i < length; i++) {
        if (userText[i] === typingState.targetText[i]) correct++;
    }
    const accuracy = length > 0 ? Math.round((correct / length) * 100) : 100;
    document.getElementById('typing-accuracy').textContent = `${accuracy}%`;
}

function finishTypingTest() {
    typingState.isActive = false;
    clearInterval(typingState.timer);
    
    const input = document.getElementById('typing-input');
    input.disabled = true;
    
    updateTypingStats();
    
    const wpm = parseInt(document.getElementById('typing-wpm').textContent);
    updateGlobalStats('typing', wpm);
    
    setTimeout(() => {

        input.value = '';
        document.getElementById('typing-start-btn').style.display = 'block';
    }, 2000);
}

let numberState = {
    level: 1,
    currentNumber: '',
    isShowing: false
};

function initNumberTest() {
    numberState = {
        level: 1,
        currentNumber: '',
        isShowing: false
    };
    
    updateNumberUI();
    
    document.getElementById('number-display').querySelector('.number-content').textContent = 'Ready to start?';
    document.getElementById('number-input').style.display = 'none';
    document.getElementById('number-input').value = '';
    document.getElementById('number-submit-btn').style.display = 'none';
    document.getElementById('number-message').textContent = '';
    document.getElementById('number-message').className = 'test-message';
    document.getElementById('number-start-btn').style.display = 'block';
    
    document.getElementById('number-start-btn').onclick = startNumberTest;
    document.getElementById('number-submit-btn').onclick = checkNumberAnswer;
}

function updateNumberUI() {
    document.getElementById('number-level').textContent = numberState.level;
    document.getElementById('number-digits').textContent = numberState.level + 2;
    document.getElementById('number-start-btn').textContent = `Start Level ${numberState.level}`;
}

function startNumberTest() {
    document.getElementById('number-start-btn').style.display = 'none';
    document.getElementById('number-message').textContent = '';
    document.getElementById('number-message').className = 'test-message';
    document.getElementById('number-input').style.display = 'none';
    document.getElementById('number-submit-btn').style.display = 'none';
    
    const digits = numberState.level + 2;
    numberState.currentNumber = '';
    for (let i = 0; i < digits; i++) {
        numberState.currentNumber += Math.floor(Math.random() * 10);
    }
    
    const display = document.getElementById('number-display').querySelector('.number-content');
    display.textContent = numberState.currentNumber;
    numberState.isShowing = true;
    
    const showTime = 1000 + (digits * 500);
    setTimeout(() => {
        display.textContent = '?';
        numberState.isShowing = false;
        
        const input = document.getElementById('number-input');
        input.style.display = 'block';
        input.value = '';
        input.focus();
        
        document.getElementById('number-submit-btn').style.display = 'block';
        
        input.onkeypress = (e) => {
            if (e.key === 'Enter') checkNumberAnswer();
        };
    }, showTime);
}

function checkNumberAnswer() {
    const input = document.getElementById('number-input');
    const userAnswer = input.value.trim();
    const msg = document.getElementById('number-message');
    
    document.getElementById('number-submit-btn').style.display = 'none';
    
    if (userAnswer === numberState.currentNumber) {
        msg.textContent = `Correct! ${numberState.currentNumber} - Moving to level ${numberState.level + 1}`;
        msg.className = 'test-message success';
        
        numberState.level++;
        updateNumberUI();
        updateGlobalStats('number', numberState.level);
        
        setTimeout(() => {
            document.getElementById('number-start-btn').style.display = 'block';
        }, 2000);
        
    } else {
        msg.textContent = `Wrong! The number was ${numberState.currentNumber}. Final level: ${numberState.level}`;
        msg.className = 'test-message error';
        
        updateGlobalStats('number', numberState.level);
        numberState.level = 1;
        updateNumberUI();
        
        setTimeout(() => {
            document.getElementById('number-start-btn').style.display = 'block';
        }, 3000);
    }
    
    input.style.display = 'none';
}


function saveTestResults(testType, results) {
    localStorage.setItem(`skillTester_${testType}`, JSON.stringify(results));
}

function loadTestResults(testType) {
    const saved = localStorage.getItem(`skillTester_${testType}`);
    return saved ? JSON.parse(saved) : null;
}

function updateGlobalStats(testType, score) {
    globalStats.testsCompleted++;
    
    const scoreText = testType === 'reaction' ? `${score}ms` : 
                     testType === 'typing' ? `${score} WPM` : 
                     `Level ${score}`;
    
    if (!globalStats.bestScore || shouldUpdateBestScore(testType, score, globalStats.bestScore)) {
        globalStats.bestScore = scoreText;
    }
    
    saveGlobalStats();
}

function shouldUpdateBestScore(testType, newScore, currentBest) {
    if (!currentBest) return true;
    
    if (testType === 'reaction') {
        const current = parseInt(currentBest);
        return newScore < current;
    } else if (testType === 'typing') {
        const current = parseInt(currentBest);
        return newScore > current;
    } else {
        const current = parseInt(currentBest.replace('Level ', ''));
        return newScore > current;
    }
}
